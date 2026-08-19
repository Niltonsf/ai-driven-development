# Padrões CVA para os primitivos

Esqueletos de uso de `class-variance-authority` (CVA) que devem ser seguidos na Fase 4. Ajustar os valores ao que o template demonstra; não mudar a forma.

## Helper `cn`

Localização: `src/shared/utils/cn.ts`. Criar se não existir.

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Pattern básico: variant × size

```ts
import { cva, type VariantProps } from 'class-variance-authority';

const buttonStyles = cva(
  // base — classes que se aplicam a todas as combinações
  'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-ui ' +
    'focus-visible:outline-none focus-visible:shadow-uiFocus ' +
    'disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:   'bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover active:bg-ui-primary-active',
        secondary: 'bg-ui-secondary text-ui-secondary-fg hover:bg-ui-secondary-hover',
        outline:   'bg-transparent border border-ui-border text-ui-fg hover:bg-ui-surfaceMuted',
        ghost:     'bg-transparent text-ui-fg hover:bg-ui-surfaceMuted',
        danger:    'bg-ui-danger text-ui-danger-fg hover:bg-ui-danger-hover',
        // ... só listar variantes que o template demonstra
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-uiSm',
        md: 'h-10 px-4 text-sm rounded-uiMd',
        lg: 'h-12 px-6 text-base rounded-uiLg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonStyles>;
```

## Pattern: compoundVariants

Use quando uma combinação específica de variant+size precisa de override pontual:

```ts
compoundVariants: [
  // outline + sm tem padding ligeiramente diferente no template
  { variant: 'outline', size: 'sm', class: 'px-2.5' },
],
```

## Pattern: estado controlado por prop, fora do CVA

Estados como `loading`, `invalid`, `checked` que vêm de props diretas (não de variantes CVA) — aplicar via `cn()` lado a lado:

```tsx
className={cn(
  buttonStyles({ variant, size }),
  loading && 'cursor-wait',
  className,
)}
```

`className` da prop **sempre vem por último** no `cn()`, para que o consumidor possa sobrescrever quando necessário. `tailwind-merge` resolve conflitos.

## Pattern: forwardRef com VariantProps

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';
import { buttonStyles, type ButtonVariants } from './button.styles';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, disabled, children, ...props }, ref) => {
    return (
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
    );
  },
);

Button.displayName = 'Button';
```

> Observação: o exemplo usa um arquivo `.styles.ts` separado para o CVA — opcional. Para primitivos pequenos, manter CVA inline no `.component.tsx` é aceitável e geralmente preferível.

## Quando NÃO usar CVA

- Apenas 1 dimensão binária (ex.: `Divider` com `vertical: true|false`): ternário direto é mais simples.
- Componente sem variantes (ex.: `Spinner` com apenas `size`): usar map de string ou CVA — qualquer um. Preferir CVA quando ≥3 valores possíveis.

## Re-exports no `index.ts`

```ts
export { Button, type ButtonProps } from './button.component';
export { Input, type InputProps } from './input.component';
// ... uma linha por primitivo
```

Nomes em **PascalCase** para componentes; tipos `Props` exportados nomeados.
