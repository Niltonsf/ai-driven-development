"use client";

import type { ReactNode } from "react";
import { ActionMenu } from "./action-menu.component";
import { Avatar } from "./avatar.component";

export interface UserMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  href?: string;
}

export interface UserMenuProps {
  name: string;
  email?: string;
  avatarSrc?: string;
  items: UserMenuItem[];
  footer?: ReactNode;
}

export function UserMenu({ name, email, avatarSrc, items, footer }: UserMenuProps) {
  return (
    <ActionMenu>
      <ActionMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-3 rounded-full bg-transparent p-1 transition hover:bg-ui-gray-100 focus:outline-none focus:ring-2 focus:ring-ui-brand-500/20"
        >
          <Avatar src={avatarSrc} alt={name} size="sm" />
          <span className="hidden text-sm font-medium text-ui-gray-800 md:block">
            {name}
          </span>
        </button>
      </ActionMenu.Trigger>
      <ActionMenu.Content className="min-w-[16rem] p-3">
        <div className="px-2 pb-3">
          <div className="text-sm font-semibold text-ui-gray-800">{name}</div>
          {email ? (
            <div className="text-xs text-ui-gray-500">{email}</div>
          ) : null}
        </div>
        <ActionMenu.Separator />
        <div className="flex flex-col gap-0.5 pt-2">
          {items.map((item) => (
            <ActionMenu.Item
              key={item.id}
              danger={item.danger}
              onSelect={() => item.onSelect?.()}
              asChild={!!item.href}
            >
              {item.href ? (
                <a href={item.href} className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ) : (
                <>
                  {item.icon}
                  <span>{item.label}</span>
                </>
              )}
            </ActionMenu.Item>
          ))}
        </div>
        {footer ? (
          <>
            <ActionMenu.Separator />
            <div className="px-2 pt-2">{footer}</div>
          </>
        ) : null}
      </ActionMenu.Content>
    </ActionMenu>
  );
}
