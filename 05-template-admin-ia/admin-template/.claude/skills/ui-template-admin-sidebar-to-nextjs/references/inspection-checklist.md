# Inspection Checklist

Como ler o HTML/CSS/JS do template para extrair tudo que importa para reproduzir o sidebar com fidelidade. Use isto durante o passo 1c do SKILL.md.

## 1. Localizar o sidebar no HTML

Buscar, em ordem, por:

- `<aside>` (semântica)
- Classes que contenham: `sidebar`, `side-nav`, `main-menu`, `nav-menu`, `app-sidebar`, `vertical-nav`, `left-nav`
- IDs equivalentes: `#sidebar`, `#main-menu`, `#app-sidebar`
- Estruturas com `role="navigation"` em coluna lateral

Quando o template tem múltiplas páginas HTML, escolher a página com o **menu mais completo** (geralmente `index.html` ou `dashboard.html`) — itens vazios em outras páginas geram árvore incompleta.

## 2. Identificar a árvore semântica

Padrões comuns:

- `<ul>` raiz com `<li>` para cada item
- `<li>` com `<a>` direto = item folha
- `<li>` com `<a>` + `<ul>` interno = grupo expansível
- `<li class="menu-header">` ou `<div class="menu-section">` = título de seção
- `<li class="divider">`, `<hr>`, `<li class="menu-separator">` = divisor

Para cada item extrair:

- `label` — texto visível (preservar idioma do template)
- `icon` — classe ou nome do ícone (ex.: `fa-dashboard`, `bi bi-speedometer`, `mdi-home`, `<svg>` inline)
- `href` — atributo do `<a>` (manter como no original; rota de exemplo é derivada disto)
- `badge` — pequeno selo numérico/textual ao lado do label, se existir. Quando existir, **abrir o CSS e capturar** as três cores (bg inativo, bg ativo/hover, texto). Buscar literalmente os seletores no CSS (ex.: `.menu-dropdown-badge`, `.menu-dropdown-badge-active`, `.badge-new`). Badges costumam usar paleta success/warning distinta — não inferir do resto do menu.
- `children[]` — recursivamente

## 3. Identificar o set de ícones

Procurar no `<head>` dos HTMLs e nos CSS:

| Pista no original                                          | Pacote React       |
| ---------------------------------------------------------- | ------------------ |
| `<i class="fa fa-...">` ou `fas`/`far`/`fab`               | `@fortawesome/react-fontawesome` + free packs |
| `<i class="bi bi-...">`                                    | `react-bootstrap-icons`             |
| `<i class="mdi mdi-...">`                                  | `@mdi/react`                        |
| `<i class="ti ti-...">`                                    | `@tabler/icons-react`               |
| `<i class="material-icons">name</i>`                       | `@mui/icons-material`               |
| Heroicons (`<svg>` com `data-slot="icon"`)                 | `@heroicons/react`                  |
| Lucide (`<svg>` com classes lucide)                        | `lucide-react`                      |
| `<svg>` inline custom                                      | copiar para `icons/` como componentes |

Se incerto, perguntar ao usuário antes de instalar dependência.

## 4. Tokens visuais (CSS)

Para cada item da lista abaixo, abrir o(s) CSS principal(is) do template e localizar a regra que produz o efeito. Anotar valores literais.

### Cores

- `bg` — background do container do sidebar
- `bgHover` — background do item ao hover
- `bgActive` — background do item ativo (geralmente em `.active`, `.is-active`, `[aria-current="page"]`)
- `text` — cor do label default
- `textHover` — cor do label em hover (se diferente)
- `textActive` — cor do label ativo
- `icon` — cor do ícone default
- `iconActive` — cor do ícone ativo
- `divider` — cor de divisores e bordas
- `sectionTitle` — cor de títulos de seção
- `activeIndicator` — cor da barra lateral indicadora do ativo (se existir)

### Spacing (preservar valores literais — não aproximar)

- `widthFull` — largura quando expandido (ex.: `260px`, `280px`)
- `widthMini` — largura quando colapsado (ex.: `64px`, `78px`)
- `itemHeight` — altura do item de menu
- `itemPaddingX`, `itemPaddingY` — padding interno
- `iconLabelGap` — gap entre ícone e label
- `childIndent` — indentação extra dos filhos em grupos expandidos
- `sectionGap` — gap antes de cada título de seção
- `dividerMargin` — margem de divisores

### Tipografia

- `fontFamily` — herdada ou específica
- `labelSize`, `labelWeight`
- `sectionTitleSize`, `sectionTitleWeight`, `sectionTitleTransform` (uppercase?), `sectionTitleLetterSpacing`
- `badgeSize`, `badgeWeight`

### Estado ativo — anatomia

Identificar QUAL combinação o template usa:

- background sólido?
- borda lateral (`border-left: 3px solid ...`)?
- mudança de cor de texto?
- mudança de cor/peso do ícone?
- pseudo-elemento `::before` como indicador?

Replicar exatamente — não escolher uma das técnicas se o original combina duas.

### Hover e focus

- transição (duração, propriedades animadas)
- ring de focus (`outline`, `box-shadow`)

### Grupo expansível

- ícone de chevron — qual é, onde fica (esquerda/direita), gira no expand?
- altura animada? (slide-down) ou abre instantâneo?
- children em background diferente do pai?

## 5. Modos responsivos (CSS media queries + JS)

Ler as media queries que tocam no sidebar e o JS que troca classes. Identificar quais destes modos existem (pode ser mais de um — ver `responsive-modes.md`):

- **Full** — desktop, expandido, largura `widthFull`
- **Mini-collapsed** — desktop, colapsado para `widthMini`, só ícones; labels somem ou aparecem em tooltip ao hover
- **Mobile-drawer** — abre da esquerda sobre o conteúdo, com overlay escurecido; fecha por backdrop-click, ESC, ou botão X
- **Mobile-overlay** — sidebar full ocupa a tela inteira em mobile
- **Hidden** — em mobile, sidebar simplesmente desaparece e é mostrado por botão hamburguer

Anotar os breakpoints exatos (`max-width: 991.98px`, `max-width: 767px` etc.).

## 6. JS — toggles e persistência

Procurar:

- Listener de clique em botão hamburguer / botão de colapso
- Adição/remoção de classes no `<body>`, `<html>`, ou no próprio aside (`sidebar-collapsed`, `sidebar-mini`, `sidebar-open`)
- `localStorage.setItem(...)` para persistir o modo — se existir, replicar; se não existir, NÃO inventar persistência
- Listener de ESC para fechar drawer
- Listener para fechar ao clicar fora

## 7. Scroll

- Área de menu tem `overflow-y: auto`?
- Existe scrollbar custom (`::-webkit-scrollbar` com cor/largura próprias)?
- Header e footer do sidebar (logo, perfil rápido) ficam fixos enquanto o meio rola? Note a estrutura flex/grid usada.

## 8. Saída deste passo

Produzir um relatório em formato curto que o usuário possa confirmar de uma olhada (passo 1d do SKILL.md):

```
Árvore (resumida): N seções, M grupos, P itens folha
Set de ícones: Lucide
Modos responsivos: full + mini-collapsed (desktop ≥ 992px), mobile-drawer (< 992px)
Persiste collapsed: sim, em localStorage chave "sb-collapsed"

Tokens:
  cores: bg #1e2a3a, bgHover #2a3a4d, bgActive #3b82f6, text #c5cdd9, textActive #ffffff, icon #8a96a8, divider #2a3a4d
  spacing: widthFull 260px, widthMini 78px, itemHeight 44px
  tipografia: 14px/500 label, 11px/600 uppercase section title
  ativo: bg sólido + indicador lateral 3px à esquerda
  transição: width 300ms cubic-bezier(.4,0,.2,1)
```
