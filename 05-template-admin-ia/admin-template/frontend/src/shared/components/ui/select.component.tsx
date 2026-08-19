import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const selectVariants = cva(
  [
    "h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm text-ui-gray-800",
    "placeholder:text-ui-gray-400 shadow-ui-xs",
    "focus:ring-3 focus:outline-none",
    "disabled:border-ui-gray-100 disabled:bg-ui-gray-50 disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      state: {
        default:
          "border-ui-gray-300 focus:border-ui-brand-300 focus:ring-ui-brand-500/10",
        error:
          "border-ui-error-300 focus:border-ui-error-300 focus:ring-ui-error-500/10",
        success:
          "border-ui-success-300 focus:border-ui-success-300 focus:ring-ui-success-500/10",
      },
    },
    defaultVariants: { state: "default" },
  },
);

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, state, children, ...props }, ref) => (
    <span className="relative inline-block w-full">
      <select
        ref={ref}
        aria-invalid={state === "error" ? true : undefined}
        className={cn(selectVariants({ state }), className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-gray-500"
      />
    </span>
  ),
);
Select.displayName = "Select";
