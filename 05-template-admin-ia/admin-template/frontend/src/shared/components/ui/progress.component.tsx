import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const trackVariants = cva("w-full overflow-hidden rounded-full bg-ui-gray-100", {
  variants: {
    size: {
      sm: "h-1.5",
      md: "h-2",
      lg: "h-2.5",
    },
  },
  defaultVariants: { size: "md" },
});

const fillVariants = cva("h-full rounded-full transition-[width] duration-300", {
  variants: {
    variant: {
      primary: "bg-ui-brand-500",
      success: "bg-ui-success-500",
      error: "bg-ui-error-500",
      warning: "bg-ui-warning-500",
    },
  },
  defaultVariants: { variant: "primary" },
});

export interface ProgressProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof trackVariants>,
    VariantProps<typeof fillVariants> {
  value: number;
  max?: number;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value, max = 100, size, variant, ...props },
    ref,
  ) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(trackVariants({ size }), className)}
        {...props}
      >
        <div
          className={fillVariants({ variant })}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";
