"use client";

import { useMenuState } from "../use-menu-state.hook";
import { HamburgerDesktopIcon, HamburgerMobileIcon, CrossIcon } from "./icons";

/**
 * TopbarSidebarToggle — botão hambúrguer da sidebar.
 * Integra-se ao `useMenuState` existente (já fornecido pelo shell). Replica
 * fielmente o markup do template: ícone diferente em xl+ (hamburger 16x12) e
 * mobile (hamburger 24x24 ou cross 24x24 quando aberto), botão 40x40 (mobile)
 * ou 44x44 (desktop) com border xl:border.
 */
export function TopbarSidebarToggle() {
  const { mode, toggle, isMobile } = useMenuState();

  // No desktop, "ativo" = não-colapsado.
  const desktopActive = !isMobile && mode !== "mini";
  // No mobile, "ativo" = drawer aberto.
  const mobileActive = isMobile && mode === "mobile-open";
  const isActive = desktopActive || mobileActive;

  return (
    <button
      type="button"
      aria-label="Toggle sidebar"
      aria-expanded={isActive}
      onClick={toggle}
      className={`z-99999 flex h-10 w-10 items-center justify-center rounded-lg border-adminTopbar-buttonBorder text-adminTopbar-iconDefault xl:h-11 xl:w-11 xl:border ${
        isActive ? "bg-adminTopbar-buttonActiveBg xl:bg-transparent" : ""
      }`}
      style={{ zIndex: "var(--z-adminTopbar)" }}
    >
      {/* Desktop: sempre hamburger horizontal 16x12 */}
      <HamburgerDesktopIcon className="hidden fill-current xl:block" />

      {/* Mobile: hamburger 24x24 quando fechado, cross 24x24 quando aberto */}
      {mobileActive ? (
        <CrossIcon className="block fill-current xl:hidden" />
      ) : (
        <HamburgerMobileIcon className="block fill-current xl:hidden" />
      )}
    </button>
  );
}
