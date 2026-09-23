## 1. Negócio — agenda no período e séries ativas

- [x] 1.1 Ler a skill `module-domain-service` e acrescentar a `RecurrenceScheduleCalculator` o método estático `occurrencesBetween(startDate, rule, { from, to, endDate?, installments? })`: estimativa aritmética do índice inicial por semanas/meses/anos, ajuste enquanto `occurrenceAt(i) < from`, laço parando em `to`, `installments` e `endDate`, todas as datas vindas de `occurrenceAt` (design, decisão 1)
- [x] 1.2 Acrescentar ao teste existente `test/transaction-series/recurrence-schedule-calculator.service.test.ts` todos os cenários do requisito "Ocorrências de uma série dentro de um período" (spec `recurrence-schedule`), inclusive a série semanal de 2020 com índices 348 a 351
- [x] 1.3 Criar `transaction-series/provider/list-active-transaction-series.query.ts` com `ListActiveTransactionSeriesInput` (`userId`, `from`, `to`) e `ListActiveTransactionSeriesQuery` devolvendo `Promise<Result<TransactionSeriesDTO[]>>`, documentando o critério de período (skill `module-query-cqrs`), e exportar no barril `provider`

## 2. Negócio — agregado ScheduledTransaction

- [x] 2.1 Rodar `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module transaction --aggregate scheduled-transaction --mode example`, remover o caso de uso de exemplo e garantir que `src/index.ts` continua exportando `movement`, `transaction` e `transaction-series` e mantém `getModuleName()`
- [x] 2.2 Criar `model/scheduled-transaction.entity.ts` (skill `module-entity`) com `ScheduledTransactionProps` e `ScheduledTransactionErrors` (`as const`, 10 códigos), no desenho de `Transaction`: `seriesId`/`accountId` vazios reprovados antes do `Id`, `occurrenceIndex` inteiro `>= 0` sem `PositiveInteger`, `occurrenceOn`/`expectedOn` com códigos próprios e sem relação de ordem, opcionais vazios como `null`, invariante `status`/`settledOn` depois do combine, getters, `create`/`tryCreate` e **sem** `softDelete()` (design, decisão 3)
- [x] 2.3 Criar `dto/scheduled-transaction.dto.ts` com `ScheduledTransactionDTO` (atributos sem `deletedAt`, `id: string`, `value` numérico, datas `YYYY-MM-DD`, opcionais `null`, `createdAt`/`updatedAt` como `Date`, `materialized`, nomes dos vínculos, `seriesName`, `seriesKind`, `installments`) (skill `module-dto`)
- [x] 2.4 Criar `provider/scheduled-transaction.repository.ts` estendendo `CrudRepository<ScheduledTransaction>` sem operação extra, documentando `findById` com `SCHEDULED_TRANSACTION_NOT_FOUND` e `delete` físico (skill `module-repository`)
- [x] 2.5 Criar `provider/find-scheduled-transaction-by-occurrence.query.ts` (`execute(seriesId, occurrenceIndex, userId)` → `Result<ScheduledTransactionDTO | null>`) e `provider/list-scheduled-transactions-in-period.query.ts` (`execute({ userId, from, to })` → `Result<ScheduledTransactionDTO[]>`, `expectedOn` ou `occurrenceOn` no período, série não excluída, sem outros filtros) (skill `module-query-cqrs`)
- [x] 2.6 Criar `model/scheduled-transaction-generator.service.ts` (skill `module-domain-service`) com `ScheduledTransactionGenerator.occurrenceDate(series, occurrenceIndex)`, `generateForPeriod(series, { from, to }, isMaterialized)` (usando `occurrencesBetween` e `ScheduledTransaction.create`, copiando os campos da série, `PENDING`, `settledOn: null`, `occurrenceOn = expectedOn`) e `toGeneratedDTO(entity, series)` com `materialized: false` (design, decisão 2)
- [x] 2.7 Atualizar os barris do agregado (`model`, `dto`, `provider`, `use-case`, `index.ts`)

## 3. Negócio — casos de uso da ocorrência

- [x] 3.1 Criar `use-case/save-scheduled-transaction.use-case.ts` (skill `module-use-case`) com `SaveScheduledTransactionErrors` (5 códigos), `SaveScheduledTransactionInput` (`seriesId`, `occurrenceIndex`, `userId`, `id`, editáveis) e o fluxo série → `occurrenceDate` → `tryCreate` → vínculos → consulta pela ocorrência → `update` via `findById(idGravado)` + `cloneWith(editáveis)` ou `create` com o id do payload, devolvendo `{ id }` (design, decisão 4)
- [x] 3.2 Criar `use-case/find-scheduled-transaction.use-case.ts`: gravada (`materialized: true`) ou série + `occurrenceDate` + ocorrência gerada em memória (`materialized: false`), com os códigos de série e de ocorrência não encontradas
- [x] 3.3 Criar `use-case/reset-scheduled-transaction.use-case.ts`: resolve pela consulta da ocorrência, ausente → `SCHEDULED_TRANSACTION_NOT_FOUND`, presente → `repository.delete(id)`
- [x] 3.4 Exportar os casos de uso no barril `use-case`

## 4. Negócio — modelo de leitura do extrato

- [x] 4.1 Criar à mão `modules/transaction/src/monthly-statement/{dto,model,use-case}` com barris e exportar `monthly-statement` em `src/index.ts`
- [x] 4.2 Criar `model/statement-entry-kind.enum.ts` (`TRANSACTION`, `SCHEDULED`, sem type guard) e `dto/statement-entry.dto.ts` com `StatementEntryDTO` (campos comuns + bloco da série `null` na avulsa), documentando o `id` efêmero e o endereço `(seriesId, occurrenceIndex)` (skill `module-dto`)
- [x] 4.3 Criar `model/statement-filter-policy.service.ts` com `StatementFilters` e `StatementFilterPolicy.matches(entry, filters)` espelhando o `where` do `TransactionPrisma.listTransactions` (busca parcial sem caixa, igualdades, `creditCardId` com precedência sobre `onlyCreditCard`)
- [x] 4.4 Criar `model/statement-entry.mapper.ts` com `StatementEntryMapper.fromTransaction` e `fromScheduled`
- [x] 4.5 Criar `use-case/find-monthly-statement.use-case.ts` (skill `module-use-case`) com `STATEMENT_MAX_ENTRIES = 500` documentado, `FindMonthlyStatementErrors` (`INVALID_STATEMENT_PERIOD`), entrada `{ userId, from, to, ...StatementFilters }` e o fluxo da decisão 6 do design: validação do período, avulsas filtradas na consulta com `pageSize: 500`, gravadas separadas em exibidas e supressão, geração das séries ativas, filtro em memória nas ocorrências, mapeamento, concatenação `[avulsas, gravadas, geradas]`, ordenação estável por `expectedOn` desc e corte no teto, devolvendo `PaginatedResultDTO<StatementEntryDTO>` com `page: 1`, `pageSize: 500`, `totalPages: 1`

## 5. Negócio — testes e verificação

- [x] 5.1 Criar `test/mock/in-memory-scheduled-transaction.repository.ts` implementando o repositório (delete físico) e as duas consultas do agregado sobre o mesmo armazenamento, com um dublê simples de "série excluída" e helper `all()`
- [x] 5.2 Criar `test/scheduled-transaction/scheduled-transaction.entity.test.ts` com os cenários do spec `scheduled-transaction-domain` (inclusive derivação preservando a identidade e o conteúdo exato de `ScheduledTransactionErrors`)
- [x] 5.3 Criar `test/scheduled-transaction/scheduled-transaction-generator.service.test.ts` com os cenários de "Geração em memória das ocorrências de uma série"
- [x] 5.4 Criar `test/scheduled-transaction/save-scheduled-transaction.use-case.test.ts`, `find-scheduled-transaction.use-case.test.ts` e `reset-scheduled-transaction.use-case.test.ts` com os cenários do spec `scheduled-transaction-use-cases`, reaproveitando `in-memory-movement-references.query.ts` e um dublê de `FindTransactionSeriesByIdQuery`
- [x] 5.5 Criar `test/monthly-statement/statement-filter-policy.service.test.ts` e `test/monthly-statement/find-monthly-statement.use-case.test.ts` com os cenários do spec `monthly-statement-domain`, usando dublês das três consultas (objetos com `execute`), sem o mock in-memory do agregado
- [x] 5.6 Conferir o negócio: `npx turbo run test --filter=@poupig/transaction` verde, os testes de agenda e do extrato verdes também com `TZ=America/Sao_Paulo`, e `npx turbo run build --filter=@poupig/transaction` verde

## 6. Backend — Prisma

- [x] 6.1 Acrescentar em `apps/backend/prisma/models/transaction.model.prisma` o model `ScheduledTransaction` (`@@map("scheduled_transaction")`, snake_case, mesmos tipos de `Transaction` sem `deletedAt`, `seriesId`, `occurrenceIndex Int`, `occurrenceOn @db.Date`), `@@unique([seriesId, occurrenceIndex])`, relações (`series`/`user`/`account` com `Cascade`, `creditCard`/`subcategory` com `SetNull`) e os cinco índices (skill `backend-prisma-data`)
- [x] 6.2 Acrescentar `scheduledTransactions ScheduledTransaction[]` em `TransactionSeries`, `User`, `Account`, `Card` e `Subcategory`, sem nenhuma outra alteração nesses models
- [x] 6.3 Subir o banco local, gerar a migração `add_scheduled_transaction` e o client; conferir que o SQL só cria tabela, restrição única, FKs e índices

## 7. Backend — adapters

- [x] 7.1 Criar `apps/backend/src/modules/transaction/scheduled-transaction.prisma.ts` com `ScheduledTransactionPrisma implements ScheduledTransactionRepository`: `create`/`update` gravando todos os campos, `findById` com `SCHEDULED_TRANSACTION_NOT_FOUND`, `delete` físico e `db(tx)`, reaproveitando `toDbDate`/`fromDbDate`, `referenceNamesSelect` + `series { name, kind, installments }` e `toReferenceNames`
- [x] 7.2 Implementar `readonly findScheduledTransactionByOccurrence` e `readonly listScheduledTransactionsInPeriod` filtrando `userId` e `series: { deletedAt: null }`, com `OR` entre `expectedOn` e `occurrenceOn` e ordenação `expectedOn`/`createdAt` desc, montando DTO com `materialized: true`
- [x] 7.3 Acrescentar `readonly listActiveTransactionSeries` ao `TransactionSeriesPrisma` (`deletedAt: null`, `startDate <= to`, `endDate` nulo ou `>= from`, `startDate` asc), reaproveitando o mapeamento de linha para DTO existente

## 8. Backend — controllers, módulo e integração

- [x] 8.1 Extrair `parseBooleanFlag` do `TransactionController` para `transaction-query.util.ts` e usá-lo no controller sem alterar o corpo nem o comportamento
- [x] 8.2 Criar `scheduled-transaction.controller.ts` (skill `backend-controller`) com `@Controller('scheduled-transactions')`, `GET|PUT|DELETE /:seriesId/:occurrenceIndex`, injeção de `ScheduledTransactionPrisma`, `TransactionSeriesPrisma` e `TransactionPrisma`, casos de uso montados no método, corpo do `PUT` só com `id` + editáveis, helper privado `parseNumber` (sem `NaN` silencioso) e `toHttpException` (3 códigos → 404, resto → 400)
- [x] 8.3 Criar `statement.controller.ts` com `@Controller('statement')` e um `GET` (`from`, `to`, filtros crus, `onlyCreditCard` pelo helper extraído), montando `FindMonthlyStatement` com `transactionPrisma.listTransactions`, `scheduledTransactionPrisma.listScheduledTransactionsInPeriod` e `transactionSeriesPrisma.listActiveTransactionSeries`; `INVALID_STATEMENT_PERIOD` → 400
- [x] 8.4 Registrar `ScheduledTransactionController`, `StatementController` e `ScheduledTransactionPrisma` em `transaction.module.ts`
- [x] 8.5 Criar `scheduled-transaction.integration.http` e `statement.integration.http` com todos os cenários do requisito de integração do spec `scheduled-transaction-backend`, anotando em cada requisição o status e o conteúdo esperados
- [x] 8.6 Conferir o backend: build e testes do backend verdes, testes do domínio ainda verdes e `npx eslint` **sem `--fix`** nos arquivos criados/alterados sem erros (não rodar `npm run lint`)

## 9. Frontend — camada de dados

- [x] 9.1 Consultar `node_modules/next/dist/docs/` no que for pertinente a componentes cliente, como pede o `AGENTS.md` do frontend
- [x] 9.2 Criar `data/statement-api.client.ts` com `listStatement(token, { from, to, ...filtros })` (só filtros informados na query string), resposta `PaginatedResultDTO<StatementEntryDTO>`, `StatementEntryDTO`/`StatementEntryKind` de `@poupig/transaction` e erro com `statusCode`
- [x] 9.3 Criar `data/scheduled-transaction-api.client.ts` com `ScheduledTransactionDTO` (auditoria como `string`), `SaveScheduledTransactionInput` (`id` + editáveis, sem `occurrenceOn`/`userId`), `fetchScheduledTransaction`, `saveScheduledTransaction` (`PUT`), `resetScheduledTransaction` e erro com `statusCode`
- [x] 9.4 Acrescentar a `data/transaction-series-api.client.ts` `fetchTransactionSeries`, `updateTransactionSeries` (`PUT`) e `deleteTransactionSeries`, no formato de `createTransactionSeries`
- [x] 9.5 Acrescentar os 16 códigos novos em `shared/i18n/messages.pt.ts` e `messages.en.ts`, na ordem alfabética dos arquivos
- [x] 9.6 Criar `data/use-statement.ts` com `useStatement(params)` (sem página, estado só no `then`, resposta obsoleta descartada, recarga por contador) e `useToggleStatementEntrySettled` (movido de `use-transactions.ts`, com ramo por `kind`: `updateTransaction` ou `saveScheduledTransaction` com o `id` da entrada) (design, decisão 11)
- [x] 9.7 Remover de `use-transactions.ts` e `transaction-api.client.ts` `useTransactions`, `useToggleTransactionSettled`, `listTransactions` e `ListTransactionsParams`, mantendo `MutationResult`, `useSaveTransaction`, `useDeleteTransaction` e `useTransactionOptions`
- [x] 9.8 Criar `data/use-scheduled-transaction.ts` com `useScheduledTransaction(seriesId, occurrenceIndex, { onNotFound })` (expõe `scheduledTransaction`, `isLoading`, `isMaterialized`, `isNotFound`; `onNotFound` chamado dentro do `then`), `useSaveScheduledTransaction` e `useResetScheduledTransaction`
- [x] 9.9 Acrescentar a `data/use-transaction-series.ts` `useTransactionSeries(seriesId, { onNotFound })` (`series`, `isLoading`, `isNotFound`), `useUpdateTransactionSeries` e `useDeleteTransactionSeries`, sem `any` e sem `setState` síncrono em efeito
- [x] 9.10 Renomear `data/group-transactions.ts` para `data/group-statement-entries.ts` e retipar para `StatementEntryDTO` (`groupStatementEntries`, `StatementEntryGroup`), sem mudar chave, rótulo, ordem nem `Sem classificação`; retipar `data/statement-format.ts`
- [x] 9.11 Atualizar `modules/transaction/data/index.ts` com os arquivos novos, renomeados e removidos, sem nomes duplicados

## 10. Frontend — lista do extrato

- [x] 10.1 Retipar `components/statement-item-parts.component.tsx` por `StatementEntryDTO` e acrescentar o componente do sinal de recorrência (`Repeat` + `Tooltip` com o nome da série e texto `N/T` em `CLOSED`, nada para `TRANSACTION`)
- [x] 10.2 Renomear `transaction-table.component.tsx` → `statement-table.component.tsx` e `transaction-card.component.tsx` → `statement-card.component.tsx`, retipando por `StatementEntryDTO` (chave de linha `entry.id`) e exibindo o sinal de recorrência junto ao nome, sem coluna nem cor nova

## 11. Frontend — formulários reaproveitados

- [x] 11.1 Em `components/transaction-form.component.tsx`, trocar a prop do registro por `TransactionFormRecord` (campos editáveis comuns) e acrescentar `leadingSection?: ReactNode` antes da primeira seção, mantendo `transaction.schema.ts` intacto (design, decisão 10)
- [x] 11.2 Em `components/transaction-series-form.component.tsx`, aceitar `series?: TransactionSeriesDTO`: `defaultValues` derivados da série (regra, parcelas, data fim), `anchorTouched` inicial `true` com série, título/texto do botão por modo e o aviso de alcance acima de `Recorrência` só na edição (design, decisão 12)

## 12. Frontend — página do extrato

- [x] 12.1 Trocar em `pages/monthly-statement.page.tsx` `mode` + `editingTransaction` pela união `ViewMode` da decisão 9, remover `PageState`, `PAGE_SIZE` e `PaginationControls`, e usar `useStatement` com `from`/`to` do mês e filtros, mantendo `meta.total` na barra, `groupStatementEntries`, a sobreposição de efetivação presa ao array `data` e `useToggleStatementEntrySettled`
- [x] 12.2 Abrir linha por `kind`: `TRANSACTION` → `{ kind: 'form', transaction: entry }`; `SCHEDULED` → `{ kind: 'scheduled-form', seriesId, occurrenceIndex }`
- [x] 12.3 Implementar o modo `scheduled-form`: `PageSectionHeader` (`Extrato Mensal`, `Transação da série`), `FormSkeleton` ao carregar, `onNotFound` com toast e volta à lista, `TransactionFormComponent` com `leadingSection` do bloco da série em `ReadonlyTextField` (nome, `SERIES_KIND_LABELS`, `Parcela N de T`, data original quando movida) e salvar por `useSaveScheduledTransaction` com toast, volta e recarga
- [x] 12.4 No cabeçalho do `scheduled-form`, `Editar série` (`Repeat`, sempre visível) indo para `{ kind: 'series-form', seriesId, returnTo }` e `Reverter para a série` (`RotateCcw`, só com `isMaterialized`) com `DeleteConfirmationDialog` (`confirmWord="reverter"`, `confirmLabel="Reverter"`, descrição de descarte), `useResetScheduledTransaction`, toast, volta e recarga
- [x] 12.5 Adaptar o modo `series-form`: sem `seriesId`, criação do prompt 18 passando a recarregar o extrato ao salvar; com `seriesId`, `useTransactionSeries` (`FormSkeleton`, `onNotFound`), `PageSectionHeader` (`Extrato Mensal`, `Editar série`, subtítulo `SERIES_KIND_LABELS`), formulário com `key={series.id}`, Cancelar voltando para `returnTo`, salvar por `useUpdateTransactionSeries` com toast, volta e recarga
- [x] 12.6 Botão `Excluir série` (`Trash2`) só na edição, com `DeleteConfirmationDialog` de título `Excluir série` e descrição explícita (para de gerar ocorrências **e** as já alteradas ou efetivadas somem do extrato e dos relatórios), `useDeleteTransactionSeries`, toast, volta e recarga
- [x] 12.7 Atualizar `apps/frontend/src/modules/transaction/index.ts` com os componentes renomeados

## 13. Verificação final

- [x] 13.1 `npm run build` na raiz verde
- [x] 13.2 Testes do domínio (`@poupig/transaction` e `@poupig/shared`) e do backend verdes
- [x] 13.3 `npx eslint` **sem `--fix`** nos arquivos de frontend criados ou alterados, sem erros
- [x] 13.4 `npx eslint` **sem `--fix`** nos arquivos de backend criados ou alterados, sem erros
- [x] 13.5 Buscar referências remanescentes a `useTransactions`, `listTransactions`, `groupTransactions`, `TransactionTableComponent`, `TransactionCardComponent` e `PaginationControls` no módulo de transação do frontend e confirmar que não sobrou nenhuma
- [x] 13.6 Buscar nos arquivos novos do domínio e do frontend por `Date.now`, `new Date()`, `getDate(`, `getDay(`, `getMonth(`, `toISOString` e `any`, e confirmar que só aparecem onde já eram permitidos
- [x] 13.7 Conferir por `git status`/`git diff --stat` que a mudança ficou restrita a `modules/transaction`, `apps/backend/prisma`, `apps/backend/src/modules/transaction`, `apps/frontend/src/modules/transaction` e `apps/frontend/src/shared/i18n`
