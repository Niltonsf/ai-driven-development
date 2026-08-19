# Sonner integration (toast)

`sonner` é a fila de toasts. **Não implementar fila própria.** Esta skill apenas:

1. Instala `sonner`.
2. Cria um wrapper `<Toaster />` configurado com tokens visuais do template (cores, ícones, posição, duração).
3. Expõe helpers `showToast.success/.error/.warning/.info` que delegam para `toast()` do sonner.
4. Registra `<Toaster />` em `src/app/layout.tsx` — única alteração permitida no layout root.

## Instalação

Apenas se a Fase 1 identificou padrão de toast no template.

```bash
npm install sonner
```

Perguntar uma vez na Fase 3 se o usuário prefere `react-hot-toast` em vez de `sonner` — caso afirmativo, adaptar API equivalente.

## Estrutura de arquivos

Seguir convenção de nomenclatura dos primitivos. Tipicamente:

```
src/shared/components/ui/toast/
├── toaster.component.tsx      # <Toaster /> configurado
├── show-toast.ts              # helpers showToast.success/.error/.warning/.info
└── index.ts                   # re-exports
```

## `toaster.component.tsx`

```tsx
'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"            // ler do template
      duration={4000}                  // ler do template
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-ui shadow-uiPopover bg-white border border-ui-card-border',
          title: 'text-sm font-medium text-ui-fg',
          description: 'text-sm text-ui-fg-muted',
          actionButton: 'bg-ui-primary text-white rounded',
          cancelButton: 'bg-transparent text-ui-fg-muted',
          success: 'border-l-4 border-l-ui-success',
          error: 'border-l-4 border-l-ui-danger',
          warning: 'border-l-4 border-l-ui-warning',
          info: 'border-l-4 border-l-ui-info',
        },
      }}
    />
  );
}
```

**Os valores acima (position, duration, classes) são extraídos do CSS/JS do template original.** Se o template mostra toasts no canto inferior direito com 5s de duração e ícones FA, replicar.

## `show-toast.ts`

```ts
import { toast } from 'sonner';

export const showToast = {
  success: (message: string, opts?: { description?: string; duration?: number }) =>
    toast.success(message, opts),
  error: (message: string, opts?: { description?: string; duration?: number }) =>
    toast.error(message, opts),
  warning: (message: string, opts?: { description?: string; duration?: number }) =>
    toast.warning(message, opts),
  info: (message: string, opts?: { description?: string; duration?: number }) =>
    toast.info(message, opts),
  custom: toast,                       // escape hatch
  dismiss: toast.dismiss,
};
```

## Registro em `layout.tsx`

Única alteração permitida no layout root. Inserir `<Toaster />` no final do `<body>`, após o conteúdo principal:

```tsx
import { Toaster } from '@/shared/components/ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="...">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

Se o `layout.tsx` já tem outros providers (theme-runtime, etc.), inserir `<Toaster />` dentro deles, sempre como filho direto de `<body>` ou similar — sem alterar a estrutura existente.

## Ícones

Usar a mesma biblioteca já instalada. `sonner` aceita ícones custom via `icons` prop em `<Toaster>`. Se o template usa Font Awesome, passar componentes FA equivalentes.

## Fidelidade

- Posição: ler do JS/CSS do template (`.toast-container.top-right` etc.).
- Cores de borda lateral por severidade: do template.
- Duração: do template (ou padrão 4000ms se não evidente).
- Ícones: da biblioteca já instalada.
- Fonte e padding: tokens `ui.*`.

## Não fazer

- Não criar `<ToastProvider>` próprio com `useState`.
- Não usar Radix Toast (usar sonner mesmo — escolha desta skill).
- Não chamar `toast()` direto em consumidores — sempre via `showToast.*` para futuro refactor.
