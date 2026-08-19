"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type MenuMode = "expanded" | "mini" | "mobile-open" | "mobile-closed";

type MenuStateValue = {
  mode: MenuMode;
  isMobile: boolean;
  setMode: (next: MenuMode) => void;
  toggle: () => void;
  openOnMobile: () => void;
  closeOnMobile: () => void;
};

const MenuStateContext = createContext<MenuStateValue | null>(null);

const BP_MD = 1280;
const HAS_MINI = true;
const SUPPORTED_DESKTOP_MODES: MenuMode[] = HAS_MINI ? ["expanded", "mini"] : ["expanded"];
const SUPPORTED_MOBILE_MODES: MenuMode[] = ["mobile-open", "mobile-closed"];

export function MenuStateProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setModeState] = useState<MenuMode>("expanded");
  const lastDesktopMode = useRef<MenuMode>("expanded");

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BP_MD - 1}px)`);
    const apply = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setModeState((prev) => {
        if (mobile) {
          if (prev === "expanded" || prev === "mini") {
            lastDesktopMode.current = prev;
            return "mobile-closed";
          }
          return prev;
        }
        if (prev === "mobile-open" || prev === "mobile-closed") {
          return lastDesktopMode.current;
        }
        return prev;
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const setMode = (next: MenuMode) => {
    const allowed = isMobile ? SUPPORTED_MOBILE_MODES : SUPPORTED_DESKTOP_MODES;
    if (!allowed.includes(next)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[menu-state] mode "${next}" not supported in current breakpoint`);
      }
      return;
    }
    setModeState(next);
  };

  const toggle = () => {
    if (isMobile) {
      setModeState((m) => (m === "mobile-open" ? "mobile-closed" : "mobile-open"));
    } else if (HAS_MINI) {
      setModeState((m) => (m === "expanded" ? "mini" : "expanded"));
    }
  };

  const openOnMobile = () => isMobile && setModeState("mobile-open");
  const closeOnMobile = () => isMobile && setModeState("mobile-closed");

  const value = useMemo<MenuStateValue>(
    () => ({ mode, isMobile, setMode, toggle, openOnMobile, closeOnMobile }),
    [mode, isMobile],
  );

  return <MenuStateContext.Provider value={value}>{children}</MenuStateContext.Provider>;
}

export function useMenuStateContext(): MenuStateValue {
  const ctx = useContext(MenuStateContext);
  if (!ctx) throw new Error("useMenuState must be used inside <MenuStateProvider>");
  return ctx;
}
