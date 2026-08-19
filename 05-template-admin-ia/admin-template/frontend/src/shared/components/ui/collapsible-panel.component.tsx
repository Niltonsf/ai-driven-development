"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface CollapsiblePanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CollapsiblePanel = forwardRef<HTMLDivElement, CollapsiblePanelProps>(
  (
    { title, defaultOpen = false, open, onOpenChange, children, className, ...props },
    ref,
  ) => {
    const [internal, setInternal] = useState(defaultOpen);
    const isOpen = open ?? internal;
    const toggle = () => {
      if (open === undefined) setInternal(!isOpen);
      onOpenChange?.(!isOpen);
    };
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-2xl border border-ui-card-border bg-ui-card-bg",
          className,
        )}
        {...props}
      >
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={toggle}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-ui-gray-800 transition hover:bg-ui-gray-50 sm:px-6"
        >
          <span>{title}</span>
          <svg
            className={cn("transition-transform", isOpen ? "rotate-180" : "rotate-0")}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4.79175 7.39584L10.0001 12.6042L15.2084 7.39585"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {isOpen ? (
          <div className="border-t border-ui-card-border px-5 py-4 text-sm text-ui-gray-600 sm:px-6">
            {children}
          </div>
        ) : null}
      </div>
    );
  },
);
CollapsiblePanel.displayName = "CollapsiblePanel";
