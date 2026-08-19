import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface FormFooterProps extends HTMLAttributes<HTMLDivElement> {
  cancel?: ReactNode;
  submit?: ReactNode;
  sticky?: boolean;
}

export const FormFooter = forwardRef<HTMLDivElement, FormFooterProps>(
  ({ cancel, submit, sticky, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-3 border-t border-ui-card-border bg-ui-card-bg px-5 py-4 lg:px-6",
        sticky ? "sticky bottom-0 z-10" : "",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          {cancel}
          {submit}
        </>
      )}
    </div>
  ),
);
FormFooter.displayName = "FormFooter";
