import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-6 w-6 border-[3px]",
} as const;

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent text-ui-gray-400",
        sizeMap[size],
        className,
      )}
      {...props}
    />
  ),
);
Spinner.displayName = "Spinner";
