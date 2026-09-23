## Context

Ver `proposal.md` — Why. Requisitos em `specs/`. Restrições do estado atual que moldam a abordagem (verificadas no código):

- Os prompts 15 a 18 estão concluídos e arquivados. `RecurrenceScheduleCalculator` expõe `firstOccurrence`, `occurrenceAt(startDate, rule, index)` e `lastOccurrence`, com helpers privados `parse`, `format`, `isBefore`, `daysInMonth` e `clampDay` sobre `{ year, month, day }` em UTC.
- `Entity.cloneWith` do `@poupig/shared` chama o `tryCreate` da própria classe: toda derivação revalida. `Id.tryCreate` gera uuid para valor vazio.
- `TransactionSeriesDTO` do domínio traz `recurrence` (a própria `RecurrenceRule`), `startDate`, `endDate` (já calculada em `CLOSED`), `installments` e os nomes dos vínculos — tem tudo o que a geração precisa, sem carregar a entidade.
- `TransactionPrisma.listTransactions` aplica `skip`/`take` com o `pageSize` recebido; o teto de 100 está **só** no `TransactionController`. Chamado direto pelo caso de uso do extrato, aceita `pageSize: 500`.
- `transaction-prisma.util.ts` já exporta `toDbDate`, `fromDbDate`, `referenceNamesSelect` e `toReferenceNames`. O helper `parseBooleanFlag` do `TransactionController` é privado.
- No frontend, a página do extrato tem `mode: 'list' | 'form' | 'series-form'` e `editingTransaction` em estados separados, estado de página preso a uma chave de mês + filtros, e a sobreposição de efetivação (`SettledOverlay`) presa ao array da resposta. `statement-item-parts.component.tsx` e `statement-format.ts` também são tipados por `TransactionDTO` (não citados no prompt, mas entram na retipagem).
- O frontend tem sua própria `TransactionSeriesDTO` no client (datas de auditoria como `string`); não existe no projeto padrão de "registro não encontrado" em hook, e a regra `react-hooks/set-state-in-effect` reprova `setState` síncrono em `useEffect`.
- O lint já falha (88 erros no frontend, 58 no backend) e o `npm run lint` do backend aplica `--fix` em tudo.
- A implementação roda em três sub-agentes sequenciais (negócio, backend, frontend); cada grupo termina com uma verificação para o agente seguinte partir de um estado verde.

## Goals / Non-Goals

**Goals:**

- Uma única regra para "essa ocorrência existe" (`ScheduledTransactionGenerator.occurrenceDate`) e uma única regra de filtro das entradas em memória (`StatementFilterPolicy`).
- Nenhuma conta de calendário nova: `occurrencesBetween` só estima o índice inicial e delega as datas a `occurrenceAt`.
- Extrato de um mês em uma requisição, com custo proporcional ao que o mês tem, e não à idade das séries.
- Reaproveitar sem duplicar: `TransactionFormComponent` + `transaction.schema.ts`, `TransactionSeriesFormComponent`, `DeleteConfirmationDialog`, conversões e seleção de vínculos dos adapters.

**Non-Goals:**

- Tratar a colisão da chave única como upsert atômico no banco (ver Riscos).
- Invalidar ou reescrever ocorrências gravadas quando a série muda.
- Reaproveitar `GET /transactions` no extrato ou alterar seu contrato.
- Suíte de testes de frontend.

## Decisions

### 1. `occurrencesBetween`: estimativa aritmética + ajuste de no máximo um passo

```ts
static occurrencesBetween(
  startDate: string, rule: RecurrenceRule,
  options: { from: string; to: string; endDate?: string | null; installments?: number | null },
): { index: number; date: string }[]
```

1. `first = firstOccurrence(startDate, rule)`. Se `first > to`, devolve `[]`.
2. Estimativa do índice inicial `i` (0 quando `from <= first`):
   - `WEEK`: dias entre `first` e `from` por `Date.UTC` dos dois `parse`, `i = ceil(dias / (7 × interval))`;
   - `MONTH`: `meses = (from.year × 12 + from.month) − (first.year × 12 + first.month)`, `i = max(0, floor(meses / interval))`;
   - `YEAR`: `anos = from.year − first.year`, `i = max(0, floor(anos / interval))`.
3. Ajuste: enquanto `occurrenceAt(i) < from`, `i++` (no máximo um passo em `MONTH`/`YEAR`, por causa do grampo e do dia dentro do mês).
4. Laço: enquanto `installments` ausente ou `i < installments`, calcula `date = occurrenceAt(i)`; para se `date > to` ou (`endDate` e `date > endDate`); empilha e `i++`.

Toda data sai de `occurrenceAt` — o grampo continua em um lugar só. O único cálculo novo é a diferença de dias/meses/anos para a estimativa, em helper privado ao lado de `parse`.

Alternativa: varrer desde o índice 0 — rejeitada, uma semanal aberta desde 2020 custaria ~350 iterações por mês consultado. Fórmula fechada sem ajuste — rejeitada, o grampo e o dia dentro do mês tornam a estimativa frágil nas bordas.

### 2. A ocorrência em memória é uma entidade, com `id` efêmero; o endereço é `(seriesId, occurrenceIndex)`

`ScheduledTransactionGenerator.generateForPeriod` monta cada ocorrência por `ScheduledTransaction.create` (que lança em falha) e devolve `ScheduledTransaction[]`. Um resultado inválido aqui é defeito de programação: estourar é melhor que uma entrada silenciosamente ausente. `toGeneratedDTO(entity, series)` monta o DTO com `materialized: false`, `createdAt`/`updatedAt` da entidade e os nomes/contexto da série.

Rotas, estado da página e decisão de upsert usam sempre o par. O `id` serve de chave de linha e de payload da **primeira** gravação — por isso, depois de efetivar pelo check, a sobreposição local continua válida: a linha gravada recebe o mesmo `id` da entrada.

Alternativa: ocorrência gerada sem `id` (`id: string | null`) — rejeitada, obrigaria `key` artificial na lista e um tipo diferente para a primeira gravação.

### 3. Entidade `ScheduledTransaction` no desenho da `Transaction`

Mesmo `tryCreate` (acúmulo de falhas com `Result.combine`, códigos remapeados de `Id`/`DateOnly`, opcionais vazios como `null`, invariante `status`/`settledOn` depois do combine), mais:

- `seriesId` e `accountId`: string vazia/ausente reprovada **antes** do `Id.tryCreate`.
- `occurrenceIndex`: `typeof === 'number' && Number.isInteger(v) && v >= 0`, sem `PositiveInteger` (que reprova 0).
- `occurrenceOn` e `expectedOn`: `DateOnly` com códigos próprios, sem relação de ordem.
- Sem `softDelete()`; `deletedAt` do `EntityProps` fica sempre `null` e não é persistido.

`SaveScheduledTransaction` aplica `cloneWith` só com os campos editáveis — `id`, `userId`, `seriesId`, `occurrenceIndex` e `occurrenceOn` nunca entram no objeto da derivação.

### 4. Upsert decidido pela consulta da ocorrência, não pelo `id`

Fluxo de `SaveScheduledTransaction.execute(input)`:

1. `findTransactionSeriesById.execute(seriesId, userId)` → `null` = `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND`.
2. `occurrenceOn = ScheduledTransactionGenerator.occurrenceDate(series, occurrenceIndex)` → `null` = `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`. O `occurrenceIndex` é validado aqui como inteiro `>= 0` antes de chamar o calculador (índice inválido → `null`).
3. `ScheduledTransaction.tryCreate({ id: input.id, userId, seriesId, occurrenceIndex, occurrenceOn, ...editáveis })` → falha propaga.
4. Vínculos pela `MovementReferencesQuery` (conta sempre; cartão/subcategoria só quando preenchidos).
5. `findScheduledTransactionByOccurrence.execute(seriesId, occurrenceIndex, userId)`:
   - achou → `repository.findById(existing.id)` → `entity.cloneWith(editáveis)` → `update` → `{ id: existing.id }`;
   - não achou → `repository.create(candidate)` → `{ id: candidate.id }`.

Decidir pelo `id` faria duas abas do mesmo mês (cada uma com seu `id` efêmero) tentarem inserir a mesma ocorrência. `FindScheduledTransaction` e `ResetScheduledTransaction` seguem o mesmo endereçamento; o reset resolve o id pela consulta e chama o `delete(id)` físico do contrato.

### 5. `occurrenceOn` separado de `expectedOn` e uma consulta para exibir e suprimir

`ListScheduledTransactionsInPeriodQuery` devolve as linhas com `expectedOn` **ou** `occurrenceOn` no período, sem filtros. No `FindMonthlyStatement`:

- **exibidas** = linhas com `from <= expectedOn <= to`;
- **supressão** = `Set` de `${seriesId}:${occurrenceIndex}` das linhas com `from <= occurrenceOn <= to`.

A ocorrência movida para outro mês não é exibida no mês de origem e mesmo assim bloqueia a geração dele. A supressão ignora filtros de propósito: uma ocorrência escondida pelo filtro não pode "reaparecer" como gerada.

Alternativa: uma coluna só (`expectedOn`) — rejeitada, mover a data faria o gerador recriar a ocorrência no mês original.

### 6. `FindMonthlyStatement`: três consultas, filtro único, ordenação estável

```
validate(from, to)                       → INVALID_STATEMENT_PERIOD
transactions = listTransactions({ userId, page: 1, pageSize: 500, expectedFrom: from, expectedTo: to, ...filters })
persisted    = listScheduledTransactionsInPeriod({ userId, from, to })
series       = listActiveTransactionSeries({ userId, from, to })
generated    = series.flatMap(s => generateForPeriod(s, { from, to }, isSuppressed).map(e => toGeneratedDTO(e, s)))
entries = [
  ...transactions.data.map(fromTransaction),
  ...shown(persisted).map(fromScheduled).filter(matches),
  ...generated.map(fromScheduled).filter(matches),
].sort((a, b) => b.expectedOn.localeCompare(a.expectedOn))   // Array.prototype.sort é estável (ES2019)
 .slice(0, STATEMENT_MAX_ENTRIES)
```

`StatementFilterPolicy.matches(entry, filters)` opera sobre `StatementEntryDTO` (por isso o filtro vem depois do mapeamento) e replica o `where` do `TransactionPrisma.listTransactions`: `search` por `toLocaleLowerCase().includes`, igualdade nos demais, `creditCardId` com precedência sobre `onlyCreditCard`. `from`/`to` validados com `DateOnly.tryCreate` e comparação de string.

Filtros do SQL para avulsas e em memória para ocorrências: as avulsas podem ser muitas; as ocorrências são limitadas pelas séries ativas no mês. `meta = { page: 1, pageSize: 500, total: entries.length, totalPages: 1 }`.

Alternativas: (a) paginar a união — rejeitada, `OFFSET` sobre linhas que não existem no banco; (b) filtrar ocorrências no SQL — rejeitada, as geradas não estão no banco, e duas implementações da regra divergiriam.

### 7. Modelo de leitura `monthly-statement` feito à mão

`modules/transaction/src/monthly-statement/{dto,model,use-case}` sem `provider`: não há entidade nem repositório. `StatementEntryKind` sem type guard (o valor nunca vem de fora). `StatementEntryMapper` com métodos estáticos `fromTransaction(TransactionDTO)` e `fromScheduled(ScheduledTransactionDTO)`. O `module-aggregate` materializaria entidade e repositório que o extrato não tem.

### 8. Backend: adapter, controllers e helper extraído

- `ScheduledTransactionPrisma implements ScheduledTransactionRepository` com `readonly findScheduledTransactionByOccurrence` e `readonly listScheduledTransactionsInPeriod` inline, no estilo de `TransactionPrisma`. Seleção = `referenceNamesSelect` + `series: { select: { name, kind, installments } }`; `toReferenceNames`, `toDbDate`/`fromDbDate` e `Number(decimal)` reaproveitados. `delete` = `prisma.scheduledTransaction.delete`. Consultas com `userId` e `series: { deletedAt: null }`; período com `OR: [{ expectedOn: { gte, lte } }, { occurrenceOn: { gte, lte } }]`, `orderBy: [{ expectedOn: 'desc' }, { createdAt: 'desc' }]`.
- `TransactionSeriesPrisma.listActiveTransactionSeries`: `where { userId, deletedAt: null, startDate: { lte: to }, OR: [{ endDate: null }, { endDate: { gte: from } }] }`, `orderBy: { startDate: 'asc' }`, reaproveitando o mapeamento de linha para DTO já existente.
- `ScheduledTransactionController` (`@Controller('scheduled-transactions')`): `GET|PUT|DELETE /:seriesId/:occurrenceIndex`; injeta `ScheduledTransactionPrisma`, `TransactionSeriesPrisma` e `TransactionPrisma` (só `movementReferences`); casos de uso montados no método. Helper privado `parseNumber(value)`: `number` passa; string vazia/ausente vira `undefined`; string vira `Number(trim)` — `NaN` segue para o domínio reprovar (`INVALID_MONEY_AMOUNT` / `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX`). `toHttpException`: `NotFoundException` para os três `*_NOT_FOUND` de endereço; `BadRequestException(errors)` para o resto.
- `StatementController` (`@Controller('statement')`): `GET` com `from`, `to` e filtros crus; `parseBooleanFlag` movido para `transaction-query.util.ts` e usado também pelo `TransactionController` (mesmo corpo).

### 9. Frontend: estado da página como união discriminada

```ts
type ViewMode =
  | { kind: 'list' }
  | { kind: 'form'; transaction?: TransactionDTO }
  | { kind: 'scheduled-form'; seriesId: string; occurrenceIndex: number }
  | { kind: 'series-form'; seriesId?: string; returnTo?: { seriesId: string; occurrenceIndex: number } };
```

Substitui `mode` + `editingTransaction` e remove `PageState`/`PAGE_SIZE`/`PaginationControls`. `Editar série` vai para `{ kind: 'series-form', seriesId, returnTo }`; Cancelar da edição volta para `{ kind: 'scheduled-form', ...returnTo }`. O formulário de transação avulsa recebe a entrada do extrato já no formato comum (decisão 10).

Alternativa: rotas novas por modo — rejeitada pelas especificações (sem rota nova).

### 10. Formulário de transação reaproveitado por tipo estrutural + `leadingSection`

`TransactionFormComponent` troca `transaction?: TransactionDTO` por `transaction?: TransactionFormRecord`, com `TransactionFormRecord = Pick<StatementEntryDTO, 'name' | 'note' | 'value' | 'direction' | 'accountId' | 'creditCardId' | 'subcategoryId' | 'status' | 'expectedOn' | 'settledOn'>` — `TransactionDTO`, `StatementEntryDTO` e `ScheduledTransactionDTO` do client satisfazem estruturalmente. Nova prop `leadingSection?: ReactNode` renderizada antes de `Lançamento`. Schema intacto; o título/botão continuam vindo das props existentes.

O bloco da série é montado na página com `ReadonlyTextField`s: nome, `SERIES_KIND_LABELS[seriesKind]`, `Parcela ${index + 1} de ${installments}` em `CLOSED`, e `formatDateOnly(occurrenceOn)` quando `expectedOn !== occurrenceOn`.

### 11. Hooks sem `setState` síncrono em efeito e "não encontrado" por callback

- `useStatement(params)`: mesmo desenho de `useTransactions` (chave serializada, contador de requisição, estado gravado só no `then`, resposta obsoleta descartada, `refresh` por contador), sem página.
- `useToggleStatementEntrySettled`: move `toSettledToggleInput` + sobreposição; ramo por `entry.kind` (`updateTransaction(entry.id, …)` ou `saveScheduledTransaction(entry.seriesId, entry.occurrenceIndex, { id: entry.id, … })`).
- `useScheduledTransaction(seriesId, occurrenceIndex, { onNotFound })` e `useTransactionSeries(seriesId, { onNotFound })`: carregam com o mesmo desenho, expõem `isNotFound` (404 do client) e chamam `onNotFound` **dentro do `then`** da promessa — nunca num `useEffect` que dispara `toast`/`setMode`. A página passa `onNotFound = () => { toast.error(message); backToList(); }`.
- Os clients distinguem 404 lançando o erro com `statusCode` (como `TransactionApiError` e `TransactionSeriesApiError`), para o hook decidir `isNotFound` sem comparar texto.

### 12. Formulário de série em modo edição por remontagem

`TransactionSeriesFormComponent` recebe `series?: TransactionSeriesDTO`. `defaultValues` é derivado da série (regra achatada de volta para os campos do formulário, parcelas, data fim) e `anchorTouched` nasce `true` quando há série. A página renderiza o formulário com `key={series.id}` depois do carregamento — o `defaultValues` vale na montagem, sem `reset` em efeito. Título, texto do botão e o aviso de alcance (acima de `Recorrência`) vêm por props/condição `series !== undefined`. O envio usa o mesmo `toSaveInput`; a página escolhe `useCreateTransactionSeries` ou `useUpdateTransactionSeries`.

### 13. Retipagem e renomeação dos arquivos do extrato

`group-transactions.ts` → `group-statement-entries.ts` (`groupStatementEntries`, `StatementEntryGroup`), `transaction-table.component.tsx` → `statement-table.component.tsx`, `transaction-card.component.tsx` → `statement-card.component.tsx`; `statement-item-parts.component.tsx` e `statement-format.ts` retipados por `StatementEntryDTO` sem renomear. Ícone `Repeat` + `Tooltip` e o texto `N/T` num componente pequeno em `statement-item-parts` usado pela tabela e pelo card. `useTransactions`, `listTransactions` e `ListTransactionsParams` removidos; `MutationResult`, opções e `useSaveTransaction`/`useDeleteTransaction` permanecem.

## Risks / Trade-offs

- [Duas gravações simultâneas da mesma ocorrência não gravada passam ambas pela consulta e uma bate na chave única] → o banco garante a integridade; a requisição perdedora responde erro genérico e um novo salvamento cai no ramo de alteração. Cenário raro (duas abas, mesmo clique quase simultâneo); tratar o `P2002` como alteração fica para quando aparecer na prática.
- [Alterar a regra da série pode deixar uma ocorrência gravada numa data que a regra nova não geraria, ou num índice que agora cai fora da série] → é o preço de respeitar a edição do usuário; a tela de edição avisa, e `Reverter para a série` desfaz uma a uma. Uma gravada com índice fora da nova série continua aparecendo (ela não depende da regra), mas não pode mais ser salva (`SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`); reverter continua possível.
- [`id` efêmero trocando a cada carregamento] → nada persiste o `id` de uma ocorrência gerada além da primeira gravação; chaves de React mudam só entre respostas, quando a lista é trocada inteira de qualquer forma.
- [Teto de 500 corta silenciosamente] → folga larga para um mês real; documentado na constante. Sinalizar truncamento fica fora de escopo.
- [Filtro em dois lugares (SQL e memória) divergir] → uma única política em memória, com teste por filtro espelhando o `where` do adapter; qualquer mudança de semântica de filtro passa a exigir alterar os dois, e o spec `monthly-statement-domain` fixa a semântica.
- [Série excluída com linhas gravadas fica com dados órfãos visíveis só no banco] → decisão deliberada (restaurar série está fora de escopo); a exclusão física da série remove as linhas em cascata.
- [Retirar a paginação do extrato muda o contrato consumido pela tela] → a mudança é interna ao frontend; `GET /transactions` segue igual para os testes de integração existentes.

## Migration Plan

1. Migração `add_scheduled_transaction` só cria tabela, restrição única, FKs e índices — sem backfill (nenhuma ocorrência precisa existir no banco para aparecer).
2. Backend e frontend sobem juntos: o frontend novo depende de `GET /statement`; o backend novo não quebra o frontend antigo (`GET /transactions` intacto).
3. Rollback: reverter o deploy do frontend volta a usar `GET /transactions`; a tabela nova pode ficar (ninguém a lê) ou ser removida revertendo a migração, perdendo apenas as ocorrências gravadas.
