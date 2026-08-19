#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  downloadWebsite,
  SITE_META_FILE,
  STANDARD_DIRS,
} = require("./downloader.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const DEFAULT_SITES_DIR = path.join(PACKAGE_ROOT, "sites");

function resolveSitesDir(outputDir) {
  if (outputDir && String(outputDir).trim()) {
    return path.resolve(String(outputDir).trim());
  }
  if (process.env.SITES_DIR && process.env.SITES_DIR.trim()) {
    return path.resolve(process.env.SITES_DIR.trim());
  }
  return DEFAULT_SITES_DIR;
}

const server = new McpServer(
  { name: "site-extractor", version: "1.0.0" },
  { capabilities: { logging: {} } }
);

server.tool(
  "extract_site",
  "Baixa uma página web (HTML, CSS, JS, imagens, fontes) usando Playwright, com reescrita de caminhos para execução local. Retorna o caminho da pasta gerada e da página inicial.",
  {
    url: z.string().url().describe("URL completa da página a extrair (ex: https://exemplo.com/pagina)."),
    recursive: z
      .boolean()
      .optional()
      .describe("Quando true, segue links internos do mesmo domínio. Padrão: false."),
    maxPages: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Limite de páginas no modo recursivo. Padrão: 25."),
    outputDir: z
      .string()
      .optional()
      .describe("Pasta destino dos sites baixados. Padrão: <pacote>/sites ou env SITES_DIR."),
  },
  async ({ url, recursive, maxPages, outputDir }) => {
    const sitesDir = resolveSitesDir(outputDir);
    await fs.mkdir(sitesDir, { recursive: true });

    const startedAt = Date.now();
    const sendLog = (message) => {
      try {
        server.server.sendLoggingMessage({
          level: "info",
          logger: "site-extractor",
          data: String(message),
        });
      } catch {
        // Cliente pode não ter ativado capability de logging — ignora silenciosamente.
      }
    };

    sendLog(`URL: ${url}`);
    sendLog(`Modo: ${recursive ? "recursivo (mesmo domínio)" : "página única"}`);
    sendLog(`Pasta destino: ${sitesDir}`);

    const result = await downloadWebsite(url, sitesDir, sendLog, {
      recursive: Boolean(recursive),
      maxPages,
    });

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    const entryAbsolute = path.join(result.siteRoot, result.entryPagePath);

    const summary = [
      `Site extraído com sucesso em ${elapsed}s.`,
      `Pasta: ${result.siteRoot}`,
      `Página inicial local: ${entryAbsolute}`,
      `Páginas processadas: ${result.pageCount}`,
      `URL final: ${result.finalUrl}`,
    ].join("\n");

    return {
      content: [{ type: "text", text: summary }],
      structuredContent: {
        siteRoot: result.siteRoot,
        siteRelativePath: result.siteRelativePath,
        entryPagePath: result.entryPagePath,
        entryPageAbsolutePath: entryAbsolute,
        pageCount: result.pageCount,
        sourceUrl: result.sourceUrl,
        finalUrl: result.finalUrl,
        elapsedSeconds: Number(elapsed),
      },
    };
  }
);

server.tool(
  "list_sites",
  "Lista os sites previamente extraídos na pasta de saída.",
  {
    outputDir: z
      .string()
      .optional()
      .describe("Pasta onde os sites foram salvos. Padrão: <pacote>/sites ou env SITES_DIR."),
  },
  async ({ outputDir }) => {
    const sitesDir = resolveSitesDir(outputDir);
    const sites = await collectSites(sitesDir);

    const text =
      sites.length === 0
        ? `Nenhum site baixado em: ${sitesDir}`
        : [
            `Sites em ${sitesDir}:`,
            ...sites.map(
              (s) =>
                `- ${s.folderName}` +
                (s.sourceUrl ? `  (${s.sourceUrl})` : "") +
                (s.updatedAt ? `  [${s.updatedAt}]` : "")
            ),
          ].join("\n");

    return {
      content: [{ type: "text", text }],
      structuredContent: { sitesDir, sites },
    };
  }
);

server.tool(
  "delete_site",
  "Remove a pasta de um site previamente extraído.",
  {
    folderName: z
      .string()
      .describe("Caminho relativo do site (conforme retornado por list_sites). Ex: www.exemplo.com/about"),
    outputDir: z.string().optional(),
  },
  async ({ folderName, outputDir }) => {
    const sitesDir = resolveSitesDir(outputDir);
    const safeRoot = path.resolve(sitesDir);

    const parts = String(folderName || "")
      .split("/")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0 || parts.some((p) => p === ".." || p.includes("\0") || p.startsWith("/"))) {
      throw new Error("folderName inválido.");
    }

    const target = path.resolve(safeRoot, ...parts);
    if (target !== safeRoot && !target.startsWith(safeRoot + path.sep)) {
      throw new Error("Acesso negado: alvo fora da pasta de sites.");
    }

    let stat;
    try {
      stat = await fs.stat(target);
    } catch {
      throw new Error(`Site não encontrado: ${target}`);
    }
    if (!stat.isDirectory()) {
      throw new Error(`Caminho não é uma pasta: ${target}`);
    }

    await fs.rm(target, { recursive: true, force: true });

    return {
      content: [{ type: "text", text: `Removido: ${target}` }],
      structuredContent: { removedPath: target },
    };
  }
);

async function collectSites(rootDir) {
  try {
    await fs.mkdir(rootDir, { recursive: true });
  } catch {
    // ignore
  }

  const standardAssetFolders = new Set(
    Object.values(STANDARD_DIRS).map((d) => String(d).split("/")[0].toLowerCase())
  );

  const results = [];

  async function walk(relativePath) {
    const absolute = relativePath ? path.join(rootDir, ...relativePath.split("/")) : rootDir;

    let entries;
    try {
      entries = await fs.readdir(absolute, { withFileTypes: true });
    } catch {
      return;
    }

    const hasMeta = entries.some((e) => e.isFile() && e.name === SITE_META_FILE);
    if (hasMeta && relativePath) {
      let stats;
      try {
        stats = await fs.stat(absolute);
      } catch {
        // ignore
      }

      let sourceUrl = null;
      try {
        const meta = JSON.parse(await fs.readFile(path.join(absolute, SITE_META_FILE), "utf8"));
        if (meta && typeof meta.sourceUrl === "string" && meta.sourceUrl.trim()) {
          sourceUrl = meta.sourceUrl.trim();
        }
      } catch {
        // ignore
      }

      results.push({
        folderName: relativePath,
        absolutePath: absolute,
        sourceUrl,
        updatedAt: stats?.mtime?.toISOString() || null,
      });
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;
      if (standardAssetFolders.has(entry.name.toLowerCase())) continue;

      const child = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      // eslint-disable-next-line no-await-in-loop
      await walk(child);
    }
  }

  await walk("");

  results.sort((a, b) => {
    const av = a.updatedAt || "";
    const bv = b.updatedAt || "";
    if (av === bv) return 0;
    return av < bv ? 1 : -1;
  });

  return results;
}

const transport = new StdioServerTransport();
await server.connect(transport);
