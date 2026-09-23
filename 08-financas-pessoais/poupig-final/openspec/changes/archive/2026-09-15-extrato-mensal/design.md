## Context

Ver `proposal.md` — Why. Requisitos em `specs/`. Restrições do estado atual que moldam a abordagem:

- O prompt 15 (`transacao-base-crud`, arquivado) entregou a tela e o endpoint que esta mudança **adapta**: `TransactionsPage` alternando `list`/`form` com filtros em estado local e `PAGE_SIZE = 10`; `TransactionListComponent` em `TableCard` com ações; `useTransactions(page, pageSize, filters)` com chave de requisição e descarte de resposta obsoleta; `useTransactionOptions` (contas e cartões ativos, página de 50); `updateTransaction` sobre `PUT /transactions/:id`; `GET /transactions` com teto 50 e sem filtro de cartão.
- O `TransactionFormComponent` **não tem exclusão**: hoje o único caminho para excluir é a lista, então tirar as ações da lista obriga a mover a exclusão para o modo formulário da página.
- O `TransactionDTO` já traz todos os campos do `SaveTransactionInput` e os nomes de conta, cartão, categoria e subcategoria: agrupar e efetivar não precisam de campo novo.
- `shell.context.tsx` + `shell.hook.ts` são o padrão de contexto global. `ShellProvider.isMobile` começa `false` e só é resolvido em `useEffect`, então **não** serve para decidir o padrão de visualização no primeiro render.
- O `AdminShell` não tem slot no cabeçalho; o `SidebarMenu` já esconde o rótulo de seção quando vazio/colapsado. Caminhos de navegação vivem no layout `(private)`, não em `shared/`.
- O grupo `(private)` só renderiza no cliente com usuário resolvido (`AuthGuard` devolve `null` antes). `useLocalStorage` lê de forma síncrona no inicializador lazy. Logo, inicializadores lazy com `window`/`localStorage` são seguros e não há risco de hidratação.
- `Popover` (base do `date-picker-input`), `date-fns` com `ptBR`, `Table`, `Badge`, `Card`, `Tooltip` (exige `TooltipProvider` acima), `PageSectionHeader`, `PaginationControls`, `EmptyListState`, `DeleteConfirmationDialog` e `formatCurrency` já existem.
- O frontend não tem suíte de testes; o lint de frontend (88) e backend (58) já falha, e o `npm run lint` do backend aplica `--fix`. As regras `react-hooks/set-state-in-effect` e `no-explicit-any` estão ativas.
- A implementação roda em **três sub-agentes sequenciais** — (1) negócio + backend, (2) frontend parte A, (3) frontend parte B — e cada grupo de tarefas fecha com uma verificação própria. Sem teste via navegador: o usuário testa manualmente.

## Goals / Non-Goals

**Goals:**

- Um único ponto de verdade para o mês em foco, pronto para o dashboard e os relatórios consumirem sem refatoração.
- Toda aritmética de mês/data concentrada em um utilitário, com mês humano (1–12) e sem fuso.
- A tela do extrato na forma final, sem versão intermediária a ser desmontada.
- Zero `setState` síncrono em efeito e zero `any` nos arquivos novos ou alterados.

**Non-Goals:**

- Não criar hook genérico de paginação, cliente HTTP novo, carregamento de opções novo nem endpoint de efetivação.
- Não mexer no `SidebarMenu`, no `transaction-form.component.tsx` nem em componentes de `shared/components/ui` além do seletor, da pílula e do slot do shell.
- Não alinhar o teto de página de outros módulos.

## Decisions

### 1. Utilitário de mês com mês humano e strings montadas à mão

`shared/util/month.util.ts` define `SelectedMonth = { year; month }` com `month` de **1 a 12** (documentado no topo do arquivo) e as funções `currentMonth`, `monthRange`, `monthKey`, `shiftMonth`, `isSameMonth`, `formatMonthLabel`, `formatShortMonthLabel` e `MONTH_SHORT_LABELS`. `monthRange` monta `YYYY-MM-DD` com padding a partir de ano/mês/dia; o último dia vem de `new Date(year, month, 0).getDate()` (o mês humano já é o índice do mês seguinte). `shiftMonth` converte para índice absoluto (`year * 12 + month - 1 + delta`) e volta, cobrindo a virada de ano sem `if`. Rótulos usam `format` do `date-fns` com `ptBR` sobre um `Date` local do dia 1 (primeira letra maiúscula no longo; `MMM/yyyy` no curto); `MONTH_SHORT_LABELS` é gerado iterando os 12 meses.

Alternativas: `Date` como estado — rejeitada, carrega dia/hora/fuso que não significam nada aqui; `toISOString().slice(0, 10)` — rejeitada, volta um dia à noite em UTC-3; índice 0–11 — rejeitada, é a principal fonte de erro de mês trocado nas bordas (API, rótulos).

### 2. Contexto do mês espelhando o `ShellProvider`, sem persistência

`SelectedMonthProvider` (`'use client'`, contexto `null`) guarda só `selectedMonth` com `useState(() => defaultMonth ?? currentMonth())` e expõe no `useMemo` os derivados (`monthStart`, `monthEnd`, `monthLabel`, `shortMonthLabel`, `isCurrentMonth`) e as ações com `useCallback` (`selectMonth`, `goToPreviousMonth`, `goToNextMonth`, `goToCurrentMonth`). `useSelectedMonthContext` lança com `getMessage('SELECTED_MONTH_CONTEXT_PROVIDER_REQUIRED')`; o hook fino `useSelectedMonth` é o único import dos consumidores. O provider fica dentro do `AuthGuard` e envolve `ShellProvider`/`AdminShell` no layout `(private)`, porque o seletor (cabeçalho) e o extrato (rota filha) precisam estar debaixo dele.

`isCurrentMonth` compara com `currentMonth()` no cálculo do value; como a aplicação não fica aberta de um mês para outro em uso normal, não há timer para virada de mês.

Alternativas: `localStorage`/query string — rejeitadas pela decisão de produto (recarregar volta ao mês atual) e porque reflexo na URL está fora de escopo; guardar o período no estado — rejeitada, duplica a verdade.

### 3. Slot `headerLeading` no `AdminShell`, preenchido pelo layout

Nova prop opcional `headerLeading?: ReactNode`, renderizada logo depois do botão de colapsar, no mesmo contêiner `flex min-w-0 items-center gap-3`. O shell não importa seletor nem contexto — mesmo contrato do `sidebar`. O layout passa `headerLeading={<MonthPicker />}`.

Alternativa: o `AdminShell` renderizar o `MonthPicker` direto — rejeitada, amarraria o template compartilhado a um estado da aplicação e quebraria telas que usem o shell sem o provider.

### 4. `MonthPicker` sobre `Popover`, ano da grade como estado local do painel

Mesmo esqueleto do `date-picker-input` (`open`/`onOpenChange` controlados, `PopoverTrigger asChild`). Setas fora do popover chamam `goToPreviousMonth`/`goToNextMonth`. Dentro, `viewYear` é estado local redefinido **no handler** `onOpenChange(true)` para `selectedMonth.year` — nunca em `useEffect`. Clicar num mês chama `selectMonth({ year: viewYear, month })` e fecha. Destaque do selecionado reaproveita as classes de item ativo do menu (`aria-pressed`); o mês corrente leva borda/ponto discreto. "Mês atual" só renderiza com `!isCurrentMonth`. Rótulo do gatilho com `hidden sm:inline` / `sm:hidden` alternando longo e curto.

Alternativas: `Combobox` de mês/ano — rejeitada, lista com busca é pesada para 12 itens; `Calendar` — rejeitada, seleciona dia.

### 5. Menu como dado

Só `NAVIGATION_SECTIONS` muda: seção `main` sem `label` com `dashboard` e `transactions` (`ReceiptText`), `registrations` intacta; saem `auth`, `category`, `transaction` e os imports `Fingerprint`/`ArrowRightLeft` (o `Tags` segue em uso).

### 6. Backend: filtros de cartão no `where` e conversão no controller

- `ListTransactionsInput` ganha `creditCardId?: string` e `onlyCreditCard?: boolean`, com JSDoc (skill `module-query-cqrs`).
- `TransactionPrisma.listTransactions`: `creditCardId` presente → `where.creditCardId = creditCardId`; senão `onlyCreditCard === true` → `where.creditCardId = { not: null }`. Mantém `userId` e `deletedAt: null`, então id de cartão alheio simplesmente não casa (lista vazia, sem 404 e sem vazar existência). Não é preciso validar o formato do id: `credit_card_id` é `String?` sem `@db.Uuid` no model, então um valor malformado só não casa com nenhuma linha.
- `TransactionController`: `@Query('creditCardId')` com `trim()` e vazio → `undefined`; `@Query('onlyCreditCard')` convertido por helper privado `parseBooleanFlag` (`'true'`/`'1'` → `true`, qualquer outra coisa → `undefined`). O teto do `pageSize` sobe de 50 para 100 só neste controller.

Alternativas: filtrar cartão no cliente — rejeitada, numa lista paginada devolveria páginas incompletas e `meta.total` errado; `onlyCreditCard=false` significando "sem cartão" — rejeitada, não há caso de uso e um booleano malformado estreitaria a lista em silêncio.

### 7. Página guardada junto da chave em que foi escolhida

A página do extrato é `useState<{ key: string; page: number }>`, onde `key = monthKey + JSON dos filtros + busca`. A página efetiva é `pageState.key === currentKey ? pageState.page : 1`; `onPageChange` grava `{ key: currentKey, page }`. Trocar mês/filtro muda `currentKey`, a página efetiva vira `1` no mesmo render e `useTransactions` nunca recebe a combinação "mês novo + página velha".

Alternativas: `useEffect(() => setPage(1), [month])` — rejeitada, dispara uma requisição com a página antiga e viola `set-state-in-effect`; resetar a página em cada handler — rejeitada, o mês muda fora da página (no cabeçalho), então não há handler local para interceptar.

### 8. Preferências via `useLocalStorage` com versão e validação

`useStatementPreferences` usa `useLocalStorage('poupig:statement-preferences', initial, { deserialize })`. O `initial` é calculado uma vez com `window.innerWidth < 1024 ? 'cards' : 'table'` (breakpoint do `ShellProvider`, repetido como constante local porque o do shell não é exportado). `deserialize` faz `JSON.parse` e confere `version === 1`, `view`/`grouping` nas uniões, `filtersOpen` booleano e cada filtro (`isDirection`, `isTransactionStatus`, strings não vazias, `onlyCreditCard === true`); qualquer falha lança e o `useLocalStorage` cai no `initial`. Filtros inválidos individualmente descartam o objeto inteiro, para não restaurar metade de uma escolha. Setters: `setView`, `setGrouping`, `toggleFilters`, `setFilter(name, value)` (setar `creditCardId` remove `onlyCreditCard` e vice-versa) e `clearFilters`.

`StatementFilters` nunca contém `expectedFrom`/`expectedTo`/`search`: o período vem sempre do contexto e a busca é estado local da página.

Alternativa: `isReady` + `useEffect` de leitura — rejeitada, o `(private)` já é só cliente e isso atrasaria a primeira requisição.

### 9. Agrupamento e formatação como funções puras em `data/`

`statement-format.ts` recebe (movida, sem reescrever) a formatação `dd/MM/yyyy` da lista e ganha `formatDayLabel` (`12 de setembro · sábado`) a partir da string `YYYY-MM-DD` partida em números → `new Date(y, m - 1, d)` local → `format` com `ptBR`. `group-transactions.ts` expõe `groupTransactions(items, grouping): { key; label; items }[]`: `date` percorre em ordem e abre grupo novo quando `expectedOn` muda; os demais usam `Map` por chave, ordenam com `localeCompare(..., 'pt-BR')` e empurram `Sem classificação` para o fim, preservando a ordem de entrada dentro do grupo (que já é data decrescente). Os rótulos de visualização/agrupamento ficam em `Record<StatementView | StatementGrouping, string>` em `statement-view.ts`.

Alternativa: pedir agrupamento ao backend — rejeitada, exigiria endpoint/ordenação nova e o agrupamento é apresentação.

### 10. Efetivação: `PUT` existente + sobreposição local amarrada à resposta

`useToggleTransactionSettled` monta o `SaveTransactionInput` a partir do DTO (todos os campos, opcionais como `null`) trocando `status`/`settledOn` (`SETTLED` + `expectedOn`, ou `PENDING` + `null`), chama `updateTransaction` e expõe `togglingId`. Cancelada nunca chega à chamada (botão desabilitado). Na página:

- **Sem filtro de situação**: o sucesso grava `overlay = { source: data, items: { ...(overlay.source === data ? overlay.items : {}), [id]: atualizada } }`. A lista exibida é `data.map(t => overlay.source === data ? overlay.items[t.id] ?? t : t)`. Quando chega uma resposta nova, `data` muda de referência e a sobreposição é ignorada naturalmente — sem `useEffect` de limpeza.
- **Com filtro de situação**: chama `refresh()` de `useTransactions`, porque a linha precisa sair.
- Erro: `toast.error(getErrorMessage(err))` e nada é aplicado.

Alternativas: `PATCH /transactions/:id/settle` — fora de escopo e o `PUT` já basta; atualização otimista antes da resposta — rejeitada, exigiria rollback visual e o spec pede "nenhuma mudança" em erro; sempre recarregar — rejeitada, faz a lista piscar a cada check.

### 11. Exclusão no modo formulário da página, formulário intocado

`MonthlyStatementPage` renderiza, no modo formulário de edição, um cabeçalho com botão `Excluir` (`Trash2`, discreto) acima do `TransactionFormComponent`, abrindo `DeleteConfirmationDialog`; confirmado, `useDeleteTransaction`, toast, `mode = 'list'` e `refresh()`. Na criação o botão não é renderizado.

Alternativa: botão dentro do `TransactionFormComponent` — rejeitada, o formulário não muda nesta mudança e a exclusão é ação de página.

### 12. Linha e card clicáveis sem conflito com o check

Linha (`TableRow`) e card recebem `role="button"`, `tabIndex={0}`, `onClick={() => onOpen(t)}` e `onKeyDown` para `Enter`/`Espaço` (com `preventDefault` no espaço). O check é um `Button ghost` redondo com `Check`, `aria-pressed`, `aria-label` `Marcar "<nome>" como efetivada`/`pendente` e `event.stopPropagation()` em `onClick` e `onKeyDown`. O `Tooltip` do cancelado envolve um `span` (botão desabilitado não dispara eventos de ponteiro); a página monta um `TooltipProvider` único em volta da lista.

### 13. `FilterPill` em `shared`, painel e barra no módulo

`shared/components/ui/filter-pill.tsx` é só apresentação (`type="button"`, `rounded-full`, `aria-pressed`, `disabled`, `count?`), porque os relatórios vão reutilizá-la. `StatementFiltersPanel` e `StatementToolbar` ficam no módulo e recebem estado e callbacks por props; as opções de conta/cartão vêm do `useTransactionOptions` chamado **uma vez** na página. O agrupamento usa pílulas a partir de `sm` e um `Combobox` compacto abaixo disso, com peso visual menor que o botão `Filtros`.

### 14. Renomes no mesmo movimento

`pages/transactions.page.tsx` → `pages/monthly-statement.page.tsx` (`MonthlyStatementPage`) e `components/transaction-list.component.tsx` → `components/transaction-table.component.tsx` (`TransactionTableComponent`), ajustando `app/(private)/transactions/page.tsx` e os barris. `useTransactions` e o cliente de API mantêm os nomes. Busca por referências antigas antes de fechar.

## Risks / Trade-offs

- [Grupo quebrado entre páginas] → página de 100 cobre o mês inteiro em praticamente todos os casos; o compromisso é aceito e documentado no spec.
- [Deploy do frontend antes do backend] → um backend antigo limitaria a página a 50 e ignoraria os filtros de cartão (listagem mais larga, não errada no escopo do usuário). Publicar o backend primeiro.
- [Preferência gravada com conta/cartão depois inativado ou excluído] → o filtro continua enviado e a lista vem vazia com o estado vazio "com filtros" e o atalho `Limpar filtros`; a pílula desse item não aparece. Aceito.
- [Sobreposição local divergindo do servidor] → só é aplicada após sucesso do `PUT` e descartada na próxima resposta; com filtro de situação a lista recarrega.
- [`window.innerWidth` no inicializador] → seguro porque o `(private)` só renderiza no cliente; se um dia houver SSR nesse grupo, o `useLocalStorage` já devolve o `initial` fora do navegador e o padrão precisaria de guarda `typeof window`.
- [Cabeçalho apertado no mobile] → rótulo curto abaixo de `sm`, `min-w-0` preservado e `truncate` no nome/e-mail do usuário.
- [Lint pré-existente e `--fix` do backend] → `npx eslint <arquivos tocados>` sem `--fix`; nunca `npm run lint` no backend.
- [Next.js com convenções próprias] → o sub-agente de frontend consulta `node_modules/next/dist/docs/` antes de mexer em rota/layout, como pede o `AGENTS.md` do frontend.

## Migration Plan

1. Publicar o backend (filtros de cartão e teto 100) — mudança compatível com o frontend atual.
2. Publicar o frontend com o mês global, o menu novo e o extrato.

Sem migração de banco. Rollback: reverter o frontend (as preferências gravadas em `poupig:statement-preferences` são simplesmente ignoradas pela versão anterior) e, se preciso, o backend; nenhum dado é alterado.
