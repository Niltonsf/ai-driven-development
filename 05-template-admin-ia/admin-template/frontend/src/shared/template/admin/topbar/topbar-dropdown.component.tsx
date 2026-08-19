"use client";

import type { ReactNode } from "react";
import { forwardRef } from "react";

type Props = {
  open: boolean;
  align?: "left" | "right" | "right-mobile-shift";
  width?: string;
  className?: string;
  children: ReactNode;
};

/**
 * TopbarDropdown — painel suspenso reutilizável.
 * Replica o estilo dos dropdowns (notificações, user menu) do template:
 * - rounded-2xl, border gray-200, bg branco, shadow-theme-lg
 * - margin-top de 17px (mt-[17px])
 * - animação fade + slide-down
 *
 * `align="right-mobile-shift"` replica o comportamento do dropdown de notificações
 * (-right-[240px] no mobile, lg:right-0).
 */
export const TopbarDropdown = forwardRef<HTMLDivElement, Props>(function TopbarDropdown(
  { open, align = "right", width, className = "", children },
  ref,
) {
  if (!open) return null;
  const alignClasses =
    align === "right"
      ? "right-0"
      : align === "left"
        ? "left-0"
        : "-right-[240px] lg:right-0";
  return (
    <div
      ref={ref}
      role="menu"
      className={`absolute mt-[17px] flex flex-col rounded-2xl border border-adminTopbar-dropdownBorder bg-adminTopbar-dropdownBg p-3 shadow-adminTopbar-dropdown ${alignClasses} ${className}`}
      style={{
        animation: "var(--animate-adminTopbar-dropdownIn)",
        ...(width ? { width } : {}),
      }}
    >
      {children}
    </div>
  );
});
