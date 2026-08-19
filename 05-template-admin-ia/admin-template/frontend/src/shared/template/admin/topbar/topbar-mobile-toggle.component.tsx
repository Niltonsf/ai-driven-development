"use client";

import { DotsHorizontalIcon } from "./icons";

type Props = {
  open: boolean;
  onToggle: () => void;
};

/**
 * TopbarMobileToggle — botão "Application nav menu" presente APENAS no mobile
 * (xl:hidden). Abre/fecha o painel direito da topbar (ações secundárias) no mobile.
 * Replica fielmente o botão do template (h-10 w-10 rounded-lg).
 */
export function TopbarMobileToggle({ open, onToggle }: Props) {
  return (
    <button
      type="button"
      aria-label="Toggle topbar actions"
      aria-expanded={open}
      onClick={onToggle}
      className={`z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-adminTopbar-iconHover hover:bg-adminTopbar-buttonHoverBg xl:hidden ${
        open ? "bg-adminTopbar-buttonActiveBg" : ""
      }`}
      style={{ zIndex: "var(--z-adminTopbar)" }}
    >
      <DotsHorizontalIcon className="fill-current" />
    </button>
  );
}
