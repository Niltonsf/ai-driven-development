"use client";

import { useMemo, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/shared/utils/cn";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  keywords?: string[];
  onSelect?: () => void;
  group?: string;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyText?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Search…",
  emptyText = "No results.",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const blob = `${it.label} ${it.description ?? ""} ${(it.keywords ?? []).join(" ")}`.toLowerCase();
      return blob.includes(q);
    });
  }, [items, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const it of filtered) {
      const key = it.group ?? "";
      const list = map.get(key) ?? [];
      list.push(it);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) setQuery("");
        onOpenChange(o);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[99999] bg-ui-modal-overlay backdrop-blur-[8px]",
            "data-[state=open]:animate-ui-overlay-in data-[state=closed]:animate-ui-overlay-out",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-[18%] z-[99999] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-ui-popover-border bg-ui-popover-bg shadow-ui-cardLg",
            "data-[state=open]:animate-ui-content-in data-[state=closed]:animate-ui-content-out",
            "focus:outline-none",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-ui-card-border px-4 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ui-gray-500"
              />
            </svg>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-ui-gray-800 placeholder:text-ui-gray-400 focus:outline-none"
            />
          </div>
          <div className="max-h-[24rem] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-ui-gray-500">
                {emptyText}
              </div>
            ) : (
              groups.map(([group, list]) => (
                <div key={group || "default"} className="py-1">
                  {group ? (
                    <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ui-gray-500">
                      {group}
                    </div>
                  ) : null}
                  <ul className="flex flex-col gap-0.5">
                    {list.map((it) => (
                      <li key={it.id}>
                        <button
                          type="button"
                          onClick={() => {
                            it.onSelect?.();
                            onOpenChange(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ui-gray-700 transition hover:bg-ui-gray-100 focus:bg-ui-gray-100 focus:outline-none"
                        >
                          {it.icon ? (
                            <span className="text-ui-gray-500">{it.icon}</span>
                          ) : null}
                          <span className="flex-1">
                            <span className="block font-medium text-ui-gray-800">
                              {it.label}
                            </span>
                            {it.description ? (
                              <span className="block text-xs text-ui-gray-500">
                                {it.description}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
