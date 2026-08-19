const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const mime = require("mime-types");
const cheerio = require("cheerio");
const { chromium } = require("playwright");
const { decodeHTML } = require("entities");

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MAX_CAPTURED_RESOURCE_BYTES = 25 * 1024 * 1024;
const DEFAULT_FETCH_TIMEOUT_MS = 15000;
const DEFAULT_RECURSIVE_MAX_PAGES = 25;
const SITE_META_FILE = ".site-meta.json";
const ROUTE_MAP_FILE = ".route-map.json";
const HTML_PAGE_EXTENSIONS = new Set([".html", ".htm", ".php", ".asp", ".aspx"]);

const STANDARD_DIRS = {
  css: "css",
  js: "js",
  assets: "assets",
  images: "assets/images",
  fonts: "assets/fonts",
  media: "assets/media",
  files: "assets/files",
};

class WebsiteDownloader {
  constructor(url, outputDir, logCallback = () => {}, options = {}) {
    this.url = url;
    this.outputDir = outputDir;
    this.baseUrl = url;
    this.baseOrigin = safeOrigin(url);
    this.logCallback = logCallback;
    this.recursive = Boolean(options.recursive);
    this.maxPages = Number(options.maxPages) > 0
      ? Number(options.maxPages)
      : DEFAULT_RECURSIVE_MAX_PAGES;
    this.resourceCache = new Map();
    this.networkResources = new Map();
    this.routeMap = new Map();
    this.cookieHeader = "";
    this.captureTasks = [];
  }

  log(message) {
    this.logCallback(message);
  }

  async prepareOutput() {
    if (await pathExists(this.outputDir)) {
      this.log(`Site já existente encontrado. Removendo pasta antiga: ${this.outputDir}`);
      await fs.rm(this.outputDir, { recursive: true, force: true });
    }

    await fs.mkdir(this.outputDir, { recursive: true });
    await Promise.all(
      Object.values(STANDARD_DIRS).map((relativeDir) =>
        fs.mkdir(path.join(this.outputDir, ...relativeDir.split("/")), {
          recursive: true,
        })
      )
    );
    this.log(`Pasta do site: ${this.outputDir}`);
  }

  async process() {
    await this.prepareOutput();

    const capture = await this.capturePage();
    this.baseUrl = capture.baseUrl;
    this.baseOrigin = safeOrigin(this.baseUrl);
    this.cookieHeader = buildCookieHeader(capture.cookies);

    let htmlContent = capture.html;
    if (capture.iframeHtml) {
      htmlContent = capture.iframeHtml;
      this.log("✨ Usando conteúdo extraído de iframe/srcdoc");
    }

    this.log(`📦 Capturados ${this.networkResources.size} recursos de rede`);
    await this.predownloadCapturedResources();

    let result;
    if (this.recursive) {
      result = await this.processRecursivePages(htmlContent);
    } else {
      result = await this.processSinglePage(htmlContent);
    }

    await this.writeRouteMap();

    this.log(`✅ Concluído! ${this.resourceCache.size} assets salvos`);

    return {
      finalUrl: this.baseUrl,
      removedFrameworkScripts: result.removedFrameworkScripts,
      pageCount: result.pageCount,
      savedAssets: this.resourceCache.size,
    };
  }

  async processSinglePage(htmlContent) {
    const localPath = "index.html";
    this.addRouteAliases(this.url, localPath);
    this.addRouteAliases(this.baseUrl, localPath);

    const { html, removedFrameworkScripts } = await this.rewriteHtml(htmlContent, {
      pageUrl: this.baseUrl,
      sourceLocalPath: localPath,
      pageRouteMap: null,
    });

    await writeFileSafe(path.join(this.outputDir, localPath), Buffer.from(html, "utf8"));
    return { removedFrameworkScripts, pageCount: 1 };
  }

  async processRecursivePages(entryHtml) {
    this.log("🕸️ Modo recursivo ativado: buscando páginas internas do mesmo domínio...");

    const entryUrl = normalizeUrlForMap(this.baseUrl);
    const entryRouteMap = new Map([[entryUrl, "index.html"]]);
    const pages = [];
    const usedLocalPaths = new Set();
    const queued = new Set([entryUrl]);
    const visited = new Set();
    const queue = [{ url: this.baseUrl, html: entryHtml, localPath: "index.html", isEntry: true }];

    this.addRouteAliases(this.url, "index.html");
    this.addRouteAliases(this.baseUrl, "index.html");

    while (queue.length > 0 && pages.length < this.maxPages) {
      const current = queue.shift();
      const normalizedCurrent = normalizeUrlForMap(current.url);
      if (visited.has(normalizedCurrent)) {
        continue;
      }
      visited.add(normalizedCurrent);

      let pageHtml = current.html;
      if (!pageHtml) {
        // eslint-disable-next-line no-await-in-loop
        const downloaded = await this.downloadResource(current.url);
        if (
          !downloaded ||
          !downloaded.body ||
          isHtmlResponse(downloaded.contentType, downloaded.finalUrl || current.url) === false
        ) {
          continue;
        }
        pageHtml = downloaded.body.toString("utf8");
      }

      let localPath = current.localPath || this.buildLocalHtmlPath(current.url, current.isEntry);
      if (!localPath) {
        continue;
      }

      localPath = this.ensureUniqueHtmlPath(localPath, usedLocalPaths);
      usedLocalPaths.add(localPath);
      entryRouteMap.set(normalizedCurrent, localPath);
      this.addRouteAliases(current.url, localPath);
      pages.push({ url: current.url, html: pageHtml, localPath });

      const linkedPages = this.collectInternalPageLinks(pageHtml, current.url);
      for (const pageUrl of linkedPages) {
        const normalized = normalizeUrlForMap(pageUrl);
        if (visited.has(normalized) || queued.has(normalized)) {
          continue;
        }
        if (pages.length + queue.length >= this.maxPages) {
          break;
        }
        queued.add(normalized);
        queue.push({ url: pageUrl, html: null, localPath: null, isEntry: false });
      }
    }

    this.log(`📄 Páginas internas capturadas: ${pages.length}`);

    let removedFrameworkScripts = 0;
    for (const page of pages) {
      // eslint-disable-next-line no-await-in-loop
      const rewritten = await this.rewriteHtml(page.html, {
        pageUrl: page.url,
        sourceLocalPath: page.localPath,
        pageRouteMap: entryRouteMap,
      });
      removedFrameworkScripts += rewritten.removedFrameworkScripts;
      // eslint-disable-next-line no-await-in-loop
      await writeFileSafe(
        path.join(this.outputDir, ...page.localPath.split("/")),
        Buffer.from(rewritten.html, "utf8")
      );
    }

    return { removedFrameworkScripts, pageCount: pages.length || 1 };
  }

  buildLocalHtmlPath(pageUrl, isEntry = false) {
    if (isEntry) {
      return "index.html";
    }

    try {
      const parsed = new URL(String(pageUrl));
      const pathname = parsed.pathname || "/";
      const ext = path.posix.extname(pathname).toLowerCase();
      const segments = pathname
        .split("/")
        .filter(Boolean)
        .map(sanitizePathSegment);

      let localPath;
      if (!ext) {
        localPath = segments.length > 0 ? `${segments.join("/")}/index.html` : "index.html";
      } else if (HTML_PAGE_EXTENSIONS.has(ext)) {
        const fileNameRaw = path.posix.basename(pathname, ext) || "index";
        const fileName = `${sanitizePathSegment(fileNameRaw)}.html`;
        const folder = segments.slice(0, -1);
        localPath = folder.length > 0 ? `${folder.join("/")}/${fileName}` : fileName;
      } else {
        return null;
      }

      if (parsed.search) {
        const querySuffix = `-q${shortHash(parsed.search, 8)}`;
        if (localPath.endsWith("/index.html")) {
          localPath = localPath.replace(/\/index\.html$/i, `/index${querySuffix}.html`);
        } else {
          localPath = localPath.replace(/\.html$/i, `${querySuffix}.html`);
        }
      }

      return localPath || "index.html";
    } catch {
      return null;
    }
  }

  ensureUniqueHtmlPath(candidatePath, usedPaths) {
    if (!usedPaths.has(candidatePath)) {
      return candidatePath;
    }

    const ext = path.posix.extname(candidatePath) || ".html";
    const stem = candidatePath.slice(0, -ext.length);
    let index = 2;
    let next = `${stem}-${index}${ext}`;
    while (usedPaths.has(next)) {
      index += 1;
      next = `${stem}-${index}${ext}`;
    }
    return next;
  }

  collectInternalPageLinks(html, currentPageUrl) {
    const $ = cheerio.load(html || "", { decodeEntities: false });
    const collected = new Set();

    for (const element of $("a[href]").toArray()) {
      const href = decodeHTML(String($(element).attr("href") || "").trim());
      if (!href || href.startsWith("#") || isIgnorableRawUrl(href) || isTemplatedOrBrokenUrl(href)) {
        continue;
      }

      const absolute = resolveUrl(href, currentPageUrl || this.baseUrl);
      if (!absolute) {
        continue;
      }

      if (!this.shouldCrawlPage(absolute)) {
        continue;
      }

      collected.add(normalizeUrlForMap(absolute));
    }

    return Array.from(collected);
  }

  shouldCrawlPage(candidateUrl) {
    try {
      const parsed = new URL(String(candidateUrl));
      if (!/^https?:$/i.test(parsed.protocol)) {
        return false;
      }
      if (parsed.origin !== this.baseOrigin) {
        return false;
      }

      const pathname = parsed.pathname || "/";
      const ext = path.posix.extname(pathname).toLowerCase();
      if (!ext) {
        return true;
      }
      return HTML_PAGE_EXTENSIONS.has(ext);
    } catch {
      return false;
    }
  }

  async capturePage() {
    this.log("🚀 Iniciando navegador...");

    const browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
      ],
    });

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    page.on("response", (response) => {
      const task = this.captureNetworkResponse(response);
      this.captureTasks.push(task);
    });

    this.log(`🌐 Carregando ${this.url}...`);
    try {
      await page.goto(this.url, { waitUntil: "load", timeout: 60000 });
      this.log("✓ Página carregada (load)");
      await page.waitForTimeout(3000);
      this.log("✓ Recursos adicionais carregados");
    } catch (error) {
      this.log(`⚠️ Aviso de carregamento: ${String(error.message || error).slice(0, 120)}`);
      this.log("⚠️ Tentando continuar mesmo assim...");
    }

    await page.waitForTimeout(2000);

    const iframeHtml = await this.extractIframeContent(page);
    if (!iframeHtml) {
      this.log("📜 Rolando página para carregar conteúdo lazy...");
      await this.scrollPage(page);
      await page.waitForTimeout(3000);
    }

    await Promise.allSettled(this.captureTasks);

    const html = iframeHtml || (await page.content());
    const cookies = await context.cookies();
    const baseUrl = page.url() || this.url;

    await context.close();
    await browser.close();

    return { html, iframeHtml, cookies, baseUrl };
  }

  async captureNetworkResponse(response) {
    try {
      if (response.status() !== 200) {
        return;
      }

      const url = response.url();
      if (!url || isSpecialScheme(url)) {
        return;
      }

      const headers = response.headers();
      const contentLength = Number(headers["content-length"] || 0);
      if (Number.isFinite(contentLength) && contentLength > MAX_CAPTURED_RESOURCE_BYTES) {
        return;
      }

      const body = await response.body();
      if (!body || !Buffer.isBuffer(body) || body.length === 0) {
        return;
      }

      const contentType = headers["content-type"] || "";
      const normalizedFinal = normalizeUrlForMap(url);
      const resource = { body, contentType };

      this.networkResources.set(normalizedFinal, resource);

      const requestUrl = response.request().url();
      if (requestUrl && requestUrl !== url) {
        this.networkResources.set(normalizeUrlForMap(requestUrl), resource);
      }
    } catch {
      // ignore individual capture errors
    }
  }

  async extractIframeContent(page) {
    try {
      const srcdocIframe = await page.$("iframe[srcdoc]");
      if (srcdocIframe) {
        const srcdoc = await srcdocIframe.getAttribute("srcdoc");
        if (srcdoc) {
          this.log("🔍 Detectado iframe com srcdoc - extraindo conteúdo real...");
          return decodeHTML(srcdoc);
        }
      }

      const previewSelectors = [
        'iframe[class*="preview"]',
        'iframe[class*="site-frame"]',
        'iframe[class*="canvas"]',
        'iframe[id*="preview"]',
        "#preview-iframe",
        ".preview-frame iframe",
        '[role="tabpanel"] iframe',
        '[data-testid*="preview"] iframe',
      ];

      for (const selector of previewSelectors) {
        const iframe = await page.$(selector);
        if (!iframe) {
          continue;
        }

        for (const frame of page.frames()) {
          if (frame === page.mainFrame()) {
            continue;
          }

          const frameUrl = frame.url();
          if (!frameUrl || frameUrl === "about:blank") {
            continue;
          }

          try {
            const content = await frame.content();
            if (content && content.length > 500) {
              this.log(`🔍 Detectado iframe de preview - extraindo de ${frameUrl.slice(0, 60)}...`);
              this.baseUrl = frameUrl;
              return content;
            }
          } catch {
            // continue trying other frames
          }
        }
      }

      for (const frame of page.frames()) {
        if (frame === page.mainFrame()) {
          continue;
        }

        try {
          if (frame.url() === "about:srcdoc") {
            const content = await frame.content();
            if (content && content.length > 1000) {
              this.log("🔍 Detectado iframe srcdoc via frame - extraindo conteúdo...");
              return content;
            }
          }
        } catch {
          // ignore
        }
      }

      const body = await page.$("body");
      if (!body) {
        return null;
      }

      const childCount = await page.$$eval("body > *", (nodes) => nodes.length);
      const iframeCount = await page.$$eval("iframe", (nodes) => nodes.length);
      const mainContent = await page.content();

      if (childCount <= 5 && iframeCount > 0) {
        for (const frame of page.frames()) {
          if (frame === page.mainFrame()) {
            continue;
          }

          try {
            const content = await frame.content();
            if (content && content.length > mainContent.length * 0.3) {
              this.log("🔍 Detectado wrapper com iframe - usando conteúdo do frame...");
              const frameUrl = frame.url();
              if (frameUrl && frameUrl !== "about:blank" && frameUrl !== "about:srcdoc") {
                this.baseUrl = frameUrl;
              }
              return content;
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore iframe extraction failures
    }

    return null;
  }

  async scrollPage(page) {
    try {
      await page.evaluate(() => {
        try {
          if (window.lenis && typeof window.lenis.destroy === "function") {
            window.lenis.destroy();
          }
        } catch {}

        try {
          if (
            window.locomotiveScroll &&
            typeof window.locomotiveScroll.destroy === "function"
          ) {
            window.locomotiveScroll.destroy();
          }
        } catch {}

        document.documentElement.style.scrollBehavior = "auto";
        document.body.style.scrollBehavior = "auto";

        if (getComputedStyle(document.body).overflow === "hidden") {
          document.body.style.overflow = "auto";
        }
        if (getComputedStyle(document.documentElement).overflow === "hidden") {
          document.documentElement.style.overflow = "auto";
        }
      });

      const scrollContainer = await page.evaluate(() => {
        const selectors = [
          "[data-scroll-container]",
          ".scroll-container",
          ".smooth-scroll",
          "main",
          "#__next",
          "#__nuxt",
          "#app",
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.scrollHeight > window.innerHeight) {
            return selector;
          }
        }

        return null;
      });

      if (scrollContainer) {
        this.log(`🔍 Detectado container de scroll customizado: ${scrollContainer}`);
      }

      let totalHeight = await page.evaluate(() =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
      );
      const viewportHeight = await page.evaluate(() => window.innerHeight || 1080);

      let current = 0;
      let iteration = 0;
      const maxIterations = 20;

      while (current < totalHeight && iteration < maxIterations) {
        await page.evaluate((position) => {
          window.scrollTo(0, position);
          document.documentElement.scrollTop = position;
          document.body.scrollTop = position;

          const containers = document.querySelectorAll(
            "[data-scroll-container], .scroll-container, main"
          );
          containers.forEach((container) => {
            container.scrollTop = position;
          });
        }, current);

        await page.waitForTimeout(600);
        current += viewportHeight;
        iteration += 1;

        const newHeight = await page.evaluate(() =>
          Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
        );
        if (newHeight > totalHeight) {
          totalHeight = newHeight;
        }
      }

      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
      await page.waitForTimeout(1000);
    } catch (error) {
      this.log(`⚠️ Erro no scroll: ${String(error.message || error)}`);
    }
  }

  async rewriteHtml(html, options = {}) {
    const pageUrl = options.pageUrl || this.baseUrl;
    const sourceLocalPath = options.sourceLocalPath || "index.html";
    const pageRouteMap = options.pageRouteMap instanceof Map ? options.pageRouteMap : null;

    this.log("🔧 Processando HTML e assets...");
    const $ = cheerio.load(html, { decodeEntities: false });

    if (this.shouldApplyScrollFix($)) {
      this.fixScrollBlocking($);
    } else {
      this.log("ℹ️ Scroll-fix não aplicado (site não LiteSpeed).");
    }
    this.removeWrapperIframes($);

    this.log("🎨 Processando stylesheets...");
    const stylesheetLinks = $("link[rel][href]")
      .toArray()
      .filter((element) => {
        const rel = ($(element).attr("rel") || "").toLowerCase();
        return rel.split(/\s+/).includes("stylesheet");
      });

    for (const element of stylesheetLinks) {
      const link = $(element);
      const href = decodeHTML(String(link.attr("href") || "").trim());
      if (!href || isIgnorableRawUrl(href)) {
        continue;
      }

      const absUrl = resolveUrl(href, pageUrl);
      if (!absUrl) {
        continue;
      }

      const fetched = await this.getResourceBytes(absUrl);
      if (!fetched || !fetched.body) {
        continue;
      }

      const cssLocalPath = this.peekResourcePath(absUrl, fetched.contentType, "css");
      const cssText = fetched.body.toString("utf8");
      const rewrittenCss = await this.rewriteCssText(cssText, absUrl, cssLocalPath);
      const localPath = await this.saveResource(
        absUrl,
        Buffer.from(rewrittenCss, "utf8"),
        fetched.contentType || "text/css",
        "css",
        { overwrite: true }
      );
      link.attr("href", toRelativeLocalPath(localPath, sourceLocalPath));
    }

    this.log("✨ Processando estilos inline...");
    for (const element of $("style").toArray()) {
      const styleTag = $(element);
      const styleText = styleTag.html();
      if (!styleText) {
        continue;
      }
      const rewritten = await this.rewriteCssText(styleText, pageUrl, sourceLocalPath);
      styleTag.html(rewritten);
    }

    this.log("📝 Processando scripts...");
    this.normalizeLiteSpeedScripts($);
    for (const element of $("script[src]").toArray()) {
      const script = $(element);
      const src = decodeHTML(String(script.attr("src") || "").trim());
      if (!src || isIgnorableRawUrl(src)) {
        continue;
      }

      const localPath = await this.getResourceLocalPath(src, pageUrl, sourceLocalPath, "js");
      if (localPath && localPath !== src) {
        script.attr("src", localPath);
        script.removeAttr("integrity");
        script.removeAttr("crossorigin");
        script.removeAttr("nonce");
      }
    }

    this.log("🖼️ Processando imagens e mídia...");
    const mediaSelectors = ["img", "source", "video", "audio", "input"];
    for (const selector of mediaSelectors) {
      for (const element of $(selector).toArray()) {
        const node = $(element);

        const lazyAttrs = [
          "data-src",
          "data-original",
          "data-lazy-src",
          "data-url",
          "data-image",
          "data-bg",
        ];

        for (const lazyAttr of lazyAttrs) {
          const lazyValue = decodeHTML(String(node.attr(lazyAttr) || "").trim());
          if (!lazyValue || isIgnorableRawUrl(lazyValue)) {
            continue;
          }

          const rewritten = await this.getResourceLocalPath(
            lazyValue,
            pageUrl,
            sourceLocalPath,
            null
          );
          if (rewritten && rewritten !== lazyValue) {
            node.attr("src", rewritten);
            node.removeAttr(lazyAttr);
            break;
          }
        }

        const src = decodeHTML(String(node.attr("src") || "").trim());
        if (src && !isIgnorableRawUrl(src)) {
          const rewritten = await this.getResourceLocalPath(src, pageUrl, sourceLocalPath, null);
          if (rewritten && rewritten !== src) {
            node.attr("src", rewritten);
          }
        }

        const srcset = node.attr("srcset");
        if (srcset) {
          const rewritten = await this.rewriteSrcset(srcset, pageUrl, sourceLocalPath);
          node.attr("srcset", rewritten);
        }

        const dataSrcset = node.attr("data-srcset");
        if (dataSrcset) {
          const rewritten = await this.rewriteSrcset(dataSrcset, pageUrl, sourceLocalPath);
          node.attr("data-srcset", rewritten);
        }

        if (selector === "video") {
          const poster = decodeHTML(String(node.attr("poster") || "").trim());
          if (poster && !isIgnorableRawUrl(poster)) {
            const rewritten = await this.getResourceLocalPath(
              poster,
              pageUrl,
              sourceLocalPath,
              "images"
            );
            if (rewritten && rewritten !== poster) {
              node.attr("poster", rewritten);
            }
          }
        }
      }
    }

    this.log("🔗 Processando styles inline e ícones...");
    for (const element of $("*[style]").toArray()) {
      const node = $(element);
      const style = node.attr("style");
      if (!style || !style.includes("url(")) {
        continue;
      }

      const rewritten = await this.rewriteCssText(style, pageUrl, sourceLocalPath);
      node.attr("style", rewritten);
    }

    for (const element of $("link[href]").toArray()) {
      const link = $(element);
      const rel = String(link.attr("rel") || "").toLowerCase();
      if (!rel) {
        continue;
      }

      const isIconLike =
        rel.includes("icon") || rel.includes("apple-touch") || rel.includes("manifest");
      if (!isIconLike) {
        continue;
      }

      const href = decodeHTML(String(link.attr("href") || "").trim());
      if (!href || isIgnorableRawUrl(href)) {
        continue;
      }

      const rewritten = await this.getResourceLocalPath(href, pageUrl, sourceLocalPath, null);
      if (rewritten && rewritten !== href) {
        link.attr("href", rewritten);
      }
    }

    for (const element of $("meta[content]").toArray()) {
      const meta = $(element);
      const prop = String(meta.attr("property") || meta.attr("name") || "").toLowerCase();
      if (!prop.includes("image")) {
        continue;
      }

      const content = decodeHTML(String(meta.attr("content") || "").trim());
      if (!content || isIgnorableRawUrl(content)) {
        continue;
      }

      const rewritten = await this.getResourceLocalPath(content, pageUrl, sourceLocalPath, null);
      if (rewritten && rewritten !== content) {
        meta.attr("content", rewritten);
      }
    }

    for (const element of $("*[data-background]").toArray()) {
      const node = $(element);
      const bg = decodeHTML(String(node.attr("data-background") || "").trim());
      if (!bg || isIgnorableRawUrl(bg)) {
        continue;
      }

      const rewritten = await this.getResourceLocalPath(bg, pageUrl, sourceLocalPath, null);
      if (rewritten && rewritten !== bg) {
        node.attr("data-background", rewritten);
      }
    }

    this.log("🔗 Corrigindo links de navegação offline...");
    for (const element of $("a[href]").toArray()) {
      const node = $(element);
      const href = decodeHTML(String(node.attr("href") || "").trim());
      if (!href || href.startsWith("#")) {
        continue;
      }

      const rewrittenHref = this.rewriteNavigationHref(href, pageUrl, sourceLocalPath, pageRouteMap);
      if (rewrittenHref && rewrittenHref !== href) {
        node.attr("href", rewrittenHref);
      }
    }

    const frameworkResult = this.removeFrameworkHydration($);

    return {
      html: injectLocalRuntimePatch($.html()),
      removedFrameworkScripts: frameworkResult.removedScripts,
    };
  }

  rewriteNavigationHref(href, pageUrl, sourceLocalPath, pageRouteMap) {
    if (!href || isIgnorableRawUrl(href) || isTemplatedOrBrokenUrl(href)) {
      return href;
    }

    const absolute = resolveUrl(href, pageUrl || this.baseUrl);
    if (!absolute) {
      return href;
    }

    try {
      const parsed = new URL(absolute);
      const hash = parsed.hash || "";
      parsed.hash = "";
      const normalized = normalizeUrlForMap(parsed.toString());
      const byPathWithSearch = `${parsed.pathname}${parsed.search}`;

      if (pageRouteMap) {
        const mapped =
          pageRouteMap.get(normalized) ||
          pageRouteMap.get(byPathWithSearch) ||
          pageRouteMap.get(parsed.pathname);
        if (mapped) {
          return `${toRelativeLocalPath(mapped, sourceLocalPath)}${hash}`;
        }

        if (parsed.origin === this.baseOrigin) {
          return "#";
        }

        return href;
      }

      if (parsed.origin === this.baseOrigin && parsed.pathname.startsWith("/")) {
        return "#";
      }
      return href;
    } catch {
      return href;
    }
  }

  normalizeLiteSpeedScripts($) {
    for (const element of $("script").toArray()) {
      const script = $(element);
      const type = String(script.attr("type") || "").toLowerCase();
      if (type.includes("litespeed/javascript")) {
        script.attr("type", "text/javascript");
      }

      const src = String(script.attr("src") || "").trim();
      const dataSrc = String(script.attr("data-src") || "").trim();
      if (!src && dataSrc && !isIgnorableRawUrl(dataSrc)) {
        script.attr("src", decodeHTML(dataSrc));
      }

      script.removeAttr("data-optimized");
    }
  }

  removeWrapperIframes($) {
    for (const element of $("iframe").toArray()) {
      const iframe = $(element);
      const srcdoc = iframe.attr("srcdoc");
      const cls = String(iframe.attr("class") || "").toLowerCase();
      if (srcdoc || cls.includes("preview")) {
        iframe.remove();
      }
    }
  }

  removeFrameworkHydration($) {
    const isGatsby = $("#___gatsby").length > 0;
    const isNuxt = $("#__nuxt").length > 0;
    const isNextjs = $("#__next").length > 0 || detectNextjs($);

    if (!isGatsby && !isNuxt && !isNextjs) {
      return { removedScripts: 0, removedLinks: 0 };
    }

    const framework = isGatsby ? "Gatsby" : isNextjs ? "Next.js" : "Nuxt";
    this.log(`🛡️ Detectado ${framework} - removendo scripts de hidratação do framework...`);

    const safeKeywords = [
      "google",
      "analytics",
      "gtm",
      "gtag",
      "facebook",
      "pixel",
      "elfsight",
      "hubspot",
      "intercom",
      "crisp",
      "drift",
      "hotjar",
      "clarity",
      "segment",
      "mixpanel",
      "amplitude",
      "adobe",
      "privacy",
    ];

    let removedScripts = 0;
    for (const element of $("script").toArray()) {
      const script = $(element);
      const src = String(script.attr("src") || "").toLowerCase();
      const scriptText = String(script.html() || "").toLowerCase();

      const isSafe = safeKeywords.some((keyword) => src.includes(keyword));
      if (isSafe) {
        continue;
      }

      let shouldRemove = false;

      if (
        isGatsby &&
        (src.includes("framework-") ||
          src.includes("app-") ||
          src.includes("commons-") ||
          src.includes("component-") ||
          src.includes("webpack-runtime") ||
          src.includes("polyfill"))
      ) {
        shouldRemove = true;
      }

      if (isNextjs) {
        if (src && !src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("//")) {
          shouldRemove = true;
        }
        if (src.includes("_next/") || src.includes("webpack") || src.includes("polyfill")) {
          shouldRemove = true;
        }
        if (scriptText.includes("__next") || scriptText.includes("self.__next")) {
          shouldRemove = true;
        }
        if (src.includes("assets/") && src.endsWith(".js") && src.includes("-")) {
          shouldRemove = true;
        }
      }

      if (
        isNuxt &&
        (src.includes("_nuxt/") || scriptText.includes("__nuxt__") || src.includes("nuxt"))
      ) {
        shouldRemove = true;
      }

      if (
        scriptText.includes("hydrate") ||
        scriptText.includes("window.__") ||
        scriptText.includes("gatsby") ||
        scriptText.includes("pagedata") ||
        scriptText.includes("self.__next") ||
        scriptText.includes("__next_data__")
      ) {
        shouldRemove = true;
      }

      if (shouldRemove) {
        script.remove();
        removedScripts += 1;
      }
    }

    let removedLinks = 0;
    for (const element of $("link[rel][href]").toArray()) {
      const link = $(element);
      const rel = String(link.attr("rel") || "").toLowerCase();
      const href = String(link.attr("href") || "").toLowerCase();
      const preloadLike =
        rel.includes("preload") || rel.includes("prefetch") || rel.includes("modulepreload");
      if (!preloadLike) {
        continue;
      }

      if (href.includes("_next/") || (href.startsWith("assets/") && href.includes("-"))) {
        link.remove();
        removedLinks += 1;
      }
    }

    this.log(`   ✅ Removidos ${removedScripts} scripts e ${removedLinks} preloads do framework`);
    return { removedScripts, removedLinks };
  }

  fixScrollBlocking($) {
    this.log("🔧 Corrigindo problemas de scroll para visualização offline...");

    const htmlElement = $("html").first();
    if (htmlElement.length > 0) {
      const classes = String(htmlElement.attr("class") || "")
        .split(/\s+/)
        .filter(Boolean);
      const blocked = new Set([
        "lenis",
        "lenis-smooth",
        "lenis-scrolling",
        "lenis-stopped",
        "has-scroll-smooth",
        "has-scroll-init",
        "locomotive-scroll",
      ]);
      const cleaned = classes.filter((className) => !blocked.has(className.toLowerCase()));
      htmlElement.attr("class", cleaned.join(" "));
    }

    const body = $("body").first();
    if (body.length > 0) {
      const classes = String(body.attr("class") || "")
        .split(/\s+/)
        .filter(Boolean);
      const blocked = new Set([
        "overflow-hidden",
        "no-scroll",
        "scroll-lock",
        "fixed",
        "lenis",
        "lenis-smooth",
        "has-scroll-smooth",
      ]);
      let cleaned = classes.filter((className) => !blocked.has(className.toLowerCase()));

      if (cleaned.includes("items-center") && cleaned.includes("flex")) {
        cleaned = cleaned.map((className) => (className === "items-center" ? "items-start" : className));
      }

      body.attr("class", cleaned.join(" "));
    }

    for (const element of $("*[style]").toArray()) {
      const node = $(element);
      const style = String(node.attr("style") || "");
      if (!style.toLowerCase().includes("overflow") || !style.toLowerCase().includes("hidden")) {
        continue;
      }
      const newStyle = style.replace(/overflow\s*:\s*hidden\s*;?/gi, "").trim();
      node.attr("style", newStyle);
    }

    // Nao injeta CSS global de opacidade/transform aqui para evitar
    // sobreposicao de blocos animados (ex.: painéis com opacity-0/translate).
    const scrollFixCss = `
html, body {
  overflow-x: hidden !important;
}
`;

    const head = $("head").first();
    if (head.length > 0) {
      head.append(`<style data-scroll-fix="true">${scrollFixCss}</style>`);
      this.log("   ✅ Injetado CSS mínimo de scroll");
    }

    let scriptsRemoved = 0;
    for (const element of $("script").toArray()) {
      const script = $(element);
      const src = String(script.attr("src") || "").toLowerCase();
      const text = String(script.html() || "").toLowerCase();

      if (
        src.includes("lenis") ||
        src.includes("locomotive") ||
        src.includes("smooth-scroll") ||
        text.includes("new lenis") ||
        text.includes("new locomotivescroll") ||
        text.includes("smoothscroll")
      ) {
        script.remove();
        scriptsRemoved += 1;
      }
    }

    if (scriptsRemoved > 0) {
      this.log(`   ✅ Removidos ${scriptsRemoved} scripts de smooth scroll`);
    }
  }

  async rewriteCssText(cssText, cssUrl, cssLocalPath) {
    return asyncReplace(cssText, /url\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi, async (full, _quote, raw) => {
      const original = decodeHTML(String(raw || "")).trim();
      if (!original || isIgnorableRawUrl(original) || isTemplatedOrBrokenUrl(original)) {
        return full;
      }

      const localPath = await this.getResourceLocalPath(original, cssUrl, cssLocalPath, null);
      if (!localPath || localPath === original) {
        return full;
      }

      return `url("${escapeCssUrl(localPath)}")`;
    });
  }

  async rewriteSrcset(srcset, baseUrl, sourceLocalPath) {
    if (!srcset) {
      return srcset;
    }

    const parts = srcset
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const rewritten = [];
    for (const part of parts) {
      const tokens = part.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {
        continue;
      }

      const urlCandidate = decodeHTML(tokens[0]);
      if (isIgnorableRawUrl(urlCandidate) || isTemplatedOrBrokenUrl(urlCandidate)) {
        rewritten.push(part);
        continue;
      }

      const descriptor = tokens.slice(1).join(" ");
      const localPath = await this.getResourceLocalPath(urlCandidate, baseUrl, sourceLocalPath, null);
      if (!localPath || localPath === urlCandidate) {
        rewritten.push(part);
        continue;
      }

      rewritten.push([localPath, descriptor].filter(Boolean).join(" "));
    }

    return rewritten.join(", ");
  }

  async getResourceLocalPath(rawUrl, baseUrl, sourceLocalPath, forcedCategory) {
    const decoded = decodeHTML(String(rawUrl || "").trim());
    if (!decoded || isIgnorableRawUrl(decoded) || isTemplatedOrBrokenUrl(decoded)) {
      return rawUrl;
    }

    const absUrl = resolveUrl(decoded, baseUrl || this.baseUrl);
    if (!absUrl) {
      return rawUrl;
    }

    const normalized = normalizeUrlForMap(absUrl);
    const cached = this.resourceCache.get(normalized);
    if (cached) {
      return toRelativeLocalPath(cached, sourceLocalPath);
    }

    const captured = this.networkResources.get(normalized);
    if (captured && captured.body && !isHtmlResponse(captured.contentType, normalized)) {
      const localPath = await this.saveResource(
        normalized,
        captured.body,
        captured.contentType,
        forcedCategory
      );
      return toRelativeLocalPath(localPath, sourceLocalPath);
    }

    const fallback = await this.downloadResource(normalized);
    if (!fallback || !fallback.body || isHtmlResponse(fallback.contentType, fallback.finalUrl || normalized)) {
      return rawUrl;
    }

    const localPath = await this.saveResource(
      fallback.finalUrl || normalized,
      fallback.body,
      fallback.contentType,
      forcedCategory
    );

    if (fallback.finalUrl && normalizeUrlForMap(fallback.finalUrl) !== normalized) {
      this.resourceCache.set(normalized, localPath);
      this.addRouteAliases(normalized, localPath);
    }

    return toRelativeLocalPath(localPath, sourceLocalPath);
  }

  async getResourceBytes(absUrl) {
    const normalized = normalizeUrlForMap(absUrl);

    const captured = this.networkResources.get(normalized);
    if (captured && captured.body) {
      return captured;
    }

    return this.downloadResource(normalized);
  }

  async downloadResource(absUrl) {
    let timeout;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);

      const response = await fetch(absUrl, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: this.buildFetchHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      const body = Buffer.from(await response.arrayBuffer());
      if (!body || body.length === 0) {
        return null;
      }

      return {
        body,
        contentType,
        finalUrl: response.url || absUrl,
      };
    } catch {
      return null;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  buildFetchHeaders() {
    const headers = {
      "User-Agent": USER_AGENT,
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: this.baseUrl,
    };

    if (this.cookieHeader) {
      headers.Cookie = this.cookieHeader;
    }

    return headers;
  }

  peekResourcePath(url, contentType = "", forcedCategory = null) {
    const normalized = normalizeUrlForMap(url);
    const cached = this.resourceCache.get(normalized);
    if (cached) {
      return cached;
    }

    const folder = pickResourceFolder(normalized, contentType, forcedCategory);
    const extension = pickExtension(normalized, contentType, forcedCategory);
    const baseName = pickSafeBaseName(normalized);
    const hash = shortHash(normalized, 10);
    const fileName = `${baseName}-${hash}${extension}`.toLowerCase();
    return `${folder}/${fileName}`;
  }

  async saveResource(url, content, contentType = "", forcedCategory = null, options = {}) {
    const normalized = normalizeUrlForMap(url);
    const alreadySaved = this.resourceCache.get(normalized);

    if (alreadySaved && !options.overwrite) {
      return alreadySaved;
    }

    const localPath = alreadySaved || this.peekResourcePath(normalized, contentType, forcedCategory);
    const absolute = path.join(this.outputDir, ...localPath.split("/"));
    await writeFileSafe(absolute, Buffer.isBuffer(content) ? content : Buffer.from(String(content)));
    this.resourceCache.set(normalized, localPath);
    this.addRouteAliases(normalized, localPath);

    return localPath;
  }

  shouldApplyScrollFix($) {
    const html = $.html() || "";
    return /litespeed|guest\.vary\.php|litespeed\/javascript/i.test(html);
  }

  async predownloadCapturedResources() {
    const entries = Array.from(this.networkResources.entries());
    if (entries.length === 0) {
      return;
    }

    let saved = 0;
    const chunkSize = 10;
    for (let i = 0; i < entries.length; i += chunkSize) {
      const slice = entries.slice(i, i + chunkSize);
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        slice.map(async ([resourceUrl, resource]) => {
          try {
            if (!resource || !resource.body || resource.body.length === 0) {
              return;
            }
            if (isHtmlResponse(resource.contentType, resourceUrl)) {
              return;
            }
            if (this.resourceCache.has(resourceUrl)) {
              return;
            }
            await this.saveResource(resourceUrl, resource.body, resource.contentType, null);
            saved += 1;
          } catch {
            // ignore predownload failures
          }
        })
      );
    }

    if (saved > 0) {
      this.log(`📦 Recursos adicionais pré-salvos do capture: ${saved}`);
    }
  }

  addRouteAliases(resourceUrl, localPath) {
    const normalizedLocal = String(localPath || "").replace(/\\/g, "/");
    try {
      const parsed = new URL(String(resourceUrl));
      parsed.hash = "";
      this.routeMap.set(parsed.href, normalizedLocal);
      this.routeMap.set(`${parsed.pathname}${parsed.search}`, normalizedLocal);
      this.routeMap.set(parsed.pathname, normalizedLocal);
    } catch {
      // ignore invalid route aliases
    }
  }

  async writeRouteMap() {
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      baseOrigin: safeOrigin(this.baseUrl),
      routes: Object.fromEntries(this.routeMap),
    };
    await fs.writeFile(
      path.join(this.outputDir, ROUTE_MAP_FILE),
      JSON.stringify(payload, null, 2),
      "utf8"
    );
  }
}

function detectNextjs($) {
  const nextDataScript = $("script#__NEXT_DATA__").length > 0;
  if (nextDataScript) {
    return true;
  }

  for (const element of $("script").toArray()) {
    const script = $(element);
    const scriptId = String(script.attr("id") || "");
    const scriptText = String(script.html() || "");

    if (scriptId.includes("__NEXT_DATA__") || scriptText.includes("self.__next")) {
      return true;
    }
  }

  for (const element of $("script[src]").toArray()) {
    const src = String($(element).attr("src") || "");
    if (src.includes("_next/") || src.toLowerCase().includes("webpack")) {
      return true;
    }
  }

  for (const element of $("link[href]").toArray()) {
    const href = String($(element).attr("href") || "");
    if (href.includes("_next/")) {
      return true;
    }
  }

  return false;
}

function pickResourceFolder(url, contentType = "", forcedCategory = null) {
  if (forcedCategory === "css") {
    return STANDARD_DIRS.css;
  }
  if (forcedCategory === "js") {
    return STANDARD_DIRS.js;
  }
  if (forcedCategory === "images") {
    return STANDARD_DIRS.images;
  }

  const mimeType = String(contentType || "").split(";")[0].trim().toLowerCase();
  if (mimeType === "text/css") {
    return STANDARD_DIRS.css;
  }
  if (
    mimeType.includes("javascript") ||
    mimeType === "application/ecmascript" ||
    mimeType === "text/javascript"
  ) {
    return STANDARD_DIRS.js;
  }
  if (mimeType.startsWith("image/")) {
    return STANDARD_DIRS.images;
  }
  if (mimeType.startsWith("font/") || mimeType.includes("woff") || mimeType.includes("ttf")) {
    return STANDARD_DIRS.fonts;
  }
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
    return STANDARD_DIRS.media;
  }

  const pathname = safePathFromUrl(url).toLowerCase();
  if (/\.(css)(\?|$)/i.test(pathname)) {
    return STANDARD_DIRS.css;
  }
  if (/\.(mjs|cjs|js)(\?|$)/i.test(pathname)) {
    return STANDARD_DIRS.js;
  }
  if (/\.(png|jpg|jpeg|gif|svg|webp|avif|ico|bmp|tiff?)(\?|$)/i.test(pathname)) {
    return STANDARD_DIRS.images;
  }
  if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(pathname)) {
    return STANDARD_DIRS.fonts;
  }
  if (/\.(mp4|webm|ogg|mp3|wav|m4a|mov|m3u8)(\?|$)/i.test(pathname)) {
    return STANDARD_DIRS.media;
  }

  return STANDARD_DIRS.files;
}

function pickExtension(url, contentType = "", forcedCategory = null) {
  const pathname = safePathFromUrl(url);
  const currentExt = path.extname(pathname);

  // Ignora extensões inválidas como ".17" para scripts/estáticos versionados.
  if (
    currentExt &&
    currentExt.length <= 8 &&
    /^[.][a-z0-9]+$/i.test(currentExt) &&
    /[a-z]/i.test(currentExt)
  ) {
    return currentExt.toLowerCase();
  }

  if (forcedCategory === "css") {
    return ".css";
  }
  if (forcedCategory === "js") {
    return ".js";
  }

  const mimeType = String(contentType || "").split(";")[0].trim().toLowerCase();
  const guessed = mimeType ? mime.extension(mimeType) : null;
  if (guessed) {
    return `.${guessed.toLowerCase()}`;
  }

  return ".bin";
}

function pickSafeBaseName(url) {
  const pathname = safePathFromUrl(url);
  let baseName = path.basename(pathname, path.extname(pathname));
  if (!baseName || baseName === "/" || baseName === ".") {
    baseName = "resource";
  }

  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return sanitized || "resource";
}

function buildCookieHeader(cookies) {
  if (!Array.isArray(cookies) || cookies.length === 0) {
    return "";
  }

  return cookies
    .filter((cookie) => cookie && cookie.name && typeof cookie.value === "string")
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

function normalizeUrlForMap(input) {
  try {
    const parsed = new URL(String(input));
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return String(input || "").trim();
  }
}

function safeOrigin(input) {
  try {
    return new URL(String(input)).origin;
  } catch {
    return "";
  }
}

function resolveUrl(raw, base) {
  try {
    return new URL(String(raw), base).toString();
  } catch {
    return null;
  }
}

function safePathFromUrl(input) {
  try {
    return new URL(String(input)).pathname || "/";
  } catch {
    return String(input || "");
  }
}

function toRelativeLocalPath(targetPath, fromPath = "index.html") {
  const fromDir = path.posix.dirname(fromPath || "index.html");
  let relative = path.posix.relative(fromDir, targetPath);

  if (!relative) {
    relative = path.posix.basename(targetPath);
  }

  return relative;
}

async function asyncReplace(input, regex, replacer) {
  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    const [fullMatch] = match;
    const index = match.index;

    result += input.slice(lastIndex, index);
    // eslint-disable-next-line no-await-in-loop
    result += await replacer(...match);
    lastIndex = index + fullMatch.length;
  }

  result += input.slice(lastIndex);
  return result;
}

function isHtmlResponse(contentType, url) {
  const mimeType = String(contentType || "").toLowerCase();
  if (mimeType.includes("text/html")) {
    return true;
  }

  const pathname = safePathFromUrl(url).toLowerCase();
  if (!path.extname(pathname) && pathname.endsWith("/")) {
    return true;
  }

  return false;
}

function isSpecialScheme(url) {
  return /^(data:|blob:|javascript:|mailto:|tel:)/i.test(String(url || "").trim());
}

function isIgnorableRawUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) {
    return true;
  }

  if (value === "#") {
    return true;
  }

  return isSpecialScheme(value);
}

function isTemplatedOrBrokenUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return true;
  }

  if (raw.includes("${") || raw.includes("{{") || raw.includes("...")) {
    return true;
  }

  const decoded = safeDecodeURIComponent(raw);
  if (decoded.includes("${") || decoded.includes("{{") || decoded.includes("...")) {
    return true;
  }

  return false;
}

function escapeCssUrl(value) {
  return String(value || "").replace(/"/g, "\\\"");
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return String(value || "");
  }
}

function shortHash(value, size = 10) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, size);
}

async function writeFileSafe(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function injectLocalRuntimePatch(html) {
  const input = String(html || "");
  if (!input || input.includes("data-site-extractor-runtime")) {
    return input;
  }

  const runtimePatch =
    '<script data-site-extractor-runtime="1">(function(){if(typeof window==="undefined"||typeof window.fetch!=="function"){return;}var nativeFetch=window.fetch.bind(window);var proxyPath="/api/ext-proxy?url=";var proxiedSuffixes=["b-cdn.net"];function shouldBypass(raw){try{var absolute=new URL(raw,window.location.href);var path=(absolute.pathname||"").toLowerCase();if(path.endsWith("/guest.vary.php")){return true;}return false;}catch(_error){return false;}}function shouldProxy(raw){try{var absolute=new URL(raw,window.location.href);if(!/^https?:$/i.test(absolute.protocol)){return false;}if(absolute.origin===window.location.origin){return false;}for(var i=0;i<proxiedSuffixes.length;i+=1){var suffix=proxiedSuffixes[i];if(absolute.hostname===suffix||absolute.hostname.endsWith("."+suffix)){return true;}}return false;}catch(_error){return false;}}window.fetch=function(input,init){var rawUrl=null;var nextInit=Object.assign({},init||{});if(typeof input==="string"){rawUrl=input;}else if(input instanceof URL){rawUrl=input.href;}else if(input&&typeof input.url==="string"){rawUrl=input.url;if(!nextInit.method&&input.method){nextInit.method=input.method;}if(!nextInit.headers&&input.headers){nextInit.headers=input.headers;}if(nextInit.body===undefined&&input.clone&&nextInit.method&&!/^(GET|HEAD)$/i.test(nextInit.method)){try{nextInit.body=input.clone().body;}catch(_bodyError){}}}if(rawUrl&&shouldBypass(rawUrl)){var payload=\'{"ok":true,"bypassed":"guest.vary.php"}\';if(typeof Response==="function"){return Promise.resolve(new Response(payload,{status:200,headers:{"content-type":"application/json; charset=utf-8"}}));}return Promise.resolve({ok:true,status:200,text:function(){return Promise.resolve(payload);},json:function(){return Promise.resolve({ok:true,bypassed:"guest.vary.php"});}});}if(!rawUrl||!shouldProxy(rawUrl)){return nativeFetch(input,init);}var absoluteTarget=new URL(rawUrl,window.location.href).href;var proxyUrl=proxyPath+encodeURIComponent(absoluteTarget);return nativeFetch(proxyUrl,nextInit);};})();</script>';

  if (input.includes("</head>")) {
    return input.replace("</head>", `${runtimePatch}</head>`);
  }

  if (input.includes("<body")) {
    return input.replace("<body", `${runtimePatch}<body`);
  }

  return runtimePatch + input;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeInputUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    throw new Error("Informe uma URL válida.");
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("URL inválida.");
  }

  if (!url.hostname) {
    throw new Error("URL inválida.");
  }

  url.hash = "";
  return url;
}

function sanitizePathSegment(input) {
  const value = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return value || "root";
}

function buildSiteRelativePath(url) {
  const host = sanitizePathSegment(url.hostname);
  const segments = url.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(sanitizePathSegment);

  if (segments.length === 0) {
    return host;
  }

  return [host, ...segments].join("/");
}

async function writeSiteMeta(outputDir, sourceUrl, finalUrl, options = {}) {
  const metaPath = path.join(outputDir, SITE_META_FILE);
  const payload = {
    sourceUrl,
    finalUrl,
    recursive: Boolean(options.recursive),
    pageCount: Number(options.pageCount) > 0 ? Number(options.pageCount) : 1,
    extractedAt: new Date().toISOString(),
  };

  await fs.writeFile(metaPath, JSON.stringify(payload, null, 2), "utf8");
}

async function downloadWebsite(inputUrl, sitesRoot, log, options = {}) {
  const normalized = normalizeInputUrl(inputUrl);
  const relativeSitePath = buildSiteRelativePath(normalized);
  const outputDir = path.join(sitesRoot, ...relativeSitePath.split("/"));

  const downloader = new WebsiteDownloader(normalized.toString(), outputDir, log, options);
  const result = await downloader.process();

  await writeSiteMeta(outputDir, normalized.toString(), result.finalUrl || normalized.toString(), {
    recursive: Boolean(options.recursive),
    pageCount: result.pageCount,
  });

  return {
    siteRoot: outputDir,
    siteRelativePath: relativeSitePath,
    entryPagePath: "index.html",
    pageCount: Number(result.pageCount) > 0 ? Number(result.pageCount) : 1,
    sourceUrl: normalized.toString(),
    finalUrl: result.finalUrl || normalized.toString(),
  };
}

module.exports = {
  WebsiteDownloader,
  downloadWebsite,
  normalizeInputUrl,
  buildSiteRelativePath,
  SITE_META_FILE,
  ROUTE_MAP_FILE,
  STANDARD_DIRS,
};
