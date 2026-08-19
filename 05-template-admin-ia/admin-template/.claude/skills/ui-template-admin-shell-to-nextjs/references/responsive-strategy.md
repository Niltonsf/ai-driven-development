# Estratégia responsiva

Como mapear breakpoints do CSS original para a stack alvo, sem perder fidelidade.

## Princípios

1. **Os breakpoints do template mandam.** Se o original quebra em 992px, o shell quebra em 992px — não em `lg` (1024px) só porque é o default do Tailwind.
2. **Tokens primeiro.** Breakpoints viram CSS variables (`--shell-bp-md`, `--shell-bp-lg`) e são consumidos via `matchMedia(...)` em JS e via container queries / media queries arbitrárias em CSS.
3. **Apenas os necessários.** Se o template tem 2 breakpoints, o shell tem 2. Não inventar `xl`/`2xl` extras.

## Por stack

### Tailwind v4

Em `globals.css`:

```css
@theme {
  --breakpoint-shell-md: 768px;
  --breakpoint-shell-lg: 1024px;
}
```

Uso nos componentes:

```tsx
<aside className="w-[var(--shell-aside-w-expanded)] max-shell-md:hidden" />
```

(Tailwind v4 gera variantes a partir de `--breakpoint-*`.)

### Tailwind v3

Em `tailwind.config.ts`:

```ts
theme: {
  screens: {
    "shell-md": "768px",
    "shell-lg": "1024px",
  },
}
```

Uso:

```tsx
<aside className="hidden shell-md:block shell-md:w-[var(--shell-aside-w-expanded)]" />
```

> Atenção: substituir `screens` inteiro **apaga** os defaults. Se o projeto já usa `sm/md/lg`, usar `theme.extend.screens` em vez de `theme.screens`.

### CSS Modules / styled-components

Definir as media queries em `admin-shell.tokens.css`:

```css
@custom-media --shell-mobile (max-width: 767px);
@custom-media --shell-desktop (min-width: 768px);
```

E consumir via PostCSS (`postcss-custom-media`) ou, se não disponível, via media queries literais com o valor em px.

## Em JS

`use-menu-state.hook.ts` usa `window.matchMedia`:

```ts
const mq = window.matchMedia(`(min-width: ${BP_MD}px)`);
```

`BP_MD` é injetado como constante no arquivo gerado, pegando o valor do token.
