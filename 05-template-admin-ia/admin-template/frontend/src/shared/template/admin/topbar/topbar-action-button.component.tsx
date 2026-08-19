"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  badge?: ReactNode;
  isActive?: boolean;
};

/**
 * TopbarActionButton — botão circular de 44px (h-11 w-11) com ícone, opcionalmente
 * com badge animado. Replica EXATAMENTE o estilo do botão de notificação e dark-mode
 * toggle do template demo.tailadmin.com.
 */
export const TopbarActionButton = forwardRef<HTMLButtonElement, Props>(function TopbarActionButton(
  { children, badge, isActive = false, className = "", ...rest },
  ref,
) {
  const baseClasses =
    "relative flex h-11 w-11 items-center justify-center rounded-full border border-adminTopbar-buttonBorder bg-adminTopbar-bg text-adminTopbar-iconDefault transition-colors hover:bg-adminTopbar-buttonHoverBg hover:text-adminTopbar-iconHover focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-brand-500/30";
  const activeClasses = isActive ? "bg-adminTopbar-buttonActiveBg text-adminTopbar-iconHover" : "";
  return (
    <button
      ref={ref}
      type="button"
      className={`${baseClasses} ${activeClasses} ${className}`.trim()}
      {...rest}
    >
      {badge}
      {children}
    </button>
  );
});
