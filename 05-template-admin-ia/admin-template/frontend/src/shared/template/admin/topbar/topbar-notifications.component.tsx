"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { TopbarActionButton } from "./topbar-action-button.component";
import { TopbarDropdown } from "./topbar-dropdown.component";
import { BellIcon, CrossIcon } from "./icons";
import type { TopbarNotification } from "./topbar.types";

type Props = {
  notifications: TopbarNotification[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

/**
 * TopbarNotifications — botão de sino + dropdown com lista de notificações.
 * Replica EXATAMENTE estrutura do template (header, lista scrollável, footer
 * "View All Notification") e badge com efeito ping laranja.
 */
export function TopbarNotifications({ notifications, isOpen, onToggle, onClose }: Props) {
  const [hasUnread, setHasUnread] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Fecha ao clicar fora.
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

  // Fecha com ESC.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Fecha ao trocar de rota.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div ref={containerRef} className="relative">
      <TopbarActionButton
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        isActive={isOpen}
        onClick={() => {
          onToggle();
          setHasUnread(false);
        }}
        badge={
          hasUnread ? (
            <span className="absolute top-0.5 right-0 z-1 flex h-2 w-2 rounded-full bg-adminTopbar-badgePing">
              <span
                aria-hidden
                className="absolute -z-1 inline-flex h-full w-full rounded-full bg-adminTopbar-badgePing opacity-75"
                style={{ animation: "var(--animate-adminTopbar-ping)" }}
              />
            </span>
          ) : null
        }
      >
        <BellIcon className="fill-current" />
      </TopbarActionButton>

      <TopbarDropdown
        open={isOpen}
        align="right-mobile-shift"
        className="h-[480px] w-[350px] sm:w-[361px]"
      >
        <div className="mb-3 flex items-center justify-between border-b border-adminTopbar-dropdownDivider pb-3">
          <h5 className="text-lg font-semibold text-adminTopbar-notificationActor">Notification</h5>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={onClose}
            className="text-adminTopbar-iconDefault hover:text-adminTopbar-iconHover"
          >
            <CrossIcon className="fill-current" />
          </button>
        </div>

        <ul
          className="custom-scrollbar flex h-auto flex-col overflow-y-auto"
          role="menu"
        >
          {notifications.map((n) => {
            const statusClass =
              n.statusColor === "success"
                ? "bg-adminTopbar-statusSuccess"
                : "bg-adminTopbar-statusError";
            return (
              <li key={n.id} role="none">
                <a
                  // TODO: integrar com ação real (link para detalhe da notificação)
                  href="#"
                  role="menuitem"
                  className="flex gap-3 rounded-lg border-b border-adminTopbar-dropdownDivider p-3 px-[18px] py-3 hover:bg-adminTopbar-dropdownItemHover"
                >
                  <span className="relative z-1 block h-10 w-full max-w-10 rounded-full">
                    <Image
                      src={n.avatarSrc}
                      alt={n.actorName}
                      width={40}
                      height={40}
                      className="overflow-hidden rounded-full"
                    />
                    <span
                      className={`absolute right-0 bottom-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white ${statusClass}`}
                    />
                  </span>

                  <span className="block">
                    <span className="mb-1.5 block text-sm text-adminTopbar-notificationMessage">
                      <span className="font-medium text-adminTopbar-notificationActor">
                        {n.actorName}
                      </span>{" "}
                      {n.message}{" "}
                      <span className="font-medium text-adminTopbar-notificationActor">
                        {n.projectName}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-adminTopbar-notificationMeta">
                      <span>{n.category}</span>
                      <span className="h-1 w-1 rounded-full bg-adminTopbar-notificationDot" />
                      <span>{n.timeAgo}</span>
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <a
          // TODO: integrar com rota real "ver todas as notificações"
          href="#"
          className="mt-3 flex justify-center rounded-lg border border-adminTopbar-footerBtnBorder bg-adminTopbar-footerBtnBg p-3 text-sm font-medium text-adminTopbar-footerBtnFg shadow-adminTopbar hover:bg-adminTopbar-footerBtnHoverBg"
        >
          View All Notification
        </a>
      </TopbarDropdown>
    </div>
  );
}
