# Radix integration patterns

Radix UI primitives **sem estilização** são a base para overlays. **Apenas** Radix é permitido como biblioteca de behavior. Estilização vem 100% de Tailwind + tokens do template.

## Pacotes permitidos

- `@radix-ui/react-dialog` — modal, drawer
- `@radix-ui/react-popover` — action-popover
- `@radix-ui/react-dropdown-menu` — action-menu, user-menu
- `@radix-ui/react-tooltip` — apenas se primitivo `Tooltip` ainda não existir; tipicamente já criado pela skill de primitivos
- `@radix-ui/react-tabs` — tabs (justificar uso vs nativo)

Instalar **apenas** os pacotes efetivamente usados pelos compostos identificados na Fase 1.

## Padrão de animação via `data-state`

Radix expõe `data-state="open"` e `data-state="closed"` em seus elementos. Use Tailwind para aplicar animações condicionalmente:

```tsx
<Dialog.Overlay
  className={cn(
    'fixed inset-0 z-50 bg-ui-modal-overlay',
    'data-[state=open]:animate-uiOverlayShow',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
  )}
/>
```

## Modal (`@radix-ui/react-dialog`)

```tsx
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

const Modal = Dialog.Root;
const ModalTrigger = Dialog.Trigger;
const ModalClose = Dialog.Close;

const ModalPortal = ({ children }: { children: ReactNode }) => (
  <Dialog.Portal>{children}</Dialog.Portal>
);

const ModalOverlay = forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-ui-modal-overlay',
      'data-[state=open]:animate-uiOverlayShow',
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = 'ModalOverlay';

const ModalContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(({ className, children, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <Dialog.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'bg-ui-modal-contentBg rounded-ui-card shadow-uiModalContent',
        'data-[state=open]:animate-uiContentShow',
        className,
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  </ModalPortal>
));
ModalContent.displayName = 'ModalContent';

// ModalHeader, ModalBody, ModalFooter — divs simples com tokens do template
// ModalTitle = Dialog.Title estilizado; ModalDescription = Dialog.Description estilizado

export const ModalCompound = Object.assign(Modal, {
  Trigger: ModalTrigger,
  Close: ModalClose,
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Title: ModalTitle,
  Description: ModalDescription,
});
```

Exportar como `Modal` no `index.ts`.

## Drawer (mesma base, animação lateral)

`Dialog.Root` + `Dialog.Content` com classes de animação `data-[state=open]:animate-uiDrawerSlideInRight`. Variantes `direction="left|right"` via CVA.

## Popover (`@radix-ui/react-popover`)

```tsx
<Popover.Root>
  <Popover.Trigger asChild>{trigger}</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      sideOffset={8}
      className="z-50 rounded-ui bg-white shadow-uiPopover p-3 data-[state=open]:animate-uiContentShow"
    >
      {children}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

## Dropdown menu (`@radix-ui/react-dropdown-menu`)

`DropdownMenu.Root` + `Trigger` (`asChild` para envolver `IconButton` primitivo) + `Portal` + `Content` + `Item`/`Separator`/`Label`/`CheckboxItem`/`RadioItem`/`Group`. Estilizar `Item` com `data-[highlighted]:bg-...` para hover.

## Confirm-modal (variante simples)

Não é um Radix novo — é uma API simples sobre `Modal`:

```tsx
'use client';
export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
}

export function ConfirmModal({ open, onOpenChange, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default', onConfirm }: ConfirmModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <Modal.Header><Modal.Title>{title}</Modal.Title></Modal.Header>
        {description && <Modal.Body><Modal.Description>{description}</Modal.Description></Modal.Body>}
        <Modal.Footer>
          <Modal.Close asChild><Button variant="ghost">{cancelLabel}</Button></Modal.Close>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
```

## Acessibilidade

Radix entrega gratuitamente:

- Foco gerenciado (autofocus no primeiro elemento focável; restauração ao fechar).
- Trap de foco em `Dialog`.
- `Esc` fecha overlay.
- `aria-*` corretos (role dialog, aria-labelledby, aria-describedby).

**Não tentar reimplementar.** Se precisar customizar foco, usar `onOpenAutoFocus` / `onCloseAutoFocus` props.

## Bandeiras vermelhas

- Importar `Dialog` direto do Radix em uma página (não — usar o composto `Modal` exposto por esta skill).
- Esquecer de envolver `Trigger` com `asChild` ao usar `IconButton`/`Button` primitivos (gera botão duplo).
- Estilizar `Trigger` quando ele é `asChild` (estilizar o filho).
- Hardcode de `z-index` arbitrário — usar `z-50` do Tailwind (ou o que o template estabelecer como camada de overlay).
