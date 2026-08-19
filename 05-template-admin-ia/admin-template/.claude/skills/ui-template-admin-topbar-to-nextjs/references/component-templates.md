# component-templates.md

Snippets de referência para os componentes da skill. Adapte cores, larguras e durações aos tokens extraídos do template — **não copie literal sem trocar**. Os snippets aqui são esqueleto canônico, não saída final.

> Convenção de import: ícones via `lucide-react` (substitua pelo set do template). `usePathname` via `next/navigation`. Helper `cn` opcional (`clsx` + `tailwind-merge`); se o projeto não tiver, usar template strings.

## topbar.types.ts

```ts
export type TopbarZone = 'left' | 'center' | 'right';

export type TopbarDropdownItem = {
  id: string;
  icon?: string;
  label: string;
  href?: string;
  badge?: string;
  variant?: 'default' | 'danger';
  divider?: boolean;
};

export type TopbarDropdownConfig = {
  id: string;
  width?: string; // chave de width custom (ex.: 'adminTopbarDropdownNotifications')
  header?: { title: string; action?: { label: string; onClick?: () => void } };
  items: TopbarDropdownItem[];
  footer?: { label: string; href?: string };
};

export type TopbarAction = {
  id: string;
  icon: string;
  label: string; // aria-label
  badge?: string | number;
  dropdown?: TopbarDropdownConfig;
};

export type TopbarSearchConfig = {
  placeholder: string;
  expandable: boolean;
  shortcut?: string;
};

export type TopbarUserConfig = {
  avatarSrc?: string;
  name: string;
  role?: string;
  items: TopbarDropdownItem[];
};

export type TopbarConfig = {
  brand?: { label?: string; logoSrc?: string; href?: string };
  search?: TopbarSearchConfig;
  actions: TopbarAction[];
  themeToggle?: boolean;
  user?: TopbarUserConfig;
  showMobileToggle?: boolean;
};
```

## topbar-action-button.component.tsx

```tsx
'use client';
import { forwardRef } from 'react';

type Props = {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  isOpen?: boolean;
  hasDropdown?: boolean;
  onClick?: () => void;
};

export const TopbarActionButton = forwardRef<HTMLButtonElement, Props>(
  function TopbarActionButton({ icon, label, badge, isOpen, hasDropdown, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-haspopup={hasDropdown ? 'menu' : undefined}
        aria-expanded={hasDropdown ? !!isOpen : undefined}
        onClick={onClick}
        className={[
          'relative inline-flex items-center justify-center',
          'w-adminTopbarButton h-adminTopbarButton rounded-md',
          'text-adminTopbar-iconDefault hover:text-adminTopbar-iconHover',
          'hover:bg-adminTopbar-buttonHoverBg',
          isOpen ? 'bg-adminTopbar-buttonActiveBg' : '',
          'transition-colors duration-adminTopbar',
        ].filter(Boolean).join(' ')}
      >
        {icon}
        {badge !== undefined && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold bg-adminTopbar-badgeBg text-adminTopbar-badgeText">
            {badge}
          </span>
        )}
      </button>
    );
  },
);
```

## topbar-dropdown.component.tsx

```tsx
'use client';
import { forwardRef } from 'react';
import type { TopbarDropdownConfig } from './topbar.types';

type Props = TopbarDropdownConfig & { isOpen: boolean };

export const TopbarDropdown = forwardRef<HTMLDivElement, Props>(
  function TopbarDropdown({ width, header, items, footer, isOpen }, ref) {
    return (
      <div
        ref={ref}
        role="menu"
        className={[
          'absolute right-0 top-[calc(100%+8px)]',
          width ? `w-${width}` : 'w-72',
          'bg-adminTopbar-dropdownBg border border-adminTopbar-dropdownBorder rounded-md',
          'shadow-adminTopbarDropdown z-adminTopbarDropdown overflow-hidden',
          'origin-top-right transition-all duration-adminTopbar',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-1 scale-95 pointer-events-none',
        ].join(' ')}
      >
        {header && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-adminTopbar-dropdownBorder">
            <span className="font-semibold text-sm">{header.title}</span>
            {header.action && (
              // TODO: integrar com ação real
              <button type="button" onClick={header.action.onClick} className="text-xs text-adminTopbar-iconHover">
                {header.action.label}
              </button>
            )}
          </div>
        )}
        <ul className="max-h-[480px] overflow-y-auto py-1">
          {items.map((it) =>
            it.divider ? (
              <li key={it.id}><hr className="my-1 border-adminTopbar-dropdownBorder" /></li>
            ) : (
              <li key={it.id} role="none">
                {/* TODO: integrar com ação real */}
                <a
                  role="menuitem"
                  href={it.href ?? '#'}
                  className={[
                    'flex items-center gap-3 px-4 py-2 text-sm',
                    'hover:bg-adminTopbar-dropdownItemHover',
                    it.variant === 'danger' ? 'text-red-600' : '',
                  ].join(' ')}
                >
                  {it.icon && <span className="w-4 h-4" aria-hidden />}
                  <span className="flex-1">{it.label}</span>
                  {it.badge && <span className="text-xs">{it.badge}</span>}
                </a>
              </li>
            ),
          )}
        </ul>
        {footer && (
          <div className="border-t border-adminTopbar-dropdownBorder px-4 py-3 text-center">
            {/* TODO: integrar com ação real */}
            <a href={footer.href ?? '#'} className="text-sm font-medium">{footer.label}</a>
          </div>
        )}
      </div>
    );
  },
);
```

## topbar-search.component.tsx

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import type { TopbarSearchConfig } from './topbar.types';

export function TopbarSearch({ placeholder, expandable, shortcut }: TopbarSearchConfig) {
  const [value, setValue] = useState('');
  const [expanded, setExpanded] = useState(!expandable);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expandable && expanded) inputRef.current?.focus();
  }, [expandable, expanded]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: integrar com lógica de busca real
      }}
      className={[
        'flex items-center bg-adminTopbar-searchBg rounded-md px-3',
        'transition-all duration-adminTopbar',
        expanded ? 'w-adminTopbarSearch' : 'w-adminTopbarButton justify-center',
      ].join(' ')}
    >
      <button
        type="button"
        aria-label="Search"
        onClick={() => expandable && setExpanded((v) => !v)}
        className="text-adminTopbar-iconDefault hover:text-adminTopbar-iconHover"
      >
        {/* substituir por ícone do template */}
        <svg className="w-4 h-4" />
      </button>
      {expanded && (
        <>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none px-2 text-sm placeholder:text-adminTopbar-searchPlaceholder"
          />
          {shortcut && <span className="text-xs text-adminTopbar-searchPlaceholder">{shortcut}</span>}
        </>
      )}
    </form>
  );
}
```

## topbar-theme-toggle.component.tsx

```tsx
'use client';
import { useState } from 'react';
import { TopbarActionButton } from './topbar-action-button.component';

export function TopbarThemeToggle() {
  // TODO: integrar com sistema de tema real (next-themes ou similar)
  const [visualMode, setVisualMode] = useState<'light' | 'dark'>('light');
  return (
    <TopbarActionButton
      icon={<span aria-hidden>{visualMode === 'light' ? '☀' : '☾'}</span>}
      label="Toggle theme"
      onClick={() => setVisualMode((m) => (m === 'light' ? 'dark' : 'light'))}
    />
  );
}
```

## topbar-user-menu.component.tsx

```tsx
'use client';
import { useRef } from 'react';
import { TopbarDropdown } from './topbar-dropdown.component';
import type { TopbarUserConfig } from './topbar.types';

type Props = TopbarUserConfig & {
  isOpen: boolean;
  onToggle: () => void;
};

export function TopbarUserMenu({ avatarSrc, name, role, items, isOpen, onToggle }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-adminTopbar-buttonHoverBg"
      >
        {avatarSrc && <img src={avatarSrc} alt="" className="w-8 h-8 rounded-full" />}
        <span className="hidden lg:flex flex-col items-start leading-tight">
          <span className="text-adminTopbarUserName font-medium">{name}</span>
          {role && <span className="text-adminTopbarUserRole opacity-70">{role}</span>}
        </span>
      </button>
      <TopbarDropdown
        id="user"
        width="adminTopbarDropdownUser"
        items={items}
        isOpen={isOpen}
      />
    </div>
  );
}
```

## topbar-mobile-toggle.component.tsx

```tsx
'use client';
import { TopbarActionButton } from './topbar-action-button.component';

type Props = { isOpen: boolean; onToggle: () => void };

export function TopbarMobileToggle({ isOpen, onToggle }: Props) {
  return (
    <TopbarActionButton
      icon={<span aria-hidden>{isOpen ? '✕' : '☰'}</span>}
      label="Toggle menu"
      isOpen={isOpen}
      onClick={onToggle}
    />
  );
}
```

## topbar.component.tsx (orquestrador)

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { TopbarConfig } from './topbar.types';
import { TopbarActionButton } from './topbar-action-button.component';
import { TopbarDropdown } from './topbar-dropdown.component';
import { TopbarSearch } from './topbar-search.component';
import { TopbarThemeToggle } from './topbar-theme-toggle.component';
import { TopbarUserMenu } from './topbar-user-menu.component';
import { TopbarMobileToggle } from './topbar-mobile-toggle.component';

type Props = { config: TopbarConfig };

export function Topbar({ config }: Props) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);

  // Fechar ao trocar rota
  useEffect(() => {
    setOpenDropdownId(null);
    setMobileOpen(false);
  }, [pathname]);

  // Fechar ao clicar fora
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpenDropdownId(null);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenDropdownId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggle = (id: string) =>
    setOpenDropdownId((cur) => (cur === id ? null : id));

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-adminTopbar h-adminTopbarHeight flex items-center justify-between px-adminTopbarPaddingX bg-adminTopbar-bg border-b border-adminTopbar-border shadow-adminTopbar"
    >
      <div className="flex items-center gap-adminTopbarGap">
        {config.showMobileToggle && (
          <TopbarMobileToggle isOpen={mobileOpen} onToggle={() => setMobileOpen((v) => !v)} />
        )}
        {/* brand opcional */}
      </div>
      <div className="flex-1 flex justify-center">
        {config.search && <TopbarSearch {...config.search} />}
      </div>
      <div className="flex items-center gap-adminTopbarGap">
        {config.actions.map((a) => (
          <div key={a.id} className="relative">
            <TopbarActionButton
              icon={<span aria-hidden />} // substituir por ícone real
              label={a.label}
              badge={a.badge}
              hasDropdown={!!a.dropdown}
              isOpen={openDropdownId === a.id}
              onClick={() => (a.dropdown ? toggle(a.id) : undefined)}
            />
            {a.dropdown && (
              <TopbarDropdown {...a.dropdown} isOpen={openDropdownId === a.id} />
            )}
          </div>
        ))}
        {config.themeToggle && <TopbarThemeToggle />}
        {config.user && (
          <TopbarUserMenu
            {...config.user}
            isOpen={openDropdownId === 'user'}
            onToggle={() => toggle('user')}
          />
        )}
      </div>
    </header>
  );
}
```

## topbar.config.ts (exemplo — substituir pelos dados extraídos da Fase 1b)

```ts
import type { TopbarConfig } from './topbar.types';

export const topbarConfig: TopbarConfig = {
  search: { placeholder: 'Search…', expandable: false, shortcut: '⌘K' },
  showMobileToggle: true,
  themeToggle: true,
  actions: [
    {
      id: 'notifications',
      icon: 'bell',
      label: 'Notifications',
      badge: 4,
      dropdown: {
        id: 'notifications',
        width: 'adminTopbarDropdownNotifications',
        header: { title: 'Notifications', action: { label: 'Mark all as read' } },
        items: [
          // mapear o que o template tem
        ],
        footer: { label: 'View all notifications', href: '#' },
      },
    },
  ],
  user: {
    avatarSrc: '/avatar.png',
    name: 'John Doe',
    role: 'Admin',
    items: [
      { id: 'profile', icon: 'user', label: 'My Profile', href: '#' },
      { id: 'settings', icon: 'settings', label: 'Settings', href: '#' },
      { id: 'div', label: '', divider: true },
      { id: 'logout', icon: 'log-out', label: 'Logout', variant: 'danger' },
    ],
  },
};
```

## globals.css — apenas se necessário

Exemplo: seta apontando do dropdown para o botão de notificações (impossível sem pseudo-elemento).

```css
/* admin topbar — seta dos dropdowns (apenas o que Tailwind não cobre) */
.admin-topbar-dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 14px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--admin-topbar-dropdown-bg, #fff);
}
```

Se o template não tem seta, NÃO criar.
