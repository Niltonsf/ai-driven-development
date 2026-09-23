'use client';

import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

type DataGeneratorQuantityRowProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Ceiling of the item, shown next to the quantity. */
  max: number;
  /** Registration of the quantity field in the generator form. */
  field: UseFormRegisterReturn;
  error?: string;
};

/**
 * One checklist item of a data generator: checkbox, quantity and ceiling. The
 * quantity is only disabled while unchecked, so it keeps the typed value.
 * Independent of any specific generator form (shared by both generator parts).
 */
export function DataGeneratorQuantityRow({
  label,
  checked,
  onCheckedChange,
  max,
  field,
  error,
}: DataGeneratorQuantityRowProps) {
  const checkboxId = useId();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-3">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(state) => onCheckedChange(state === true)}
          />
          <Label htmlFor={checkboxId}>{label}</Label>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            step={1}
            className="w-28"
            aria-label={`Quantidade de ${label.toLowerCase()}`}
            aria-invalid={checked && Boolean(error)}
            {...field}
            disabled={!checked}
          />
          <span className="w-16 text-xs text-muted-foreground">máx. {max}</span>
        </div>
      </div>

      {checked && error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </div>
  );
}
