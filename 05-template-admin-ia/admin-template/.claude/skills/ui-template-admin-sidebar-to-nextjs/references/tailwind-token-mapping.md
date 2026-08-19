# Tailwind Token Mapping

Como traduzir os tokens extraídos no passo 1c em entradas de `tailwind.config`. Use isto durante o passo 2 do SKILL.md.

## Princípios

1. **Namespace dedicado.** Todos os tokens vão sob chaves `adminMenu*` para não colidir com tokens existentes do projeto destino. Outros desenvolvedores precisam poder ler o tailwind.config e ver claramente "isto pertence ao sidebar admin".
2. **Valores literais.** Se o original usa `260px`, o token vai como `'260px'` — não aproximar para `w-64` (256px). Diferenças sub-pixel viram desalinhamento percebível.
3. **Sem reinvenção.** Se um token já existe no escala default do Tailwind e bate exatamente com o original, usar a classe nativa (ex.: `text-sm` se o label é `14px`). Só adicionar quando o valor é fora da escala.
4. **Não tocar fora do `extend`.** Sempre `theme.extend.*`, nunca `theme.*` (que sobrescreveria a default).

## Mapeamento por categoria

### Cores → `theme.extend.colors.adminMenu`

```ts
colors: {
  adminMenu: {
    bg: '#1e2a3a',
    bgHover: '#2a3a4d',
    bgActive: '#3b82f6',
    text: '#c5cdd9',
    textHover: '#ffffff',     // omitir se igual a textActive
    textActive: '#ffffff',
    icon: '#8a96a8',
    iconActive: '#ffffff',
    divider: '#2a3a4d',
    sectionTitle: '#6b7a8e',
    activeIndicator: '#3b82f6', // omitir se não houver indicador
    // Tokens de badge — incluir SE o template tem selo (New, Pro, contador) em algum item.
    // Buscar literalmente o CSS do badge no template (ex.: .menu-dropdown-badge*) —
    // badges costumam usar uma paleta dedicada (success/warning), diferente do resto do menu.
    badgeBg: '#ecfdf3',         // bg inativo
    badgeBgActive: '#d1fadf',   // bg quando item/grupo ativo (ou hover)
    badgeText: '#039855',
  },
}
```

**Regra dura sobre badge:** se 1c detectou badge no template, esses três tokens são obrigatórios E o componente do menu (`menu-item.component.tsx`, `menu-group.component.tsx`) DEVE referenciá-los (ou as cores literais) de forma que renderize de fato. Nunca emitir classes apontando para variáveis CSS que não estão no `tailwind.config` — isso produz badge sem fundo, falha silenciosa.

Uso: `bg-adminMenu-bg`, `text-adminMenu-text`, `hover:bg-adminMenu-bgHover`, `data-[active=true]:bg-adminMenu-bgActive` etc.

### Spacing → `theme.extend.spacing`

Todos prefixados `adminMenu`:

```ts
spacing: {
  adminMenuFull: '260px',
  adminMenuMini: '78px',
  adminMenuItemH: '44px',
  adminMenuItemPx: '16px',
  adminMenuItemPy: '10px',
  adminMenuIconGap: '12px',
  adminMenuChildIndent: '40px',
  adminMenuSectionGap: '24px',
}
```

Uso: `w-adminMenuFull`, `h-adminMenuItemH`, `px-adminMenuItemPx`, `gap-adminMenuIconGap`, `pl-adminMenuChildIndent`.

### Tipografia

Adicionar APENAS se valor cai fora da escala default.

```ts
fontSize: {
  adminMenuLabel: ['14px', { lineHeight: '20px', fontWeight: '500' }],
  adminMenuSection: ['11px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.06em' }],
}
```

Para `text-transform: uppercase` no título de seção, usar a classe `uppercase` direto no JSX — não vira token.

### Transições / animações

```ts
transitionDuration: {
  adminMenu: '300ms',
}
transitionTimingFunction: {
  adminMenu: 'cubic-bezier(0.4, 0, 0.2, 1)',
}
```

Uso: `duration-adminMenu ease-adminMenu`.

### Breakpoints

Se o template usa breakpoints diferentes dos default Tailwind (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`), adicionar customs apenas para o(s) breakpoint(s) onde o sidebar muda de modo:

```ts
screens: {
  adminMenuMd: '992px', // breakpoint que aciona modo mobile no original
}
```

Uso: `adminMenuMd:w-adminMenuFull max-adminMenuMd:hidden`.

### Z-index

Drawer mobile precisa ficar acima do conteúdo. Se o template tem `z-index` específico, adicionar:

```ts
zIndex: {
  adminMenu: '40',
  adminMenuOverlay: '30',
}
```

## Estado ativo — combinando técnicas

Se o original combina `bg sólido + indicador lateral 3px`, ambos viram classes:

- `bg-adminMenu-bgActive` no `<a>`
- pseudo-elemento via Tailwind: `before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-adminMenu-activeIndicator`

Se o indicador é uma cor, mas a largura é fora do padrão, manter literal: `before:w-[3px]`. Não aproximar.

## Globals.css — quando recorrer

Só usar `globals.css` para o que Tailwind não cobre:

- Scrollbar custom (`::-webkit-scrollbar` com cor/largura próprias) — escopar com seletor de classe da área de menu
- `font-face` se o template embute fontes próprias (raro para sidebar)

Exemplo escopado:

```css
.admin-menu-scroll::-webkit-scrollbar { width: 6px; }
.admin-menu-scroll::-webkit-scrollbar-thumb { background: theme('colors.adminMenu.divider'); border-radius: 3px; }
```

Usar a classe `admin-menu-scroll` no elemento que rola.

## Anti-padrões

- ❌ Aproximar `260px` para `w-64`
- ❌ Adicionar tokens em `theme.colors` (sobrescreve default) em vez de `theme.extend.colors`
- ❌ Criar utilitárias soltas em `@layer utilities` quando uma classe Tailwind composta resolve
- ❌ Usar `@apply` em vez de classes diretas no JSX (quebra tree-shaking e duplica intent)
- ❌ Reinventar tokens que o projeto destino já tem (cores neutras genéricas) — só adicionar `adminMenu*` específicos
