"use client";
// "use client" — FormField gera id via useId() para ligar Label↔input, evitando colisão SSR.

import { useId, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Label } from "./label.component";

export interface FormFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (props: { id: string; "aria-describedby"?: string }) => ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;
  const helperId = `${fieldId}-helper`;
  const showHelper = Boolean(error ?? hint);

  return (
    <div className={cn("flex flex-col", className)}>
      {label ? (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      ) : null}
      {children({
        id: fieldId,
        "aria-describedby": showHelper ? helperId : undefined,
      })}
      {showHelper ? (
        <p
          id={helperId}
          className={cn(
            "mt-1.5 text-xs",
            error ? "text-ui-error-500" : "text-ui-gray-500",
          )}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}
FormField.displayName = "FormField";
