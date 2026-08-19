import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface WidgetCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: ReactNode;
}

export const WidgetCard = forwardRef<HTMLDivElement, WidgetCardProps>(
  ({ title, action, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-2xl border border-ui-card-border bg-ui-card-bg",
        className,
      )}
      {...props}
    >
      {title || action ? (
        <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
          {title ? (
            <h3 className="text-lg font-semibold text-ui-gray-800">{title}</h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  ),
);
WidgetCard.displayName = "WidgetCard";
