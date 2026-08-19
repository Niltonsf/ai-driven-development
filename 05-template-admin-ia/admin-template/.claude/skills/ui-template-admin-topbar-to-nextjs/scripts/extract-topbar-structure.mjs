#!/usr/bin/env node
/**
 * extract-topbar-structure.mjs
 *
 * Lê um arquivo HTML estático de um template admin e extrai a estrutura
 * semântica da topbar como JSON, no formato:
 *
 *   {
 *     zones: {
 *       left:   TopbarElement[],
 *       center: TopbarElement[],
 *       right:  TopbarElement[],
 *     }
 *   }
 *
 *   type TopbarElement =
 *     | { type: 'brand', label?, logoSrc? }
 *     | { type: 'mobile-toggle', icon }
 *     | { type: 'search', placeholder, expandable }
 *     | { type: 'action-button', icon, label?, badge?, dropdownId? }
 *     | { type: 'dropdown', id, header?, items, footer? }
 *     | { type: 'theme-toggle', iconLight?, iconDark? }
 *     | { type: 'user-menu', avatarSrc?, name?, role?, items }
 *     | { type: 'divider' }
 *
 * Uso:
 *   node extract-topbar-structure.mjs <html-path> [selector]
 *
 * Falha graciosa: sai com código 2 quando nenhum seletor encontra a topbar.
 * Nesse caso Claude faz a extração manualmente lendo o HTML.
 */

import { readFileSync } from 'node:fs';
import { argv, exit, stderr, stdout } from 'node:process';

const [, , htmlPath, userSelector] = argv;
if (!htmlPath) {
  stderr.write('Uso: node extract-topbar-structure.mjs <html-path> [selector]\n');
  exit(1);
}

const html = readFileSync(htmlPath, 'utf8');

let parse;
try {
  ({ parse } = await import('node-html-parser'));
} catch {
  stderr.write(
    'node-html-parser indisponível. Rode com: npx -y -p node-html-parser node extract-topbar-structure.mjs <html> [selector]\n',
  );
  exit(3);
}

const root = parse(html, { lowerCaseTagName: false, comment: false });

const FALLBACK_SELECTORS = [
  'header.app-header',
  'header.main-header',
  'header.layout-navbar',
  'header.topbar',
  'header.navbar',
  '.app-header',
  '.main-header',
  '.layout-navbar',
  '.topbar',
  '.header-navbar',
  'nav.navbar',
  '#header',
  '#topbar',
  'header',
];

let topbarRoot = null;
const tried = [];
const candidates = userSelector ? [userSelector] : FALLBACK_SELECTORS;

for (const sel of candidates) {
  tried.push(sel);
  const found = root.querySelector(sel);
  if (found) {
    topbarRoot = found;
    stderr.write(`Selector usado: ${sel}\n`);
    break;
  }
}

if (!topbarRoot) {
  stderr.write(
    `Nenhum seletor encontrou a topbar. Tentados:\n  ${tried.join('\n  ')}\n` +
      `Inspecione o HTML e rode novamente passando um seletor explícito.\n`,
  );
  exit(2);
}

function textOf(node) {
  return (node?.text ?? '').replace(/\s+/g, ' ').trim();
}

function clsOf(node) {
  return (node?.getAttribute?.('class') ?? '').toLowerCase();
}

function detectIcon(el) {
  if (!el) return undefined;
  const i = el.querySelector('i, svg, img');
  if (!i) return undefined;
  if (i.tagName === 'SVG') return 'svg-inline';
  if (i.tagName === 'IMG') return i.getAttribute('src') || undefined;
  const cls = i.getAttribute('class') || '';
  return cls.trim() || undefined;
}

function detectBadge(el) {
  if (!el) return undefined;
  const b = el.querySelector('.badge, .notification-badge, .indicator, .badge-dot');
  if (!b) return undefined;
  const t = textOf(b);
  return t || '•';
}

function isDivider(el) {
  return /(^|\s)(divider|vertical-divider|navbar-divider|nav-divider)(\s|$)/.test(clsOf(el));
}

function isMobileToggle(el) {
  const cls = clsOf(el);
  if (/(menu-toggle|navbar-toggler|hamburger|sidebar-toggle|menu-burger|nav-toggle)/.test(cls)) return true;
  const aria = (el.getAttribute?.('aria-label') || '').toLowerCase();
  return /menu|sidebar|navigation/.test(aria) && /toggle|open|close/.test(aria);
}

function isThemeToggle(el) {
  const cls = clsOf(el);
  if (/(theme-toggle|theme-switcher|dark-mode|color-mode|mode-toggle)/.test(cls)) return true;
  const aria = (el.getAttribute?.('aria-label') || '').toLowerCase();
  return /theme|dark.?mode|appearance/.test(aria);
}

function isSearchForm(el) {
  if (el.tagName !== 'FORM' && el.tagName !== 'DIV') return false;
  const cls = clsOf(el);
  if (/(search|searchbox|search-form|search-bar|navbar-search)/.test(cls)) return true;
  return !!el.querySelector('input[type="search"], input[placeholder*="earch"]');
}

function extractSearch(el) {
  const input = el.querySelector('input');
  const placeholder = input?.getAttribute('placeholder') || '';
  const expandable = /expandable|expand|collapsed/.test(clsOf(el)) || !!el.querySelector('[data-toggle="search"], .search-toggle');
  return { type: 'search', placeholder, expandable };
}

function extractDropdownItems(menu) {
  const items = [];
  for (const li of menu.querySelectorAll('a, button, .dropdown-item, li')) {
    const cls = clsOf(li);
    if (/divider|separator/.test(cls)) {
      items.push({ id: `div-${items.length}`, label: '', divider: true });
      continue;
    }
    const label = textOf(li);
    if (!label) continue;
    const href = li.getAttribute?.('href') || undefined;
    const icon = detectIcon(li);
    items.push({
      id: label.toLowerCase().replace(/\s+/g, '-').slice(0, 40) || `item-${items.length}`,
      label,
      ...(href ? { href } : {}),
      ...(icon ? { icon } : {}),
    });
  }
  return items;
}

function isUserMenu(el) {
  const cls = clsOf(el);
  if (/(user-menu|user-dropdown|user-profile|profile-menu|account-menu|user-nav)/.test(cls)) return true;
  return !!el.querySelector('img.avatar, img.user-avatar, .avatar-img, .user-avatar');
}

function extractUserMenu(el) {
  const avatar = el.querySelector('img');
  const avatarSrc = avatar?.getAttribute('src') || undefined;
  const nameEl = el.querySelector('.user-name, .username, .name, .fw-medium');
  const roleEl = el.querySelector('.user-role, .role, .text-muted, .designation');
  const menu = el.querySelector('.dropdown-menu, .menu, ul');
  const items = menu ? extractDropdownItems(menu) : [];
  return {
    type: 'user-menu',
    ...(avatarSrc ? { avatarSrc } : {}),
    ...(nameEl ? { name: textOf(nameEl) } : {}),
    ...(roleEl ? { role: textOf(roleEl) } : {}),
    items,
  };
}

function classify(el) {
  if (!el || !el.tagName) return null;
  const tag = el.tagName;
  const cls = clsOf(el);

  if (/(brand|navbar-brand|logo)/.test(cls) || el.querySelector('.brand, .navbar-brand, .logo')) {
    const a = el.tagName === 'A' ? el : el.querySelector('a');
    const img = (a || el).querySelector('img');
    return {
      type: 'brand',
      ...(img?.getAttribute('src') ? { logoSrc: img.getAttribute('src') } : {}),
      ...(textOf(a || el) ? { label: textOf(a || el) } : {}),
    };
  }

  if (isDivider(el)) return { type: 'divider' };

  if (isSearchForm(el)) return extractSearch(el);

  if (isThemeToggle(el)) {
    return { type: 'theme-toggle', icon: detectIcon(el) };
  }

  if (isMobileToggle(el)) {
    return { type: 'mobile-toggle', icon: detectIcon(el) };
  }

  if (isUserMenu(el)) return extractUserMenu(el);

  if (tag === 'BUTTON' || tag === 'A' || el.querySelector('button, a')) {
    const btn = tag === 'BUTTON' || tag === 'A' ? el : el.querySelector('button, a');
    const icon = detectIcon(btn) || detectIcon(el);
    if (!icon) return null;
    const label = btn.getAttribute?.('aria-label') || textOf(btn) || undefined;
    const badge = detectBadge(el);
    const hasDropdown =
      btn.getAttribute?.('data-bs-toggle') === 'dropdown' ||
      btn.getAttribute?.('data-toggle') === 'dropdown' ||
      !!el.querySelector('.dropdown-menu');
    const dropdownId = hasDropdown ? (label || `dd-${icon}`).toLowerCase().replace(/\s+/g, '-').slice(0, 32) : undefined;
    return {
      type: 'action-button',
      icon,
      ...(label ? { label } : {}),
      ...(badge ? { badge } : {}),
      ...(dropdownId ? { dropdownId } : {}),
    };
  }

  return null;
}

function classifyZone(el) {
  const cls = clsOf(el);
  if (/(navbar-nav-left|left|start|topbar-left|header-left|navbar-left)/.test(cls)) return 'left';
  if (/(navbar-nav-right|right|end|topbar-right|header-right|navbar-right|ms-auto|ml-auto)/.test(cls)) return 'right';
  if (/(navbar-nav-center|center|topbar-center|header-center)/.test(cls)) return 'center';
  return null;
}

const zones = { left: [], center: [], right: [] };

const containers = topbarRoot.querySelectorAll('.navbar-nav, .topbar-left, .topbar-right, .topbar-center, .header-left, .header-right, .header-center, ul, .d-flex');
let assigned = false;

for (const container of containers) {
  const zone = classifyZone(container) || classifyZone(container.parentNode);
  if (!zone) continue;
  for (const child of container.childNodes.filter((n) => n.tagName)) {
    const cls = classify(child);
    if (cls) {
      zones[zone].push(cls);
      assigned = true;
    }
  }
}

// Fallback heurístico: se nada foi classificado em zonas, varrer linearmente
// e dividir em 3 com base na ordem dos children diretos.
if (!assigned) {
  const top = topbarRoot.childNodes.filter((n) => n.tagName);
  const all = [];
  for (const c of top) {
    const cls = classify(c);
    if (cls) all.push(cls);
    else {
      // descer um nível
      for (const cc of c.childNodes?.filter?.((n) => n.tagName) ?? []) {
        const c2 = classify(cc);
        if (c2) all.push(c2);
      }
    }
  }
  const third = Math.ceil(all.length / 3);
  zones.left = all.slice(0, third);
  zones.center = all.slice(third, third * 2);
  zones.right = all.slice(third * 2);
  stderr.write('Aviso: zonas inferidas heuristicamente. Confira o JSON contra o HTML.\n');
}

stdout.write(JSON.stringify({ zones }, null, 2) + '\n');
