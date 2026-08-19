"use client";

import { TopbarThemeToggle } from "./topbar-theme-toggle.component";
import { TopbarNotifications } from "./topbar-notifications.component";
import { TopbarUserMenu } from "./topbar-user-menu.component";
import type { TopbarConfig } from "./topbar.types";

type Props = {
  config: TopbarConfig;
  mobileOpen: boolean;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
};

/**
 * TopbarActions — agrupador das ações da direita (theme toggle, notificações,
 * user menu). Replica fielmente o markup do template:
 * - container hidden no mobile a menos que `menuToggle` esteja ativo;
 * - em xl+ flex justify-end com sombra apenas no mobile-aberto.
 */
export function TopbarActions({
  config,
  mobileOpen,
  openDropdownId,
  setOpenDropdownId,
}: Props) {
  const containerClasses = mobileOpen ? "flex" : "hidden";

  return (
    <div
      className={`${containerClasses} w-full items-center justify-between gap-4 px-5 py-4 shadow-adminTopbar-mobileActions xl:flex xl:justify-end xl:px-0 xl:shadow-none`}
    >
      <div className="flex items-center gap-2 2xsm:gap-3">
        <TopbarThemeToggle />

        <TopbarNotifications
          notifications={config.notifications}
          isOpen={openDropdownId === "notifications"}
          onToggle={() =>
            setOpenDropdownId(openDropdownId === "notifications" ? null : "notifications")
          }
          onClose={() => setOpenDropdownId(null)}
        />
      </div>

      <TopbarUserMenu
        user={config.user}
        isOpen={openDropdownId === "user"}
        onToggle={() => setOpenDropdownId(openDropdownId === "user" ? null : "user")}
        onClose={() => setOpenDropdownId(null)}
      />
    </div>
  );
}
