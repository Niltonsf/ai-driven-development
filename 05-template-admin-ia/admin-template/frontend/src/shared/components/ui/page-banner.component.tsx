"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface PageBannerProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const PageBanner = forwardRef<HTMLDivElement, PageBannerProps>(
  (
    { icon, title, description, action, dismissible, onDismiss, className, ...props },
    ref,
  ) => {
    const [open, setOpen] = useState(true);
    if (!open) return null;
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 rounded-2xl border border-ui-pageBanner-border bg-ui-pageBanner-bg px-4 py-3",
          className,
        )}
        {...props}
      >
        {icon ? (
          <div className="mt-0.5 shrink-0 text-ui-pageBanner-fg">{icon}</div>
        ) : null}
        <div className="flex-1 text-sm text-ui-pageBanner-fg">
          {title ? <div className="font-semibold">{title}</div> : null}
          {description ? <div className="mt-0.5">{description}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
        {dismissible ? (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
              setOpen(false);
              onDismiss?.();
            }}
            className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-ui-pageBanner-fg transition hover:bg-white/40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    );
  },
);
PageBanner.displayName = "PageBanner";
