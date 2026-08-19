"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { TopbarDropdown } from "./topbar-dropdown.component";
import {
  ChevronDownIcon,
  UserCircleIcon,
  SettingsIcon,
  InfoCircleIcon,
  SignOutIcon,
} from "./icons";
import type { TopbarUserConfig, TopbarUserMenuItem } from "./topbar.types";

type Props = {
  user: TopbarUserConfig;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

const ICON_MAP: Record<TopbarUserMenuItem["iconKey"], (props: { className?: string }) => React.JSX.Element> = {
  "edit-profile": (p) => <UserCircleIcon {...p} />,
  "account-settings": (p) => <SettingsIcon {...p} />,
  support: (p) => <InfoCircleIcon {...p} />,
};

/**
 * TopbarUserMenu — avatar + nome + chevron + dropdown com itens de perfil.
 * Replica EXATAMENTE o template: avatar 44px, nome em medium, chevron rotaciona
 * 180° quando aberto, dropdown 260px com header (nome + email), 3 itens e botão
 * "Sign out" no rodapé.
 */
export function TopbarUserMenu({ user, isOpen, onToggle, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex items-center text-adminTopbar-iconDefault focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-brand-500/30 rounded-lg"
      >
        <span className="mr-3 h-11 w-11 overflow-hidden rounded-full">
          <Image
            src={user.avatarSrc}
            alt={user.fullName}
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        </span>
        <span className="mr-1 block text-sm font-medium">{user.shortName}</span>
        <ChevronDownIcon
          className={`stroke-current transition-transform duration-adminTopbar ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <TopbarDropdown open={isOpen} align="right" className="w-[260px]">
        <div>
          <span className="block text-sm font-medium text-adminTopbar-userName">
            {user.fullName}
          </span>
          <span className="mt-0.5 block text-xs text-adminTopbar-userEmail">{user.email}</span>
        </div>

        <ul className="flex flex-col gap-1 border-b border-adminTopbar-border pt-4 pb-3">
          {user.menuItems.map((item) => {
            const IconComp = ICON_MAP[item.iconKey];
            return (
              <li key={item.id} role="none">
                <a
                  // TODO: integrar com ação/rota real
                  href={item.href ?? "#"}
                  role="menuitem"
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-adminTopbar-menuItemFg hover:bg-adminTopbar-menuItemHoverBg hover:text-adminTopbar-menuItemHoverFg"
                >
                  <IconComp className="fill-adminTopbar-iconDefault group-hover:fill-adminTopbar-iconHover" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          // TODO: integrar com ação real de logout
          onClick={() => {}}
          className="group mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-adminTopbar-menuItemFg hover:bg-adminTopbar-menuItemHoverBg hover:text-adminTopbar-menuItemHoverFg"
        >
          <SignOutIcon className="fill-adminTopbar-iconDefault group-hover:fill-adminTopbar-iconHover" />
          Sign out
        </button>
      </TopbarDropdown>
    </div>
  );
}
