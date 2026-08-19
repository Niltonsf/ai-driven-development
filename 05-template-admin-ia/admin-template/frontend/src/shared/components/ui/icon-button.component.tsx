import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const iconButtonVariants = cva(
  [
    "inline-flex items-center justify-center rounded-full transition-colors",
    "focus:outline-none focus:ring-3",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border border-ui-gray-200 bg-white text-ui-gray-500 hover:bg-ui-gray-100 hover:text-ui-gray-700 focus:ring-ui-brand-500/10",
        ghost:
          "bg-transparent text-ui-gray-500 hover:bg-ui-gray-100 hover:text-ui-gray-700 focus:ring-ui-brand-500/10",
        primary:
          "bg-ui-brand-500 text-white hover:bg-ui-brand-600 focus:ring-ui-brand-500/20",
      },
      size: {
        sm: "h-9 w-9",
        md: "h-11 w-11",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string;
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, icon, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {icon}
    </button>
  ),
);
IconButton.displayName = "IconButton";
