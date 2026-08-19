"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMenuState } from "./use-menu-state.hook";
import { Logo } from "./logo.component";
import { useMenuConfig } from "./menu-config.context";
import type { MenuNode } from "./menu.types";
import { MenuItem } from "./menu-item.component";
import { MenuGroup } from "./menu-group.component";
import { MenuSection } from "./menu-section.component";
import { MenuDivider } from "./menu-divider.component";

/**
 * Orquestrador da navegação lateral.
 *
 * Mantém a região do logo no topo (responsabilidade do shell) e renderiza
 * a árvore de itens vinda do `MenuConfigProvider`. Aceita também `children`
 * (caminho de fallback usado pelo shell quando nenhum Provider foi montado).
 *
 * behavior #3 (1e — auto-fechar drawer mobile ao navegar): quando a rota
 * muda e o sidebar está aberto em mobile, ele fecha automaticamente.
 */
export function Menu({ children }: { children?: ReactNode }) {
  const { mode, isMobile, closeOnMobile } = useMenuState();
  const isMini = !isMobile && mode === "mini";
  const { items } = useMenuConfig();
  const pathname = usePathname();

  /* behavior #3: auto-close mobile drawer on route change. */
  useEffect(() => {
    if (isMobile && mode === "mobile-open") {
      closeOnMobile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        className="logo-aside-only"
        style={{
          alignItems: "var(--shell-aside-header-align)",
          justifyContent: isMini ? "center" : "space-between",
          gap: "var(--shell-aside-header-gap)",
          paddingTop: "var(--shell-aside-header-pt)",
          paddingBottom: "var(--shell-aside-header-pb)",
          paddingLeft: isMini ? "var(--shell-aside-header-px-mini)" : "var(--shell-aside-header-px-expanded)",
          paddingRight: isMini ? "var(--shell-aside-header-px-mini)" : "var(--shell-aside-header-px-expanded)",
        }}
      >
        <Logo placement="aside" />
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "1rem",
          color: "var(--adminMenu-text)",
          background: "var(--adminMenu-bg)",
        }}
      >
        {items.length > 0 ? <MenuTree items={items} /> : children}
      </nav>
    </div>
  );
}

function MenuTree({ items }: { items: MenuNode[] }) {
  return (
    <>
      {items.map((node, idx) => {
        switch (node.type) {
          case "section":
            return (
              <MenuSection key={`section-${node.label}-${idx}`} label={node.label}>
                {node.children.map((child, childIdx) => renderNode(child, childIdx))}
              </MenuSection>
            );
          case "divider":
            return <MenuDivider key={`div-${idx}`} />;
          case "group":
            return (
              <ul
                key={`group-${node.label}-${idx}`}
                style={{
                  listStyle: "none",
                  margin: 0,
                  marginBottom: "var(--adminMenu-groupSpacing)",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <MenuGroup group={node} />
              </ul>
            );
          case "item":
            return (
              <ul
                key={`item-${node.href}-${idx}`}
                style={{
                  listStyle: "none",
                  margin: 0,
                  marginBottom: "0.25rem",
                  padding: 0,
                }}
              >
                <MenuItem label={node.label} href={node.href} icon={node.icon} badge={node.badge} />
              </ul>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function renderNode(node: MenuNode, idx: number) {
  switch (node.type) {
    case "item":
      return (
        <MenuItem
          key={`${node.label}-${node.href}`}
          label={node.label}
          href={node.href}
          icon={node.icon}
          badge={node.badge}
        />
      );
    case "group":
      return <MenuGroup key={`group-${node.label}-${idx}`} group={node} />;
    case "divider":
      return <MenuDivider key={`div-${idx}`} />;
    case "section":
      return (
        <MenuSection key={`section-${node.label}-${idx}`} label={node.label}>
          {node.children.map((child, childIdx) => renderNode(child, childIdx))}
        </MenuSection>
      );
    default:
      return null;
  }
}
