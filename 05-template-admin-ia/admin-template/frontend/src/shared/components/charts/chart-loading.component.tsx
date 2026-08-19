"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";
import { Spinner } from "@/shared/components/ui";

export interface ChartLoadingProps extends HTMLAttributes<HTMLDivElement> {
  height?: number;
  variant?: "bar" | "line" | "area" | "pie" | "donut" | "sparkline" | "generic";
  label?: string;
}

/**
 * Skeleton shown while the chart chunk lazy-loads (or while data is fetched
 * upstream). The `height` matches the eventual chart height to avoid layout
 * shift when ApexCharts hydrates.
 */
export const ChartLoading = forwardRef<HTMLDivElement, ChartLoadingProps>(
  ({ className, height = 300, variant = "generic", label = "Loading chart", ...props }, ref) => {
    const isCircular = variant === "pie" || variant === "donut";
    const isSparkline = variant === "sparkline";
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(
          "flex w-full items-center justify-center rounded-lg bg-ui-gray-50",
          "animate-pulse",
          className,
        )}
        style={{ height: isSparkline ? height ?? 50 : height }}
        {...props}
      >
        {isCircular ? (
          <div className="h-3/4 w-auto aspect-square rounded-full border-8 border-ui-gray-100" />
        ) : (
          <Spinner size="md" />
        )}
      </div>
    );
  },
);
ChartLoading.displayName = "ChartLoading";
