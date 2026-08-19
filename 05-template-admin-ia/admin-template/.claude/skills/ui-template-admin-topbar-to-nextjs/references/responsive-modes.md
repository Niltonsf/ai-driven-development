# responsive-modes.md

Taxonomia de comportamentos responsivos por elemento da topbar. Use para preencher a tabela do passo 1d. Cada elemento real do template deve ser mapeado para um (e apenas um) comportamento por breakpoint.

## Breakpoints típicos

| Faixa | Tailwind default | Uso típico |
|-------|------------------|------------|
| < 640px | `< sm` | Mobile portrait |
| 640–767 | `sm` | Mobile landscape / phablet |
| 768–1023 | `md` | Tablet portrait |
| 1024–1279 | `lg` | Tablet landscape / small desktop |
| ≥ 1280 | `xl`+ | Desktop |

Templates como Sneat, Vuexy, Materio costumam reorganizar a topbar em 3 pontos: mobile (< md), tablet (md–lg) e desktop (≥ lg). Confirme no CSS do template antes de assumir.

## Comportamentos possíveis por elemento

### Brand / logo

- `visible` em todos os breakpoints (mais comum)
- `hidden < md` (quando a sidebar tem o logo e a topbar não)
- `compact < md` (só ícone, sem wordmark)

### Mobile toggle (hambúrguer)

- `visible < lg` / `hidden ≥ lg` (default)
- `visible < md` / `hidden ≥ md` (template com sidebar permanente já em tablet)

### Search

- `inline` em todos os breakpoints (fixa, sem expansão)
- `expandable`: ícone-only em mobile, expande em foco/click
- `hidden < md`, `inline ≥ md` (esconde por completo no mobile, sem alternativa)
- `dropdown < md` (vira um dropdown próprio acionado por ícone)

### Action button (notificações, mensagens, etc.)

- `visible` em todos os breakpoints (default para ações primárias)
- `hidden < sm` (ações secundárias somem no mobile)
- `collapse-into-menu < md` (entram em um menu hambúrguer secundário — raro, mas existe)

### Theme toggle

- Como action button: `visible` ou `hidden < sm`

### User menu

- `full` (avatar + nome + role) ≥ lg
- `avatar-only` < lg (esconde nome e role, mantém avatar clicável)
- `name-only` em variantes raras

### Dropdowns

- Sempre abrem com posicionamento à direita do botão em desktop
- Em mobile, podem virar **fullscreen sheet** (cobrem viewport) — verificar se o template faz isso
- Largura: pode mudar entre desktop (`w-adminTopbarDropdownNotifications`) e mobile (`w-screen` com padding)

### Divisor vertical

- `visible` em todos os breakpoints (default)
- `hidden < md` se separa duas zonas que colapsam juntas no mobile

## Tabela exemplo (a ser preenchida pelo Claude na Fase 1d)

| Elemento | < sm | sm | md | lg | xl |
|----------|------|----|----|----|----|
| Brand | compact | compact | visible | visible | visible |
| Mobile toggle | visible | visible | visible | hidden | hidden |
| Search | hidden | expandable | inline | inline | inline |
| Notifications | visible | visible | visible | visible | visible |
| Messages | hidden | visible | visible | visible | visible |
| Theme toggle | visible | visible | visible | visible | visible |
| Divider 1 | hidden | hidden | visible | visible | visible |
| User menu | avatar-only | avatar-only | avatar-only | full | full |

Sem inferir — só registrar o que o CSS do template realmente faz (geralmente `display: none` em media query ou utilitário `d-none d-md-block` do Bootstrap).

## Tradução para Tailwind

| Comportamento | Classes |
|---------------|---------|
| `visible` em todos | (nenhuma) |
| `hidden < md` | `hidden md:flex` (ou `md:block`) |
| `visible < lg / hidden ≥ lg` | `flex lg:hidden` |
| `compact < md` | duas estruturas com `md:hidden` / `hidden md:flex` |
| `avatar-only < lg` | esconder filhos com `hidden lg:block` mantendo wrapper visível |
