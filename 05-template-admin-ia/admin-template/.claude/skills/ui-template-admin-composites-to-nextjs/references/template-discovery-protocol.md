# Protocolo de descoberta livre (passada B)

A lista canônica é piso. **Templates admin reais quase sempre trazem compostos próprios** que não cabem em uma taxonomia genérica. Esta passada captura esses compostos com o mesmo rigor dos canônicos.

## Como varrer

### Escopo

Varrer **todos** os HTMLs do template — sem filtro funcional. Páginas que mais entregam compostos próprios costumam ser:

- `components.html`, `ui-elements.html`, `ui-kits.html`
- `cards.html`, `widgets.html`, `extras.html`
- `email.html`, `chat.html`, `kanban.html`, `invoice.html`, `pricing.html`
- páginas demo de feature: `social-feed.html`, `notifications.html`, `file-manager.html`
- qualquer página com mais de uma seção visualmente repetitiva

### Procedimento

1. Para cada HTML, identificar **blocos de markup repetitivo** com classe-raiz própria. Sintoma típico:
   - mesmo padrão `<div class="X">…</div>` aparece 3+ vezes na mesma página, OU
   - o template tem uma página dedicada (`pricing.html` com 3-4 cards), OU
   - há uma classe semântica clara (`.notification-item`, `.kanban-card`, `.feature-block`) e o CSS dedica regras a ela.

2. Agrupar variações da mesma classe-raiz. Se há `.pricing-card`, `.pricing-card.featured`, `.pricing-card.compact` — **um composto** com 3 variantes (CVA), não três compostos.

3. Verificar se o bloco é de fato um **composto reutilizável** ou apenas **conteúdo de página**. Sintomas de "conteúdo de página" (descartar):
   - Aparece uma única vez sem classe própria.
   - É uma sequência específica de texto/imagem que pertence ao layout daquela tela.
   - Não tem CSS próprio reutilizável (estiliza só por composição de utilities Bootstrap).

4. Verificar se o bloco é um **primitivo** (descartar — pré-requisito):
   - Botão isolado, input isolado, badge isolado, etc.

5. Verificar se o bloco é um **canônico já capturado na passada A** (não duplicar — apenas anotar a variação).

## Critérios de inclusão (claros)

Inclui se **qualquer um** for verdadeiro:

- Aparece em ≥2 contextos distintos (2 páginas, ou 2 seções claramente independentes).
- Tem classe semântica própria (`.<nome>` único no CSS) com regras dedicadas (não apenas wrapper utility).
- Está em página vitrine de componentes (`components.html`/`ui-elements.html`) com bloco titulado dedicado a ele.

Exclui se:

- É 100% conteúdo de uma única tela.
- Já foi capturado como primitivo ou composto canônico.
- Não tem identidade visual reconhecível além do que utilities Bootstrap entregam.

## Galeria ilustrativa (não-prescritiva)

Exemplos de compostos próprios comuns em templates admin reais. **Esta lista não é obrigatória** — só se aplicam se o template em questão os contiver.

| nome sugerido | sintomas no template |
|---|---|
| `pricing-card` | seção `.pricing`, `.plan-card` com preço grande + lista de features + CTA |
| `feature-card` / `feature-item` | grid 3-4 colunas de ícone + título + descrição |
| `media-object` | layout horizontal avatar/imagem à esquerda + texto à direita (presente em comments, posts) |
| `notification-item` | linha de lista com indicador de "não lido" (bolinha colorida), avatar/ícone, texto, timestamp |
| `chat-message-bubble` | bolha alinhada à esquerda/direita com avatar |
| `chat-input` | textarea com toolbar embutida |
| `kanban-column-header` | header de coluna com título + contagem + menu |
| `kanban-card` | card draggable com tags, due date, avatares de assignees |
| `invoice-summary` | bloco de totais (subtotal, tax, total) com linhas alinhadas |
| `order-line-item` | linha com imagem do produto, nome, qty, price |
| `cart-item` | similar a order-line, com controles de qty |
| `review-card` / `testimonial-card` | aspas + texto + autor com avatar |
| `stats-banner-horizontal` | barra horizontal com 3-5 métricas separadas por divisores |
| `info-tile` / `icon-box` | tile pequeno com ícone grande + label, distinto de stat-card por não ter delta |
| `process-step` | bloco numerado para landing/onboarding |
| `social-feed-post` | post com header (avatar+nome+timestamp), corpo, footer (like/comment) |
| `email-list-item` / `inbox-row` | linha com checkbox + estrela + remetente + preview + data |
| `setting-row` | label + descrição à esquerda + controle (Switch, Select) à direita |
| `permission-row` | similar a setting-row, com matriz de checkboxes |
| `activity-log-row` | linha de log com ícone de severidade + texto + timestamp |
| `tag-input` | input que aceita múltiplas tags (chips inline) |
| `color-swatch-list` | lista de cores selecionáveis |
| `image-with-overlay` | imagem com overlay hover + ações |
| `attached-file-row` | linha com ícone de tipo de arquivo + nome + tamanho + remove |

**Não copiar essa lista.** Use-a apenas como referência para reconhecer padrões análogos no template real.

## Naming dos compostos descobertos

- kebab-case, derivado da classe principal do template (`.pricing-card` → `pricing-card`).
- Se a classe é genérica/Bootstrap (`.card.bg-primary`), usar a intenção visual: `feature-tile`, `stats-banner-horizontal`, etc.
- Manter nomes em **inglês** para coerência com primitivos (que tipicamente são em inglês), independentemente do idioma do template.

## Output da passada B

Linha por composto descoberto:

```
- nome: notification-item
  origem: index.html (3x), notifications.html (12x)
  classe-raiz: .notification-list-item
  primitivos consumidos: Avatar, Badge
  variantes encontradas: padrão, unread (bolinha azul à esquerda), highlighted (fundo amarelo claro)
  estados: hover (fundo cinza claro), active
  comportamentos JS: click marca como lido (será expressado via callback `onClick`)
  justificativa: 15 ocorrências, classe própria, página dedicada
```

Esses compostos descobertos entram na Fase 3 (plano) em uma seção própria, separados dos canônicos para o usuário ter visibilidade clara da distinção.
