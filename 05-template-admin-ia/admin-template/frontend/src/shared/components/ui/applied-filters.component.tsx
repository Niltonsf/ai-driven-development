import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface AppliedFilter {
  id: string;
  label: string;
}

export interface AppliedFiltersProps extends HTMLAttributes<HTMLDivElement> {
  filters: AppliedFilter[];
  onRemove?: (id: string) => void;
  onClearAll?: () => void;
  clearAllLabel?: string;
}

export const AppliedFilters = forwardRef<HTMLDivElement, AppliedFiltersProps>(
  (
    { filters, onRemove, onClearAll, clearAllLabel = "Clear all", className, ...props },
    ref,
  ) => {
    if (!filters || filters.length === 0) return null;
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap items-center gap-2", className)}
        {...props}
      >
        {filters.map((f) => (
          <span
            key={f.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-ui-appliedFilter-bg px-2.5 py-1 text-xs font-medium text-ui-appliedFilter-fg"
          >
            {f.label}
            {onRemove ? (
              <button
                type="button"
                aria-label={`Remove ${f.label}`}
                onClick={() => onRemove(f.id)}
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-ui-appliedFilter-removeFg hover:bg-white/40"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </span>
        ))}
        {onClearAll && filters.length > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-1 text-xs font-medium text-ui-brand-500 hover:text-ui-brand-600"
          >
            {clearAllLabel}
          </button>
        ) : null}
      </div>
    );
  },
);
AppliedFilters.displayName = "AppliedFilters";
