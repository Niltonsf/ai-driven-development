"use client";

import type { ReactNode } from "react";
import { useMenuState } from "./use-menu-state.hook";
import { Menu } from "./menu.component";
import { Topbar } from "./topbar/topbar.component";

export function AdminShell({ children }: { children: ReactNode }) {
  const { mode, isMobile, closeOnMobile } = useMenuState();

  const asideWidth =
    mode === "expanded" || mode === "mobile-open"
      ? "var(--shell-aside-w-expanded)"
      : mode === "mini"
        ? "var(--shell-aside-w-mini)"
        : "0px";

  const showOverlay = isMobile && mode === "mobile-open";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--shell-bg)",
        color: "var(--shell-text)",
        fontFamily: "var(--shell-font-family)",
        fontSize: "var(--shell-font-size-base)",
      }}
    >
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: asideWidth,
          background: "var(--shell-aside-bg)",
          color: "var(--shell-aside-text)",
          borderRight: "1px solid var(--shell-border)",
          overflow: "hidden",
          paddingLeft: "1.25rem",
          paddingRight: "1.25rem",
          transition: "width 200ms ease, transform 200ms ease",
          transform: isMobile && mode === "mobile-closed" ? "translateX(-100%)" : "translateX(0)",
          zIndex: 30,
        }}
      >
        <Menu />
      </aside>

      {showOverlay && (
        <button
          aria-label="Fechar menu"
          onClick={closeOnMobile}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            border: 0,
            padding: 0,
            zIndex: 25,
          }}
        />
      )}

      <div
        style={{
          marginLeft: isMobile ? 0 : asideWidth,
          transition: "margin-left 200ms ease",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Topbar />

        <main
          style={{
            flex: 1,
            paddingTop: "var(--shell-main-py)",
            paddingBottom: "var(--shell-main-py)",
            paddingLeft: "var(--shell-main-px)",
            paddingRight: "var(--shell-main-px)",
          }}
        >
          <div
            style={{
              maxWidth: "var(--shell-main-max-w)",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
