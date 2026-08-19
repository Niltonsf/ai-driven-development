# Checklist de inspeção do template

Como varrer um template HTML/CSS/JS estático para produzir o inventário da Fase 1.

## 1. Arquivos prioritários

Templates admin geralmente têm páginas dedicadas a UI. Ler primeiro, em ordem:

1. `forms.html`, `form-elements.html`, `form-basic.html`, `form-layouts.html`
2. `buttons.html`, `button.html`
3. `components.html`, `ui-elements.html`, `ui-features.html`
4. `cards.html`
5. `alerts.html`, `badges.html`, `tooltips.html`
6. `dashboard.html` / `index.html` (validar quais primitivos aparecem em uso real)

Se nenhum desses existir, varrer todos os `.html` da pasta e ranquear por densidade de classes de UI.

## 2. Mapa classe → primitivo (frameworks comuns)

### Bootstrap-derivados (AdminLTE, CoreUI, SB Admin, Tabler, Vuexy)

| Classe no template | Primitivo |
| --- | --- |
| `.btn`, `.btn-primary`, `.btn-outline-*`, `.btn-sm`, `.btn-lg`, `.btn-icon` | Button (variantes, sizes) |
| `.btn-icon-only`, `.btn-square` | IconButton (se distinto) |
| `.form-control`, `.form-control-sm`, `.form-control-lg` | Input/Textarea |
| `.form-select` | Select |
| `.form-check-input[type=checkbox]` | Checkbox |
| `.form-check-input[type=radio]` | Radio |
| `.form-switch`, `.form-check-input.switch` | Switch |
| `.form-label` | Label |
| `.form-text`, `.invalid-feedback`, `.valid-feedback` | (parte de FormField) |
| `.input-group`, `.input-group-text` | (parte de Input com prefix/suffix) |
| `.is-invalid`, `.is-valid` | estado de Input |
| `.badge`, `.badge-pill`, `.badge-soft-*` | Badge |
| `.chip` | Chip |
| `.alert`, `.alert-success`, `.alert-dismissible` | Alert |
| `.avatar`, `.avatar-sm`, `.avatar-status` | Avatar |
| `.spinner-border`, `.spinner-grow` | Spinner |
| `.progress`, `.progress-bar` | Progress |
| `.tooltip`, `[data-bs-toggle=tooltip]` | Tooltip |
| `<hr>`, `.divider`, `.separator` | Divider |

### Tailwind-derivados (Sneat free, Materio, customs)

Não há classes nomeadas — varrer pela tag e pelo conjunto de utilities. Procurar por:

- `<button class="...">` repetido com mesmo padrão de utilities → variante de Button
- `<input type="...">` padrão repetido → Input
- `<span class="rounded-full ... text-xs ...">` repetido → Badge

### Material-derivados

| Classe | Primitivo |
| --- | --- |
| `.MuiButton-*`, `.mat-button` | Button |
| `.MuiTextField-*`, `.mat-form-field` | FormField + Input |
| `.MuiChip-*` | Chip |
| `.MuiBadge-*` | Badge |
| `.MuiAlert-*` | Alert |
| `.MuiAvatar-*` | Avatar |

## 3. Para cada primitivo identificado, anotar

- **Seletor base** (ex.: `.btn`)
- **Variantes** (ex.: `.btn-primary`, `.btn-secondary`, `.btn-outline-primary`, `.btn-soft-success`)
- **Tamanhos** (ex.: `.btn-sm`, default, `.btn-lg`)
- **Estados** procurando no CSS por `:hover`, `:focus`, `:active`, `:disabled`, `[disabled]`, `.disabled`, `.is-invalid`
- **Modificadores** (ex.: `.btn-icon`, `.btn-block`, `.btn-rounded`)
- **Quantidade de páginas** em que aparece (rodar `grep -l "btn-primary" *.html | wc -l`)

## 4. Detecção de Select custom (Radix)

`<select>` nativo dá conta da maioria dos casos. Usar Radix Select **somente se** o template tem:
- `<div>` ou `<button>` simulando o trigger do select
- JS proprietário (Select2, Choices.js, Tom Select, custom) abrindo um dropdown estilizado
- estilização que `<select>` nativo não permite (cada `<option>` com ícone, badges, descrições)

Se for `<select>` nativo estilizado via CSS, **manter `<select>` nativo** — Radix é overkill.

## 5. Detecção de Switch

Switch geralmente é `<input type="checkbox">` com CSS escondendo o checkbox e mostrando uma "pílula" via `::before` / `::after`. Replicar com checkbox + Tailwind (sem Radix). Usar Radix Switch **somente se** o comportamento de teclado/aria do nativo não cobre o caso.

## 6. Detecção de Tooltip

Procurar por `[data-bs-toggle=tooltip]`, `.tooltip`, `data-tippy-content`, `title=`. Se aparecer recorrentemente (≥3 páginas), criar Tooltip com Radix. Caso contrário, descartar.

## 7. Saída desta fase

Para cada primitivo da `primitives-catalog.md`:
- **incluir**: anotar variantes/tamanhos/estados extraídos
- **descartar**: anotar motivo

Levar para a Fase 2.
