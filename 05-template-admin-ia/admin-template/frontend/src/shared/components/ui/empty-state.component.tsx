import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon ? <div className="mb-4 text-ui-emptyState-icon">{icon}</div> : null}
      <h3 className="text-base font-semibold text-ui-emptyState-title">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-ui-emptyState-description">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  ),
);
EmptyState.displayName = "EmptyState";
