#!/usr/bin/env node
/**
 * extract-composites-inventory.mjs
 *
 * Varredura de uma pasta de template admin (HTML/CSS/JS estático) procurando
 * candidatos a componentes compostos.
 *
 * Saída: JSON em stdout com duas seções:
 *   - canonical:  ocorrências de blocos típicos da lista canônica
 *   - discovered: blocos recorrentes com classes próprias do template,
 *                 agrupados por classe-raiz
 *
 * Uso:
 *   node extract-composites-inventory.mjs <pasta-template>
 *
 * Falha graciosa: se algum HTML não puder ser parseado, registra warning e
 * segue. Se nenhum HTML for encontrado, sai com código 1.
 *
 * Dependência única: node-html-parser (fallback regex se ausente).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative, basename } from 'node:path';

const root = process.argv[2];
if (!root) {
  console.error('Usage: extract-composites-inventory.mjs <pasta-template>');
  process.exit(1);
}

// ---------- helpers ----------

function walk(dir, files = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry)) continue;
      walk(full, files);
    } else if (extname(entry).toLowerCase() === '.html') {
      files.push(full);
    }
  }
  return files;
}

let parser = null;
try {
  const mod = await import('node-html-parser');
  parser = mod.parse;
} catch {
  // fallback regex
}

function parseDoc(html) {
  if (parser) {
    try { return { kind: 'dom', root: parser(html) }; } catch { /* fallthrough */ }
  }
  return { kind: 'regex', html };
}

// ---------- canonical detectors ----------

const CANONICAL_SELECTORS = [
  // [composite, selectors-css-like-or-tag, primitives]
  { name: 'page-header',         match: ['.page-header', '.content-header', '.page-title-box', '.page-titles', '.app-page-title'], primitives: [] },
  { name: 'breadcrumb',          match: ['.breadcrumb', 'nav[aria-label="breadcrumb"]', 'ol.breadcrumb'], primitives: [] },
  { name: 'card',                match: ['.card', '.box', '.panel'], primitives: [] },
  { name: 'stat-card',           match: ['.stat-card', '.info-box', '.kpi-card', '.card-stats', '.widget-stat'], primitives: ['Badge', 'Avatar'] },
  { name: 'profile-card',        match: ['.profile-card', '.user-profile-card'], primitives: ['Avatar', 'Badge', 'Button'] },
  { name: 'timeline',            match: ['.timeline', '.activity-feed', '.activity-list'], primitives: ['Avatar'] },
  { name: 'collapsible-panel',   match: ['.accordion-item', '.collapsible', 'details'], primitives: ['IconButton'] },
  { name: 'modal',               match: ['.modal', '[role="dialog"]', '.dialog'], primitives: ['Button', 'IconButton'] },
  { name: 'drawer',              match: ['.offcanvas', '.drawer', '.side-panel'], primitives: ['IconButton'] },
  { name: 'popover',             match: ['.popover'], primitives: [] },
  { name: 'toast',               match: ['.toast', '.notification', '.alert-stack'], primitives: [] },
  { name: 'empty-state',         match: ['.empty-state', '.no-data', '.placeholder-block'], primitives: ['Button'] },
  { name: 'loading-skeleton',    match: ['.skeleton', '.placeholder-glow', '.shimmer'], primitives: [] },
  { name: 'page-banner',         match: ['.alert-banner', '.page-banner', '.notice-bar'], primitives: [] },
  { name: 'data-table',          match: ['table.table', '.data-table', 'table.dataTable'], primitives: ['Checkbox', 'Button', 'Badge'] },
  { name: 'pagination',          match: ['.pagination', '.page-numbers', 'ul.pagination'], primitives: ['Button', 'IconButton'] },
  { name: 'applied-filters',     match: ['.applied-filters', '.active-filters', '.tag-filters'], primitives: ['Chip', 'Tag'] },
  { name: 'tabs',                match: ['.nav-tabs', '.tabs', '[role="tablist"]'], primitives: [] },
  { name: 'action-menu',         match: ['.dropdown-menu', '.action-menu'], primitives: ['IconButton'] },
  { name: 'segmented-control',   match: ['.btn-group[role="group"]', '.segmented', '.pill-nav'], primitives: ['Button'] },
  { name: 'stepper',             match: ['.stepper', '.wizard-steps', '.bs-stepper'], primitives: [] },
  { name: 'file-upload',         match: ['.dropzone', '.file-upload'], primitives: ['Button', 'Progress', 'IconButton'] },
  { name: 'command-palette',     match: ['.command-palette', '.spotlight'], primitives: ['Input', 'Spinner'] },
];

// ---------- detection ----------

function classMatches(classAttr, sel) {
  // sel can be `.foo`, `tag.foo`, `tag[attr="value"]`, `[role="X"]`
  if (sel.startsWith('.')) {
    const cls = sel.slice(1);
    return classAttr.split(/\s+/).includes(cls);
  }
  return false;
}

function countCanonicalInHtml(html) {
  // simple regex-driven count of class occurrences
  const counts = {};
  for (const def of CANONICAL_SELECTORS) {
    let total = 0;
    for (const sel of def.match) {
      if (sel.startsWith('.')) {
        const cls = sel.slice(1).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
        const re = new RegExp(`class\\s*=\\s*["'][^"']*\\b${cls}\\b[^"']*["']`, 'g');
        total += (html.match(re) || []).length;
      } else if (sel.includes('[role=')) {
        const m = sel.match(/\[role=["']?([^"'\]]+)["']?\]/);
        if (m) {
          const re = new RegExp(`role\\s*=\\s*["']${m[1]}["']`, 'g');
          total += (html.match(re) || []).length;
        }
      } else if (sel.includes('.')) {
        const [tag, cls] = sel.split('.');
        const re = new RegExp(`<${tag}\\b[^>]*class\\s*=\\s*["'][^"']*\\b${cls}\\b[^"']*["']`, 'g');
        total += (html.match(re) || []).length;
      } else {
        // bare tag
        const re = new RegExp(`<${sel}\\b`, 'g');
        total += (html.match(re) || []).length;
      }
    }
    if (total > 0) counts[def.name] = total;
  }
  return counts;
}

// ---------- discovery (passada B) ----------

const KNOWN_PRIMITIVE_CLASSES = new Set([
  'btn', 'btn-primary', 'btn-secondary', 'btn-danger', 'btn-success', 'btn-warning', 'btn-info',
  'badge', 'chip', 'tag', 'avatar', 'spinner', 'alert', 'tooltip', 'progress', 'progress-bar',
  'form-control', 'form-select', 'form-check', 'form-switch', 'input-group', 'form-label',
  'row', 'col', 'container', 'container-fluid', 'd-flex', 'flex', 'block', 'inline',
]);

const KNOWN_LAYOUT_CLASSES = new Set([
  'sidebar', 'main-sidebar', 'app-sidebar', 'navbar', 'topbar', 'header', 'app-header',
  'footer', 'main-footer', 'app-footer', 'page-content', 'main-content', 'wrapper',
  'content-wrapper', 'app-main',
]);

// classes already covered by canonical
const CANONICAL_CLASSES = new Set();
for (const def of CANONICAL_SELECTORS) {
  for (const sel of def.match) {
    if (sel.startsWith('.')) CANONICAL_CLASSES.add(sel.slice(1));
    if (sel.includes('.') && !sel.startsWith('.')) {
      const cls = sel.split('.')[1];
      if (cls) CANONICAL_CLASSES.add(cls);
    }
  }
}

function discoverInHtml(html, pageName, accumulator) {
  // collect all class attributes
  const re = /class\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const classes = m[1].split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      // filter out known primitives, layout, canonical
      if (KNOWN_PRIMITIVE_CLASSES.has(cls)) continue;
      if (KNOWN_LAYOUT_CLASSES.has(cls)) continue;
      if (CANONICAL_CLASSES.has(cls)) continue;
      // filter Bootstrap utilities
      if (/^(d|m|p|mt|mb|ml|mr|mx|my|pt|pb|pl|pr|px|py|w|h|text|bg|border|rounded|flex|grid|gap|justify|align|float|position)-/.test(cls)) continue;
      if (/^(col|row|order|offset)(-|$)/.test(cls)) continue;
      if (/^(fa|fas|far|fab|fal|fi|bi|ri|ti|mdi)-/.test(cls)) continue; // icon classes
      if (/^(active|show|hide|hidden|visible|disabled|fade|collapse|collapsed|open|closed)$/.test(cls)) continue;
      if (cls.length < 4) continue;
      // require kebab-case with at least one hyphen — proxy for "componentish" classes
      if (!/-/.test(cls)) continue;

      if (!accumulator[cls]) {
        accumulator[cls] = { count: 0, pages: new Set(), sample: null };
      }
      accumulator[cls].count++;
      accumulator[cls].pages.add(pageName);
      if (!accumulator[cls].sample) {
        // capture small surrounding snippet
        const idx = m.index;
        const start = Math.max(0, html.lastIndexOf('<', idx));
        const end = Math.min(html.length, html.indexOf('>', idx) + 1);
        accumulator[cls].sample = html.slice(start, Math.min(end + 200, html.length)).slice(0, 400);
      }
    }
  }
}

// ---------- main ----------

const htmlFiles = walk(root);
if (htmlFiles.length === 0) {
  console.error(`No HTML files found under ${root}`);
  process.exit(1);
}

const canonicalAggregate = {}; // name -> { totalCount, pages: { page: count } }
const discovered = {};

for (const file of htmlFiles) {
  let html;
  try { html = readFileSync(file, 'utf8'); }
  catch (e) { console.error(`warn: cannot read ${file}: ${e.message}`); continue; }

  const pageName = relative(root, file);
  const counts = countCanonicalInHtml(html);
  for (const [name, count] of Object.entries(counts)) {
    if (!canonicalAggregate[name]) canonicalAggregate[name] = { total: 0, pages: {} };
    canonicalAggregate[name].total += count;
    canonicalAggregate[name].pages[pageName] = count;
  }

  discoverInHtml(html, pageName, discovered);
}

// canonical output
const canonical = Object.entries(canonicalAggregate).map(([name, info]) => {
  const def = CANONICAL_SELECTORS.find(d => d.name === name);
  return {
    name,
    totalOccurrences: info.total,
    pages: info.pages,
    primitivesConsumed: def?.primitives ?? [],
    selectors: def?.match ?? [],
  };
}).sort((a, b) => b.totalOccurrences - a.totalOccurrences);

// discovered output: keep only classes appearing in ≥2 contexts OR ≥3 occurrences total
const discoveredOut = Object.entries(discovered)
  .filter(([_, info]) => info.pages.size >= 2 || info.count >= 3)
  .map(([cls, info]) => ({
    suggestedName: cls,
    rootClass: cls,
    occurrences: info.count,
    pages: [...info.pages],
    sampleHtml: info.sample,
  }))
  .sort((a, b) => b.occurrences - a.occurrences);

const output = {
  templateRoot: root,
  htmlFilesScanned: htmlFiles.length,
  canonical,
  discovered: discoveredOut,
};

process.stdout.write(JSON.stringify(output, null, 2));
