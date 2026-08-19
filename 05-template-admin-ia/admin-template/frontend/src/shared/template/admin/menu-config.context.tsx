"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MenuNode } from "./menu.types";

/**
 * Context genérico que carrega a árvore de itens do menu lateral.
 * Esta skill NÃO escreve a árvore concreta — quem injeta `items` é a skill
 * `ui-template-admin-pages-to-nextjs`, no layout privado da app.
 */
type MenuConfigValue = {
  items: MenuNode[];
};

const MenuConfigContext = createContext<MenuConfigValue | null>(null);

export function MenuConfigProvider({
  items,
  children,
}: {
  items: MenuNode[];
  children: ReactNode;
}) {
  return <MenuConfigContext.Provider value={{ items }}>{children}</MenuConfigContext.Provider>;
}

/**
 * Lê a árvore de itens. Retorna `[]` quando nenhum Provider foi montado —
 * isso permite ao `<Menu>` renderizar a casca (header + nav vazio) sem
 * quebrar a aplicação enquanto a skill `pages` ainda não foi executada.
 */
export function useMenuConfig(): MenuConfigValue {
  const ctx = useContext(MenuConfigContext);
  if (!ctx) return { items: [] };
  return ctx;
}
