# Catálogo de primitivos

Taxonomia canônica usada para classificar o que é primitivo e o que não é. Use como checklist na Fase 1.

## Regra de inclusão

Um elemento entra na lista de primitivos se atender **um** dos critérios:

1. Aparece em **≥2 páginas distintas** do template, com a mesma classe/estrutura.
2. É um **controle de formulário** (input, textarea, select, checkbox, radio, switch, label) — entra mesmo se aparecer em apenas uma página, porque qualquer aplicação real precisará dele.

Se aparece em apenas uma página e não é controle de formulário, é **conteúdo**, não primitivo. Descartar.

## Lista canônica

Para cada primitivo abaixo, mapear: **variantes**, **tamanhos**, **estados**, e **subvariantes com/sem ícone**.

### Form controls (sempre incluir se houver no template)

| Primitivo | Tipo HTML base | Variações típicas |
| --- | --- | --- |
| `Input` | `<input type="text\|email\|password\|number\|search">` | tamanhos sm/md/lg; estados default/focus/error/disabled/readonly; com/sem ícone esquerda/direita; com/sem prefixo/sufixo |
| `Textarea` | `<textarea>` | tamanhos; estados; com contador de chars (se template usa) |
| `Label` | `<label>` | obrigatório (asterisco), opcional (texto cinza) |
| `FormField` | wrapper | label + controle + helper + erro — só criar se o template tem essa composição padronizada |
| `Select` | `<select>` nativo (default) ou Radix Select (se template usa custom dropdown estilizado) | tamanhos; estados; placeholder |
| `Checkbox` | `<input type="checkbox">` | tamanhos; estados default/checked/indeterminate/disabled; com label |
| `Radio` | `<input type="radio">` | tamanhos; estados; com label |
| `RadioGroup` | wrapper de Radio | só criar se o template tem agrupamento padronizado (orientação horizontal/vertical) |
| `Switch` | botão custom com Radix ou checkbox visualmente customizado | tamanhos; estados on/off/disabled |

### Display

| Primitivo | Variações típicas |
| --- | --- |
| `Button` | variantes primary/secondary/outline/ghost/link/danger/success/warning; tamanhos xs/sm/md/lg/xl; estados default/hover/active/focus/disabled/loading; com ícone esquerda/direita; full-width |
| `IconButton` | criar **somente se** visualmente distinto de Button (ex.: padding quadrado, sem texto). Caso contrário, é variante de Button. |
| `Badge` | cores/variantes (primary, secondary, success, danger, warning, info, neutral); pill vs square; com/sem ícone |
| `Chip` | criar **somente se** distinto de Badge (geralmente com botão de remover ou ação clicável) |
| `Tag` | criar **somente se** distinto de Badge/Chip no template |
| `Avatar` | tamanhos xs/sm/md/lg/xl; círculo vs quadrado/arredondado; com imagem, com iniciais (fallback), com status indicator (online/offline/busy) |
| `Divider` | horizontal/vertical; com/sem texto no meio |
| `Spinner` | tamanhos; cores/variantes |
| `Progress` | linear; tamanhos; cores; determinate vs indeterminate |

### Feedback / overlay

| Primitivo | Variações típicas |
| --- | --- |
| `Alert` | variantes info/success/warning/error; com/sem ícone; com/sem título; com/sem botão de fechar |
| `Tooltip` | só incluir se aparece recorrentemente; usa Radix Tooltip como behavior |

## Quase-primitivos (atenção)

Itens que **parecem** primitivos mas frequentemente são compostos — descartar desta skill:

- **Card** com header/body/footer e variantes de conteúdo → composite
- **Modal/Dialog** com lógica de abrir/fechar centralizada → composite
- **Dropdown menu** com itens de ação → composite
- **Tabs** com lógica de seleção → composite
- **Accordion** → composite
- **Pagination** → composite
- **Breadcrumbs** → fora de escopo (navegação)
- **Datatable** → composite
- **Toast** → composite

## Saída esperada da Fase 1

Uma decisão explícita por cada item da lista canônica acima:
- **incluir** (com variantes/tamanhos/estados anotados), ou
- **descartar** (com motivo: "não aparece", "aparece só uma vez e não é form control", "é composite").
