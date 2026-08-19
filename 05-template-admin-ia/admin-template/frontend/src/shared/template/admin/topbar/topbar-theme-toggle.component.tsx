"use client";

import { useState } from "react";
import { TopbarActionButton } from "./topbar-action-button.component";
import { SunIcon, MoonIcon } from "./icons";

/**
 * TopbarThemeToggle — botão de alternância de tema (sol/lua) FIEL ao template.
 * NÃO implementa alternância real do tema da aplicação; apenas alterna o estado
 * visual local entre os dois ícones.
 */
export function TopbarThemeToggle() {
  // TODO: integrar com sistema de tema real (next-themes ou similar).
  // Atualmente apenas alterna o ícone visualmente.
  const [isDark, setIsDark] = useState(false);

  return (
    <TopbarActionButton
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setIsDark((v) => !v)}
    >
      {isDark ? (
        <SunIcon className="fill-current" />
      ) : (
        <MoonIcon className="fill-current" />
      )}
    </TopbarActionButton>
  );
}
