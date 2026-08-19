# Dynamic Behavior Inventory

Como descobrir, no template de origem, **comportamentos dinâmicos** ligados ao menu — e replicá-los na versão Next.js. Use isto durante o passo **1e** do `SKILL.md`.

> **Princípio.** Comportamento ≠ token visual. Tokens (passo 1c) cobrem o estado *parado*. Esta etapa cobre o estado *em movimento*: o que muda quando o usuário interage (hover, click, focus, navegação, resize) ou quando o estado interno do menu muda (collapsed, mode, route).
>
> A skill **não tem catálogo fixo** de comportamentos. Cada template inventa os seus. Esta referência descreve **como procurar** (busca-padrão por tipo de gatilho) e **como traduzir** (recipes neutros para React/Next.js + Tailwind), sem amarrar a nenhum framework de origem específico.

## 1. Cinco fontes de comportamento — onde olhar

Para cada fonte, fazer uma busca exaustiva em **todos** os arquivos do template (HTML/CSS/JS) cujo escopo toca o sidebar. Para cada match, registrar uma linha na tabela do passo 5.

### 1.1 CSS — pseudo-classes e seletores compostos

Ler o(s) CSS do template e listar toda regra que use uma das pseudo-classes/combinadores abaixo **com** um seletor que comprovadamente atinge o sidebar (ancestral ou descendente):

- `:hover` · `:focus` · `:focus-visible` · `:focus-within` · `:active`
- `:checked` (toggles via `<input type="checkbox" hidden>`)
- `:has(...)` (relacional, usado para "quando filho X está ativo, pai Y muda")
- `[aria-expanded="true"]` · `[aria-current="page"]` · `[data-*="..."]`
- `:target`
- Combinadores `>`, `+`, `~`

Padrões frequentes (procurar **exatamente** estes recortes — o objetivo é catalogar, não interpretar):

| Recorte CSS                                              | Comportamento provável (anotar como hipótese, validar) |
| -------------------------------------------------------- | ------------------------------------------------------ |
| `<sidebar>:hover <child>`                                | hover no container revela/expande filhos               |
| `<sidebar>.<collapsedClass>:hover`                       | hover-expand somente quando colapsado (mini → full)    |
| `<item>:hover .<tooltip>`                                | tooltip aparece ao hover                               |
| `<item>:focus-visible`                                   | ring de foco distinto do hover                         |
| `<group>[aria-expanded="true"] .<arrow>`                 | rotaciona seta quando aberto                           |
| `<group>:has(<active>) ...`                              | pai herda estado ativo do filho                        |
| `<sidebar>.<openClass>` + `body.<noScrollClass>`         | drawer mobile trava o scroll do body                   |

Para cada recorte: copiar o seletor literal + a regra resultante para a coluna "evidência" da tabela do passo 5.

### 1.2 HTML — atributos de framework e bindings declarativos

Catalogar todo atributo que represente comportamento, **independente do framework**:

- **Alpine.js**: `x-data`, `x-show`, `x-bind`, `x-cloak`, `x-transition`, `x-on:*` / `@click`, `@mouseover`, `@mouseenter`, `@mouseleave`, `@click.outside`, `@keyup.escape`, `@click.away`, `:class`, `:style`, `$persist(...)`, `$el`, `$dispatch`
- **Vue**: `v-if`, `v-show`, `v-on:*`, `@*`, `:class`, `:style`
- **Angular**: `*ngIf`, `(click)`, `(mouseenter)`, `[class.X]`, `#templateRef`
- **htmx**: `hx-get`, `hx-trigger`, `hx-target`, `hx-swap`
- **Stimulus**: `data-controller`, `data-action`, `data-*-target`
- **Web Components**: handlers em `customElements`
- **HTML nativo**: `onclick=`, `onmouseenter=`, `onkeydown=`, `<details>`/`<summary>`, `<dialog>`, `<input type="checkbox" hidden>` + `<label for="...">` (toggle CSS-only)
- **ARIA dinâmico**: `aria-expanded`, `aria-current`, `aria-hidden`, `aria-controls`, `aria-haspopup`

Para cada atributo encontrado: anotar o elemento que o carrega + o efeito declarado (sem traduzir ainda — só inventário).

### 1.3 JS — listeners imperativos

Procurar nos `.js` do template:

- `addEventListener('click'|'mouseenter'|'mouseleave'|'keydown'|'resize'|'scroll', ...)` cujo target seja um nó do sidebar (ou ancestral comum como `document`/`window` com `closest('.sidebar')` no handler)
- `IntersectionObserver`/`MutationObserver`/`ResizeObserver` apontando para nós do sidebar
- Manipulação direta de classes/estilo (`classList.add/remove/toggle`, `style.X = ...`) em alvos do sidebar
- Acesso a `localStorage` / `sessionStorage` / `cookie` com chave que parece persistir estado do sidebar (busca por substring `sidebar`, `menu`, `nav`, `drawer`, `collapse`, `mini`, `dark`, `theme`)
- Listeners globais de teclado (Esc para fechar drawer, atalho `Cmd+K` que toca no sidebar)
- Listeners de roteamento (`window.history`, `popstate`, `hashchange`) que reagem mudando estado do sidebar

### 1.4 Animações declarativas

- `@keyframes` (ler nome da animação e onde é aplicada com `animation:`)
- `transition: ... <propriedade> <duração> <easing>` aplicada a elementos do sidebar (já anotado em tokens, mas reconfirmar **quais** propriedades animam — frequentemente é mais que `width`: pode incluir `transform`, `opacity`, `visibility`, `padding`)
- `view-transition-name` se o template usa View Transitions API
- Bibliotecas (`animate.css`, GSAP, Motion One) — anotar a presença e o gatilho

### 1.5 Bibliotecas de comportamento de terceiros

Detectar pelo `<script src="...">` ou pelo CSS:

- Bootstrap collapse/offcanvas (`data-bs-toggle="collapse"`, `data-bs-target="#sidebar"`)
- jQuery + plugins (`$.fn.slideDown`, plugin de slide menu)
- Material Components (`mdc-drawer`)
- Tailwind UI/Headless UI patterns (mesmo sem React, são copiáveis)
- Perfect Scrollbar / SimpleBar (substitui scrollbar nativa — comportamento de scroll custom)

## 2. O que **ignorar**

Para manter o escopo apertado:

- Comportamentos de elementos **fora** do sidebar (header dropdowns, modais de busca, etc.) — apenas se eles tocarem no estado do menu (ex.: Cmd+K abre busca **e** colapsa o sidebar) entram.
- Animações puramente decorativas (shimmer, ripple) que não mudam estado nem visibilidade — anotar como "decorativo", marcar como **dispensável** se exigir dependência nova.
- Tracking/analytics handlers (`gtag`, `dataLayer.push`) — descartar.

## 3. Validar cada comportamento candidato

Antes de prometer reproduzir, conferir que o comportamento **de fato dispara** no template original abrindo o HTML no navegador. Comportamentos podem estar registrados mas neutralizados por outra regra (ex.: regra `:hover` sobrescrita por specificity maior). O critério é o efeito visível, não a presença do código.

## 4. Tabela de inventário (saída obrigatória do passo 1e)

Materializar tudo num bloco que o usuário vê no relatório do passo 1d. Formato:

```
| # | Gatilho                | Alvo                      | Efeito observado                                  | Origem (linha/seletor)                | Replicar como                          |
|---|------------------------|---------------------------|---------------------------------------------------|---------------------------------------|----------------------------------------|
| 1 | hover no <sidebar>     | <items>, <arrows>         | revelar labels/setas mesmo em modo colapsado      | css line 7109, `.sidebar:hover ...`   | onMouseEnter/Leave + state isHovered   |
| 2 | click no toggle        | <sidebar>                 | alterna classe collapsed; persiste em localStorage | js bundle, key `sb-collapsed`         | useState + useEffect + localStorage    |
| 3 | click fora             | <sidebar.open> (mobile)   | fecha drawer                                      | alpine `@click.outside`               | useEffect + ref + document listener    |
| 4 | ESC                    | <sidebar.open> (mobile)   | fecha drawer                                      | alpine `@keyup.escape`                | useEffect + keydown listener           |
| 5 | navegação para filho   | <group> que contém o link | abre o grupo automaticamente                      | alpine `selected = $persist(...)`     | useEffect + usePathname + setOpen      |
| 6 | scroll do <main>       | nenhum (independente)     | sidebar não rola junto                            | css `overflow-y:auto` no <nav>        | já contemplado em tokens               |
```

A tabela é **descritiva** — não conter código React. Se o passo 1e não encontrar **nada**, registrar literalmente "Nenhum comportamento dinâmico além dos tokens visuais" — não inferir comportamentos por instinto.

## 5. Recipes de tradução para Next.js + Tailwind

Não amarrar a nenhuma origem. Cada recipe pega um *padrão de comportamento* (não um framework) e dá a forma React idiomática equivalente.

### 5.1 Hover no container (revelar/expandir filhos quando colapsado)

```tsx
"use client";
const [isHovered, setIsHovered] = useState(false);
const showLabels = !collapsed || isHovered;
return (
  <aside
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    className={`transition-[width] duration-adminMenu ${collapsed && !isHovered ? "w-adminMenuMini" : "w-adminMenuFull"}`}
  >
    {/* filhos consomem `showLabels` */}
  </aside>
);
```

Se o template **anima a largura** no hover (mini → full enquanto o usuário paira), usar a mesma classe condicional na largura. Se o template apenas **revela labels mantendo a largura**, animar `opacity`/`visibility` dos labels e manter `w-adminMenuMini`. Distinguir os dois lendo a regra CSS exata anotada em 1.1.

### 5.2 Toggle persistente em `localStorage`

```tsx
const [collapsed, setCollapsed] = useState(false);
useEffect(() => {
  const v = localStorage.getItem("<chave-do-original>");
  if (v != null) setCollapsed(v === "1");
}, []);
useEffect(() => {
  localStorage.setItem("<chave-do-original>", collapsed ? "1" : "0");
}, [collapsed]);
```

**Reusar a chave do original** (passo 1.3) para que o usuário que estava no template não perca preferência. Se o original não persiste, **não** persistir.

### 5.3 Click fora (mobile drawer)

```tsx
const ref = useRef<HTMLElement>(null);
useEffect(() => {
  if (!open) return;
  function onDoc(e: MouseEvent) {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }
  document.addEventListener("mousedown", onDoc);
  return () => document.removeEventListener("mousedown", onDoc);
}, [open]);
```

### 5.4 ESC para fechar

```tsx
useEffect(() => {
  if (!open) return;
  function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, [open]);
```

### 5.5 Auto-abrir grupo do item ativo

```tsx
const pathname = usePathname();
const containsActive = group.children.some((c) => c.href === pathname || pathname.startsWith(c.href + "/"));
const [open, setOpen] = useState(containsActive);
useEffect(() => { if (containsActive) setOpen(true); }, [containsActive]);
```

### 5.6 Auto-fechar drawer ao navegar (mobile)

```tsx
const pathname = usePathname();
useEffect(() => { if (isMobile && open) setOpen(false); }, [pathname]);
```

### 5.7 Tooltip ao hover em mini

Se o template usa `title=` nativo, basta passar `title={label}` no `<Link>`. Se usa um tooltip custom (div absoluta), reproduzir com `<span>` posicionado e `pointer-events-none` mais um listener `onMouseEnter` no item.

### 5.8 Trava de scroll do body

```tsx
useEffect(() => {
  if (!open) return;
  document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = ""; };
}, [open]);
```

### 5.9 Atalho de teclado global

```tsx
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); }
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);
```

### 5.10 Comportamentos cuja recipe **não** está aqui

Se o passo 1e descobrir um comportamento que não cai em 5.1–5.9: pare antes de gerar código, descreva o comportamento numa linha extra do relatório do passo 1d, e proponha ao usuário a forma de tradução **antes** de prosseguir. Não inventar tradução silenciosa. Não cair em biblioteca nova (Framer Motion, etc.) — preferir `useState` + `useEffect` + classes Tailwind condicionais.

## 6. Checklist de paridade (passo 5 do SKILL.md, gate de aceite)

Para **cada linha** da tabela do passo 4, conferir:

- [ ] O comportamento existe no código gerado (apontar arquivo + função/handler exato).
- [ ] Foi testado em runtime (se possível, via `npm run dev` + interação manual ou Playwright/Puppeteer).
- [ ] O efeito visual bate com o template original em vídeo/screenshot lado a lado, não apenas "parecido".
- [ ] Não foi introduzida persistência/listener que o original **não** tem.

Se qualquer comportamento da tabela **não** tem implementação correspondente, a skill **falha o gate** e volta ao passo 3 — não relatar sucesso até a tabela estar 100% verde.

## 7. Sintomas comuns que essa etapa pega

- "Tudo parece igual mas falta o efeito X" → quase sempre é uma regra `:hover`/`:focus-within` em CSS, ou um `@click.outside`/`x-show` em Alpine, que ficou de fora do inventário.
- "Funciona em desktop mas o mobile não fecha sozinho ao navegar" → recipe 5.6.
- "Sidebar fica enorme em mobile e não dá para fechar" → faltou recipe 5.3 ou 5.4.
- "Item do meio do menu sempre fechado mesmo quando estou nele" → faltou recipe 5.5.
- "Quando colapso, os labels somem mas o template ainda mostrava ao passar o mouse" → faltou recipe 5.1. (Este é o caso do TailAdmin demo.)
