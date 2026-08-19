"use client";

import { useState } from "react";
import { SearchIcon } from "./icons";
import type { TopbarSearchConfig } from "./topbar.types";

type Props = {
  config: TopbarSearchConfig;
};

/**
 * TopbarSearch — input de busca inline (visível apenas em xl+, hidden xl:block).
 * Replica fielmente os tokens do template: h-11, rounded-lg, padding pl-12 pr-14,
 * focus ring brand-500/10. NÃO implementa busca real — input controlado com stub.
 */
export function TopbarSearch({ config }: Props) {
  const [value, setValue] = useState("");

  return (
    <div className="hidden xl:block">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: integrar com lógica de busca real
        }}
      >
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-adminTopbar-searchPlaceholder">
            <SearchIcon className="fill-current" />
          </span>
          <input
            id="topbar-search-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={config.placeholder}
            aria-label={config.placeholder}
            className="h-11 w-full rounded-lg border border-adminTopbar-searchBorder bg-transparent py-2.5 pr-14 pl-12 text-sm text-adminTopbar-searchText placeholder:text-adminTopbar-searchPlaceholder shadow-adminTopbar focus:border-ui-brand-300 focus:ring-3 focus:ring-ui-brand-500/10 focus:outline-none xl:w-[430px]"
          />
          <button
            id="topbar-search-button"
            type="button"
            tabIndex={-1}
            aria-hidden
            className="absolute top-1/2 right-2.5 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-adminTopbar-searchKbdBorder bg-adminTopbar-searchKbdBg px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-adminTopbar-searchKbdFg"
          >
            <span>{config.shortcut.primary}</span>
            <span>{config.shortcut.secondary}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
