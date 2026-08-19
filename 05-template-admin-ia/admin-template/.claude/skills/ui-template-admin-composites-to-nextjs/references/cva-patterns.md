# CVA patterns

Quando e como usar `class-variance-authority` em compostos.

## Quando usar

- ≥3 variantes em uma dimensão (ex.: `variant: default | featured | compact | minimal`).
- ≥2 dimensões variantes (ex.: `variant` + `size`).
- Estados visuais combinatórios (`variant` + `disabled` + `loading`).

## Quando NÃO usar

- 2 variantes simples (`variant="default" | "danger"`) → ternário direto:
  ```tsx
  className={cn(
    'base-classes',
    variant === 'danger' ? 'bg-ui-danger text-white' : 'bg-ui-primary text-white',
    className,
  )}
  ```
- Composto sem variantes (page-banner único) → classes diretas.

## Estrutura padrão

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

const statCardVariants = cva(
  // base — comum a todas variantes
  'flex flex-col gap-2 rounded-ui-card bg-ui-card-bg p-ui-card-py border border-ui-card-border transition-shadow',
  {
    variants: {
      variant: {
        default: 'shadow-uiCardElevation hover:shadow-uiCardElevationHover',
        accent:  'border-l-4 border-l-ui-primary',
        success: 'border-l-4 border-l-ui-success',
        danger:  'border-l-4 border-l-ui-danger',
      },
      size: {
        sm: 'p-3 text-sm',
        md: 'p-4',
        lg: 'p-6 text-lg',
      },
    },
    compoundVariants: [
      // se a combinação variant+size precisar de ajuste extra
      { variant: 'accent', size: 'lg', class: 'pl-7' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  label: string;
  value: string | number;
  delta?: { value: string; direction: 'up' | 'down' };
  icon?: React.ReactNode;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, variant, size, label, value, delta, icon, ...props }, ref) => (
    <div ref={ref} className={cn(statCardVariants({ variant, size }), className)} {...props}>
      {/* ... */}
    </div>
  ),
);
StatCard.displayName = 'StatCard';
```

## Princípios

1. **Base contém o que é comum a todas as variantes** — não repetir em cada variante.
2. **Variants resolvem diferenças paramétricas** — cor, padding, tamanho de fonte.
3. **CompoundVariants** apenas para combinações específicas que não cabem nas dimensões individuais.
4. **DefaultVariants** sempre presente — define a aparência sem props.
5. **Tipar props com `VariantProps<typeof variantsObj>`** — TS infere automaticamente as variantes.

## Como mapear variantes do template

Ao inspecionar o template:

- `.card` → variante padrão (`default`)
- `.card.card-featured` → variante `featured`
- `.card.card-compact` → ambíguo: pode ser `variant="compact"` OU `size="sm"`. Decidir lendo CSS:
  - Se a classe muda **só padding/margin/font-size** → `size`.
  - Se muda **cor de fundo, border, layout** → `variant`.

## Exporta

Sempre exportar `cva` schema também, caso outro composto consuma:

```ts
export { statCardVariants };
```

Útil quando um composto envolve outro e quer aplicar variantes consistentes.
