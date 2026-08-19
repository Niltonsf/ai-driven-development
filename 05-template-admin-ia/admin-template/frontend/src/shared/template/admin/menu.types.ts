/**
 * Tipos do menu lateral do template admin.
 *
 * Esta skill (`ui-template-admin-sidebar-to-nextjs`) define APENAS os tipos
 * e os componentes genéricos. A árvore concreta de itens é responsabilidade
 * da skill `ui-template-admin-pages-to-nextjs`, que materializa
 * `MenuNode[]` em `src/modules/examples/admin-menu/menu.config.ts` e injeta
 * via `<MenuConfigProvider items={...}>`.
 */
import type { ComponentType, SVGProps } from "react";

export type MenuIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type MenuItem = {
  type: "item";
  label: string;
  href: string;
  icon?: MenuIcon;
  badge?: string;
};

export type MenuGroup = {
  type: "group";
  label: string;
  icon?: MenuIcon;
  badge?: string;
  children: Array<MenuItem | MenuDivider>;
};

export type MenuSection = {
  type: "section";
  label: string;
  children: Array<MenuItem | MenuGroup | MenuDivider>;
};

export type MenuDivider = {
  type: "divider";
};

export type MenuNode = MenuItem | MenuGroup | MenuSection | MenuDivider;
