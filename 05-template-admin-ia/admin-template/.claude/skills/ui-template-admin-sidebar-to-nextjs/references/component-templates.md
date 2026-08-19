# Component Templates — Snippets de referência

Snippets de partida para os 5 componentes + tipos + config. Adaptar a aparência e a interatividade aos achados do passo 1c (não copiar cego).

Caminho base: `src/shared/template/admin/`.

## menu.types.ts

```ts
import type { ComponentType, SVGProps } from 'react';

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface MenuItem {
  type: 'item';
  label: string;
  href: string;
  icon?: IconComponent;
  badge?: string | number;
}

export interface MenuGroup {
  type: 'group';
  label: string;
  icon?: IconComponent;
  children: Array<MenuItem | MenuGroup>;
}

export interface MenuSection {
  type: 'section';
  label: string;
}

export interface MenuDivider {
  type: 'divider';
}

export type MenuNode = MenuItem | MenuGroup | MenuSection | MenuDivider;
```

## menu.config.ts

```ts
import { LayoutDashboard, Users, Settings } from 'lucide-react';
import type { MenuNode } from './menu.types';

export const menuConfig: MenuNode[] = [
  { type: 'section', label: 'GERAL' },
  { type: 'item', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    type: 'group',
    label: 'Usuários',
    icon: Users,
    children: [
      { type: 'item', label: 'Listar', href: '/users' },
      { type: 'item', label: 'Novo', href: '/users/new' },
    ],
  },
  { type: 'divider' },
  { type: 'item', label: 'Configurações', href: '/settings', icon: Settings },
];
```

## menu-divider.component.tsx

```tsx
export function MenuDivider() {
  return <hr className="my-2 border-adminMenu-divider" />;
}
```

## menu-item.component.tsx

```tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MenuItem as MenuItemType } from './menu.types';

interface Props {
  item: MenuItemType;
  collapsed?: boolean;
  nested?: boolean;
}

export function MenuItem({ item, collapsed = false, nested = false }: Props) {
  const pathname = usePathname();
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      data-active={active}
      title={collapsed ? item.label : undefined}
      className={[
        'group relative flex items-center h-adminMenuItemH px-adminMenuItemPx gap-adminMenuIconGap',
        'text-adminMenu-text hover:bg-adminMenu-bgHover hover:text-adminMenu-textHover',
        'transition-colors duration-adminMenu',
        'data-[active=true]:bg-adminMenu-bgActive data-[active=true]:text-adminMenu-textActive',
        'data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-0 data-[active=true]:before:bottom-0 data-[active=true]:before:w-[3px] data-[active=true]:before:bg-adminMenu-activeIndicator',
        nested ? 'pl-adminMenuChildIndent' : '',
      ].join(' ')}
    >
      {Icon ? <Icon className="w-5 h-5 shrink-0" aria-hidden /> : null}
      <span className={collapsed ? 'sr-only' : 'flex-1 truncate text-adminMenuLabel'}>
        {item.label}
      </span>
      {item.badge && !collapsed ? (
        <span className="ml-auto rounded-full bg-adminMenu-bgActive text-adminMenu-textActive px-2 py-0.5 text-xs">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
```

## menu-group.component.tsx

```tsx
"use client";
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { MenuGroup as MenuGroupType, MenuItem as MenuItemType } from './menu.types';
import { MenuItem } from './menu-item.component';

interface Props {
  group: MenuGroupType;
  collapsed?: boolean;
}

function hasActiveChild(group: MenuGroupType, pathname: string): boolean {
  return group.children.some((c) => {
    if (c.type === 'item') return pathname === c.href || pathname.startsWith(c.href + '/');
    if (c.type === 'group') return hasActiveChild(c, pathname);
    return false;
  });
}

export function MenuGroup({ group, collapsed = false }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => hasActiveChild(group, pathname));
  const Icon = group.icon;

  if (collapsed) {
    // No modo mini, expansão inline não acontece — flyout é responsabilidade do menu.component
    return (
      <button
        type="button"
        title={group.label}
        className="flex items-center justify-center w-full h-adminMenuItemH text-adminMenu-icon hover:bg-adminMenu-bgHover"
      >
        {Icon ? <Icon className="w-5 h-5" aria-hidden /> : null}
        <span className="sr-only">{group.label}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center w-full h-adminMenuItemH px-adminMenuItemPx gap-adminMenuIconGap text-adminMenu-text hover:bg-adminMenu-bgHover transition-colors duration-adminMenu"
      >
        {Icon ? <Icon className="w-5 h-5 shrink-0" aria-hidden /> : null}
        <span className="flex-1 text-left text-adminMenuLabel truncate">{group.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-adminMenu ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="flex flex-col">
          {group.children.map((child, i) =>
            child.type === 'item' ? (
              <MenuItem key={i} item={child as MenuItemType} nested />
            ) : child.type === 'group' ? (
              <MenuGroup key={i} group={child as MenuGroupType} />
            ) : null
          )}
        </div>
      ) : null}
    </div>
  );
}
```

## menu-section.component.tsx

```tsx
interface Props {
  label: string;
  collapsed?: boolean;
}

export function MenuSection({ label, collapsed }: Props) {
  if (collapsed) return <div className="my-2 mx-auto h-px w-6 bg-adminMenu-divider" aria-hidden />;
  return (
    <div className="px-adminMenuItemPx pt-adminMenuSectionGap pb-1 text-adminMenuSection uppercase text-adminMenu-sectionTitle">
      {label}
    </div>
  );
}
```

## menu.component.tsx (orquestrador)

```tsx
"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { menuConfig } from './menu.config';
import { MenuItem } from './menu-item.component';
import { MenuGroup } from './menu-group.component';
import { MenuSection } from './menu-section.component';
import { MenuDivider } from './menu-divider.component';

export function Menu() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 991.98px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const mode: 'full' | 'mini' | 'mobile' = isMobile ? 'mobile' : collapsed ? 'mini' : 'full';
  const widthClass = mode === 'mini' ? 'w-adminMenuMini' : 'w-adminMenuFull';

  const nav = (
    <nav className="admin-menu-scroll flex-1 overflow-y-auto py-2">
      {menuConfig.map((node, i) => {
        switch (node.type) {
          case 'section':
            return <MenuSection key={i} label={node.label} collapsed={mode === 'mini'} />;
          case 'divider':
            return <MenuDivider key={i} />;
          case 'item':
            return <MenuItem key={i} item={node} collapsed={mode === 'mini'} />;
          case 'group':
            return <MenuGroup key={i} group={node} collapsed={mode === 'mini'} />;
        }
      })}
    </nav>
  );

  if (mode === 'mobile') {
    return (
      <>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="fixed top-3 left-3 z-adminMenu p-2 bg-adminMenu-bg text-adminMenu-text rounded"
          aria-label="Abrir menu"
        >
          ☰
        </button>
        {drawerOpen ? (
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-adminMenuOverlay bg-black/50"
            aria-hidden
          />
        ) : null}
        <aside
          className={[
            'fixed top-0 left-0 bottom-0 z-adminMenu w-adminMenuFull bg-adminMenu-bg flex flex-col',
            'transition-transform duration-adminMenu ease-adminMenu',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          {nav}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={[
        'sticky top-0 h-screen bg-adminMenu-bg flex flex-col',
        'transition-[width] duration-adminMenu ease-adminMenu',
        widthClass,
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="h-12 flex items-center justify-center text-adminMenu-icon hover:bg-adminMenu-bgHover"
        aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
      >
        {collapsed ? '›' : '‹'}
      </button>
      {nav}
    </aside>
  );
}
```

## Notas

- Esses snippets assumem persistência de collapsed DESLIGADA. Se o original persiste, adicionar os dois `useEffect` de localStorage descritos em `responsive-modes.md`.
- Setas `›/‹` e `☰` são placeholders — substituir pelos ícones do set detectado.
- O ícone do chevron de grupo (`ChevronDown` do lucide) também deve ser substituído pelo equivalente do set do template.
- A persistência de `groupOpen` por grupo NÃO é replicada por padrão; se o original o faz, usar `localStorage` por chave (`adminMenu.group.<label>`).
- O wrapper de roteamento (`(private)/layout.tsx` que renderiza `<Menu />`) está fora do escopo desta skill — esta skill apenas emite o `<Menu />`. Mas é razoável criar um `(private)/layout.tsx` mínimo que faça `<div className="flex"><Menu /><main className="flex-1">{children}</main></div>` se ele ainda não existir. Confirmar com o usuário antes de criar.
