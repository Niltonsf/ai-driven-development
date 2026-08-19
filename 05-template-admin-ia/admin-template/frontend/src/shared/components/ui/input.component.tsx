import { forwardRef, type InputHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const inputVariants = cva(
  [
    "h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-ui-gray-800",
    "placeholder:text-ui-gray-400 shadow-ui-xs",
    "focus:ring-3 focus:outline-none",
    "disabled:border-ui-gray-100 disabled:bg-ui-gray-50 disabled:placeholder:text-ui-gray-300 disabled:cursor-not-allowed",
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

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, state, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={state === "error" ? true : undefined}
      className={cn(inputVariants({ state }), className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
