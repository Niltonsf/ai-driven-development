"use client";

import { forwardRef, useState, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string>
  extends Omit<ButtonHTMLAttributes<HTMLDivElement>, "value" | "defaultValue" | "onChange"> {
  options: SegmentedOption<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "h-8 text-xs px-3",
  md: "h-10 text-sm px-4",
};

function SegmentedControlInner<T extends string = string>(
  { options, value, defaultValue, onValueChange, size = "md", className, ...props }: SegmentedControlProps<T>,
  ref: React.Ref<HTMLDivElement>,
) {
  const [internal, setInternal] = useState<T | undefined>(defaultValue ?? options[0]?.value);
  const current = value ?? internal;
  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-ui-segmented-bg p-1",
        className,
      )}
      {...props}
    >
      {options.map((opt) => {
        const active = opt.value === current;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (value === undefined) setInternal(opt.value);
              onValueChange?.(opt.value);
            }}
            className={cn(
              "inline-flex items-center justify-center rounded-md font-medium transition",
              sizeClasses[size],
              active
                ? "bg-ui-segmented-itemActiveBg text-ui-segmented-itemActiveFg shadow-ui-xs"
                : "bg-transparent text-ui-segmented-itemFg hover:text-ui-segmented-itemActiveFg",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedControl = forwardRef(SegmentedControlInner) as <T extends string = string>(
  props: SegmentedControlProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof SegmentedControlInner>;
