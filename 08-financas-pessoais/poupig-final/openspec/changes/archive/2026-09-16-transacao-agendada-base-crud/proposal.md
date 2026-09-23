## Why

A `TransactionSeries` (prompt 18) já descreve parcelamentos e recorrências, mas nada do que ela promete aparece no extrato: o usuário cadastra "12x de R$ 250" e o mês continua vazio. Falta a `ScheduledTransaction` — a ocorrência que a série gera —, um extrato que junte avulsas e ocorrências na mesma lista, e um caminho na tela para ajustar, efetivar, reverter uma ocorrência e editar ou excluir a série a partir dela.

## What Changes

- `RecurrenceScheduleCalculator` ganha `occurrencesBetween`: as ocorrências (índice e data) de uma série dentro de um período, encontrando o primeiro índice por aritmética em vez de varrer desde o índice 0, e respeitando parcelas e data fim
- Novo agregado `ScheduledTransaction` em `modules/transaction/src/scheduled-transaction`, **sem VO novo**: mesma forma e mesma invariante de efetivação da `Transaction`, mais `seriesId`, `occurrenceIndex` (base 0) e `occurrenceOn` (data canônica, imutável) separada de `expectedOn` (data que o usuário vê e pode mover); chave de negócio `(seriesId, occurrenceIndex)`; **sem exclusão lógica** — reverter apaga a linha fisicamente
- A ocorrência **nasce em memória** na consulta do mês, como entidade válida com `id` efêmero, e só é gravada quando o usuário altera algo (formulário ou check de efetivação). O endereço de uma ocorrência é sempre `(seriesId, occurrenceIndex)`, nunca o `id`
- Serviço de domínio `ScheduledTransactionGenerator` (data de uma ocorrência, geração do período suprimindo as materializadas, DTO da ocorrência gerada), `ScheduledTransactionRepository`, `ScheduledTransactionDTO` com `materialized`, consultas `FindScheduledTransactionByOccurrenceQuery`, `ListScheduledTransactionsInPeriodQuery` e `ListActiveTransactionSeriesQuery`
- Casos de uso `SaveScheduledTransaction` (upsert pela ocorrência, nunca renumera a linha gravada, nunca aceita `occurrenceOn` do cliente), `FindScheduledTransaction` (persistida ou gerada) e `ResetScheduledTransaction`
- Novo modelo de leitura `monthly-statement` (sem entidade nem repositório): `StatementEntryDTO` unificando avulsas e ocorrências, `StatementFilterPolicy` (uma regra de filtro aplicada em memória nas ocorrências, com a mesma semântica do SQL das avulsas) e `FindMonthlyStatement` (período validado, supressão das ocorrências já gravadas **ou movidas**, ordenação estável por data prevista desc e teto de 500 entradas)
- Backend: model `ScheduledTransaction` com `@@unique([seriesId, occurrenceIndex])` e migração `add_scheduled_transaction`; `GET|PUT|DELETE /scheduled-transactions/:seriesId/:occurrenceIndex` (sem `POST`); `GET /statement` devolvendo o mês inteiro; `listActiveTransactionSeries` no adapter de série; helper de `onlyCreditCard` extraído do `TransactionController` sem mudar comportamento; `.http` de integração
- **BREAKING (frontend)**: o extrato deixa de consumir `GET /transactions` e de paginar — passa a pedir o mês inteiro a `GET /statement`. `useTransactions`/`listTransactions` saem do frontend; o endpoint `GET /transactions` continua igual no backend
- Frontend: arquivos do extrato retipados por `StatementEntryDTO` e renomeados (`group-statement-entries.ts`, `statement-table.component.tsx`, `statement-card.component.tsx`); ícone discreto de recorrência (com `3/12` no parcelamento) na linha; o check de efetivação passa a materializar ocorrências; novo modo `scheduled-form` reaproveitando o `TransactionFormComponent` com um bloco somente leitura da série, `Reverter para a série` (só quando gravada) e `Editar série` (sempre)
- Frontend: a série passa a ser **editada e excluída** a partir de uma ocorrência, no mesmo formulário da criação, com aviso de alcance da edição e confirmação explícita das consequências da exclusão; criar uma série passa a recarregar o extrato, porque as ocorrências dela aparecem na hora
- i18n: códigos `SCHEDULED_TRANSACTION_*`, `INVALID_SCHEDULED_TRANSACTION_*` e `INVALID_STATEMENT_PERIOD` em pt e en

## Capabilities

### New Capabilities

- `scheduled-transaction-domain`: agregado `ScheduledTransaction` — atributos, obrigatórios com códigos próprios, invariante de efetivação, `occurrenceOn` x `expectedOn`, derivação preservando a identidade da ocorrência, ausência de exclusão lógica, `ScheduledTransactionErrors`, contrato do repositório (exclusão física), `ScheduledTransactionDTO`, consultas de leitura e o gerador de ocorrências
- `scheduled-transaction-use-cases`: `SaveScheduledTransaction` (upsert pela ocorrência, validação da ocorrência contra a série, vínculos), `FindScheduledTransaction` (persistida ou gerada) e `ResetScheduledTransaction`
- `monthly-statement-domain`: modelo de leitura do extrato unificado — `StatementEntryDTO`, política única de filtros, supressão das ocorrências gravadas ou movidas, ordenação, teto e validação do período
- `scheduled-transaction-backend`: model e migração Prisma com chave única da ocorrência, persistência, endpoints em `/scheduled-transactions/:seriesId/:occurrenceIndex`, mapeamento de falhas HTTP e testes de integração
- `monthly-statement-backend`: endpoint `GET /statement` com período obrigatório, filtros e resposta do mês inteiro no formato paginado compartilhado, e testes de integração
- `scheduled-transaction-frontend`: formulário da ocorrência no extrato (bloco da série, reverter, editar série), sinal visual de recorrência na lista e dicionário de erros

### Modified Capabilities

- `recurrence-schedule`: novo requisito de ocorrências dentro de um período, com custo independente da idade da série
- `transaction-series-domain`: nova consulta de séries ativas em um período
- `transaction-series-frontend`: a interface deixa de ser só de criação — a série passa a ser editada e excluída a partir de uma ocorrência; criar ou alterar uma série recarrega o extrato
- `transaction-frontend`: o extrato passa a listar o mês inteiro (avulsas e ocorrências) sem paginação; filtros, agrupamento e abertura de linha consideram os dois tipos de entrada; o check de efetivação também grava ocorrências

## Impact

- **Domínio** (`modules/transaction`): novas pastas `src/scheduled-transaction` e `src/monthly-statement`; `RecurrenceScheduleCalculator` estendido e nova consulta em `src/transaction-series/provider`; barril `src/index.ts` estendido (preservando `movement`, `transaction` e `transaction-series`); testes em `test/scheduled-transaction`, `test/monthly-statement`, `test/mock/in-memory-scheduled-transaction.repository.ts` e no teste existente do calculador. Nenhum comportamento de `Transaction` ou `TransactionSeries` muda
- **Backend** (`apps/backend`): `prisma/models/transaction.model.prisma`, migração `add_scheduled_transaction`, relação inversa `scheduledTransactions` em `TransactionSeries`, `User`, `Account`, `Card` e `Subcategory` (única alteração em models de outros módulos); em `src/modules/transaction`, `scheduled-transaction.prisma.ts`, `scheduled-transaction.controller.ts`, `statement.controller.ts`, `listActiveTransactionSeries` no `TransactionSeriesPrisma`, helper de `onlyCreditCard` extraído, `transaction.module.ts` e dois `.http`
- **API REST**: novos `GET|PUT|DELETE /scheduled-transactions/:seriesId/:occurrenceIndex` e `GET /statement`, protegidos pelo `JwtGuard` global. `/transactions` e `/transaction-series` não mudam
- **Frontend** (`apps/frontend`): `modules/transaction/{data,components,pages}` (clients e hooks de extrato e ocorrência, edição/exclusão de série, renomeações e retipagem do extrato, formulário reaproveitado com `leadingSection`, modos `scheduled-form` e `series-form` com `seriesId`) e `shared/i18n/messages.{pt,en}.ts`. Nenhuma rota, item de menu ou componente compartilhado novo
- **Qualidade**: `npm run build` verde, testes de domínio e backend verdes e `npx eslint` sem `--fix` limpo nos arquivos criados ou alterados (os 88 erros do frontend e 58 do backend continuam fora)
- **Fora de escopo**: materialização em lote ou por job; "editar daqui para frente", pausar e reajustar série a partir de uma ocorrência; listagem e menu de séries; restaurar série excluída; totais, saldos e projeção; fatura e limite de cartão; paginação real e ordenação configurável do extrato; vincular avulsa a série e importação; mudanças em `GET /transactions`, no CRUD de série e nos módulos `account`, `category`, `credit-card` e `auth` além das relações inversas; multi-moeda e juros; corrigir o lint pré-existente
