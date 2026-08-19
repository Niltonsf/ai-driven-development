"use client";
// "use client" — Switch usa useId() para vincular input oculto ao label/track sem colisão.

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, disabled, checked, defaultChecked, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "group inline-flex cursor-pointer items-center gap-3 text-sm font-medium select-none",
          disabled ? "text-ui-gray-400 cursor-not-allowed" : "text-ui-gray-700",
          className,
        )}
      >
        <span className="relative">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer sr-only"
            disabled={disabled}
            checked={checked}
            defaultChecked={defaultChecked}
            {...props}
          />
          <span
            className={cn(
              "block h-6 w-11 rounded-full transition-colors duration-200",
              disabled
                ? "bg-ui-gray-100 peer-checked:bg-ui-brand-500/60"
                : "bg-ui-gray-200 peer-checked:bg-ui-brand-500",
            )}
          />
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full shadow-ui-sm duration-300 ease-linear",
              disabled ? "bg-ui-gray-50" : "bg-white",
              "peer-checked:translate-x-full",
            )}
          />
        </span>
        {label}
      </label>
    );
  },
);
Switch.displayName = "Switch";
