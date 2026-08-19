# Component templates (esqueletos)

Snippets-base por categoria. **Não copiar literal** — preencher cada placeholder com tokens reais do template e ajustar estrutura JSX para refletir o HTML original.

---

## breadcrumb

```tsx
import { forwardRef } from 'react';
import { ChevronRight } from 'lucide-react'; // usar a biblioteca já instalada
import { cn } from '@/shared/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, separator = <ChevronRight className="h-3.5 w-3.5 text-ui-breadcrumb-separator" />, className, ...props }, ref) => (
    <nav ref={ref} aria-label="Breadcrumb" className={cn('flex items-center', className)} {...props}>
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <a href={item.href} className="text-ui-breadcrumb-link hover:underline">{item.label}</a>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-ui-breadcrumb-activeText font-medium' : 'text-ui-breadcrumb-link'}>
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden>{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  ),
);
Breadcrumb.displayName = 'Breadcrumb';
```

---

## page-header (consome breadcrumb)

```tsx
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-2 pb-6 border-b border-ui-card-border', className)}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ui-fg">{title}</h1>
          {subtitle && <p className="text-sm text-ui-fg-muted mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
```

**Atenção**: a estrutura acima é genérica. Se o template tem o breadcrumb à direita do título (e não acima), reorganizar.

---

## card (compound)

```tsx
const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-ui-card bg-ui-card-bg border border-ui-card-border shadow-uiCardElevation', className)} {...props} />
  ),
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-ui-card-px py-ui-card-py border-b border-ui-card-border bg-ui-card-headerBg', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

// CardBody, CardFooter — análogos

export const CardCompound = Object.assign(Card, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
```

---

## stat-card (CVA)

Ver `cva-patterns.md`.

---

## empty-state

```tsx
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {icon && <div className="text-ui-emptyState-icon mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-ui-emptyState-title">{title}</h3>
      {description && <p className="text-sm text-ui-emptyState-description mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

`error-state`: similar, com `role="alert"` e `Button` retry.

---

## loading-skeleton

```tsx
const skeletonVariants = cva('animate-pulse bg-ui-card-border rounded', {
  variants: {
    variant: {
      text:   'h-4 w-full',
      title:  'h-6 w-3/4',
      avatar: 'h-10 w-10 rounded-full',
      image:  'h-32 w-full',
    },
  },
  defaultVariants: { variant: 'text' },
});

export const Skeleton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="status" aria-live="polite" className={cn(skeletonVariants({ variant }), className)} {...props} />
  ),
);
Skeleton.displayName = 'Skeleton';
```

---

## pagination

```tsx
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  variant?: 'numeric' | 'arrows-only' | 'select-only';
}
```

Renderizar 3 layouts via switch. Reusa `Button`/`IconButton`/`Select` primitivos.

---

## data-table (genérica)

```tsx
'use client';
import { type ReactNode } from 'react';

export interface DataTableColumn<TData> {
  key: keyof TData | string;
  header: ReactNode;
  cell?: (row: TData) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  rowKey: (row: TData) => string;
  selection?: { selected: string[]; onChange: (ids: string[]) => void };
  sort?: { key: string; direction: 'asc' | 'desc' };
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  empty?: ReactNode;
  loading?: boolean;
}

export function DataTable<TData>({ columns, data, rowKey, ...rest }: DataTableProps<TData>) {
  // header com ordenação UI-only (callback)
  // linhas com checkbox de seleção (consome Checkbox primitivo)
  // empty slot quando data.length === 0
  // loading: substitui linhas por Skeleton
  // Subcomponentes DataTable.Toolbar, DataTable.Empty expostos
}
```

**Sem fetch, sem state interno de dados.** Recebe tudo via props.

---

## modal/drawer/popover/dropdown

Ver `radix-integration-patterns.md`.

---

## file-upload

```tsx
'use client';
export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onFiles: (files: File[]) => void;
  files?: { file: File; progress?: number }[];
  onRemove?: (file: File) => void;
}
```

Drag & drop nativo via `onDragEnter/Over/Leave/Drop` em wrapper com `<input type="file" hidden>`. Listagem de arquivos consome `Progress` primitivo + `IconButton` para remove.

---

## stepper

```tsx
export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;       // controlado externamente
  orientation?: 'horizontal' | 'vertical';
}
```

Bolinha numerada (ou check para passos completos), conector entre passos, cor diferente para passo atual / anteriores / posteriores.

---

## Compostos descobertos

Mesmo padrão estrutural — extrair classe-raiz, identificar variantes via CVA quando aplicável, consumir primitivos onde houver botão/badge/avatar/input.

Exemplo `pricing-card`:

```tsx
const pricingCardVariants = cva('rounded-ui-card border p-6 flex flex-col gap-4', {
  variants: {
    variant: {
      default:  'bg-ui-card-bg border-ui-card-border',
      featured: 'bg-ui-pricingCard-featuredBg text-ui-pricingCard-featuredText border-ui-pricingCard-featuredRing ring-2 ring-ui-pricingCard-featuredRing',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface PricingCardProps extends VariantProps<typeof pricingCardVariants> {
  planName: string;
  price: string;
  period?: string;
  features: string[];
  ctaLabel: string;
  onCtaClick?: () => void;
}
```

Sempre derivar do HTML real do template.
