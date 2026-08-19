# Catálogo canônico de compostos (passada A)

Lista de compostos típicos em apps administrativos. **Gerar apenas os que existem no template.** Para cada composto, listamos seletores comuns a procurar e os primitivos que normalmente consome.

---

## 1. Cabeçalho de página

### page-header
**Seletores típicos**: `.page-header`, `.content-header`, `.page-title-box`, `header.page`, `.page-titles`, `.app-page-title`
**Primitivos consumidos**: nenhum direto — pode usar `Button` para ações no slot direito
**Sub-elementos**: título (`h1`/`h2`), subtítulo opcional, breadcrumb integrado, slot de ações à direita
**Atenção**: muitos templates têm 2-3 variações (com/sem breadcrumb, com/sem ações, alinhado à esquerda vs centralizado). Unificar via CVA quando as diferenças são paramétricas.

### breadcrumb
**Seletores**: `.breadcrumb`, `nav[aria-label="breadcrumb"]`, `ol.breadcrumb`
**Primitivos**: nenhum
**Sub-elementos**: lista de itens com separador (chevron, slash, ponto). O último item é `aria-current="page"` e tem cor diferente.

### section-header
**Seletores**: `.section-header`, `.card-header > h*`, `.subsection-title`
**Primitivos**: opcional `Button` para "Ver tudo"

---

## 2. Cartões e contêineres

### card (composto polimórfico com subpartes)
**Seletores**: `.card`, `.box`, `.panel`
**Subpartes**: `Card.Header`, `Card.Body`, `Card.Footer`
**Variantes típicas**: elevação (flat/elevated), com/sem border, com/sem bg
**Primitivos**: nenhum diretamente — é contêiner

### stat-card
**Seletores**: `.stat-card`, `.info-box`, `.kpi-card`, `.card-stats`, `.widget-stat`
**Primitivos**: `Badge` (delta), `Avatar` ou ícone
**Sub-elementos**: label, valor grande, delta (% e seta), ícone à esquerda/direita
**Atenção**: variantes coloridas (success/danger/info) frequentemente combinam com cor de fundo ou de border-left.

### widget-card
Card genérico com slot e header padronizado, distinto de `stat-card` por carregar conteúdo arbitrário (lista, gráfico).

### profile-card
**Seletores**: `.profile-card`, `.user-profile-card`
**Primitivos**: `Avatar`, `Badge`, `Button`
**Sub-elementos**: avatar grande, nome, role, stats horizontais, ações

### timeline
**Seletores**: `.timeline`, `.activity-feed`, `.activity-list`
**Primitivos**: `Avatar`, `Badge`
**Sub-elementos**: items com bolinha + linha vertical + conteúdo

### collapsible-panel
**Seletores**: `.accordion-item`, `.collapsible`, `details/summary`
**Primitivos**: `IconButton` (chevron toggle)
**Comportamento**: expansão controlada/incontrolada

---

## 3. Diálogos e sobreposições

### modal (subpartes)
**Base**: `@radix-ui/react-dialog`
**Seletores**: `.modal`, `[role="dialog"]`, `.dialog`
**Subpartes**: `Modal.Trigger`, `Modal.Header`, `Modal.Body`, `Modal.Footer`, `Modal.Title`, `Modal.Description`, `Modal.Close`
**Primitivos**: `IconButton` (close), `Button` (footer actions)

### confirm-modal
API simples sobre `modal`: `<ConfirmModal title description confirmLabel cancelLabel onConfirm onCancel variant="default" />`
**Primitivos**: `Button` (2x)

### delete-confirm-modal
Variante destrutiva. Pode incluir UX "digite o nome para confirmar" se template tiver evidência. Caso contrário, apenas variante visual `danger`.
**Primitivos**: `Button`, opcionalmente `Input`

### drawer
**Base**: `@radix-ui/react-dialog` com `modal={true}` + animação lateral
**Seletores**: `.offcanvas`, `.drawer`, `.side-panel`, `.sidebar-right`
**Subpartes**: header/body/footer
**Direções**: left/right (top/bottom apenas se template demonstrar)

### action-popover
**Base**: `@radix-ui/react-popover`
**Seletores**: `.popover`, `[role="tooltip"]` (cuidado para distinguir de Tooltip primitivo)
**Diferença para Tooltip primitivo**: popover carrega conteúdo arbitrário (não só texto)

---

## 4. Feedback ao usuário

### toast (wrapper sobre sonner)
**Seletores**: `.toast`, `.notification`, `.alert-stack`
**Implementação**: Não fila própria — wrapper `Toaster` configurado + helpers `showToast.success/.error/.warning/.info`. Estilizado para parecer com o template.

### empty-state
**Seletores**: `.empty-state`, `.no-data`, `.placeholder-block`
**Primitivos**: `Button` (CTA opcional)
**Sub-elementos**: ilustração/ícone, título, descrição, CTA opcional

### error-state
**Seletores**: `.error-state`, `.error-block`
**Primitivos**: `Button` (retry)
**Variante de empty-state, semanticamente distinta** (`role="alert"`).

### loading-skeleton
**Seletores**: `.skeleton`, `.placeholder-glow`, `.shimmer`
**Primitivos**: nenhum
**Variantes**: text-line, avatar-circle, image-rect, table-row

### page-banner
**Seletores**: `.alert-banner`, `.page-banner`, `.notice-bar`
**Primitivos**: `Alert` primitivo se cobrir o caso; senão composto próprio com cor + ícone + texto + close.

---

## 5. Tabelas e listagens

### data-table (subpartes)
**Seletores**: `table.table`, `.data-table`
**Subpartes**: `DataTable.Header`, `DataTable.Row`, `DataTable.Toolbar`, `DataTable.Empty`
**Primitivos**: `Checkbox` (bulk), `Button`/`IconButton` (ações por linha), `Badge` (status), `Avatar` (autor)
**Generics**: `<TData>` para tipar colunas e linhas
**Comportamento**: sorting é UI-only (callback); paginação é separada

### pagination
**Seletores**: `.pagination`, `.page-numbers`
**Primitivos**: `Button`, `IconButton`, `Select` (page size)
**Variantes via CVA**: numeric+arrows / arrows-only / select-only

### applied-filters
**Seletores**: `.applied-filters`, `.active-filters`, `.tag-filters`
**Primitivos**: `Chip` ou `Tag` removível
**Sub-elementos**: lista de chips com X + "Limpar tudo"

### item-list
Lista não-tabular para casos onde o template usa cards empilhados em vez de tabela.

---

## 6. Formulários compostos

### form-section
**Seletores**: `.form-section`, `fieldset`, `.form-block`
**Sub-elementos**: título, descrição, campos
**Primitivos**: nenhum direto — é wrapper

### form-two-column
Layout. Apenas quando o template demonstra esse padrão. Sem state.

### form-footer
Sticky footer com `Button` cancel/submit. **Primitivos**: `Button`

### stepper
**Seletores**: `.stepper`, `.wizard-steps`, `.bs-stepper`
**Sub-elementos**: lista de passos com indicador (numerado, com check), conector
**Variantes**: horizontal/vertical
**Comportamento**: passo atual controlado externamente

### file-upload
**Seletores**: `.dropzone`, `.file-upload`, `input[type="file"]` estilizado
**Primitivos**: `Button`, `Progress`, `IconButton` (remove)
**Comportamento**: drag&drop nativo + preview de arquivos. **Não** implementa fetch — expõe `onFiles`.

---

## 7. Navegação interna

### tabs
**Base**: `@radix-ui/react-tabs` (justificar) — ou nativo se template tiver implementação simples
**Seletores**: `.nav-tabs`, `.tabs`, `[role="tablist"]`
**Variantes**: underline / pills / boxed

### action-menu
**Base**: `@radix-ui/react-dropdown-menu`
**Seletores**: `.dropdown-menu`, `.action-menu`
**Primitivos**: `IconButton` (trigger 3-dots)

### segmented-control
**Seletores**: `.btn-group[role="group"]`, `.segmented`, `.pill-nav`
**Primitivos**: pode usar `Button` internamente
**Comportamento**: seleção single, controlado/incontrolado

---

## 8. Usuário

### user-menu
**Base**: `@radix-ui/react-dropdown-menu`
**Sub-elementos**: avatar trigger, nome+email no header do menu, separator, items
**Primitivos**: `Avatar`

### user-card
Variante compacta de `profile-card` para listas.

---

## 9. Busca

### command-palette
**Base**: `@radix-ui/react-dialog` + `Input` + lista filtrada
**Seletores**: `.command-palette`, `.spotlight`
**Apenas** se o template demonstrar.
**Primitivos**: `Input`, `Spinner`

### search-result-item
Linha de resultado de busca. Avatar/ícone + título + descrição + meta.
