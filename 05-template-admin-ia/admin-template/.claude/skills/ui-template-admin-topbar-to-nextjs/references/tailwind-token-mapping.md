# tailwind-token-mapping.md

Padrões para traduzir tokens visuais extraídos do CSS do template em chaves do `tailwind.config` sob o namespace `adminTopbar`. Regra mestra: **fidelidade > convenção Tailwind**. Se o template usa `64px` de altura, registre `'64px'`, não `h-16`.

## Namespace dedicado

Tudo vai sob `adminTopbar` (cores) ou prefixo `adminTopbar*` (spacing/width/duration/zIndex/shadow). Nunca sobrescrever a paleta default do Tailwind nem chaves do projeto.

## Cores → `theme.extend.colors.adminTopbar`

| Token CSS extraído | Chave Tailwind |
|--------------------|----------------|
| bg da topbar | `bg` |
| border-bottom | `border` |
| ícone default | `iconDefault` |
| ícone hover | `iconHover` |
| bg hover do botão | `buttonHoverBg` |
| bg do botão ativo (dropdown aberto) | `buttonActiveBg` |
| bg do dropdown | `dropdownBg` |
| border do dropdown | `dropdownBorder` |
| bg hover do item de dropdown | `dropdownItemHover` |
| bg do badge | `badgeBg` |
| texto do badge | `badgeText` |
| bg da busca | `searchBg` |
| placeholder da busca | `searchPlaceholder` |
| ring/focus da busca | `searchRing` |
| divisor vertical | `divider` |

Use sempre o valor exato em hex/rgba (não derivar com `opacity`). Se o template tiver dark mode com cores diferentes, registre as duas variantes apenas se a app de destino já tem dark mode configurado — caso contrário documentar e ignorar (skill não introduz dark mode).

## Spacing → `theme.extend.spacing`

| Token | Chave |
|-------|-------|
| altura da topbar | `adminTopbarHeight` |
| largura/altura do botão de ação | `adminTopbarButton` |
| padding horizontal interno | `adminTopbarPaddingX` |
| gap entre elementos | `adminTopbarGap` |
| padding interno do item de dropdown | `adminTopbarDropdownItemPad` |

## Width → `theme.extend.width`

| Token | Chave |
|-------|-------|
| busca normal | `adminTopbarSearch` |
| busca expandida | `adminTopbarSearchExpanded` |
| dropdown notificações | `adminTopbarDropdownNotifications` |
| dropdown perfil | `adminTopbarDropdownUser` |
| dropdown idioma | `adminTopbarDropdownLang` |

## Box-shadow → `theme.extend.boxShadow`

| Token | Chave |
|-------|-------|
| sombra da topbar | `adminTopbar` |
| sombra dos dropdowns | `adminTopbarDropdown` |

## Transition → `theme.extend.transitionDuration` / `transitionTimingFunction`

| Token | Chave |
|-------|-------|
| duração de hover/dropdown | `adminTopbar` |
| easing do template (se != default) | `adminTopbar` |

## z-index → `theme.extend.zIndex`

| Token | Chave |
|-------|-------|
| topbar | `adminTopbar` |
| dropdown | `adminTopbarDropdown` |

## Tipografia

Se o template usar tamanhos/pesos fora do default, registrar:

```ts
fontSize: {
  adminTopbarItem: ['14px', '20px'],
  adminTopbarUserName: ['14px', '20px'],
  adminTopbarUserRole: ['12px', '16px'],
  adminTopbarSectionTitle: ['11px', '16px'],
}
```

Não cair em `text-sm`/`text-xs` se o template usa `13px` exatos.

## Breakpoints customizados

Se o template usa breakpoints fora do default Tailwind (`sm: 576px` ao invés de `640px`, ou `xl: 1200px` ao invés de `1280px`), adicionar à `theme.screens` SEM remover os defaults. Use prefixos próprios se houver conflito (`tbsm`, `tbmd`...) — mas só se realmente conflitar com tokens já existentes.

## Quando NÃO criar token

- Se o valor coincide com o default do Tailwind (ex.: `padding: 16px` é `p-4`), use o utilitário direto e não registre no namespace
- Se o valor aparece uma única vez em um único componente sem reuso, deixe como class arbitrário (`w-[372px]`) — mas anote no relatório

## globals.css — quando recorrer

Apenas se a regra é genuinamente impossível em Tailwind utilities:

- `@keyframes` para animação custom de dropdown que combina mais de 2 propriedades de forma não-linear
- Pseudo-elementos (`::before`/`::after`) com conteúdo (ex.: seta apontando do dropdown para o botão)
- Scrollbar custom dentro de dropdown longo (notificações com lista grande)

Manter os seletores sempre escopados (`.admin-topbar-dropdown ::-webkit-scrollbar { ... }`) para não vazar.
