## Why

O extrato mensal só registra transações avulsas: parcelamentos ("12x de R$ 250") e contas recorrentes (aluguel, assinatura) precisam ser lançados um a um. A `TransactionSeries` é a segunda entidade agrupada como `<Movement>` e descreve o **molde** de um parcelamento ou de uma recorrência; esta mudança entrega o cadastro dela e o cálculo de agenda que a próxima (prompt 19, `ScheduledTransaction`) vai usar para gerar as ocorrências do extrato — sem gerar nada ainda.

## What Changes

- Novo agregado `TransactionSeries` em `modules/transaction/src/transaction-series`, reaproveitando o núcleo `movement` (`MovementName`, `MovementNote`, `Direction`, `MovementReferencesQuery`) e o `@poupig/shared` (`Id`, `Money`, `DateOnly`, `DayOfMonth`, `PositiveInteger`), **sem nenhum VO novo**
- Conjuntos fechados do agregado: `SeriesKind` (`OPEN`/`CLOSED`), `FrequencyUnit` (`WEEK`/`MONTH`/`YEAR`) e `DayOfWeek` numérico ISO-8601 (`MONDAY = 1` … `SUNDAY = 7`), cada um com type guard
- `RecurrenceRule`: união discriminada por `unit` com validação normalizadora (`tryCreateRecurrenceRule`), teto de intervalo `99` e códigos `INVALID_RECURRENCE_*`; âncora de outra unidade é descartada, não reprovada
- Serviço de domínio `RecurrenceScheduleCalculator` (puro, em UTC): primeira ocorrência `>=` início, n-ésima ocorrência e última parcela, com dia inexistente grampeado no fim do mês sem contaminar os meses seguintes
- Entidade com as invariantes da série: `CLOSED` exige parcelas (teto `480`) e tem `endDate` **calculado**, ignorando o do payload; `OPEN` descarta parcelas e aceita `endDate` opcional não anterior à primeira ocorrência; exclusão lógica; sem chave única
- `TransactionSeriesRepository`, `TransactionSeriesDTO`, consultas `FindTransactionSeriesByIdQuery`/`ListTransactionSeriesQuery` e casos de uso `SaveTransactionSeries` (cria sem `id`, atualiza com `id`, devolve `{ id }`) e `DeleteTransactionSeries`
- Backend: enums `SeriesKind`/`FrequencyUnit` e model `TransactionSeries` no Prisma com a regra em **colunas planas**, migração `add_transaction_series`, `TransactionSeriesPrisma` e `TransactionSeriesController` em `/transaction-series` (`POST`, `PUT /:id`, `GET` paginado e filtrado, `GET /:id`, `DELETE /:id`), mais `.http` de integração. As conversões de data UTC e a seleção dos nomes de vínculo do `TransactionPrisma` passam para um utilitário do módulo, sem mudar comportamento
- Frontend: formulário de criação da série como terceiro modo da página do extrato (sem rota nova), com prévia da agenda calculada pelo próprio domínio; o botão "Nova transação" da barra passa a abrir um menu com `Transação avulsa` e `Série parcelada ou recorrente`
- i18n: novos códigos de série e de regra de recorrência em pt e en
- Só a **criação** fica exposta na interface; buscar, editar, listar e excluir existem no backend e chegam à tela no prompt 19

## Capabilities

### New Capabilities

- `recurrence-schedule`: regra de recorrência (`FrequencyUnit`, `DayOfWeek`, `RecurrenceRule` e sua validação normalizadora) e o cálculo determinístico da agenda (primeira, n-ésima e última ocorrência, grampo de fim de mês, UTC)
- `transaction-series-domain`: agregado `TransactionSeries` — atributos, `SeriesKind`, invariantes de parcelas e data fim, remapeamento de códigos, exclusão lógica, contrato do repositório, `TransactionSeriesDTO` e consultas de leitura
- `transaction-series-use-cases`: `SaveTransactionSeries` (criação x atualização, posse, conferência de vínculos, recálculo da data fim) e `DeleteTransactionSeries`
- `transaction-series-backend`: model e migração Prisma, persistência da regra em colunas planas, endpoints em `/transaction-series`, mapeamento de falhas HTTP e testes de integração
- `transaction-series-frontend`: formulário de criação da série no extrato (seções, padrões, âncora derivada da data de início, prévia da agenda), camada de dados (client, schema, rótulos, hook) e dicionário de erros

### Modified Capabilities

- `transaction-frontend`: o botão "Nova transação" da barra de ferramentas deixa de abrir direto o formulário avulso e passa a abrir um menu com `Transação avulsa` e `Série parcelada ou recorrente`

## Impact

- **Domínio** (`modules/transaction`): nova pasta `src/transaction-series`, barril `src/index.ts` estendido (preservando `movement` e `transaction`), testes em `test/transaction-series` e `test/mock/in-memory-transaction-series.repository.ts`. Nada muda em `src/movement` nem em `src/transaction`
- **Backend** (`apps/backend`): `prisma/models/transaction.model.prisma`, migração `add_transaction_series`, relação inversa `transactionSeries TransactionSeries[]` em `User`, `Account`, `Card` e `Subcategory` (única alteração em models de outros módulos); em `src/modules/transaction`, controller, adapter, `.http`, `transaction.module.ts` e o utilitário extraído de `transaction.prisma.ts`
- **API REST**: novos `POST|GET /transaction-series` e `GET|PUT|DELETE /transaction-series/:id`, protegidos pelo `JwtGuard` global. `/transactions` não muda
- **Frontend** (`apps/frontend`): `modules/transaction/{data,components,pages}` (client, schema, rótulos e hook da série, formulário, modo `series-form` e menu da barra) e `shared/i18n/messages.{pt,en}.ts`. Nenhuma rota, item de menu lateral ou componente compartilhado novo
- **Qualidade**: `npm run build` verde, testes de domínio e backend verdes e `npx eslint` sem `--fix` limpo nos arquivos criados ou alterados (os 88 erros do frontend e 58 do backend continuam fora)
- **Fora de escopo**: `ScheduledTransaction` e geração de ocorrências; série no extrato, dashboard ou totais; listagem, edição e exclusão de série pela tela; ajustes por parcela (pular, pausar, reajustar, "daqui para frente"); regras que a `RecurrenceRule` não descreve; fatura, saldo e limite; vínculo com avulsas e importação; política para vínculos excluídos e restauração; multi-moeda e juros; corrigir o lint pré-existente
