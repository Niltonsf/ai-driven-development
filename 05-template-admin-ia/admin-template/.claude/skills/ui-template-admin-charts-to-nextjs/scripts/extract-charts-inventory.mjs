#!/usr/bin/env node
/**
 * extract-charts-inventory.mjs
 *
 * Walks a static admin template and produces a JSON inventory of:
 *   - detected charting libraries (with confidence scores)
 *   - chart instances (type, library, host file, page, config snippet)
 *   - palette frequency
 *   - typography hints
 *
 * Usage:
 *   node extract-charts-inventory.mjs <template-folder> [--out <path>]
 *
 * Output: prints JSON to stdout, or writes to --out file.
 *
 * Stdlib only — no node_modules required.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node extract-charts-inventory.mjs <template-folder> [--out <path>]');
  process.exit(1);
}
const root = path.resolve(args[0]);
const outIdx = args.indexOf('--out');
const outFile = outIdx >= 0 ? args[outIdx + 1] : null;

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Not a directory: ${root}`);
  process.exit(1);
}

const LIB_FILE_PATTERNS = [
  { lib: 'ApexCharts', re: /apexcharts/i, weight: 5 },
  { lib: 'Chart.js', re: /chart(\.min|\.umd|\.bundle)?\.js|chartjs/i, weight: 5 },
  { lib: 'ECharts', re: /echarts/i, weight: 5 },
  { lib: 'Highcharts', re: /highcharts|highstock|highmaps/i, weight: 5 },
  { lib: 'Chartist', re: /chartist/i, weight: 5 },
  { lib: 'Plotly', re: /plotly/i, weight: 5 },
  { lib: 'amCharts', re: /amcharts/i, weight: 5 },
  { lib: 'Morris.js', re: /morris(\.min)?\.js/i, weight: 5 },
  { lib: 'Flot', re: /jquery\.flot/i, weight: 5 },
  { lib: 'C3', re: /c3(\.min)?\.(js|css)/i, weight: 5 },
  { lib: 'NVD3', re: /nv\.d3/i, weight: 5 },
];

const LIB_CONSTRUCTOR_PATTERNS = [
  { lib: 'ApexCharts', re: /new\s+ApexCharts\s*\(/g, weight: 10 },
  { lib: 'Chart.js', re: /new\s+Chart\s*\(/g, weight: 10 },
  { lib: 'ECharts', re: /echarts\.init\s*\(/g, weight: 10 },
  { lib: 'Highcharts', re: /Highcharts\.(chart|stockChart|mapChart)\s*\(/g, weight: 10 },
  { lib: 'Chartist', re: /new\s+Chartist\./g, weight: 10 },
  { lib: 'Plotly', re: /Plotly\.(newPlot|react)\s*\(/g, weight: 10 },
  { lib: 'amCharts', re: /am[45]?(core)?\.(create|Root\.new)\s*\(/g, weight: 10 },
  { lib: 'Morris.js', re: /Morris\.(Bar|Line|Donut|Area)\s*\(/g, weight: 10 },
  { lib: 'Flot', re: /\$\.plot\s*\(/g, weight: 10 },
  { lib: 'C3', re: /c3\.generate\s*\(/g, weight: 10 },
];

const CHART_TYPE_HINTS = [
  { type: 'bar', re: /type:\s*['"]bar['"]|chart:\s*\{\s*type:\s*['"]bar['"]/i },
  { type: 'line', re: /type:\s*['"]line['"]/i },
  { type: 'area', re: /type:\s*['"]area['"]/i },
  { type: 'pie', re: /type:\s*['"]pie['"]/i },
  { type: 'donut', re: /type:\s*['"]donut['"]|cutout:\s*['"]?\d+%?['"]?/i },
  { type: 'radar', re: /type:\s*['"]radar['"]/i },
  { type: 'radialBar', re: /type:\s*['"]radialBar['"]/i },
  { type: 'gauge', re: /type:\s*['"]gauge['"]/i },
  { type: 'heatmap', re: /type:\s*['"]heatmap['"]/i },
  { type: 'scatter', re: /type:\s*['"]scatter['"]/i },
  { type: 'sparkline', re: /sparkline:\s*\{\s*enabled:\s*true/i },
];

const HEX_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

function walk(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
      walk(full, fileList);
    } else {
      fileList.push(full);
    }
  }
  return fileList;
}

const allFiles = walk(root);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
const jsFiles = allFiles.filter((f) => f.endsWith('.js'));
const cssFiles = allFiles.filter((f) => f.endsWith('.css'));

const scores = {};
const evidence = [];
const pagesWithCharts = new Set();
const chartInstances = [];
const paletteFreq = {};

function bump(lib, n) {
  scores[lib] = (scores[lib] || 0) + n;
}

// Pass A & C: file references in HTML and CSS
for (const file of [...htmlFiles, ...cssFiles]) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
  for (const { lib, re, weight } of LIB_FILE_PATTERNS) {
    if (re.test(content)) {
      bump(lib, weight);
      evidence.push({ file: path.relative(root, file), lib, pass: 'A/C' });
    }
  }
}

// Pass B: constructor calls in JS files (and inline scripts inside HTML)
const inspectableSources = [
  ...jsFiles.map((f) => ({ file: f, content: safeRead(f) })),
  ...htmlFiles.map((f) => ({ file: f, content: extractInlineScripts(safeRead(f)) })),
];

for (const { file, content } of inspectableSources) {
  if (!content) continue;
  const rel = path.relative(root, file);
  for (const { lib, re, weight } of LIB_CONSTRUCTOR_PATTERNS) {
    const matches = content.match(re);
    if (matches?.length) {
      bump(lib, weight * matches.length);
      evidence.push({ file: rel, lib, pass: 'B', occurrences: matches.length });
      // Try to detect chart type per occurrence by scanning a window after the constructor
      const re2 = new RegExp(re.source, 'g');
      let m;
      while ((m = re2.exec(content)) !== null) {
        const window = content.slice(m.index, m.index + 800);
        const type = CHART_TYPE_HINTS.find((h) => h.re.test(window))?.type ?? 'unknown';
        chartInstances.push({ file: rel, library: lib, type, snippetStart: m.index });
        if (file.endsWith('.html')) pagesWithCharts.add(rel);
      }
    }
  }
  // Capture hex colors in JS files (proxy for palette)
  const hexes = content.match(HEX_RE);
  if (hexes) {
    for (const h of hexes) {
      const norm = h.toLowerCase();
      paletteFreq[norm] = (paletteFreq[norm] || 0) + 1;
    }
  }
}

// Mark pages with charts based on which HTMLs reference chart libs
for (const ev of evidence) {
  if (ev.file.endsWith('.html')) pagesWithCharts.add(ev.file);
}

// Pick winner
const winnerEntry = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
const winner = winnerEntry?.[0] ?? null;
const winnerScore = winnerEntry?.[1] ?? 0;
const second = Object.entries(scores).sort((a, b) => b[1] - a[1])[1]?.[1] ?? 0;
let confidence = 'none';
if (winner) {
  if (winnerScore >= 30 && second < winnerScore * 0.5) confidence = 'high';
  else if (winnerScore >= 15) confidence = 'medium';
  else confidence = 'low';
}

// Top palette
const topPalette = Object.entries(paletteFreq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 24)
  .map(([color, count]) => ({ color, count }));

const out = {
  detection: {
    winner,
    confidence,
    scores,
    evidence: evidence.slice(0, 100),
  },
  pagesWithCharts: [...pagesWithCharts].sort(),
  chartInstances,
  palette: topPalette,
  fileCounts: { html: htmlFiles.length, js: jsFiles.length, css: cssFiles.length },
};

const json = JSON.stringify(out, null, 2);
if (outFile) {
  fs.writeFileSync(outFile, json);
  console.error(`Wrote ${outFile}`);
} else {
  process.stdout.write(json + '\n');
}

function safeRead(f) {
  try { return fs.readFileSync(f, 'utf8'); } catch { return ''; }
}
function extractInlineScripts(html) {
  if (!html) return '';
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let out = '';
  let m;
  while ((m = re.exec(html)) !== null) out += '\n' + m[1];
  return out;
}
