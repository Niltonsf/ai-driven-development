#!/usr/bin/env node
/**
 * extract-pages-inventory.mjs
 *
 * Varre uma pasta de template HTML/CSS/JS e produz um JSON descrevendo
 * cada página encontrada, com heurísticas para identificar arquétipo
 * (dashboard, login, 404, lista, detalhe, kanban, etc.) e blocos
 * detectáveis dentro do main.
 *
 * Uso:
 *   node extract-pages-inventory.mjs <template-path>
 *
 * Saída: JSON no stdout (redirecionar para .pages-inventory.json).
 *
 * Sem dependências externas — apenas Node fs/path + regex.
 * Heurística suficiente para listar e classificar; refinamento manual
 * é feito por Claude lendo HTMLs específicos.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.argv[2];
if (!root) {
  console.error("usage: extract-pages-inventory.mjs <template-path>");
  process.exit(1);
}
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`not a directory: ${root}`);
  process.exit(1);
}

const SCAN_DIRS = ["", "pages", "views", "templates", "html", "src", "app"];
const IGNORE = new Set(["node_modules", "vendor", "dist", "build", ".git"]);

function listHtmlFiles(dir, depth = 0) {
  if (depth > 4) return [];
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (IGNORE.has(e.name) || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listHtmlFiles(full, depth + 1));
    else if (e.isFile() && e.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const allHtml = listHtmlFiles(root);

const ARCHETYPE_PATTERNS = [
  { rx: /^(index|dashboard|home|analytics|main|default)(\W|$)/i, archetype: "dashboard" },
  { rx: /^(login|sign-?in|signin)/i, archetype: "auth-login" },
  { rx: /^(register|sign-?up|signup)/i, archetype: "auth-register" },
  { rx: /^(forgot|reset)-?password/i, archetype: "auth-forgot" },
  { rx: /^(lock|locked|lockscreen)/i, archetype: "auth-lock" },
  { rx: /^(two-?step|2fa|verify|otp)/i, archetype: "auth-verify" },
  { rx: /^(404|page-404|error-404|not-found)/i, archetype: "error-404" },
  { rx: /^(500|page-500|error-500|server-error)/i, archetype: "error-500" },
  { rx: /^(403|forbidden|maintenance|coming-soon)/i, archetype: "error-other" },
  { rx: /^(profile|account-profile)(\W|$)/i, archetype: "profile" },
  { rx: /^(settings|preferences|account-settings)/i, archetype: "settings" },
  { rx: /^(users?|user-list|members?|team|staff)/i, archetype: "users-list" },
  { rx: /^(user|member|profile)-(view|details?|profile)/i, archetype: "user-detail" },
  { rx: /^(products?|catalog)/i, archetype: "products" },
  { rx: /^(orders?|sales)/i, archetype: "orders" },
  { rx: /^(invoices?|bills)/i, archetype: "invoices" },
  { rx: /^(customers?|clients?)/i, archetype: "customers" },
  { rx: /^(kanban|board)/i, archetype: "kanban" },
  { rx: /^(calendar|events?)/i, archetype: "calendar" },
  { rx: /^(chat|messages?|conversations?)/i, archetype: "chat" },
  { rx: /^(inbox|mail|email)/i, archetype: "inbox" },
  { rx: /^(file-?manager|files)/i, archetype: "file-manager" },
  { rx: /^(todo|tasks?)/i, archetype: "todo" },
  { rx: /^(pricing|plans)/i, archetype: "pricing" },
  { rx: /^(faq|help|support)/i, archetype: "help" },
];

function classify(filename) {
  const base = path.basename(filename, ".html").toLowerCase();
  for (const { rx, archetype } of ARCHETYPE_PATTERNS) {
    if (rx.test(base)) return archetype;
  }
  return "unknown";
}

function detectBlocks(html) {
  const blocks = [];
  const main = extractMain(html);
  if (!main) return blocks;

  // stat cards: heurísticas comuns
  const statCardRx = /(card[^"']*(stat|stats|metric|kpi|widget)|widget[^"']*stat|small-?box|info-?box)/gi;
  const statCount = (main.match(statCardRx) || []).length;
  if (statCount > 0) blocks.push({ type: "stat-cards", count: Math.min(statCount, 8) });

  // gráficos
  const chartHints = [
    { rx: /apexchart|apex-chart/gi, lib: "apexcharts" },
    { rx: /chartjs|chart\.js|<canvas[^>]*chart/gi, lib: "chartjs" },
    { rx: /echarts/gi, lib: "echarts" },
    { rx: /highcharts/gi, lib: "highcharts" },
    { rx: /chartist/gi, lib: "chartist" },
  ];
  for (const { rx, lib } of chartHints) {
    const c = (main.match(rx) || []).length;
    if (c > 0) blocks.push({ type: "chart", library: lib, count: c });
  }

  // tabelas
  const tables = (main.match(/<table[\s>]/gi) || []).length;
  if (tables > 0) blocks.push({ type: "table", count: tables });

  // listas (activity / recent)
  if (/recent-?activit|activity-?list|timeline|recent-?item/gi.test(main))
    blocks.push({ type: "activity-list" });

  // progress groups
  const progress = (main.match(/progress-bar|<progress[\s>]/gi) || []).length;
  if (progress >= 3) blocks.push({ type: "progress-group", count: progress });

  return blocks;
}

function extractMain(html) {
  const m = html.match(/<main[\s\S]*?<\/main>/i)
       || html.match(/<div[^>]*(content-wrapper|main-content|page-content|app-content)[\s\S]*?<\/div>/i);
  return m ? m[0] : html;
}

function detectShell(html) {
  const hasAside = /<aside[\s>]|<nav[^>]*sidebar/i.test(html);
  const hasMain = /<main[\s>]|main-content|page-content/i.test(html);
  return hasAside && hasMain;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "";
}

function extractMenuLinks(html) {
  // procura nav/sidebar e extrai <a href> + texto
  const navRx = /<(?:aside|nav)[\s\S]*?<\/(?:aside|nav)>/gi;
  const links = [];
  const blocks = html.match(navRx) || [];
  for (const block of blocks) {
    const linkRx = /<a[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = linkRx.exec(block)) !== null) {
      const href = m[1].trim();
      const text = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!href || href.startsWith("javascript:")) continue;
      links.push({ href, label: text });
    }
  }
  return links;
}

const pages = [];
const authPages = [];
const errorPages = [];
const menuLinksAccum = new Map();

for (const file of allHtml) {
  const rel = path.relative(root, file);
  let html;
  try { html = fs.readFileSync(file, "utf8"); }
  catch { continue; }

  const archetype = classify(rel);
  const entry = {
    file: rel,
    archetype,
    title: extractTitle(html),
    hasShell: detectShell(html),
    blocks: detectBlocks(html),
  };

  if (archetype.startsWith("auth-")) authPages.push(entry);
  else if (archetype.startsWith("error-")) errorPages.push(entry);
  else pages.push(entry);

  if (entry.hasShell) {
    for (const link of extractMenuLinks(html)) {
      if (!menuLinksAccum.has(link.href)) menuLinksAccum.set(link.href, link);
    }
  }
}

const output = {
  templateRoot: root,
  scannedAt: new Date().toISOString(),
  totals: {
    htmlFiles: allHtml.length,
    pages: pages.length,
    authPages: authPages.length,
    errorPages: errorPages.length,
  },
  pages: pages.sort((a, b) => a.file.localeCompare(b.file)),
  authPages,
  errorPages,
  menuLinksInTemplate: Array.from(menuLinksAccum.values()),
};

process.stdout.write(JSON.stringify(output, null, 2) + "\n");
