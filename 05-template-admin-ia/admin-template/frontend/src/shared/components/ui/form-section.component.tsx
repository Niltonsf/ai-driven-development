import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface FormSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export const FormSection = forwardRef<HTMLDivElement, FormSectionProps>(
  ({ title, description, actions, children, className, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        "rounded-2xl border border-ui-card-border bg-ui-card-bg p-5 lg:p-6",
        className,
      )}
      {...props}
    >
      {title || description || actions ? (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title ? (
              <h3 className="text-lg font-semibold text-ui-gray-800">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-ui-gray-500">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  ),
);
FormSection.displayName = "FormSection";

export const FormTwoColumn = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid grid-cols-1 gap-5 md:grid-cols-2", className)}
      {...props}
    />
  ),
);
FormTwoColumn.displayName = "FormTwoColumn";
