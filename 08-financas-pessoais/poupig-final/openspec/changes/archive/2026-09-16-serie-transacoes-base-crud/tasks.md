## 1. Negócio — scaffold e conjuntos fechados

- [x] 1.1 Rodar `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module transaction --aggregate transaction-series --mode example`, remover o caso de uso de exemplo e garantir que `src/index.ts` exporta `movement`, `transaction` e `transaction-series`, mantendo `getModuleName()`
- [x] 1.2 Criar `transaction-series/model/series-kind.enum.ts` com `SeriesKind` (`OPEN`, `CLOSED`) e `isSeriesKind`
- [x] 1.3 Criar `model/frequency-unit.enum.ts` com `FrequencyUnit` (`WEEK`, `MONTH`, `YEAR`) e `isFrequencyUnit`
- [x] 1.4 Criar `model/day-of-week.enum.ts` com `DayOfWeek` numérico (`MONDAY = 1` … `SUNDAY = 7`), comentário ISO-8601 com semana começando na segunda, e `isDayOfWeek` por `typeof`/`Number.isInteger`/faixa, sem `Object.values`

## 2. Negócio — regra de recorrência e serviço de agenda

- [x] 2.1 Criar `model/recurrence-rule.ts` com `RecurrenceRule` (união por `unit`), `RecurrenceRuleInput`, `MAX_RECURRENCE_INTERVAL = 99` e `RecurrenceRuleErrors` (`as const`, 5 códigos)
- [x] 2.2 Implementar `tryCreateRecurrenceRule`: conversão `number | string` (vazio vira ausente), `unit` por guard, `interval` por `PositiveInteger` + teto, âncoras só da unidade (`isDayOfWeek`, `DayOfMonth` remapeado, mês 1..12), falhas acumuladas e objeto novo só com os campos da unidade
- [x] 2.3 Ler a skill `module-domain-service` e criar `model/recurrence-schedule-calculator.service.ts` com `RecurrenceScheduleCalculator.firstOccurrence`, `occurrenceAt` e `lastOccurrence`, aritmética sobre ano/mês/dia com `Date.UTC`, grampo por leitura sem reescrever a âncora e sem `Date.now()`/getters locais (design, decisão 4)
- [x] 2.4 Exportar enums, regra e serviço pelo barril `model/index.ts`

## 3. Negócio — agregado TransactionSeries

- [x] 3.1 Criar `model/transaction-series.entity.ts` (skill `module-entity`) com `TransactionSeriesProps`, `MAX_INSTALLMENTS = 480` e `TransactionSeriesErrors` (`as const`, 10 códigos)
- [x] 3.2 Implementar a validação de atributos no `tryCreate` no desenho de `Transaction.tryCreate`: `accountId` vazio antes do `Id`, códigos remapeados de id e data, `isDirection`, `isSeriesKind`, códigos da regra, opcionais só quando preenchidos e string vazia como `null`
- [x] 3.3 Implementar as regras por tipo: `CLOSED` exige e valida `installments` e ignora a `endDate` recebida; `OPEN` descarta `installments` sem validar e valida `endDate` preenchida; `kind` inválido não aplica regras de tipo
- [x] 3.4 Implementar as invariantes depois do `Result.combine`: `endDate` de `CLOSED` por `lastOccurrence` e `TRANSACTION_SERIES_END_DATE_BEFORE_START` em `OPEN` contra `firstOccurrence`; getters (com `recurrence` como `RecurrenceRule`) e `softDelete()`
- [x] 3.5 Criar `provider/transaction-series.repository.ts` estendendo `CrudRepository<TransactionSeries>` e documentando `findById` com `TRANSACTION_SERIES_NOT_FOUND` e `delete` lógico (skill `module-repository`)
- [x] 3.6 Criar `dto/transaction-series.dto.ts` com `TransactionSeriesDTO` (nomes de vínculo, `value` numérico, datas `YYYY-MM-DD`, `recurrence` como união, opcionais `null`, sem `deletedAt`) (skill `module-dto`)
- [x] 3.7 Criar `provider/find-transaction-series-by-id.query.ts` e `provider/list-transaction-series.query.ts` com `ListTransactionSeriesInput extends PaginatedInputDTO` (`userId`, `search?`, `kind?`, `direction?`, `accountId?`) (skill `module-query-cqrs`)
- [x] 3.8 Criar `use-case/save-transaction-series.use-case.ts` com `SaveTransactionSeriesErrors`, `SaveTransactionSeriesInput` e o fluxo de `SaveTransaction`: criação sem `id`, atualização com posse e substituição completa, vínculos conferidos depois da entidade e retorno `{ id }` (skill `module-use-case`)
- [x] 3.9 Criar `use-case/delete-transaction-series.use-case.ts`: `findById`, posse com `TRANSACTION_SERIES_NOT_FOUND`, `softDelete()` e `update`
- [x] 3.10 Atualizar os barris do agregado (`dto`, `provider`, `use-case`, `index.ts`) e conferir que `src/index.ts` expõe tudo

## 4. Negócio — testes e verificação

- [x] 4.1 Criar `test/mock/in-memory-transaction-series.repository.ts` no formato do repositório de transações em memória (ignorando excluídas no `findById`, helper `all()`)
- [x] 4.2 Criar `test/transaction-series/transaction-series-enums.test.ts` (dias 1..7 aceitos; `0`, `8`, `1.5`, `'MONDAY'`, `'1'` reprovados; `SeriesKind` e `FrequencyUnit` válidos e inválidos)
- [x] 4.3 Criar `test/transaction-series/recurrence-rule.test.ts` com todos os cenários de regra do spec `recurrence-schedule`
- [x] 4.4 Criar `test/transaction-series/recurrence-schedule-calculator.service.test.ts` com todos os cenários de primeira, n-ésima e última ocorrência do spec `recurrence-schedule`
- [x] 4.5 Criar `test/transaction-series/transaction-series.entity.test.ts` com os cenários do spec `transaction-series-domain` (inclusive derivação por `cloneWith` recalculando a data fim e o conteúdo exato de `TransactionSeriesErrors`)
- [x] 4.6 Criar `test/transaction-series/save-transaction-series.use-case.test.ts` e `delete-transaction-series.use-case.test.ts` com os cenários do spec `transaction-series-use-cases`, reaproveitando `in-memory-movement-references.query.ts`
- [x] 4.7 Conferir o negócio: `npx turbo run test --filter=@poupig/transaction` verde, os testes do agregado verdes também com `TZ=America/Sao_Paulo`, e `npx turbo run build --filter=@poupig/transaction` verde

## 5. Backend — Prisma

- [x] 5.1 Acrescentar em `apps/backend/prisma/models/transaction.model.prisma` os enums `SeriesKind` e `FrequencyUnit` e o model `TransactionSeries` com colunas snake_case, tipos (`Decimal(14, 2)`, `@db.Date`, `VarChar`, `SmallInt`), relações (`Cascade`/`SetNull`) e índices (skill `backend-prisma-data`)
- [x] 5.2 Acrescentar `transactionSeries TransactionSeries[]` em `User`, `Account`, `Card` e `Subcategory`, sem nenhuma outra alteração nesses models
- [x] 5.3 Subir o banco local, gerar a migração `add_transaction_series` e o client; conferir que o SQL só cria enums, tabela, FKs e índices

## 6. Backend — utilitário compartilhado e adapter

- [x] 6.1 Criar `apps/backend/src/modules/transaction/transaction-prisma.util.ts` movendo `toDbDate`/`fromDbDate` e extraindo a seleção dos nomes de vínculo e o mapeamento desses nomes; ajustar `transaction.prisma.ts` para importá-los sem alterar nenhum corpo de função nem resultado
- [x] 6.2 Criar `transaction-series.prisma.ts` com `TransactionSeriesPrisma implements TransactionSeriesRepository`: `create`/`update` gravando todos os campos (inclusive `deletedAt`), `findById` filtrando excluídas, `delete` lógico e `db(tx)`
- [x] 6.3 Implementar a ida e volta da regra: gravação com `null` nas âncoras de outra unidade e remontagem por `frequencyUnit` lendo só as âncoras dela; `Decimal` → `number` e datas UTC ↔ `YYYY-MM-DD`
- [x] 6.4 Implementar `readonly findTransactionSeriesById` escopado por usuário e `readonly listTransactionSeries` com `Promise.all` de `findMany`/`count`, ordenação `startDate`/`createdAt` desc, busca `contains` insensitive, `kind`/`direction` validados pelos guards e `meta` com `totalPages`

## 7. Backend — controller, módulo e integração

- [x] 7.1 Criar `transaction-series.controller.ts` (skill `backend-controller`) com `@Controller('transaction-series')`, injeção de `TransactionSeriesPrisma` e `TransactionPrisma`, corpo com a regra achatada, `toSaveInput` descartando `id`/`userId` do corpo e helper privado `parseNumber`
- [x] 7.2 Implementar `POST` (201) e `PUT /:id` montando `SaveTransactionSeries` com `this.transactionPrisma.movementReferences`, `GET` paginado (`page >= 1`, `pageSize` padrão 10 e teto 50, filtros crus), `GET /:id` (`null` → `NotFoundException('TRANSACTION_SERIES_NOT_FOUND')`) e `DELETE /:id`
- [x] 7.3 Implementar `toHttpException` (`TRANSACTION_SERIES_NOT_FOUND` → 404; demais → 400 com a lista) e usar `@CurrentUser()` como única fonte do dono
- [x] 7.4 Registrar `TransactionSeriesController` e `TransactionSeriesPrisma` em `transaction.module.ts`
- [x] 7.5 Criar `transaction-series.integration.http` com todos os cenários do spec `transaction-series-backend`, anotando em cada requisição o status e as datas esperadas
- [x] 7.6 Conferir o backend: build e testes do backend verdes e `npx eslint` **sem `--fix`** nos arquivos criados/alterados sem erros (não rodar `npm run lint`)

## 8. Frontend — camada de dados

- [x] 8.1 Consultar `node_modules/next/dist/docs/` no que for pertinente a componentes cliente, como pede o `AGENTS.md` do frontend
- [x] 8.2 Criar `data/transaction-series-api.client.ts` no formato de `transaction-api.client.ts` com `TransactionSeriesDTO`, `SaveTransactionSeriesInput` (regra achatada, sem `userId`), `TransactionSeriesApiError` e somente `createTransactionSeries`, com enums de `@poupig/transaction`
- [x] 8.3 Criar `data/transaction-series.labels.ts` com `SERIES_KIND_LABELS`, `FREQUENCY_UNIT_LABELS`, `DAY_OF_WEEK_LABELS` (tipados por `Record` sobre os enums) e `MONTH_LABELS` (1..12), dias e meses derivados do `ptBR` do `date-fns` e capitalizados
- [x] 8.4 Acrescentar os 18 códigos novos em `shared/i18n/messages.pt.ts` e `messages.en.ts`, na ordem alfabética dos arquivos
- [x] 8.5 Criar `data/transaction-series.schema.ts` (skill `frontend-form-schema`) com os campos de transporte da decisão 11 do design, os refinamentos que chamam `tryCreateRecurrenceRule`, `PositiveInteger`/`MAX_INSTALLMENTS` e `RecurrenceScheduleCalculator.firstOccurrence`, e `TransactionSeriesFormData` estreitando enums e datas
- [x] 8.6 Criar `data/use-transaction-series.ts` com `useCreateTransactionSeries` (token via `useAuth`, erro via `getErrorMessage`, `MutationResult` importado de `use-transactions.ts`, conversor de erro local não exportado, sem `any`)
- [x] 8.7 Exportar os novos arquivos em `modules/transaction/data/index.ts` e conferir que o barril não tem nomes duplicados

## 9. Frontend — formulário da série

- [x] 9.1 Criar `components/transaction-series-form.component.tsx` com `react-hook-form` + `v.resolver` e `FormSectionLayout` nas seções `Lançamento` e `Vínculos` (nome, `MoneyInput`, `RadioGroup` de direção com `DIRECTION_LABELS`, `Combobox` de conta, cartão e subcategoria com as opções recebidas)
- [x] 9.2 Implementar a seção `Recorrência`: `RadioGroup` de tipo, `DatePickerInput` de início, `Combobox` de frequência, intervalo numérico com a frase natural, campo de âncora por unidade, parcelas + data fim em `ReadonlyTextField` em `CLOSED` e `DatePickerInput` opcional de data fim em `OPEN`; seção `Observação` com `Textarea`
- [x] 9.3 Implementar os padrões de série nova (hoje local, âncoras derivadas da data de início) e os handlers de data de início, frequência, âncora (`anchorTouched`) e tipo (limpando o campo que deixou de valer), sem `useEffect` que grave estado
- [x] 9.4 Implementar a prévia da agenda derivada na renderização com `RecurrenceScheduleCalculator` (três primeiras ocorrências, última parcela em `CLOSED`, nada com regra incompleta) e a data fim somente leitura com o mesmo valor
- [x] 9.5 Implementar `toSaveInput` a partir da regra normalizada (âncoras alheias como `null`, `installments` só em `CLOSED`, `endDate` só em `OPEN`, opcionais vazios como `null`)

## 10. Frontend — página e barra

- [x] 10.1 Trocar em `components/statement-toolbar.component.tsx` o botão "Nova transação" por `DropdownMenu` (trigger com `ChevronDown`, mesmo rótulo e nome acessível, itens `Transação avulsa` e `Série parcelada ou recorrente`) e a prop `onNewTransaction` por `onCreateSingle`/`onCreateSeries`
- [x] 10.2 Em `pages/monthly-statement.page.tsx`, acrescentar o modo `'series-form'` com `PageSectionHeader` (badge `Extrato Mensal`, título `Nova série de transações`), `TransactionSeriesFormComponent` com as opções já carregadas, toaster de sucesso e volta à lista sem `refresh()`, e cancelar voltando à lista
- [x] 10.3 Ligar `onCreateSingle`/`onCreateSeries` na barra e manter o botão do estado vazio abrindo a transação avulsa
- [x] 10.4 Exportar o novo componente em `apps/frontend/src/modules/transaction/index.ts`

## 11. Verificação final

- [x] 11.1 `npm run build` na raiz verde
- [x] 11.2 Testes do domínio (`@poupig/transaction` e `@poupig/shared`) e do backend verdes
- [x] 11.3 `npx eslint` **sem `--fix`** nos arquivos de frontend criados ou alterados, sem erros
- [x] 11.4 `npx eslint` **sem `--fix`** nos arquivos de backend criados ou alterados, sem erros
- [x] 11.5 Conferir por `git status`/`git diff --stat` que a mudança ficou restrita a `modules/transaction`, `apps/backend/prisma`, `apps/backend/src/modules/transaction`, `apps/frontend/src/modules/transaction` e `apps/frontend/src/shared/i18n`
- [x] 11.6 Buscar nos arquivos novos do domínio e do frontend por `Date.now`, `getDate(`, `getDay(`, `getMonth(`, `toISOString` e `any`, e confirmar que só aparecem onde o design permite (datas locais de hoje no formulário e rótulos do `date-fns`)
