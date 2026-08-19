import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";
import { Spinner } from "./spinner.component";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition",
    "focus:outline-none focus:ring-3",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-ui-brand-500 text-white shadow-ui-xs hover:bg-ui-brand-600 focus:ring-ui-brand-500/20",
        secondary:
          "border border-ui-gray-300 bg-white text-ui-gray-700 shadow-ui-xs hover:bg-ui-gray-50 focus:ring-ui-brand-500/10",
        ghost:
          "bg-transparent text-ui-gray-700 hover:bg-ui-gray-100 focus:ring-ui-brand-500/10",
        destructive:
          "bg-ui-error-500 text-white shadow-ui-xs hover:bg-ui-error-600 focus:ring-ui-error-500/20",
        link:
          "bg-transparent text-ui-brand-500 underline underline-offset-2 hover:text-ui-brand-600 focus:ring-ui-brand-500/10",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      leadingIcon,
      trailingIcon,
      loading,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  ),
);
Button.displayName = "Button";
