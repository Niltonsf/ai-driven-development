# Snippets de referência por primitivo

Esqueletos para a Fase 4. Os valores exatos de classes/tokens vêm da Fase 2. Manter a forma; ajustar variantes/tamanhos/estados ao que o template demonstra.

Todos os componentes usam:
- `import { cn } from '@/shared/utils/cn'`
- `import { cva, type VariantProps } from 'class-variance-authority'` quando aplicável
- `forwardRef` em primitivos interativos
- `displayName`

## Button

```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { Spinner } from './spinner.component';

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-ui focus-visible:outline-none focus-visible:shadow-uiFocus disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover active:bg-ui-primary-active',
        secondary: 'bg-ui-secondary text-ui-secondary-fg hover:bg-ui-secondary-hover',
        outline: 'border border-ui-border bg-transparent text-ui-fg hover:bg-ui-surfaceMuted',
        ghost: 'bg-transparent text-ui-fg hover:bg-ui-surfaceMuted',
        danger: 'bg-ui-danger text-ui-danger-fg hover:bg-ui-danger-hover',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-uiSm',
        md: 'h-10 px-4 text-sm rounded-uiMd',
        lg: 'h-12 px-6 text-base rounded-uiLg',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = 'Button';
```

## IconButton (apenas se distinto de Button)

```tsx
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonStyles> {
  'aria-label': string; // obrigatório — sem texto visível
}
```

## Input

```tsx
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const inputStyles = cva(
  'block w-full bg-ui-input-bg text-ui-input-fg placeholder:text-ui-input-placeholder border transition-colors duration-ui focus-visible:outline-none disabled:bg-ui-input-disabledBg disabled:text-ui-input-disabledFg',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-sm rounded-uiSm',
        md: 'h-10 px-3 text-sm rounded-uiMd',
        lg: 'h-12 px-4 text-base rounded-uiLg',
      },
      invalid: {
        true: 'border-ui-input-borderError focus-visible:shadow-uiFocusError',
        false: 'border-ui-input-border hover:border-ui-input-borderHover focus-visible:border-ui-input-borderFocus focus-visible:shadow-uiFocus',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputStyles> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, leftIcon, rightIcon, ...props }, ref) => {
    if (!leftIcon && !rightIcon) {
      return (
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(inputStyles({ size, invalid }), className)}
          {...props}
        />
      );
    }
    return (
      <div className={cn('relative', className)}>
        {leftIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ui-fgMuted">{leftIcon}</span>}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(inputStyles({ size, invalid }), leftIcon && 'pl-10', rightIcon && 'pr-10')}
          {...props}
        />
        {rightIcon && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ui-fgMuted">{rightIcon}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';
```

## Textarea

Mesma forma de Input, sem ícones, base `<textarea>`. `min-h` por size, `py-*` em vez de `h-*`.

## Label

```tsx
import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label ref={ref} className={cn('text-sm font-medium text-ui-fg', className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-ui-danger">*</span>}
    </label>
  ),
);
Label.displayName = 'Label';
```

## FormField

```tsx
'use client';
// useId para garantir vínculo label/control sem prop manual

import { useId, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { Label } from './label.component';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
}

export function FormField({ label, required, helperText, error, className, children }: FormFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : helperText ? helpId : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': !!error || undefined })}
      {error ? (
        <p id={errorId} className="text-xs text-ui-danger">{error}</p>
      ) : helperText ? (
        <p id={helpId} className="text-xs text-ui-fgMuted">{helperText}</p>
      ) : null}
    </div>
  );
}
```

## Checkbox / Radio

`<input type="checkbox|radio">` nativo + utilities. `accent-ui-primary` é o atalho mais simples; se o template tem visual customizado (caixa estilizada, check com SVG), usar `appearance-none` + `peer` e estado via `peer-checked:`.

## Switch

Usar input checkbox + estilização visual (knob via `::after`/peer). Componente client (`useId`).

## Select (nativo)

```tsx
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const selectStyles = cva(
  'block w-full bg-ui-input-bg text-ui-input-fg border appearance-none bg-no-repeat pr-10 transition-colors duration-ui focus-visible:outline-none disabled:bg-ui-input-disabledBg',
  {
    variants: {
      size: {
        sm: 'h-8 pl-2.5 text-sm rounded-uiSm',
        md: 'h-10 pl-3 text-sm rounded-uiMd',
        lg: 'h-12 pl-4 text-base rounded-uiLg',
      },
      invalid: {
        true: 'border-ui-input-borderError',
        false: 'border-ui-input-border focus-visible:border-ui-input-borderFocus',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
);

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectStyles> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size, invalid, children, ...props }, ref) => (
    <select ref={ref} aria-invalid={invalid || undefined} className={cn(selectStyles({ size, invalid }), className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
```

> Para Select custom (Radix), criar `select/select.component.tsx` em pasta dedicada e justificar `"use client"` no topo.

## Badge

```tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const badgeStyles = cva(
  'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-ui-primary-soft text-ui-primary-softFg',
        success: 'bg-ui-success-soft text-ui-success-softFg',
        danger:  'bg-ui-danger-soft text-ui-danger-softFg',
        warning: 'bg-ui-warning-soft text-ui-warning-softFg',
        info:    'bg-ui-info-soft text-ui-info-softFg',
        neutral: 'bg-ui-surfaceMuted text-ui-fgMuted',
      },
      shape: {
        pill:   'rounded-uiFull',
        square: 'rounded-uiSm',
      },
    },
    defaultVariants: { variant: 'neutral', shape: 'pill' },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeStyles> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, shape, ...props }, ref) => (
    <span ref={ref} className={cn(badgeStyles({ variant, shape }), className)} {...props} />
  ),
);
Badge.displayName = 'Badge';
```

## Alert

```tsx
'use client';
// estado local: dismissible

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const alertStyles = cva(
  'flex gap-3 px-4 py-3 rounded-uiMd border',
  {
    variants: {
      variant: {
        info:    'bg-ui-info-soft text-ui-info-softFg border-ui-info/30',
        success: 'bg-ui-success-soft text-ui-success-softFg border-ui-success/30',
        warning: 'bg-ui-warning-soft text-ui-warning-softFg border-ui-warning/30',
        error:   'bg-ui-danger-soft text-ui-danger-softFg border-ui-danger/30',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertStyles> {
  title?: string;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, icon, dismissible, onDismiss, children, ...props }, ref) => {
    const [open, setOpen] = useState(true);
    if (!open) return null;
    return (
      <div ref={ref} role="alert" className={cn(alertStyles({ variant }), className)} {...props}>
        {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
        <div className="flex-1">
          {title && <p className="font-medium">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => { setOpen(false); onDismiss?.(); }}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    );
  },
);
Alert.displayName = 'Alert';
```

## Avatar

```tsx
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof avatarStyles> {
  src?: string;
  alt?: string;
  fallback?: string; // iniciais
  status?: 'online' | 'offline' | 'busy' | 'away';
}
```

Implementação: se `src`, renderizar `<img>` com `onError` que esconde e mostra fallback. Status indicator é um `<span>` posicionado absoluto.

## Spinner

`<span>` com `animate-spin`, `aria-label="Carregando"`, `role="status"`. Variantes de tamanho via `w-* h-*`. Sem `forwardRef` necessário (não interativo).

## Progress

`<div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>` com filho de largura `style={{ width: \`${value}%\` }}`. Variante indeterminate: animação CSS via `animate-` (Tailwind keyframe — adicionar em `globals.css` se não couber em utility).

## Tooltip (Radix)

```tsx
'use client';
// Radix Tooltip — comportamento de show/hide e posicionamento

import * as Tooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function TooltipPrimitive({ content, children, side = 'top', className }: TooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={6}
            className={cn('px-2 py-1 text-xs rounded-uiSm bg-ui-fg text-ui-surface shadow-uiSm', className)}
          >
            {content}
            <Tooltip.Arrow className="fill-ui-fg" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
```

Instalar `@radix-ui/react-tooltip` apenas se Tooltip for incluído.

## Divider

```tsx
import { type HTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({ className, orientation = 'horizontal', ...props }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'bg-ui-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className,
      )}
      {...props}
    />
  );
}
```

## index.ts

```ts
export { Button, type ButtonProps } from './button.component';
export { Input, type InputProps } from './input.component';
export { Textarea, type TextareaProps } from './textarea.component';
export { Label, type LabelProps } from './label.component';
export { FormField, type FormFieldProps } from './form-field.component';
export { Select, type SelectProps } from './select.component';
export { Checkbox, type CheckboxProps } from './checkbox.component';
export { Radio, type RadioProps } from './radio.component';
export { Switch, type SwitchProps } from './switch.component';
export { Badge, type BadgeProps } from './badge.component';
export { Avatar, type AvatarProps } from './avatar.component';
export { Alert, type AlertProps } from './alert.component';
export { Divider, type DividerProps } from './divider.component';
export { Spinner, type SpinnerProps } from './spinner.component';
export { Progress, type ProgressProps } from './progress.component';
// adicionar somente os que foram gerados
```
