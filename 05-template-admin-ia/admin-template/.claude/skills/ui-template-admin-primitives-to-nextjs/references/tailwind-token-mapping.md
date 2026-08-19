# Mapeamento CSS do template → tokens Tailwind sob namespace `ui`

Como traduzir o CSS extraído na Fase 2 para `tailwind.config`.

## Princípio

- **Namespace dedicado**: tudo vai sob `theme.extend.colors.ui`, `theme.extend.borderRadius.ui*`, `theme.extend.boxShadow.ui*`, etc. Nunca sobrescrever tokens default do Tailwind, nunca colidir com namespaces de outras skills do projeto.
- **Valores exatos**: copiar os valores de cores/medidas do CSS do template literalmente. Não arredondar. Não aproximar para a escala Tailwind.
- **Mínimo necessário**: só adicionar token se o primitivo for usá-lo. Sem speculative tokens.

## Estrutura do patch

```ts
// tailwind.config.ts (excerto)
export default {
  // ... config existente
  theme: {
    extend: {
      colors: {
        ui: {
          // Por variante de Button/Badge/Alert
          primary:   { DEFAULT: '#3b82f6', hover: '#2563eb', active: '#1d4ed8', fg: '#ffffff', soft: '#dbeafe', softFg: '#1e40af' },
          secondary: { DEFAULT: '#6b7280', hover: '#4b5563', active: '#374151', fg: '#ffffff' },
          danger:    { DEFAULT: '#ef4444', hover: '#dc2626', active: '#b91c1c', fg: '#ffffff', soft: '#fee2e2', softFg: '#991b1b' },
          success:   { DEFAULT: '#22c55e', hover: '#16a34a', active: '#15803d', fg: '#ffffff', soft: '#dcfce7', softFg: '#166534' },
          warning:   { DEFAULT: '#f59e0b', hover: '#d97706', active: '#b45309', fg: '#ffffff', soft: '#fef3c7', softFg: '#92400e' },
          info:      { DEFAULT: '#06b6d4', hover: '#0891b2', active: '#0e7490', fg: '#ffffff', soft: '#cffafe', softFg: '#155e75' },

          // Form controls
          input: {
            bg:           '#ffffff',
            border:       '#d1d5db',
            borderHover:  '#9ca3af',
            borderFocus:  '#3b82f6',
            borderError:  '#ef4444',
            placeholder:  '#9ca3af',
            disabledBg:   '#f3f4f6',
            disabledFg:   '#9ca3af',
            fg:           '#111827',
          },

          // Texto/superfícies neutras usadas pelos primitivos
          surface:     '#ffffff',
          surfaceMuted:'#f9fafb',
          border:      '#e5e7eb',
          ring:        'rgba(59, 130, 246, 0.35)',
          fg:          '#111827',
          fgMuted:     '#6b7280',
        },
      },
      borderRadius: {
        uiSm: '4px',
        uiMd: '6px',
        uiLg: '8px',
        uiFull: '9999px',
      },
      boxShadow: {
        uiFocus: '0 0 0 3px rgba(59, 130, 246, 0.35)',
        uiFocusError: '0 0 0 3px rgba(239, 68, 68, 0.30)',
        uiSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      // Adicionar fontSize/lineHeight só se o template usa tamanhos fora da escala default do Tailwind
      // fontSize: { uiXs: ['11px', '16px'] }
      transitionDuration: {
        ui: '150ms',
      },
    },
  },
}
```

## Convenções de nomes

- Variantes semânticas em **chaves no singular**: `primary`, `secondary`, `danger`, `success`, `warning`, `info`, `neutral`.
- Para cada variante, sub-keys: `DEFAULT`, `hover`, `active`, `fg` (foreground/texto sobre o bg), `soft` (versão clara para badges/alerts soft), `softFg` (texto sobre soft).
- Form controls vão em `ui.input.*` (mesmo se também usados em textarea/select — é o mesmo conjunto de cores).
- Tokens neutros usados por múltiplos primitivos: `ui.surface`, `ui.surfaceMuted`, `ui.border`, `ui.ring`, `ui.fg`, `ui.fgMuted`.

## Uso nos componentes

```tsx
// Button primary
'bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover active:bg-ui-primary-active focus-visible:shadow-uiFocus rounded-uiMd'

// Input
'bg-ui-input-bg border border-ui-input-border focus:border-ui-input-borderFocus focus-visible:shadow-uiFocus placeholder:text-ui-input-placeholder rounded-uiMd'

// Badge soft success
'bg-ui-success-soft text-ui-success-softFg rounded-uiFull'
```

## O que NÃO adicionar

- Tokens já cobertos pela escala default do Tailwind quando o template usa exatamente o mesmo valor (ex.: se o template usa `padding: 0.5rem` para sm e isso é `p-2` no Tailwind, usar `p-2` direto sem criar `ui.spacing.sm`).
- Tokens de tema dark — fora do escopo desta skill.
- Tokens de breakpoints — fora do escopo (primitivos usam apenas os breakpoints default do Tailwind).
- Tokens para componentes não-primitivos.

## Detecção de colisão

Antes de escrever, ler o `tailwind.config` atual. Se já existir `theme.extend.colors.ui` populado:
- diff: valores idênticos → seguir sem mudar
- valores divergentes → parar e perguntar ao usuário se sobrescreve, faz merge, ou usa namespace alternativo
