"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Card } from "@/shared/components/ui";

export interface ChartContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Wrapper card for charts — replicates the template's "card with header + chart"
 * layout (title on the left, optional actions/dropdown on the right). Built on
 * top of the `Card` primitive so colors/borders/radius stay consistent.
 */
export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ title, description, actions, children, className, ...props }, ref) => {
    const hasHeader = Boolean(title) || Boolean(description) || Boolean(actions);
    return (
      <Card ref={ref} className={cn("p-5 sm:p-6", className)} {...props}>
        {hasHeader ? (
          <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
            <div className="min-w-0">
              {title ? (
                <h3 className="text-lg font-semibold text-ui-gray-800">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="text-ui-sm mt-1 text-ui-gray-500">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}
        <div>{children}</div>
      </Card>
    );
  },
);
ChartContainer.displayName = "ChartContainer";
