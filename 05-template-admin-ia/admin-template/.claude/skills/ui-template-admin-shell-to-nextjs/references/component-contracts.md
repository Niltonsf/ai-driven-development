# Contratos dos componentes

API pública dos componentes gerados pela Fase 3. Outras skills/etapas podem depender desses contratos para preencher conteúdo posteriormente.

## `<AdminShell>`

```ts
type AdminShellProps = {
  children: ReactNode; // vai para o slot <main>
};
```

- Lê `useMenuState()` e aplica a coreografia das áreas.
- Renderiza `<TopBar>`, `<Footer>`, `<MenuToggle>` apenas se foram gerados.
- **`<main>` aplica padding fiel ao template** via `--shell-main-px`/`-py`. NUNCA `<main style={{ flex: 1 }}>` puro — isso produz "conteúdo colado nas bordas". Quando o template centraliza, um wrapper interno aplica `max-width: var(--shell-main-max-w)` + `margin: 0 auto`.
- Não aceita props de customização — fidelidade ao template é fixa.

## `<Menu>`

```ts
type MenuProps = {
  children?: ReactNode; // futuro: itens de menu (preenchido por skill posterior)
};
```

- Renderiza o `<aside>` vazio com largura controlada via tokens.
- Quando o logo do template está no aside, renderiza um **logo region wrapper** (réplica fiel do sidebar-header do template — padding/gap/align via tokens, `justifyContent` per-state) com `<Logo />` dentro + `{children}` abaixo. Nesse caso é client component (`"use client"`) e lê `useMenuState()` para alternar o `justify` entre os estados expanded/mini.
- Quando o logo NÃO está no aside, é server component sem hook.

## `<TopBar>` (condicional)

```ts
type TopBarProps = {
  children?: ReactNode; // futuro: breadcrumbs, search, widgets
};
```

- Renderiza o `<header>` vazio com altura controlada via token.
- **Espaçamentos via tokens** (`--shell-topbar-px`, `-py`, `-gap`, `-toggle-mr`) — nunca literais. Variantes por breakpoint sobrescrevem o token base via `@media` no `admin-shell.tokens.css`.
- Slots fixos: `<MenuToggle />` à esquerda (se existir), `<Logo />` (se o template põe logo no topbar).

## `<Footer>` (condicional)

```ts
type FooterProps = {
  children?: ReactNode;
};
```

- Renderiza o `<footer>` vazio com altura controlada via token.

## `<Logo>`

```ts
type LogoProps = {
  placement?: "aside" | "topbar"; // default "aside"
};
```

- Renderiza o logo exatamente como no template. Três `kind`s suportados (decididos na Fase 1.4):
- **`placement`** indica onde o `<Logo />` está sendo renderizado. Quando o template tem instâncias do logo em mais de uma localização (Fase 1.4.0), o componente que renderiza (`<Menu>` para `aside`, `<TopBar>` para `topbar`) passa o `placement` correto. Quando há um asset com `role="mobile"`, ele é preferido em `placement="topbar"`. Visibilidade por breakpoint é controlada pela classe wrapper `.logo-mobile-only` / `.logo-desktop-only` (definida em `admin-shell.tokens.css`), lendo `--shell-menu-bp`.
  - **`text-only`** — server component; texto + ícone inline.
  - **`image-single`** — server component; uma `<img>` apontando para `/template/admin/logo/<basename>`.
  - **`image-variants`** — client component (`"use client"`); lê `useMenuState()` e troca o `src` da `<img>` conforme o modo do menu (full em `expanded`/`mobile-open`, icon em `mini`, e variante `mobile` quando definida).
- Os arquivos do logo, quando presentes, vivem em `public/template/admin/logo/` e são copiados byte-a-byte do template original pela Fase 3.
- Sem variantes de tema (dark/light) — apenas as variantes do tema padrão são portadas.

## `<MenuToggle>` (condicional)

```ts
type MenuToggleProps = {
  // sem props públicas
};
```

- Botão funcional. Em desktop alterna `expanded ↔ mini` (se o template tem mini); senão alterna `expanded ↔ mini-equivalente` ou simplesmente abre/fecha.
- Em mobile alterna `mobile-open ↔ mobile-closed`.
- **Estrutura visual fiel ao template:** wrapper (`<button>`) recebe largura/altura/borda/radius/background/padding/cor exclusivamente dos tokens `--shell-menu-toggle-*`. Tokens ausentes no template original saem com valores neutros (`1px solid transparent`/`transparent`/`0`) — a skill **não inventa** decoração. **Borda neutra sempre `1px solid transparent`, nunca `none`** — preserva footprint quando a borda aparece em outro breakpoint/estado.
- **Borda e background podem ser condicionais por breakpoint, por estado, ou por ambos.** A Fase 1.3.1.1 monta uma matriz `(breakpoint × estado)`; cada célula com valor diferente do default sobrescreve via `@media` (breakpoint) ou via JSX condicional lendo `useMenuState()` (estado). Casos cruzados (breakpoint × estado) usam ambos.
- **Ícone** vem em uma de duas estratégias decididas na Fase 1.3.2:
  - `inline-svg` — JSX literal do `<svg>` capturado no template (preserva proporções, stroke, cantos exatos).
  - `library` — import nomeado da biblioteca de ícones detectada (lucide é o fallback global).
- Pares aberto/fechado seguem o template; quando o template apenas rotaciona o mesmo glifo, o JSX aplica `transform: rotate(...)` em vez de manter dois SVGs.
- Acessibilidade obrigatória: `aria-label` ("Abrir menu" / "Fechar menu") e `aria-expanded` casados com `isOpen`.

## `useMenuState()`

```ts
type MenuMode = "expanded" | "mini" | "mobile-open" | "mobile-closed";

type MenuStateValue = {
  mode: MenuMode;
  isMobile: boolean;
  setMode: (next: MenuMode) => void;
  toggle: () => void;          // alterna entre o par atual de estados
  openOnMobile: () => void;    // mode = "mobile-open"
  closeOnMobile: () => void;   // mode = "mobile-closed"
};
```

- Estados não suportados pelo template ficam no tipo, mas o `setMode` valida e ignora valores fora do conjunto suportado (com warning em dev).

## `<MenuStateProvider>`

```ts
type MenuStateProviderProps = {
  children: ReactNode;
};
```

- Provider único. Mora em `(private)/layout.tsx`. Escuta `matchMedia(--shell-bp-md)` para alternar entre famílias desktop/mobile.
