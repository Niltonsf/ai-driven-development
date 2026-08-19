"use client";

import type { ReactNode } from "react";
import { useMenuState } from "./use-menu-state.hook";
import { MenuGroupIcon } from "./icons/MenuGroupIcon";

/**
 * Título de seção (`<h3>` no template original — linhas 724, 1234, 1338 do
 * index.html). Quando o sidebar está em modo `mini`, o template substitui o
 * texto por um ícone de "três pontos" (`menu-group-icon`); replicamos o mesmo.
 */
export function MenuSectionHeader({ label }: { label: string }) {
  const { mode } = useMenuState();
  const isMini = mode === "mini";

  return (
    <h3
      style={{
        margin: 0,
        marginBottom: "var(--adminMenu-groupGap)",
        fontSize: "var(--adminMenu-groupTitleFontSize)",
        lineHeight: "20px",
        textTransform: "uppercase",
        color: "var(--adminMenu-groupTitle)",
        fontWeight: 500,
      }}
    >
      {isMini ? (
        <span
          aria-label={label}
          style={{
            display: "flex",
            justifyContent: "center",
            color: "var(--adminMenu-groupTitle)",
          }}
        >
          <MenuGroupIcon width={24} height={24} />
        </span>
      ) : (
        <span>{label}</span>
      )}
    </h3>
  );
}

/**
 * Wrapper de seção — renderiza o título + a lista filha como um bloco com
 * espaçamento `--adminMenu-groupSpacing` entre seções.
 */
export function MenuSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--adminMenu-groupSpacing)" }}>
      <MenuSectionHeader label={label} />
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        {children}
      </ul>
    </div>
  );
}
