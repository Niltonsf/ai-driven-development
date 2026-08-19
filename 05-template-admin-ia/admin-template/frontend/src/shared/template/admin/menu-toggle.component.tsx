"use client";

import { useMenuState } from "./use-menu-state.hook";

export function MenuToggle() {
  const { toggle, isMobile, mode } = useMenuState();
  const isOpen = isMobile ? mode === "mobile-open" : mode === "expanded";

  // SVG hamburger (closed) — extracted from template (xl variant: 16x12 viewBox).
  const iconClosed = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.25 6C3.25 5.58579 3.58579 5.25 4 5.25L20 5.25C20.4142 5.25 20.75 5.58579 20.75 6C20.75 6.41421 20.4142 6.75 20 6.75L4 6.75C3.58579 6.75 3.25 6.41422 3.25 6ZM3.25 18C3.25 17.5858 3.58579 17.25 4 17.25L20 17.25C20.4142 17.25 20.75 17.5858 20.75 18C20.75 18.4142 20.4142 18.75 20 18.75L4 18.75C3.58579 18.75 3.25 18.4142 3.25 18ZM4 11.25C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75L12 12.75C12.4142 12.75 12.75 12.4142 12.75 12C12.75 11.5858 12.4142 11.25 12 11.25L4 11.25Z"
        fill="currentColor"
      />
    </svg>
  );

  // SVG cross (open) — extracted from template.
  const iconOpen = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
        fill="currentColor"
      />
    </svg>
  );

  // Background condicional: o template aplica `bg-gray-100` apenas quando
  // sidebarToggle === true (estado mini) E em breakpoints < xl. No xl
  // permanece transparent. Replicamos a regra: em mobile/tablet (não-desktop),
  // se a sidebar estiver "fechada/mini", aplicar bg-gray-100; senão transparent.
  // No desktop (xl+), bg sempre transparent (idle); hover usa --shell-menu-toggle-bg-hover.
  const bgOverride = !isMobile || isOpen ? undefined : "#f3f4f6";

  return (
    <button
      type="button"
      aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      aria-expanded={isOpen}
      onClick={toggle}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: "var(--shell-menu-toggle-w)",
        height: "var(--shell-menu-toggle-h)",
        padding: "var(--shell-menu-toggle-padding)",
        background: bgOverride ?? "var(--shell-menu-toggle-bg)",
        border: "var(--shell-menu-toggle-border)",
        borderRadius: "var(--shell-menu-toggle-radius)",
        color: "var(--shell-menu-toggle-color)",
        cursor: "pointer",
        transition: "background 150ms ease",
        marginRight: "var(--shell-topbar-toggle-mr)",
      }}
      onMouseEnter={(e) => {
        if (!bgOverride) e.currentTarget.style.background = "var(--shell-menu-toggle-bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = bgOverride ?? "var(--shell-menu-toggle-bg)";
      }}
    >
      {isOpen ? iconOpen : iconClosed}
    </button>
  );
}
