import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-ui-gray-300 bg-white",
        "checked:border-ui-brand-500 checked:bg-ui-brand-500",
        "checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2014%2014%22%20fill=%22none%22><path%20d=%22M11.6666%203.5L5.24992%209.91667L2.33325%207%22%20stroke=%22white%22%20stroke-width=%221.94437%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/></svg>')] checked:bg-center checked:bg-no-repeat",
        "focus:outline-none focus:ring-3 focus:ring-ui-brand-500/10",
        "disabled:cursor-not-allowed disabled:bg-ui-gray-100 disabled:border-ui-gray-200 disabled:checked:bg-ui-gray-200",
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";
