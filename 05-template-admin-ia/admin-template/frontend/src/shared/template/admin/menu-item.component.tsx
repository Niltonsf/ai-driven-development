"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import type { MenuIcon } from "./menu.types";
import { useMenuState } from "./use-menu-state.hook";

/**
 * Folha do menu — link com ícone + label + badge opcional.
 * Replica `.menu-item` do template (style.css linhas ~575 e ~2562/2630).
 *
 * Estado ativo: derivado de `usePathname()` (match exato OU prefixo na url).
 *
 * No modo `mini` (sidebar colapsada em desktop), label/badge ficam ocultos —
 * mesmo padrão do template (`menu-item-text` recebe `xl:hidden` quando
 * `sidebarToggle` é `true`).
 */
export type MenuItemProps = {
  label: string;
  href: string;
  icon?: MenuIcon;
  badge?: string;
  /** Quando dentro de um grupo aberto, indica indentação para visual de filho. */
  indented?: boolean;
};

export function MenuItem({ label, href, icon: Icon, badge, indented = false }: MenuItemProps) {
  const { mode } = useMenuState();
  const pathname = usePathname();
  const isMini = mode === "mini";

  // Match exato OU prefixo (template usa `page === '<id>'` no original;
  // em Next.js o equivalente fiel é match por `pathname` exato/prefixo).
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  const baseStyle: CSSProperties = indented
    ? {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        borderRadius: "var(--adminMenu-itemRadius)",
        paddingLeft: "var(--adminMenu-dropdownPx)",
        paddingRight: "var(--adminMenu-dropdownPx)",
        paddingTop: "var(--adminMenu-dropdownPy)",
        paddingBottom: "var(--adminMenu-dropdownPy)",
        fontSize: "var(--adminMenu-dropdownFontSize)",
        fontWeight: "var(--adminMenu-itemFontWeight)" as CSSProperties["fontWeight"],
        textDecoration: "none",
        transition: `background-color var(--adminMenu-duration) var(--adminMenu-easing), color var(--adminMenu-duration) var(--adminMenu-easing)`,
        background: isActive ? "var(--adminMenu-bgActive)" : "transparent",
        color: isActive ? "var(--adminMenu-textActive)" : "var(--adminMenu-text)",
      }
    : {
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
        fontWeight: "var(--adminMenu-itemFontWeight)" as CSSProperties["fontWeight"],
        textDecoration: "none",
        justifyContent: isMini ? "center" : "flex-start",
        transition: `background-color var(--adminMenu-duration) var(--adminMenu-easing), color var(--adminMenu-duration) var(--adminMenu-easing)`,
        background: isActive ? "var(--adminMenu-bgActive)" : "transparent",
        color: isActive ? "var(--adminMenu-textActive)" : "var(--adminMenu-text)",
      };

  return (
    <li style={{ listStyle: "none" }}>
      <Link
        href={href}
        className="admin-menu-item-link"
        data-active={isActive ? "true" : "false"}
        style={baseStyle}
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
              color: isActive ? "var(--adminMenu-iconActive)" : "var(--adminMenu-icon)",
            }}
          >
            <Icon width={24} height={24} />
          </span>
        ) : null}

        {!isMini ? (
          <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </span>
        ) : null}

        {!isMini && badge ? (
          <span
            style={{
              display: "inline-block",
              borderRadius: "9999px",
              paddingInline: "0.625rem",
              paddingBlock: "0.125rem",
              fontSize: "var(--adminMenu-badgeFontSize)",
              fontWeight: 500,
              textTransform: "uppercase",
              background: isActive ? "var(--adminMenu-badgeBgActive)" : "var(--adminMenu-badgeBg)",
              color: "var(--adminMenu-badgeText)",
            }}
          >
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
