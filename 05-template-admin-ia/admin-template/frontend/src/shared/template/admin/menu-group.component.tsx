"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import type { MenuGroup as MenuGroupNode, MenuItem as MenuItemNode, MenuDivider as MenuDividerNode } from "./menu.types";
import { MenuItem } from "./menu-item.component";
import { MenuDivider } from "./menu-divider.component";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import { useMenuState } from "./use-menu-state.hook";

/**
 * Grupo expansível — replica `.menu-item` (header) + `.menu-dropdown` (filhos)
 * do template original. No HTML, o estado aberto/fechado é mantido por Alpine
 * (`x-data="{selected: $persist('Dashboard')}"`); aqui usamos `useState`.
 *
 * behavior #1 (1e — auto-open quando contém ativo): se a rota atual bater com
 * algum filho, o grupo abre automaticamente em mount/route-change.
 * behavior #2 (1e — rotação da seta ao abrir): a seta `ChevronDownIcon` recebe
 * `transform: rotate(180deg)` quando aberto.
 */
export function MenuGroup({ group }: { group: MenuGroupNode }) {
  const { mode } = useMenuState();
  const isMini = mode === "mini";
  const pathname = usePathname();

  const childHrefs = group.children
    .filter((c): c is MenuItemNode => c.type === "item")
    .map((c) => c.href);

  const containsActive = childHrefs.some(
    (h) => pathname === h || (h !== "/" && pathname.startsWith(h + "/")),
  );

  const [open, setOpen] = useState<boolean>(containsActive);

  /* behavior #1: re-open quando a rota muda para um filho deste grupo. */
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const Icon = group.icon;
  // No modo mini, o template mostra apenas o ícone centralizado e suprime
  // a seta + dropdown (`menu-item-arrow` recebe `xl:hidden`).
  const showArrow = !isMini;
  const showLabel = !isMini;

  const headerStyle: CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "var(--adminMenu-itemGap)",
    borderRadius: "var(--adminMenu-itemRadius)",
    paddingLeft: "var(--adminMenu-itemPx)",
    paddingRight: "var(--adminMenu-itemPx)",
    paddingTop: "var(--adminMenu-itemPy)",
    paddingBottom: "var(--adminMenu-itemPy)",
    fontSize: "var(--adminMenu-itemFontSize)",
    fontWeight: 500,
    width: "100%",
    background: containsActive ? "var(--adminMenu-bgActive)" : "transparent",
    color: containsActive ? "var(--adminMenu-textActive)" : "var(--adminMenu-text)",
    border: 0,
    cursor: "pointer",
    textAlign: "left",
    justifyContent: isMini ? "center" : "flex-start",
    transition: `background-color var(--adminMenu-duration) var(--adminMenu-easing), color var(--adminMenu-duration) var(--adminMenu-easing)`,
  };

  return (
    <li style={{ listStyle: "none" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={headerStyle}
        className="admin-menu-group-button"
      >
        {Icon ? (
          <span
            style={{
              flexShrink: 0,
              width: "var(--adminMenu-iconSize)",
              height: "var(--adminMenu-iconSize)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: containsActive ? "var(--adminMenu-iconActive)" : "var(--adminMenu-icon)",
            }}
          >
            <Icon width={24} height={24} />
          </span>
        ) : null}

        {showLabel ? (
          <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {group.label}
          </span>
        ) : null}

        {showLabel && group.badge ? (
          <span
            style={{
              display: "inline-block",
              borderRadius: "9999px",
              paddingInline: "0.625rem",
              paddingBlock: "0.125rem",
              fontSize: "var(--adminMenu-badgeFontSize)",
              fontWeight: 500,
              textTransform: "uppercase",
              background: "var(--adminMenu-badgeBg)",
              color: "var(--adminMenu-badgeText)",
              marginRight: "0.5rem",
            }}
          >
            {group.badge}
          </span>
        ) : null}

        {showArrow ? (
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: "var(--adminMenu-arrowSize)",
              height: "var(--adminMenu-arrowSize)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: containsActive ? "var(--adminMenu-iconActive)" : "var(--adminMenu-icon)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)" /* behavior #2 */,
              transition: `transform var(--adminMenu-duration) var(--adminMenu-easing)`,
            }}
          >
            <ChevronDownIcon width={20} height={20} />
          </span>
        ) : null}
      </button>

      {/* Dropdown — só rendereiza quando aberto E não está em modo mini. */}
      {open && !isMini ? (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            marginTop: "0.5rem",
            paddingLeft: "var(--adminMenu-dropdownIndent)",
            paddingRight: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--adminMenu-dropdownGap)",
          }}
        >
          {group.children.map((child, idx) => {
            if (child.type === "divider") {
              return <MenuDivider key={`divider-${idx}`} />;
            }
            const item = child as MenuItemNode;
            return (
              <MenuItem
                key={`${item.label}-${item.href}`}
                label={item.label}
                href={item.href}
                badge={item.badge}
                /* filhos do dropdown não exibem ícone no template original. */
                indented
              />
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

/* helper para preservar tipos sem warning de unused. */
export type MenuGroupChildren = Array<MenuItemNode | MenuDividerNode>;
