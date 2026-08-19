import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

const DefaultSeparator = (
  <svg
    className="stroke-current text-ui-breadcrumb-separator"
    width="17"
    height="16"
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
      stroke=""
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, separator = DefaultSeparator, className, ...props }, ref) => (
    <nav ref={ref} aria-label="Breadcrumb" className={cn("flex", className)} {...props}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li
              key={`${item.label}-${idx}`}
              className={cn(
                "flex items-center gap-1.5",
                isLast
                  ? "text-sm text-ui-breadcrumb-activeText"
                  : "text-sm text-ui-breadcrumb-link",
              )}
            >
              {!isLast && item.href ? (
                <a
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-sm text-ui-breadcrumb-link hover:text-ui-breadcrumb-activeText"
                >
                  {item.label}
                  <span aria-hidden="true">{separator}</span>
                </a>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  ),
);
Breadcrumb.displayName = "Breadcrumb";
