# Fidelity checklist — espelhamento fiel do template

**Critério #1 de qualidade.** Cada composto gerado deve ser indistinguível do composto correspondente no template original. Antes de finalizar cada arquivo, percorrer este checklist.

## 1. Estrutura HTML refletida em JSX (sem simplificação)

- [ ] A árvore JSX tem o **mesmo número de níveis** que o HTML original.
- [ ] Tags semânticas são preservadas (`section`, `article`, `header`, `footer`, `nav`, `ol`, `ul`, `dl`, `figure`).
- [ ] Wrappers aparentemente "desnecessários" do template **são mantidos** — frequentemente carregam estilos não-óbvios (`.card-body > .row > .col`).
- [ ] Ordem de filhos preservada.
- [ ] Atributos semânticos (`role`, `aria-*`) preservados ou aprimorados.

**Tentação a resistir**: "isso pode virar um único `div` em vez de três aninhados." Não — o template confiou nessa hierarquia para CSS, animações ou semântica. Mantenha.

## 2. Cada classe Tailwind mapeia uma propriedade CSS efetiva

Para cada elemento JSX, abrir o equivalente no template e conferir:

- [ ] `color` → classe Tailwind `text-*` referenciando token `ui.*` correto
- [ ] `background-color` / `background` → `bg-*` ou `bg-gradient-*`
- [ ] `padding` (cada lado) → `p-*` / `px-*` / `py-*` / `pt-*` etc. com valores **idênticos**
- [ ] `margin` → idem
- [ ] `border-width`, `border-color`, `border-style` → `border`, `border-*`, `border-color-*`
- [ ] `border-radius` → `rounded-*`
- [ ] `box-shadow` → `shadow-*` (token customizado se necessário)
- [ ] `font-size`, `font-weight`, `line-height`, `letter-spacing` → `text-*`, `font-*`, `leading-*`, `tracking-*`
- [ ] `display`, `flex-direction`, `align-items`, `justify-content`, `gap` → flex/grid utilities corretas
- [ ] `width`, `height`, `min/max-*` → `w-*`, `h-*` etc.
- [ ] `position`, `top/right/bottom/left`, `z-index` → utilities correspondentes
- [ ] `transition`, `transition-duration`, `transition-timing-function` → `transition-*`, `duration-*`, `ease-*`
- [ ] `opacity` → `opacity-*`

**Quando o valor não existe na escala Tailwind padrão**:
1. Primeira opção: adicionar token em `theme.extend.*` com nome semântico (`ui.card.bg`).
2. Última opção: usar arbitrary `[12.5px]` — sempre justificar em comentário inline.

## 3. Estados interativos idênticos

- [ ] `:hover` → `hover:` aplicado com **mesma cor/transformação**
- [ ] `:focus-visible` → `focus-visible:` (preferir sobre `focus:`)
- [ ] `:active` → `active:` quando template tem
- [ ] `:disabled` → `disabled:` + `aria-disabled`
- [ ] `[data-state="open"]` (Radix) → `data-[state=open]:`
- [ ] Estados de erro/loading aplicados via prop e classe condicional

## 4. Animações e transições

- [ ] Duração em **milissegundos exatos** do template (`transition-duration: 200ms` → `duration-200`)
- [ ] Easing exato (`cubic-bezier(...)` → `transitionTimingFunction` customizado em `tailwind.config`)
- [ ] Keyframes de modal/drawer/popover portados para `tailwind.config.theme.extend.keyframes` + `animation`
- [ ] Animação de entrada e saída separadas quando o Radix expõe (`data-[state=open]:animate-in data-[state=closed]:animate-out`)
- [ ] Toast (sonner) configurado com mesma duração/posição/transição

## 5. Comportamentos JS portados

- [ ] Toggles de overlay → Radix lida (validar visualmente).
- [ ] Animações de colapsar/expandir → estado React + classes Tailwind condicionais.
- [ ] Drag & drop de file-upload → eventos nativos.
- [ ] Sorting de tabela → callback prop, sem implementar.
- [ ] Seleção em massa → estado controlado/incontrolado via prop.

## 6. Acessibilidade

- [ ] Foco gerenciado por Radix em modais/drawers/popovers (não tentar reimplementar).
- [ ] `aria-current="page"` no item ativo do breadcrumb.
- [ ] `aria-label` em `IconButton` sem texto (close, expand, action menu trigger).
- [ ] `role="alert"` em error-state.
- [ ] `role="status"` ou `aria-live="polite"` em loading-skeleton quando justificado.
- [ ] Ordem de tabulação preservada.
- [ ] Texto alternativo em `<img>`.

## 7. Composição

- [ ] Importa primitivos de `src/shared/components/ui/` — **nenhum visual de Button/Input/Badge/Avatar/Alert/Spinner recriado**.
- [ ] `cn()` mescla `className` recebido por prop.
- [ ] CVA usado quando ≥3 variantes ou ≥2 dimensões; ternário simples para 2 variantes.
- [ ] `forwardRef` + `displayName` em compostos com elemento focável principal.
- [ ] `"use client"` apenas em compostos com estado interno.

## 8. Comparação visual lado a lado

Para cada composto, anotar para o relatório final:

```
nome: <composto>
fidelidade:
  - cores: ✓ (todos extraídos de ui.<sub>.*)
  - spacing: ✓ (idênticos ao original)
  - tipografia: ✓
  - sombras: ✓
  - bordas/raios: ✓
  - estados (hover/focus/active/disabled): ✓
  - animações: ✓ (200ms ease-out, igual)
  - acessibilidade: ✓ (+ aria-current adicionado, ausente no template)
divergências_conhecidas: <lista — sempre justificar>
```

Se a comparação revelar divergência sem justificativa técnica, **corrigir antes de finalizar**.

## Bandeira vermelha (refazer o composto)

- "Achei mais clean assim" → refazer fielmente.
- "Tailwind não tem esse valor exato, usei o mais próximo" → adicionar token e refazer.
- "Removi um wrapper que parecia inútil" → restaurar wrapper.
- "Substituí o ícone por um Lucide equivalente" → ok somente se a biblioteca já instalada for Lucide; caso contrário, manter o set original.
- "Mudei o easing porque ficou melhor" → refazer com easing original.
