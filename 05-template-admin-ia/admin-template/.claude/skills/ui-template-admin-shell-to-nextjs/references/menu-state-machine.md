# Máquina de estados do menu

Conjunto canônico de modos. A skill **só** habilita os modos que o template original demonstra.

## Modos

| Modo | Quando aplicável | Largura efetiva do aside |
| ---- | ---------------- | ------------------------ |
| `expanded` | desktop, menu aberto | `var(--shell-aside-w-expanded)` |
| `mini` | desktop, menu colapsado (template tem mini) | `var(--shell-aside-w-mini)` |
| `mobile-open` | mobile, drawer visível | `var(--shell-aside-w-expanded)` (overlay) |
| `mobile-closed` | mobile, drawer escondido | `0` |

## Transições

- **Desktop ↔ mobile (automática, sem clique).** Detectado via `matchMedia(min-width: var(--shell-bp-md))`. Ao cair em mobile, o último modo desktop é lembrado em ref interna; ao subir de volta, esse modo é restaurado.
- **`toggle()` em desktop:** `expanded ↔ mini` se o template tem mini; caso contrário, `toggle()` em desktop é no-op.
- **`toggle()` em mobile:** `mobile-open ↔ mobile-closed`.
- **Click em link/overlay no mobile:** `closeOnMobile()`.

## Estado inicial

- Desktop: `expanded`.
- Mobile: `mobile-closed`.
- SSR: assumir desktop (`expanded`); o efeito pós-mount corrige se necessário (FOUC mínimo aceitável — sem flicker visível na maior parte dos casos).

## Subset por template

Antes de gerar o hook, a Fase 3 reduz o conjunto de modos:

| Sinal do template | Modos habilitados |
| ----------------- | ----------------- |
| Sem toggle, sem mobile drawer | `expanded` apenas |
| Toggle com modo mini, sem mobile drawer | `expanded`, `mini` |
| Sem mini, com drawer mobile | `expanded`, `mobile-open`, `mobile-closed` |
| Com mini E drawer mobile | todos os 4 |

## Persistência

- **Não persistir** entre reloads. O modo padrão é restaurado a cada montagem. Persistência fica fora do escopo desta skill.
