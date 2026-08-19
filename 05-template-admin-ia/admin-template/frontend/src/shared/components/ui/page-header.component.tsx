import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb.component";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, subtitle, breadcrumbs, actions, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-wrap items-center justify-between gap-3 pb-6", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ui-gray-800">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-ui-gray-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumb items={breadcrumbs} /> : null}
        {actions}
      </div>
    </div>
  ),
);
PageHeader.displayName = "PageHeader";
