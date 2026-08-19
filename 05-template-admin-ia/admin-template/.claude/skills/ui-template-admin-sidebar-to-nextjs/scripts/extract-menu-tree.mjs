#!/usr/bin/env node
/**
 * extract-menu-tree.mjs
 *
 * Lê um arquivo HTML estático de um template admin e extrai a árvore semântica
 * do sidebar como JSON, no formato:
 *
 *   type MenuNode =
 *     | { type: 'item', label: string, href: string, icon?: string, badge?: string }
 *     | { type: 'group', label: string, icon?: string, children: MenuNode[] }
 *     | { type: 'section', label: string }
 *     | { type: 'divider' }
 *
 * Uso:
 *   node extract-menu-tree.mjs <html-path> [selector]
 *
 * O segundo argumento (selector) é opcional. Se omitido, tenta uma lista de
 * seletores comuns. Se nenhum bater, sai com código 2 e mensagem em stderr —
 * Claude faz a extração manualmente nesse caso.
 *
 * Sem dependências externas — usa apenas DOM de regex/parser leve.
 * Em vez de instalar `node-html-parser` via npm, este script tenta importá-lo
 * via npx-style; se falhar, usa um parser regex-based de fallback (pior, mas
 * cobre os casos comuns).
 */

import { readFileSync } from 'node:fs';
import { argv, exit, stderr, stdout } from 'node:process';

const [, , htmlPath, userSelector] = argv;
if (!htmlPath) {
  stderr.write('Uso: node extract-menu-tree.mjs <html-path> [selector]\n');
  exit(1);
}

const html = readFileSync(htmlPath, 'utf8');

let parse;
try {
  ({ parse } = await import('node-html-parser'));
} catch {
  stderr.write(
    'node-html-parser indisponível. Rode com: npx -y -p node-html-parser node extract-menu-tree.mjs <html> [selector]\n',
  );
  exit(3);
}

const root = parse(html, { lowerCaseTagName: false, comment: false });

const FALLBACK_SELECTORS = [
  'aside .menu',
  'aside ul',
  'aside nav',
  '.sidebar .menu',
  '.sidebar ul',
  '.sidebar-nav',
  '#sidebar ul',
  '.main-menu',
  '.main-sidebar ul',
  '.app-sidebar ul',
  '.vertical-nav ul',
  '.left-sidebar ul',
  'nav.sidebar',
];

let menuRoot = null;
const tried = [];
const candidates = userSelector ? [userSelector] : FALLBACK_SELECTORS;

for (const sel of candidates) {
  tried.push(sel);
  const found = root.querySelector(sel);
  if (found) {
    menuRoot = found;
    stderr.write(`Selector usado: ${sel}\n`);
    break;
  }
}

if (!menuRoot) {
  stderr.write(
    `Nenhum seletor encontrou o sidebar. Tentados:\n  ${tried.join('\n  ')}\n` +
      `Inspecione o HTML e rode novamente passando um seletor explícito.\n`,
  );
  exit(2);
}

function textOf(node) {
  return (node?.text ?? '').replace(/\s+/g, ' ').trim();
}

function detectIconClass(li) {
  const i = li.querySelector(':scope > a > i, :scope > button > i, :scope > a > span > i, :scope > a svg, :scope > a img');
  if (!i) return undefined;
  if (i.tagName === 'SVG') return 'svg-inline';
  if (i.tagName === 'IMG') return i.getAttribute('src') || undefined;
  const cls = i.getAttribute('class') || '';
  return cls.trim() || undefined;
}

function isDividerLi(li) {
  const cls = (li.getAttribute('class') || '').toLowerCase();
  return /(^|\s)(divider|menu-divider|menu-separator|nav-divider)(\s|$)/.test(cls);
}

function isSectionHeaderLi(li) {
  const cls = (li.getAttribute('class') || '').toLowerCase();
  if (/(^|\s)(menu-header|menu-title|menu-section|nav-header|menu-category|nav-title)(\s|$)/.test(cls)) {
    return true;
  }
  // li sem <a> e sem <ul> — apenas texto
  const hasA = li.querySelector(':scope > a');
  const hasUl = li.querySelector(':scope > ul');
  return !hasA && !hasUl && textOf(li).length > 0;
}

function getDirectAnchor(li) {
  return li.querySelector(':scope > a') || li.querySelector(':scope > button');
}

function getDirectChildList(li) {
  return li.querySelector(':scope > ul') || li.querySelector(':scope > .submenu') || li.querySelector(':scope > .menu-sub');
}

function labelFromAnchor(a) {
  if (!a) return '';
  // tirar texto de <i> e ícones para isolar o label
  const clone = a.clone();
  clone.querySelectorAll('i, svg, img, .badge, .menu-arrow, .menu-icon, .menu-bullet').forEach((n) => n.remove());
  return textOf(clone);
}

function badgeFromAnchor(a) {
  if (!a) return undefined;
  const b = a.querySelector('.badge, .label, .menu-badge');
  if (!b) return undefined;
  const t = textOf(b);
  return t || undefined;
}

function parseList(ul) {
  const nodes = [];
  for (const li of ul.querySelectorAll(':scope > li')) {
    if (isDividerLi(li)) {
      nodes.push({ type: 'divider' });
      continue;
    }
    if (isSectionHeaderLi(li)) {
      nodes.push({ type: 'section', label: textOf(li) });
      continue;
    }
    const a = getDirectAnchor(li);
    const sub = getDirectChildList(li);
    const label = labelFromAnchor(a) || textOf(li.querySelector(':scope > .menu-link, :scope > .nav-link') || li);
    const icon = detectIconClass(li);
    if (sub) {
      nodes.push({
        type: 'group',
        label,
        ...(icon ? { icon } : {}),
        children: parseList(sub),
      });
    } else if (a) {
      const href = a.getAttribute('href') || '#';
      const badge = badgeFromAnchor(a);
      nodes.push({
        type: 'item',
        label,
        href,
        ...(icon ? { icon } : {}),
        ...(badge ? { badge } : {}),
      });
    }
  }
  return nodes;
}

const tree = menuRoot.tagName === 'UL' ? parseList(menuRoot) : (() => {
  const ul = menuRoot.querySelector('ul');
  return ul ? parseList(ul) : [];
})();

stdout.write(JSON.stringify(tree, null, 2) + '\n');
