#!/usr/bin/env node
/**
 * extract-ui-inventory.mjs
 *
 * Varre uma pasta de template HTML/CSS/JS e produz um JSON com a contagem
 * de elementos e classes candidatos a primitivos de UI, agrupados por arquivo.
 *
 * Uso:
 *   node extract-ui-inventory.mjs <pasta-do-template>
 *
 * Saída: JSON em stdout. Falha graciosa: se nada for encontrado, retorna
 * estrutura vazia mas com exit code 0 — o caller deve cair em inspeção manual.
 *
 * Sem dependências externas. Regex-based; não é parser HTML completo, mas é
 * suficiente para varredura quantitativa de candidatos a primitivos.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) {
  console.error('Uso: node extract-ui-inventory.mjs <pasta-do-template>');
  process.exit(1);
}

const HTML_EXTS = new Set(['.html', '.htm']);

const TAG_TARGETS = [
  'button',
  'input',
  'textarea',
  'select',
  'label',
  'hr',
  'progress',
];

const CLASS_PATTERNS = [
  // Bootstrap-derivados
  { primitive: 'Button',   regex: /\bbtn(?:-[a-z0-9]+)*\b/g },
  { primitive: 'Input',    regex: /\bform-control(?:-(?:sm|lg))?\b/g },
  { primitive: 'Select',   regex: /\bform-select(?:-(?:sm|lg))?\b/g },
  { primitive: 'Checkbox', regex: /\bform-check-input\b/g },
  { primitive: 'Switch',   regex: /\bform-switch\b/g },
  { primitive: 'Label',    regex: /\bform-label\b/g },
  { primitive: 'FormText', regex: /\bform-text\b|\binvalid-feedback\b|\bvalid-feedback\b/g },
  { primitive: 'InputGroup', regex: /\binput-group(?:-text)?\b/g },
  { primitive: 'Badge',    regex: /\bbadge(?:-[a-z0-9]+)*\b/g },
  { primitive: 'Chip',     regex: /\bchip(?:-[a-z0-9]+)*\b/g },
  { primitive: 'Tag',      regex: /\btag(?:-[a-z0-9]+)*\b/g },
  { primitive: 'Alert',    regex: /\balert(?:-[a-z0-9]+)*\b/g },
  { primitive: 'Avatar',   regex: /\bavatar(?:-[a-z0-9]+)*\b/g },
  { primitive: 'Spinner',  regex: /\bspinner-(?:border|grow)\b/g },
  { primitive: 'Progress', regex: /\bprogress(?:-bar)?\b/g },
  { primitive: 'Tooltip',  regex: /data-bs-toggle="tooltip"|\btooltip\b|data-tippy-content/g },
  { primitive: 'Divider',  regex: /\bdivider\b|\bseparator\b/g },

  // Material-derivados
  { primitive: 'Button',   regex: /\bMuiButton-[A-Za-z0-9]+\b|\bmat-button\b/g },
  { primitive: 'TextField',regex: /\bMuiTextField-[A-Za-z0-9]+\b|\bmat-form-field\b/g },
  { primitive: 'Chip',     regex: /\bMuiChip-[A-Za-z0-9]+\b/g },
  { primitive: 'Badge',    regex: /\bMuiBadge-[A-Za-z0-9]+\b/g },
  { primitive: 'Alert',    regex: /\bMuiAlert-[A-Za-z0-9]+\b/g },
  { primitive: 'Avatar',   regex: /\bMuiAvatar-[A-Za-z0-9]+\b/g },
];

function listHtmlFiles(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      listHtmlFiles(full, acc);
    } else if (HTML_EXTS.has(extname(name).toLowerCase())) {
      acc.push(full);
    }
  }
  return acc;
}

function analyzeFile(path) {
  const html = readFileSync(path, 'utf8');

  const tagCounts = {};
  for (const tag of TAG_TARGETS) {
    const re = new RegExp(`<${tag}\\b`, 'gi');
    const m = html.match(re);
    tagCounts[tag] = m ? m.length : 0;
  }

  // Tipos de input
  const inputTypeCounts = {};
  const inputRe = /<input\b[^>]*\btype=["']?([a-z]+)["']?/gi;
  let match;
  while ((match = inputRe.exec(html)) !== null) {
    const t = match[1].toLowerCase();
    inputTypeCounts[t] = (inputTypeCounts[t] || 0) + 1;
  }

  const classMatches = {};
  for (const { primitive, regex } of CLASS_PATTERNS) {
    const found = html.match(regex);
    if (!found) continue;
    classMatches[primitive] = classMatches[primitive] || { total: 0, samples: new Set() };
    classMatches[primitive].total += found.length;
    for (const sample of found.slice(0, 8)) classMatches[primitive].samples.add(sample);
  }

  const classMatchesOut = {};
  for (const [k, v] of Object.entries(classMatches)) {
    classMatchesOut[k] = { total: v.total, samples: [...v.samples] };
  }

  return { tagCounts, inputTypeCounts, classMatches: classMatchesOut };
}

function aggregate(perFile) {
  const totals = { tagCounts: {}, inputTypeCounts: {}, classMatches: {}, pagesWithPrimitive: {} };
  for (const [, data] of Object.entries(perFile)) {
    for (const [tag, n] of Object.entries(data.tagCounts)) {
      totals.tagCounts[tag] = (totals.tagCounts[tag] || 0) + n;
    }
    for (const [t, n] of Object.entries(data.inputTypeCounts)) {
      totals.inputTypeCounts[t] = (totals.inputTypeCounts[t] || 0) + n;
    }
    for (const [prim, info] of Object.entries(data.classMatches)) {
      const t = totals.classMatches[prim] || { total: 0, samples: new Set() };
      t.total += info.total;
      for (const s of info.samples) t.samples.add(s);
      totals.classMatches[prim] = t;
      totals.pagesWithPrimitive[prim] = (totals.pagesWithPrimitive[prim] || 0) + 1;
    }
  }
  const out = {};
  for (const [k, v] of Object.entries(totals.classMatches)) {
    out[k] = { total: v.total, samples: [...v.samples] };
  }
  return {
    tagCounts: totals.tagCounts,
    inputTypeCounts: totals.inputTypeCounts,
    classMatches: out,
    pagesWithPrimitive: totals.pagesWithPrimitive,
  };
}

function main() {
  let files;
  try {
    const st = statSync(ROOT);
    if (!st.isDirectory()) {
      console.error(`Não é um diretório: ${ROOT}`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`Não foi possível acessar ${ROOT}: ${e.message}`);
    process.exit(1);
  }

  files = listHtmlFiles(ROOT);
  if (files.length === 0) {
    console.log(JSON.stringify({ root: ROOT, files: [], perFile: {}, totals: null, note: 'Nenhum HTML encontrado — fazer inspeção manual.' }, null, 2));
    return;
  }

  const perFile = {};
  for (const f of files) {
    try {
      perFile[f] = analyzeFile(f);
    } catch (e) {
      perFile[f] = { error: e.message };
    }
  }

  const totals = aggregate(perFile);

  console.log(JSON.stringify({
    root: ROOT,
    fileCount: files.length,
    files,
    perFile,
    totals,
    inclusionHint: 'Primitivo é candidato se pagesWithPrimitive[X] >= 2 OU se for controle de formulário (Input, Textarea, Select, Checkbox, Radio, Switch, Label).',
  }, null, 2));
}

main();
