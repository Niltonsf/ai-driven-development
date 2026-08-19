# Inspection checklist (Fase 1 — preencher por composto)

Para cada composto identificado (canônico ou descoberto), preencher esta linha. Vira a entrada da Fase 3 (plano).

## Linha-padrão

```
- nome:                    <kebab-case>
  origem:                  canonical | discovered
  paginas_de_origem:       [<file.html (Nx)>, ...]
  seletor_raiz:            <classe principal ou tag+role no template>
  ocorrencias_total:       <N>
  primitivos_consumidos:   [<Button>, <Avatar>, ...]
  uso_de_radix:            none | dialog | popover | dropdown-menu | tooltip | tabs
  variantes:
    - <variante>:          <descrição visual + diferenças>
  tamanhos:                [<sm|md|lg quando aplicável>]
  estados:
    default:               <descrição>
    hover:                 <descrição ou "n/a">
    focus:                 <descrição ou "n/a">
    active:                <descrição ou "n/a">
    disabled:              <descrição ou "n/a">
    loading:               <descrição ou "n/a">
    error:                 <descrição ou "n/a">
    expanded/open:         <descrição ou "n/a">
  comportamentos_js:
    - <interação>:         <o que faz no template; como será portada (ex.: "click expande → estado React open/closed via Radix")>
  animacoes:
    - <propriedade>:       <duração + easing>
  acessibilidade_observada:
    - <atributo>:          <valor; se ausente no template, registrar como gap a corrigir>
  decisoes_pendentes:
    - <ambiguidade>:       <perguntar ao usuário na Fase 3>
```

## Lista mínima a preencher antes de Fase 3

- Todos os canônicos do `composites-catalog.md` que existem no template.
- Todos os descobertos pelo `template-discovery-protocol.md`.

## Como medir as variantes

- Abrir o(s) HTML(s) que contêm o composto.
- Listar todas as combinações de classes encontradas no elemento raiz do composto: `.card`, `.card.elevated`, `.card.compact`, `.card.featured` → 4 variantes (mas se `compact` apenas reduz padding, virar prop `size="sm"` em vez de `variant`).
- Distinguir **variant semântica** (`default | featured | danger`) de **size** (`sm | md | lg`) — ambos viram dimensões CVA distintas.

## Como medir os estados

- Inspecionar CSS do template procurando `:hover`, `:focus`, `:focus-visible`, `:active`, `:disabled`, `[aria-expanded="true"]`, `[data-state="open"]`, `.is-loading`, `.has-error`.
- Cada um vira uma classe Tailwind correspondente (`hover:`, `focus-visible:`, `data-[state=open]:`).

## Como medir comportamentos JS

- Procurar handlers no JS do template: `$('.modal').on('shown.bs.modal', ...)`, `addEventListener('click', ...)`, atributos `data-toggle`, `data-bs-toggle`, `data-target`.
- Para cada interação, decidir como portar:
  - Toggle de overlay → Radix lida.
  - Toggle de painel colapsável → `useState` + classe Tailwind `data-[state=open]:`.
  - Animações de entrada/saída → portar para Tailwind `data-[state=open]:animate-...` + keyframes em `tailwind.config`.

## Como medir animações

- Procurar `transition:` e `@keyframes` no CSS.
- Anotar duração (ms) e easing (`ease`, `ease-out`, `cubic-bezier(...)`).
- Animações de modal/drawer geralmente combinam fade do overlay + slide/scale do content. Portar ambos.

## Output

Tabela completa preenchida → input direto para Fase 3.
