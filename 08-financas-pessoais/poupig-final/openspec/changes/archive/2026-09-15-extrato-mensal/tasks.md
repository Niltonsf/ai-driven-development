## 1. Sub-agente 1 — Negócio: filtros de cartão na consulta

- [x] 1.1 Ler a skill `module-query-cqrs` e o `ListTransactionsQuery` atual em `modules/transaction/src/transaction/provider`
- [x] 1.2 Acrescentar ao `ListTransactionsInput` os campos opcionais `creditCardId?: string` e `onlyCreditCard?: boolean`, com JSDoc explicando cada um (o booleano é ignorado quando `creditCardId` vier junto)
- [x] 1.3 Conferir que nenhum outro arquivo de `modules/*` mudou e rodar `npx turbo run test --filter=@poupig/transaction` e o build do pacote verdes

## 2. Sub-agente 1 — Backend: filtros de cartão e teto de página

- [x] 2.1 Ler a skill `backend-prisma-data` e aplicar no `where` de `TransactionPrisma.listTransactions`: `creditCardId` presente filtra pelo id; senão `onlyCreditCard === true` vira `creditCardId: { not: null }`, mantendo `userId` e `deletedAt: null`
- [x] 2.2 Ler a skill `backend-controller` e aceitar `@Query('creditCardId')` (com `trim`, vazio → `undefined`) e `@Query('onlyCreditCard')` convertido por um helper privado (`'true'`/`'1'` → `true`, qualquer outro valor → `undefined`) no `GET /transactions`
- [x] 2.3 Subir o teto de `pageSize` do `TransactionController` de `50` para `100`, mantendo padrão `10` e mínimo `1`, sem tocar em controllers de outros módulos
- [x] 2.4 Acrescentar ao `transaction.integration.http`: listar por `creditCardId`; listar com `onlyCreditCard=true`; os dois combinados com `expectedFrom`/`expectedTo` de um mês; `creditCardId` de cartão de outro usuário devolvendo lista vazia; `onlyCreditCard=yes` sem estreitar; `pageSize=100` aceito e `pageSize=101` limitado a `100` no `meta`
- [x] 2.5 Conferir o sub-agente 1: build do backend verde, testes do backend e do domínio verdes e `npx eslint` **sem `--fix`** nos arquivos alterados sem erros (não rodar `npm run lint` no backend)

## 3. Sub-agente 2 — Frontend parte A: utilitário e estado global do mês

- [x] 3.1 Consultar `node_modules/next/dist/docs/` sobre layouts do App Router antes de mexer em `app/(private)/layout.tsx`
- [x] 3.2 Criar `apps/frontend/src/shared/util/month.util.ts` com `SelectedMonth` (mês 1–12 documentado), `currentMonth`, `monthRange`, `monthKey`, `shiftMonth`, `isSameMonth`, `formatMonthLabel`, `formatShortMonthLabel` e `MONTH_SHORT_LABELS` derivado do `ptBR`, sem `toISOString` e com o último dia por `new Date(year, month, 0).getDate()`
- [x] 3.3 Acrescentar a chave `SELECTED_MONTH_CONTEXT_PROVIDER_REQUIRED` em `shared/i18n/messages.pt.ts` e `messages.en.ts`, no mesmo modelo de `SHELL_CONTEXT_PROVIDER_REQUIRED`
- [x] 3.4 Criar `shared/context/selected-month.context.tsx` espelhando o `shell.context.tsx`: `SelectedMonthProvider` com `defaultMonth?` e inicializador lazy, value com `selectedMonth`, `monthStart`, `monthEnd`, `monthLabel`, `shortMonthLabel`, `isCurrentMonth` e as ações `selectMonth`, `goToPreviousMonth`, `goToNextMonth`, `goToCurrentMonth` (`useCallback` + `useMemo`), e `useSelectedMonthContext` lançando com a chave traduzida
- [x] 3.5 Criar `shared/hooks/selected-month.hook.ts` exportando `useSelectedMonth()` como o `shell.hook.ts`

## 4. Sub-agente 2 — Frontend parte A: seletor, shell e menu

- [x] 4.1 Criar `shared/components/ui/month-picker.component.tsx` sobre o `Popover`: setas de mês anterior/seguinte fora do painel, gatilho com rótulo longo a partir de `sm` e curto abaixo, painel com navegação de ano (estado local redefinido no `onOpenChange` ao abrir), grade `grid-cols-3` que seleciona e fecha, destaque do selecionado (`aria-pressed`) e marca do mês corrente, botão "Mês atual" só quando `!isCurrentMonth` e `aria-label` nas setas e no gatilho
- [x] 4.2 Acrescentar ao `AdminShell` a prop opcional `headerLeading?: ReactNode`, renderizada logo depois do botão de colapsar no mesmo contêiner `flex min-w-0 items-center gap-3`, sem importar seletor nem contexto
- [x] 4.3 Em `app/(private)/layout.tsx`, montar o `SelectedMonthProvider` dentro do `AuthGuard` envolvendo `ShellProvider`/`AdminShell` e passar `headerLeading={<MonthPicker />}`
- [x] 4.4 Reorganizar `NAVIGATION_SECTIONS`: seção `main` sem `label` com `dashboard` e `transactions` (`Extrato Mensal`, `/transactions`, `ReceiptText`, `match: 'prefix'`), seção `registrations` intacta, e remover os itens `auth`, `category`, `transaction` e os imports `Fingerprint`/`ArrowRightLeft`
- [x] 4.5 Conferir o sub-agente 2: `npm run build` do frontend verde e `npx eslint` **sem `--fix`** nos arquivos criados ou alterados sem erros

## 5. Sub-agente 3 — Frontend parte B: dados do extrato

- [x] 5.1 Acrescentar `creditCardId?` e `onlyCreditCard?` ao `ListTransactionsParams` de `data/transaction-api.client.ts`, enviando cada um só quando informado (`onlyCreditCard` só quando `true` e nunca junto com `creditCardId`)
- [x] 5.2 Criar `data/statement-view.ts` com `StatementView`, `StatementGrouping`, os `Record` de rótulos em pt-BR tipados pelas uniões, `StatementFilters` (com `Direction`/`TransactionStatus` de `@poupig/transaction`) e `StatementPreferences` (`version: 1`)
- [x] 5.3 Criar `data/use-statement-preferences.ts` sobre o `useLocalStorage` com a chave `poupig:statement-preferences`: padrão calculado uma vez (`cards` abaixo de 1024px, `table` acima, agrupamento `date`, painel fechado, sem filtros), `deserialize` validando versão, uniões, `isDirection`/`isTransactionStatus` e tipos dos filtros, e os setters `setView`, `setGrouping`, `toggleFilters`, `setFilter` (cartão específico e `onlyCreditCard` mutuamente exclusivos) e `clearFilters`, sem `useEffect`
- [x] 5.4 Criar `data/statement-format.ts` movendo a formatação `dd/MM/yyyy` sem fuso de `transaction-list.component.tsx` e acrescentando o rótulo do dia em pt-BR (`12 de setembro · sábado`) sem fuso
- [x] 5.5 Criar `data/group-transactions.ts` com `groupTransactions(items, grouping)`: `date` na ordem recebida; `account`, `category` e `subcategory` (`Categoria › Subcategoria`) em ordem alfabética pt-BR, preservando a ordem dentro do grupo e com `Sem classificação` por último
- [x] 5.6 Criar `useToggleTransactionSettled` em `data/use-transactions.ts`, montando o `SaveTransactionInput` completo a partir do `TransactionDTO` (`SETTLED` + `settledOn = expectedOn` ou `PENDING` + `null`), chamando `updateTransaction`, expondo `toggleSettled` e `togglingId` e tratando erro com `toast.error(getErrorMessage(err))`
- [x] 5.7 Atualizar `data/index.ts` com os novos exports

## 6. Sub-agente 3 — Frontend parte B: componentes do extrato

- [x] 6.1 Criar `shared/components/ui/filter-pill.tsx` (`FilterPill`): `button type="button"`, `rounded-full`, estado ativo com a linguagem do item ativo do menu, `aria-pressed`, `disabled` e `count?`
- [x] 6.2 Criar `components/statement-filters-panel.component.tsx` com os grupos `Direção`, `Situação`, `Conta` e `Cartão` (`Somente cartão` + cartões) em pílulas de seleção única com pílula neutra, clique na ativa limpando o grupo, grupo sem opções oculto, rótulos de `transaction.labels.ts` e `Limpar filtros` só com filtro ativo
- [x] 6.3 Criar `components/statement-toolbar.component.tsx`: busca à esquerda; à direita botão `Filtros` (`SlidersHorizontal` + contagem), agrupamento (pílulas a partir de `sm`, `Combobox` compacto abaixo), alternador de visualização (`List`/`LayoutGrid` com `aria-pressed` e `aria-label`), `Nova transação` e a contagem `meta.total` discreta; quebra em duas linhas no mobile
- [x] 6.4 Renomear `components/transaction-list.component.tsx` → `components/transaction-table.component.tsx` (componente e exports): sem `TableCard` e sem coluna de ações; primeira coluna com o check de efetivar (preenchido/contornado, desabilitado com tooltip em cancelada ou em `togglingId`, `aria-pressed`, `aria-label` com o nome e `stopPropagation`); linha clicável com `role="button"`, `tabIndex={0}`, `Enter`/`Espaço` e hover; cabeçalho de grupo com `colSpan`, rótulo e contagem; colunas `Data` (oculta no agrupamento por data), `Nome` (cartão abaixo), `Conta` (`md`), `Classificação` (`lg`), `Valor` e `Situação`
- [x] 6.5 Criar `components/transaction-card.component.tsx`: lista de cards com os mesmos grupos, uma coluna no mobile e duas a partir de `lg`; linha de cima com check, nome truncado e valor; linha de baixo com data, conta, cartão, classificação e badge; card inteiro clicável e acessível por teclado, com `stopPropagation` no check

## 7. Sub-agente 3 — Frontend parte B: página do extrato

- [x] 7.1 Renomear `pages/transactions.page.tsx` → `pages/monthly-statement.page.tsx` (`MonthlyStatementPage`) e ajustar `app/(private)/transactions/page.tsx` e `modules/transaction/index.ts`
- [x] 7.2 Montar os filtros de `useTransactions` num `useMemo` com `preferences.filters` + busca local + `expectedFrom: monthStart`/`expectedTo: monthEnd`; remover campos e estado de período e a barra de filtros com combo box; `PAGE_SIZE = 100`; `hasFilters` contando busca, direção, situação, conta e cartão
- [x] 7.3 Guardar a página junto da chave (mês + filtros + busca) em que foi escolhida, tratando página de outra chave como `1`, sem `setPage` em `useEffect`
- [x] 7.4 Ligar a efetivação: sem filtro de situação, sobreposição local `Record<id, TransactionDTO>` amarrada à referência do array da resposta e ignorada quando chega resposta nova; com filtro de situação, `refresh()`
- [x] 7.5 Compor o modo lista: `PageSectionHeader` (badge `Extrato Mensal`, título `monthLabel`, sem subtítulo) → barra de ferramentas → painel (quando aberto) → tabela ou cards → `PaginationControls` só com `meta.totalPages > 1`, em `space-y`, sem `TableCard`, dentro de um `TooltipProvider`; estado vazio citando o mês, com `Limpar filtros` quando há filtros e convite para a primeira transação quando não há
- [x] 7.6 Remover da lista o fluxo de exclusão e movê-lo para o modo formulário de edição: botão `Excluir` (`Trash2`) no cabeçalho, `DeleteConfirmationDialog`, `useDeleteTransaction`, toast, volta ao modo lista e `refresh()`; não exibir na criação e não alterar `transaction-form.component.tsx`
- [x] 7.7 Buscar referências a `TransactionsPage`, `TransactionListComponent`, `transactions.page` e `transaction-list.component` e confirmar que não sobrou nenhuma

## 8. Verificação final

- [x] 8.1 `npm run build` na raiz verde
- [x] 8.2 Testes do backend e do domínio verdes
- [x] 8.3 `npx eslint` **sem `--fix`** nos arquivos de frontend criados ou alterados, sem erros (os 88 pré-existentes ficam como estão)
- [x] 8.4 `npx eslint` **sem `--fix`** nos arquivos de backend alterados, sem erros (os 58 pré-existentes ficam como estão)
- [x] 8.5 Conferir por busca nos arquivos novos ou alterados: nenhum `any`, nenhum `setState` síncrono em `useEffect`, nenhum `toISOString`/`toLocaleDateString` sobre data pura e nenhuma preferência gravando `expectedFrom`/`expectedTo`/busca
- [x] 8.6 Conferir com `git diff --stat` que o diff se limita a `modules/transaction/src/transaction/provider`, `apps/backend/src/modules/transaction/*`, `apps/frontend/src/modules/transaction/*`, os arquivos previstos de `apps/frontend/src/shared`, `app/(private)/layout.tsx` e `app/(private)/transactions/page.tsx`; não testar via navegador (teste manual do usuário)
