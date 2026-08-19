"use client";

import { useState } from "react";
import { topbarConfig } from "./topbar.config";
import { TopbarSidebarToggle } from "./topbar-sidebar-toggle.component";
import { TopbarBrand } from "./topbar-brand.component";
import { TopbarMobileToggle } from "./topbar-mobile-toggle.component";
import { TopbarSearch } from "./topbar-search.component";
import { TopbarActions } from "./topbar-actions.component";

/**
 * Topbar — orquestrador raiz da topbar do template demo.tailadmin.com.
 *
 * Layout fiel ao original (`<header>` em index.html):
 *   ┌─ header (sticky top-0 z-99999, bg branco, border xl:border-b) ─────────┐
 *   │ ┌─ wrapper (flex grow flex-col xl:flex-row xl:px-6) ───────────────────┤
 *   │ │ ┌─ left zone (flex w-full justify-between gap-2 px-3 py-3 xl:px-0) ─┐│
 *   │ │ │ [SidebarToggle] [Brand mobile] [MobileToggle] [Search xl+]        ││
 *   │ │ └──────────────────────────────────────────────────────────────────┘│
 *   │ │ ┌─ right zone (mobile drawer / xl:flex justify-end) ────────────────┐│
 *   │ │ │ [ThemeToggle] [Notifications] [UserMenu]                         ││
 *   │ │ └──────────────────────────────────────────────────────────────────┘│
 *   │ └────────────────────────────────────────────────────────────────────┘│
 *   └─────────────────────────────────────────────────────────────────────────┘
 *
 * Estado local:
 *   - `mobileOpen` controla a visibilidade do agrupador de ações no mobile
 *     (xl:flex sempre visível).
 *   - `openDropdownId` garante apenas UM dropdown aberto por vez (notifications
 *     ou user menu).
 */
export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  return (
    <header
      className="sticky top-0 flex w-full border-adminTopbar-border bg-adminTopbar-bg xl:border-b"
      style={{ zIndex: "var(--z-adminTopbar)" }}
    >
      <div className="flex grow flex-col items-center justify-between xl:flex-row xl:px-6">
        {/* Zona esquerda — sempre visível */}
        <div className="flex w-full items-center justify-between gap-2 border-b border-adminTopbar-border px-3 py-3 sm:gap-4 lg:py-4 xl:justify-normal xl:border-b-0 xl:px-0">
          <TopbarSidebarToggle />
          <TopbarBrand brand={topbarConfig.brand} />
          <TopbarMobileToggle
            open={mobileOpen}
            onToggle={() => setMobileOpen((v) => !v)}
          />
          <TopbarSearch config={topbarConfig.search} />
        </div>

        {/* Zona direita — drawer no mobile, inline no xl+ */}
        <TopbarActions
          config={topbarConfig}
          mobileOpen={mobileOpen}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
        />
      </div>
    </header>
  );
}
