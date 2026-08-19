"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface ChartEmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  height?: number;
  message?: string;
  description?: ReactNode;
  action?: ReactNode;
}

/**
 * Rendered in place of a chart when there's no data to display. Visual style
 * matches the template's empty cards (gray-50 surface, dashed border absent —
 * the parent Card already provides the border).
 */
export const ChartEmptyState = forwardRef<HTMLDivElement, ChartEmptyStateProps>(
  (
    {
      className,
      height = 300,
      message = "No data available",
      description,
      action,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      role="status"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-lg",
        "bg-ui-gray-50 px-6 text-center",
        className,
      )}
      style={{ height }}
      {...props}
    >
      <svg
        aria-hidden
        className="h-10 w-10 text-ui-gray-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3v18h18M7 14l4-4 4 4 5-6"
        />
      </svg>
      <div>
        <p className="text-ui-sm font-medium text-ui-gray-700">{message}</p>
        {description ? (
          <p className="text-ui-xs mt-1 text-ui-gray-500">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  ),
);
ChartEmptyState.displayName = "ChartEmptyState";
