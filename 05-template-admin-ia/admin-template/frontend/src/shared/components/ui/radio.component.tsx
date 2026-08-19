import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="radio"
      className={cn(
        "h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border border-ui-gray-300 bg-white",
        "checked:border-ui-brand-500",
        "checked:bg-[radial-gradient(circle,_var(--color-ui-brand-500)_0_30%,_transparent_35%)]",
        "focus:outline-none focus:ring-3 focus:ring-ui-brand-500/10",
        "disabled:cursor-not-allowed disabled:bg-ui-gray-100 disabled:border-ui-gray-200",
        className,
      )}
      {...props}
    />
  ),
);
Radio.displayName = "Radio";
