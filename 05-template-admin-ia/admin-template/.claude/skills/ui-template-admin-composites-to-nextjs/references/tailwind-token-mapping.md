# Tailwind token mapping (Fase 2)

Esta skill **expande** o namespace `ui.*` criado pela skill de primitivos. Não cria namespace novo (`composites.*` seria errado — compostos vivem na mesma pasta dos primitivos).

## Princípios

1. **Reutilizar antes de criar**. Cores semânticas (`ui.danger`, `ui.success`, `ui.warning`, `ui.primary`), focus rings, raios padrão e sombras genéricas já estão em `ui.*`. Não duplicar.
2. **Subgrupos semânticos por composto** quando o token é específico do composto: `ui.card.*`, `ui.modal.*`, `ui.table.*`, `ui.breadcrumb.*`, `ui.pricingCard.*`.
3. **Valores literais do template** — nunca aproximar. Se o template tem `padding: 1.125rem`, criar token com esse valor.
4. **Regras impossíveis em Tailwind** (ex.: scrollbar custom de drawer, animações com múltiplos keyframes complexos) vão para `globals.css` em `@layer utilities`.

## Onde adicionar

`tailwind.config.{ts,js}` → `theme.extend`:

```ts
theme: {
  extend: {
    colors: {
      ui: {
        // ... tokens existentes preservados
        card: {
          bg: '#ffffff',
          border: '#e5e7eb',
          headerBg: '#f9fafb',
          footerBg: '#fafbfc',
        },
        modal: {
          overlay: 'rgba(15, 23, 42, 0.6)',
          contentBg: '#ffffff',
          headerBorder: '#e5e7eb',
        },
        table: {
          headerBg: '#f9fafb',
          headerText: '#475569',
          rowHover: '#f3f4f6',
          divider: '#e5e7eb',
        },
        breadcrumb: {
          separator: '#94a3b8',
          link: '#475569',
          activeText: '#0f172a',
        },
        emptyState: {
          icon: '#cbd5e1',
          title: '#0f172a',
          description: '#64748b',
        },
        // tokens de descobertos:
        pricingCard: {
          featuredBg: '#1e3a8a',
          featuredText: '#ffffff',
          featuredRing: '#3b82f6',
        },
        notificationItem: {
          unreadIndicator: '#3b82f6',
          unreadBg: '#eff6ff',
        },
      }
    },
    boxShadow: {
      uiCardElevation: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      uiCardElevationHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      uiModalContent: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      uiPopover: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    spacing: {
      // valores específicos do template não-padrão
      'ui-card-px': '1.5rem',
      'ui-card-py': '1.125rem',
    },
    transitionTimingFunction: {
      uiModalEnter: 'cubic-bezier(0.16, 1, 0.3, 1)',
      uiModalExit: 'cubic-bezier(0.7, 0, 0.84, 0)',
    },
    keyframes: {
      uiOverlayShow: {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
      uiContentShow: {
        from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
        to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
      },
      uiDrawerSlideInRight: {
        from: { transform: 'translateX(100%)' },
        to: { transform: 'translateX(0)' },
      },
      uiToastSlideIn: {
        from: { transform: 'translateY(-100%)', opacity: '0' },
        to: { transform: 'translateY(0)', opacity: '1' },
      },
    },
    animation: {
      uiOverlayShow: 'uiOverlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      uiContentShow: 'uiContentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      uiDrawerSlideInRight: 'uiDrawerSlideInRight 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      uiToastSlideIn: 'uiToastSlideIn 150ms ease-out',
    },
  }
}
```

## Como nomear

- Subgrupo = nome do composto em camelCase: `ui.statCard`, `ui.dataTable`, `ui.commandPalette`.
- Para descobertos, mesmo padrão: `ui.pricingCard`, `ui.notificationItem`, `ui.kanbanCard`.
- Variantes coloridas que reutilizam paleta semântica reaproveitam os tokens existentes — não criar `ui.statCard.dangerBg` se já existe `ui.danger`.

## Quando ir para `globals.css`

Apenas para o que Tailwind genuinamente não cobre via utilities + theme:

- Scrollbar custom de drawer: `.ui-drawer-scroll::-webkit-scrollbar { ... }`
- `@font-face` adicional (improvável — geralmente já posto pela skill de design system).
- Pseudo-elementos com conteúdo dinâmico: `.ui-breadcrumb-separator::before { content: '/'; }` (geralmente substituído por ícone JSX, evitar).

Manter ao mínimo. Cada regra em `globals.css` requer justificativa.

## Verificação

Após patch:
1. `npm run build` — Tailwind compila sem warnings.
2. Inspecionar uma classe gerada (ex.: `bg-ui-card-bg`) e confirmar que resolve para o valor literal do token.
3. Conferir que nenhum token foi sobrescrito por engano (ex.: `ui.danger` redefinido).
