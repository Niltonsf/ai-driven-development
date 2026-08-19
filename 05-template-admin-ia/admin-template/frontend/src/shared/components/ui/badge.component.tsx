import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium",
  {
    variants: {
      variant: {
        primary: "bg-ui-brand-50 text-ui-brand-500",
        success: "bg-ui-success-50 text-ui-success-600",
        error: "bg-ui-error-50 text-ui-error-600",
        warning: "bg-ui-warning-50 text-ui-warning-600",
        gray: "bg-ui-gray-100 text-ui-gray-700",
      },
      size: {
        sm: "py-0.5 px-2 text-xs",
        md: "py-0.5 pl-2 pr-2.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
