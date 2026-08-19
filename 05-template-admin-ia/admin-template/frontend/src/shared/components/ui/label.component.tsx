import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "mb-1.5 block text-sm font-medium text-ui-gray-700",
        className,
      )}
      {...props}
    >
      {children}
      {required ? <span className="ml-0.5 text-ui-error-500">*</span> : null}
    </label>
  ),
);
Label.displayName = "Label";
