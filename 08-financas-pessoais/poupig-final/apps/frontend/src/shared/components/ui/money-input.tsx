'use client';

import * as React from 'react';
import { Input, type InputProps } from '@/shared/components/ui/input';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Maximum typed digits (cents included), matching a `Decimal(14,2)` column. */
const MAX_DIGITS = 14;

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export type MoneyInputProps = Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'type'> & {
  /** Amount in reais. `undefined` renders an empty field. */
  value?: number;
  /** Emits the amount in reais, or `undefined` when the field is cleared. */
  onChange?: (value: number | undefined) => void;
};

function isDeletion(event: React.ChangeEvent<HTMLInputElement>): boolean {
  const nativeEvent = event.nativeEvent as InputEvent;
  return typeof nativeEvent.inputType === 'string' && nativeEvent.inputType.startsWith('delete');
}

/**
 * Typed digits are read as cents (`123456` → `1234.56`), so the mask never
 * depends on the cursor position or on the decimal separator.
 */
function parseTypedAmount(event: React.ChangeEvent<HTMLInputElement>): number | undefined {
  const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
  if (!digits) return undefined;

  const cents = Number(digits);
  if (cents === 0 && isDeletion(event)) return undefined;

  return cents / 100;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, placeholder = 'R$ 0,00', ...props }, ref) => {
    const displayValue = typeof value === 'number' && Number.isFinite(value) ? formatCurrency(value) : '';

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={displayValue}
        onChange={(event) => onChange?.(parseTypedAmount(event))}
      />
    );
  },
);
MoneyInput.displayName = 'MoneyInput';
