import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface SearchResultItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
}

export const SearchResultItem = forwardRef<HTMLDivElement, SearchResultItemProps>(
  ({ icon, title, description, meta, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-2 transition hover:bg-ui-gray-50",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mt-0.5 shrink-0 text-ui-gray-500">{icon}</div>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium text-ui-gray-800">{title}</div>
        {description ? (
          <div className="truncate text-xs text-ui-gray-500">{description}</div>
        ) : null}
      </div>
      {meta ? (
        <div className="shrink-0 text-xs text-ui-gray-500">{meta}</div>
      ) : null}
    </div>
  ),
);
SearchResultItem.displayName = "SearchResultItem";
