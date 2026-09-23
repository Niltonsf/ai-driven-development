# Lista de Tarefas

Cadastro (CRUD) de `TransactionSeries` no módulo `transaction`: a segunda entidade agrupada por `<Movement>`, que descreve um parcelamento ou uma recorrência e que, numa mudança futura, vai **gerar** as `ScheduledTransaction` exibidas no extrato.

## Entidade

- Nome: `TransactionSeries` — plural na URL: `transaction-series`
- Módulo: `modules/transaction` (os módulos `account`, `category`, `credit-card` e `auth` só são tocados nas relações inversas do Prisma, ver seção Backend)
- Novo agregado, pasta irmã de `src/movement` e de `src/transaction`: `modules/transaction/src/transaction-series`
- Atributos:
  - `id` (identificador da série, gerado quando ausente — `Id` do `@poupig/shared`)
  - `userId` (dono da série — sempre do usuário autenticado, nunca vem do cliente)
  - `name` (obrigatório — `MovementName`, do núcleo `movement`)
  - `note` (opcional, `null` quando ausente — `MovementNote`, do núcleo `movement`)
  - `value` (obrigatório — `Money` do `@poupig/shared`, em reais, positivo; zero é inválido)
  - `direction` (obrigatório — enum `Direction`: `IN` ou `OUT`)
  - `accountId` (obrigatório — conta que paga ou recebe as parcelas)
  - `creditCardId` (opcional, `null` quando ausente)
  - `subcategoryId` (opcional, `null` quando ausente)
  - `kind` (obrigatório — enum `SeriesKind`: `CLOSED` (parcelamento, fim calculado) ou `OPEN` (recorrência, fim opcional))
  - `recurrence` (obrigatório — `RecurrenceRule`, a âncora que diz **onde** cada ocorrência cai)
  - `startDate` (obrigatório — `DateOnly`, a partir de quando a série vale)
  - `endDate` (calculado quando `CLOSED`; opcional e informado pelo usuário quando `OPEN`; `null` quando a série é aberta sem fim)
  - `installments` (obrigatório quando `CLOSED`, `null` quando `OPEN` — quantidade de parcelas)
  - `createdAt`, `updatedAt`, `deletedAt` vêm do `EntityProps` do `@poupig/shared` e não são declarados de novo
- **Nenhum VO de identificador novo**: `Id` do `@poupig/shared` atende `id`, `userId`, `accountId`, `creditCardId` e `subcategoryId`, como já é feito em `Transaction`
- A série **não tem `status` nem `settledOn`**: situação e efetivação são das ocorrências geradas (`ScheduledTransaction`), não do molde que as descreve
- O sinal continua sendo do `direction`: `Money` é sempre positivo
- Conjuntos fechados desta mudança (linguagem ubíqua, nomes exatamente assim):
  - `SeriesKind = OPEN | CLOSED`
  - `FrequencyUnit = WEEK | MONTH | YEAR`
  - `DayOfWeek = MONDAY(1) … SUNDAY(7)` (ISO-8601, **numérico**)
- `RecurrenceRule` é uma união discriminada por `unit`:
  - `{ unit: 'WEEK';  interval: number; weekDay: DayOfWeek }`
  - `{ unit: 'MONTH'; interval: number; dayOfMonth: number }`
  - `{ unit: 'YEAR';  interval: number; month: number; dayOfMonth: number }`
- Exclusão **lógica**, como `Transaction` e os demais cadastros: `softDelete()` preenche `deletedAt`, toda consulta filtra `deletedAt: null` e o `deletedAt` não sai no DTO
- Chave única: **nenhuma**. Duas séries do mesmo usuário podem ter o mesmo nome, valor e frequência — não criar checagem de unicidade nem código `TRANSACTION_SERIES_ALREADY_EXISTS`
- Listagem (existe no backend, ainda sem tela): ordenar por `startDate` desc, com `createdAt` desc como desempate. Filtros: busca por nome, `kind`, `direction` e `accountId`
- Grupos do formulário: `Lançamento` (nome, valor, direção), `Vínculos` (conta, cartão, subcategoria), `Recorrência` (parcelamento/recorrência, início, frequência, intervalo, âncora, parcelas ou data fim), `Observação`

## Contexto Atual (verificado no código)

> Estado real do repositório na abertura desta mudança — usar como ponto de partida, não repetir o que já existe.

- **Pré-requisito: os prompts 15 e 16 precisam estar concluídos.** O que eles entregam e esta mudança reaproveita:
  - `modules/transaction/src/movement` (prompt 15): `MovementName`, `MovementNote`, `Direction` + `isDirection`, `TransactionStatus` + `isTransactionStatus`, `MovementErrors` (`INVALID_DIRECTION`, `INVALID_TRANSACTION_STATUS`) e a **`MovementReferencesQuery`** (`provider/movement-references.query.ts`, com `accountBelongsToUser`, `creditCardBelongsToUser` e `subcategoryBelongsToUser`), criada no núcleo justamente para a série reaproveitar. **Não** mover nem recriar
  - `packages/shared/src/vo/money.vo.ts`: `Money` (reais, positivo, duas casas, `INVALID_MONEY_AMOUNT`)
  - `modules/transaction/src/transaction` (prompt 15) — **referência direta de estilo**: entidade com `tryCreate` + `Result.combine`, opcionais validados só quando preenchidos, `softDelete()`, `TransactionErrors` (`as const`) no arquivo da entidade com `TRANSACTION_NOT_FOUND`, invariante e códigos remapeados de `Id`/`DateOnly`; `TransactionRepository extends CrudRepository<Transaction>` com `findById` falhando em ausente/excluído; `FindTransactionByIdQuery`/`ListTransactionsQuery` com `PaginatedInputDTO`/`PaginatedResultDTO`; `SaveTransaction` (sem `id` cria, com `id` exige existência e posse) e `DeleteTransaction`, cada um com seu objeto de erros; testes em `test/transaction` e mocks em `test/mock` (inclusive `in-memory-movement-references.query.ts`)
  - `apps/backend/prisma/models/transaction.model.prisma` (prompt 15): enums `Direction`/`TransactionStatus`, model `Transaction` (`@@map("transaction")`, snake_case, `Decimal(14, 2)`, `@db.Date`, `VarChar(100)`/`VarChar(500)`, `deletedAt`) e as relações inversas `transactions Transaction[]` em `User` (`auth.model.prisma`), `Account` (`account.model.prisma`), **`Card`** (`credit-card.model.prisma`) e `Subcategory` (`category.model.prisma`). Migração `add_transaction`
  - `apps/backend/src/modules/transaction` (prompts 15 e 16): `TransactionController` (`@Controller('transactions')`: `POST`, `PUT /:id`, `GET` paginado, `GET /:id`, `DELETE /:id`; `NotFoundException` para `TRANSACTION_NOT_FOUND`), `TransactionPrisma` (repositório + `findTransactionById`, `listTransactions` e `movementReferences` como atributos inline, conversão de `Decimal` e de `@db.Date` em UTC) e `transaction.module.ts` (importa `DbModule`, provê e exporta `TransactionPrisma`). O `JwtGuard` é global: nada de `@Public()`
  - Frontend (prompts 15 e 16), em `apps/frontend/src/modules/transaction`: `data/transaction-api.client.ts`, `data/transaction.schema.ts` (VOs do domínio; `accountId` com `Text` porque `Id` aceita vazio gerando uuid; `direction`/`status` fora do schema; refinamento do `v`), `data/use-transactions.ts` (hooks sem `any` e sem `setState` síncrono em efeito, `useTransactionOptions` com contas e cartões ativos numa página de 50 e subcategorias agrupadas), `data/transaction.labels.ts`, `components/transaction-form.component.tsx`, `components/statement-toolbar.component.tsx` (com o botão **"Nova transação"**) e `pages/monthly-statement.page.tsx` (`mode: 'list' | 'form'`, o formulário abre na própria página). O dicionário de erros é o `shared/i18n` via `getErrorMessage`
  - `apps/frontend/src/shared/components/ui/money-input.tsx` (prompt 15) com `MoneyInput` e `formatCurrency`; `shared/util/month.util.ts` (prompt 16)
- `@poupig/shared` já tem `Id`, `DateOnly` (aceita `Date` ou `string`, normaliza para `YYYY-MM-DD`, falha com `INVALID_DATE_ONLY`), `DayOfMonth` (inteiro 1..31, falha com `INVALID_DAY_OF_MONTH` ou `DAY_OF_MONTH_OUT_OF_RANGE`), `PositiveInteger` (inteiro ≥ 1, `INVALID_POSITIVE_INTEGER`), `Entity`/`EntityProps` (com `cloneWith`), `Result`, `UseCase`, `CrudRepository` e as interfaces de paginação — usar, não reimplementar
- `ValueObject.equals` compara `value` com `===`: os VOs do projeto são de **valores escalares**. `RecurrenceRule` é objeto e por isso **não** é `ValueObject` (ver Decisões)
- Padrão de enum do projeto: `enum` do TypeScript (`account-type.enum.ts`, `card-brand.enum.ts`, e `direction.enum.ts`/`transaction-status.enum.ts` do prompt 15), com type guard no mesmo arquivo. Enum **numérico** do TypeScript tem mapeamento reverso (`Object.values(DayOfWeek)` devolve também os nomes), então o guard de `DayOfWeek` não pode se basear em `Object.values`
- **Não existem** no projeto: helpers `optional()`/`as()`/`validateOptional()`/`requiredId()`, método `toDTO()` em entidade, arquivos `*.errors.ts`/`*.constants.ts` em agregado, helpers `toNumber`/`toPage`/`toSearch` nos controllers, `routes.ts`, `authenticatedRequest`, mapas `*-error.ts` e rotas próprias de formulário
- Skill `module-domain-service`: serviço de domínio é classe com método estático (ou instância simples), nome orientado à regra (`*Calculator`, `*Policy`), arquivo `*.service.ts` em `modules/*/src/**`, sem I/O e sem dependência de framework
- `shared/components/ui` já tem `dropdown-menu` (`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`), `readonly-text-field` (`ReadonlyTextField` com `value`), `radio-group` (`RadioGroup`, `RadioGroupItem`), `date-picker-input`, `combobox`, `input`, `textarea`, `label`, `form-section-layout`, `form-error-message` e `page-section-header` — usar, não recriar
- O frontend **não tem suíte de testes** e o `npx eslint .` **já falha com 88 erros pré-existentes** em outros arquivos; as regras `react-hooks/set-state-in-effect` e `@typescript-eslint/no-explicit-any` reprovam `setState` síncrono em `useEffect` e `any`. O backend **já falha com 58 erros e 1 aviso** no `npx eslint "src/**/*.ts"`, e o script `lint` dele roda com `--fix`. Domínio e backend têm testes e continuam valendo
- O monorepo usa **npm** + Turbo, não pnpm

## Decisões (fechar antes de codar, para não abrir discussão no meio)

- **Só a criação fica exposta na interface**. O CRUD é completo no domínio e no backend (salvar, buscar por id, listar paginado e excluir), mas a única porta de entrada na tela é o formulário de criação. Edição e exclusão pela interface chegam no prompt 19, a partir das ocorrências que a série gera no extrato (botão `Editar série` dentro da ocorrência); listagem de séries não existe — nenhum item de menu e nenhuma rota nova
- **O formulário da série abre na própria página do extrato**, como terceiro modo (`mode: 'list' | 'form' | 'series-form'`), seguindo a mesma navegação de `Transaction`. Nada de rota `/transaction-series/novo`
- **Parcelamento e recorrência são o mesmo agregado**, separados pelo `kind`: `CLOSED` é o parcelamento (o usuário informa a quantidade de parcelas e o **sistema calcula** a data fim) e `OPEN` é a recorrência (a data fim é opcional e do usuário). Dois agregados duplicariam valor, vínculos, âncora e frequência
- **`endDate` de série `CLOSED` é sempre calculado, nunca aceito do cliente**: é a data da última parcela, derivada de `startDate` + `recurrence` + `installments`. Valor enviado no payload é ignorado e sobrescrito
- **`installments` só existe em série `CLOSED`**: em `OPEN` o valor informado é descartado para `null`, sem falhar (mesma normalização que `Transaction` faz com `settledOn` fora de `SETTLED`). `CLOSED` **sem** `installments` falha — é o dado que define a série
- **`RecurrenceRule` não é `ValueObject`**: é um tipo união com uma função de validação (`tryCreateRecurrenceRule`) que devolve `Result<RecurrenceRule>`, no mesmo espírito dos type guards dos enums do módulo
- **A regra é normalizadora, não rigorosa com o excedente**: a validação lê `unit` e só considera as âncoras daquela unidade; âncora de outra unidade que venha junto no payload é descartada, não é erro (é o formulário trocando de frequência sem limpar o campo anterior)
- **A âncora manda, o `startDate` só diz a partir de quando**: a primeira ocorrência é a **primeira data >= `startDate`** que casa com a âncora, e o intervalo conta a partir dela. Ex.: mensal a cada 3, `dayOfMonth: 15`, `startDate: 20/01` → 15/02, 15/05, 15/08
- **Dia que não existe no mês é grampeado no último dia do mês** (31 em abril → 30; 29/02 em ano comum → 28), e o grampo **não contamina** os meses seguintes: a âncora continua sendo 31. O mesmo vale para `YEAR` com 29/02
- **Nada de fuso em lugar nenhum**: toda a aritmética de data do domínio é feita em UTC (`Date.UTC`) e o resultado sai como `YYYY-MM-DD`
- **Enums seguem o padrão do projeto**: `SeriesKind` e `FrequencyUnit` como `enum` de string do TypeScript espelhados como enums do Prisma (igual a `Direction`); `DayOfWeek` como `enum` **numérico** (`MONDAY = 1` … `SUNDAY = 7`) gravado como inteiro
- **A regra é persistida em colunas planas** (`frequencyUnit`, `frequencyInterval`, `weekDay`, `dayOfMonth`, `month`), não como JSON: a geração das ocorrências vai querer consultar por unidade, e coluna anulável é conferível pelo banco. A união é remontada no adapter
- **Limites ficam no domínio, sem arquivo de constantes**: `MAX_RECURRENCE_INTERVAL = 99` exportado de `recurrence-rule.ts` e `MAX_INSTALLMENTS = 480` (40 anos de série mensal) exportado de `transaction-series.entity.ts`. O teto de parcelas existe para a geração futura não explodir, não porque o usuário erraria
- **Códigos de erro seguem o desenho do `Transaction`**: invariantes, códigos remapeados e `TRANSACTION_SERIES_NOT_FOUND` no `TransactionSeriesErrors` do arquivo da entidade; os da regra no `RecurrenceRuleErrors` de `recurrence-rule.ts`; os de vínculo no objeto de erros do caso de uso. A série **não** reaproveita os `TRANSACTION_*_NOT_FOUND` da `Transaction`: a mensagem que o usuário lê fala da série
- **A série não aparece no extrato** e não gera nada nesta mudança: salvar grava a série e pronto. A geração das `ScheduledTransaction` é outra mudança (prompt 19), e vai reaproveitar o serviço de agenda entregue aqui

## Negócio

- Criar o agregado `transaction-series` com a skill `module-aggregate` em modo `example` (`node .claude/skills/module-aggregate/scripts/create-aggregate.js --module transaction --aggregate transaction-series --mode example`) e trocar o caso de uso de exemplo pelos desta mudança, preservando os exports de `movement` e `transaction` em `src/index.ts`
- Criar os conjuntos fechados em `transaction-series/model`, cada um com type guard no mesmo arquivo:
  - `series-kind.enum.ts`: `enum SeriesKind { OPEN = 'OPEN', CLOSED = 'CLOSED' }` + `isSeriesKind`
  - `frequency-unit.enum.ts`: `enum FrequencyUnit { WEEK = 'WEEK', MONTH = 'MONTH', YEAR = 'YEAR' }` + `isFrequencyUnit`
  - `day-of-week.enum.ts`: `enum DayOfWeek { MONDAY = 1, …, SUNDAY = 7 }` + `isDayOfWeek` (inteiro entre 1 e 7, **sem** `Object.values`, por causa do mapeamento reverso). Documentar que é ISO-8601 e que a semana começa na segunda
- Criar `model/recurrence-rule.ts` com o tipo união `RecurrenceRule`, o tipo cru de entrada `RecurrenceRuleInput` (tudo opcional, números aceitando `number | string`, já que vêm de formulário), `MAX_RECURRENCE_INTERVAL`, `RecurrenceRuleErrors` (`as const`) e `tryCreateRecurrenceRule(input): Result<RecurrenceRule>`:
  - `unit` fora do conjunto → `INVALID_RECURRENCE_FREQUENCY_UNIT`
  - `interval` validado por `PositiveInteger` e limitado por `MAX_RECURRENCE_INTERVAL` → `INVALID_RECURRENCE_INTERVAL`
  - `WEEK` exige `weekDay` válido (`isDayOfWeek`) → `INVALID_RECURRENCE_WEEK_DAY`
  - `MONTH` exige `dayOfMonth` validado pelo `DayOfMonth` do `@poupig/shared` → `INVALID_RECURRENCE_DAY_OF_MONTH`
  - `YEAR` exige `month` (inteiro 1..12) → `INVALID_RECURRENCE_MONTH` — e `dayOfMonth`, com o mesmo código de `MONTH`
  - âncora de unidade diferente da escolhida é descartada, não é erro
- Criar o serviço de domínio `model/recurrence-schedule-calculator.service.ts` (skill: module-domain-service): classe `RecurrenceScheduleCalculator` com métodos estáticos puros, sem repositório e sem `Date.now()` no meio da conta:
  - `firstOccurrence(startDate, rule): string` — primeira data `>= startDate` que casa com a âncora
  - `occurrenceAt(startDate, rule, index): string` — a n-ésima ocorrência (índice base 0), somando `interval` a partir da primeira
  - `lastOccurrence(startDate, rule, installments): string` — atalho para `occurrenceAt(..., installments - 1)`, que é a data fim de uma série `CLOSED`
  - `WEEK`: anda de `7 * interval` dias; `MONTH`: anda de `interval` meses sobre a âncora `dayOfMonth`, grampeando no último dia do mês; `YEAR`: anda de `interval` anos sobre `month`/`dayOfMonth`, com o mesmo grampo (29/02)
  - Toda a conta em UTC, entrada e saída em `YYYY-MM-DD`. O grampo é aplicado na leitura de cada ocorrência e **nunca** reescreve a âncora
- Criar a entidade `TransactionSeries` em `model/transaction-series.entity.ts` (skill: module-entity), no desenho da `Transaction` e **sem criar nenhum VO novo**:
  - `MovementName`, `MovementNote`, `Money`, `Id` e `DateOnly` vindos do que já existe; `direction` validado por `isDirection` (falha com `MovementErrors.INVALID_DIRECTION`)
  - `kind` validado por `isSeriesKind`, `recurrence` por `tryCreateRecurrenceRule`
  - `installments` validado por `PositiveInteger` e por `MAX_INSTALLMENTS`
  - opcionais só passam pelo VO quando preenchidos; string vazia vira `null`
  - invariantes, aplicadas depois da validação dos atributos:
    - `CLOSED` sem `installments` → `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`
    - `OPEN` normaliza `installments` para `null`, sem falhar
    - `CLOSED` **calcula** `endDate` com `RecurrenceScheduleCalculator.lastOccurrence` e ignora o que veio do payload
    - `OPEN` aceita `endDate` opcional; quando informado, precisa ser `>=` à primeira ocorrência → `TRANSACTION_SERIES_END_DATE_BEFORE_START`
  - `softDelete()` como na `Transaction`
- Exportar `TransactionSeriesErrors` (`as const`) no arquivo da entidade, **sem** repetir códigos do núcleo, dos VOs nem da regra:
  - `TRANSACTION_SERIES_NOT_FOUND` (usado pelo adapter e pelos casos de uso)
  - `INVALID_SERIES_KIND`, `INVALID_TRANSACTION_SERIES_INSTALLMENTS`
  - `INVALID_TRANSACTION_SERIES_ACCOUNT_ID`, `INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID` (remapeando o `INVALID_ID` do `Id`; `id`/`userId` continuam com `INVALID_ID`). `accountId` ausente ou vazio é reprovado com `INVALID_TRANSACTION_SERIES_ACCOUNT_ID` **antes** do `Id`, que geraria um uuid
  - `INVALID_TRANSACTION_SERIES_START_DATE`, `INVALID_TRANSACTION_SERIES_END_DATE` (remapeando o `INVALID_DATE_ONLY`)
  - `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`, `TRANSACTION_SERIES_END_DATE_BEFORE_START`
  - **não** criar código de duplicidade. Não traduzir erro no domínio nem no backend
- Criar o DTO de leitura `TransactionSeriesDTO` (skill: module-dto): os atributos da entidade (sem `deletedAt`) com `value` em `number`, datas em `YYYY-MM-DD`, opcionais em `null`, `recurrence` como a própria união (o discriminante `unit` viaja no JSON), `createdAt`/`updatedAt` como `Date` e os nomes resolvidos pela consulta (`accountName`, `creditCardName`, `subcategoryName`, `categoryName`)
- Criar `TransactionSeriesRepository extends CrudRepository<TransactionSeries>`, sem operação extra, documentando que `findById` falha com `TRANSACTION_SERIES_NOT_FOUND` quando o registro não existe ou está excluído e que `delete` é lógico (skill: module-repository)
- Criar as consultas em `transaction-series/provider` (skill: module-query-cqrs): `FindTransactionSeriesByIdQuery` (`execute(id, userId): Promise<Result<TransactionSeriesDTO | null>>`) e `ListTransactionSeriesQuery` (`ListTransactionSeriesInput extends PaginatedInputDTO` com `userId`, `search?`, `kind?`, `direction?`, `accountId?`, devolvendo `PaginatedResultDTO<TransactionSeriesDTO>`)
- Criar os casos de uso de escrita (skill: module-use-case), no mesmo desenho dos de `Transaction`:
  - `SaveTransactionSeries` (recebe `TransactionSeriesRepository` e `MovementReferencesQuery`), com `SaveTransactionSeriesErrors`: `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND`, `TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND`, `TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND`. Sem `id` cria; com `id` carrega por `findById`, falha com `TRANSACTION_SERIES_NOT_FOUND` quando é de outro usuário e atualiza com `cloneWith` (o `endDate` de `CLOSED` é recalculado pela entidade). Valida tudo primeiro e só depois confere os vínculos pela `MovementReferencesQuery` (vínculo opcional ausente não é consultado). Devolve `Result<{ id: string }>` com o id da série gravada — o gerador de massa de dados (prompt 20) precisa dele para gravar as ocorrências da série recém-criada até o fim do mês atual
  - `DeleteTransactionSeries`: carrega, confere posse (`TRANSACTION_SERIES_NOT_FOUND`), aplica `softDelete()` e persiste com `update`
- Não criar caso de uso para as consultas: sem regra de negócio, elas são resolvidas direto no controller
- Exportar tudo pelo barril do agregado e pelo `src/index.ts`
- Criar os testes em `modules/transaction/test/transaction-series/`, com `in-memory-transaction-series.repository.ts` em `test/mock` e reaproveitando o `in-memory-movement-references.query.ts` que já existe, cobrindo:
  - enums: `isDayOfWeek` aceitando 1..7 e reprovando `0`, `8`, `1.5`, `'MONDAY'` e `'1'`; `isSeriesKind`/`isFrequencyUnit` com valores válidos e inválidos
  - regra de recorrência: cada unidade com sua âncora, âncora faltando, âncora de outra unidade sendo descartada, números vindos como string, intervalo zero/negativo/fracionário/acima do teto
  - serviço de agenda: primeira ocorrência quando a âncora ainda não passou e quando já passou, semanal a cada 2, mensal a cada 3 (trimestral), anual a cada 1, dia 31 em meses de 30 e em fevereiro (com e sem ano bissexto), 29/02 anual em ano comum, a âncora 31 voltando a 31 depois de um mês grampeado, e a última parcela de uma série de 12
  - entidade: obrigatórios ausentes, opcionais ausentes e string vazia virando `null`, valor zero/negativo, direção e `kind` inválidos, `CLOSED` sem parcelas, `OPEN` descartando parcelas, `endDate` calculado em `CLOSED` ignorando o do payload, `endDate` anterior à primeira ocorrência em `OPEN`, parcelas acima do teto, códigos remapeados de id e data, `softDelete()`
  - casos de uso: criação (sem id) x atualização (com id), id inexistente, série de outro usuário, série excluída tratada como inexistente, cada um dos três vínculos inválidos e exclusão

## Backend

- Acrescentar ao arquivo `apps/backend/prisma/models/transaction.model.prisma` (é o arquivo do módulo, não criar outro) e gerar a migração `add_transaction_series` (skill: backend-prisma-data):
  - enums `SeriesKind` (`OPEN`, `CLOSED`) e `FrequencyUnit` (`WEEK`, `MONTH`, `YEAR`), espelhando os enums de domínio
  - model `TransactionSeries` (`@@map("transaction_series")`, colunas em snake_case com `@map`) com `value` em `Decimal @db.Decimal(14, 2)`, `startDate`/`endDate` em `DateTime @db.Date` (`endDate` anulável), `name` em `@db.VarChar(100)` e `note` em `@db.VarChar(500)`, `kind`, `frequencyUnit`, `frequencyInterval`/`weekDay`/`dayOfMonth`/`month`/`installments` em `Int @db.SmallInt` (as quatro últimas anuláveis), `createdAt`, `updatedAt` e `deletedAt DateTime?`
  - relações iguais às de `Transaction`: `user` e `account` com `onDelete: Cascade`, `creditCard` (model `Card`) e `subcategory` opcionais com `onDelete: SetNull`
  - índices: `@@index([userId, startDate])`, `@@index([accountId])`, `@@index([creditCardId])`, `@@index([subcategoryId])`
  - **relações inversas**: declarar `transactionSeries TransactionSeries[]` em `User`, `Account`, `Card` e `Subcategory`. O Prisma exige o lado inverso: é a **única** alteração permitida em arquivo de outro módulo
- Mesmos cuidados de conversão do `TransactionPrisma`: `Decimal` vira `number` na leitura e número na gravação (nunca vaza para o DTO), e as colunas `@db.Date` entram e saem em UTC. **Reaproveitar** as funções de conversão que o `transaction.prisma.ts` já usa — se forem locais daquele arquivo, movê-las para um arquivo do módulo backend (ex.: `transaction-prisma.util.ts`) e importar nos dois adapters, sem mudar comportamento
- Criar `apps/backend/src/modules/transaction/transaction-series.prisma.ts` implementando `TransactionSeriesRepository` e, na mesma classe, as consultas como atributos públicos inline (`findTransactionSeriesById`, `listTransactionSeries`), no estilo do `TransactionPrisma`:
  - `create`/`update` gravam todos os campos, inclusive `deletedAt`; `findById` filtra `deletedAt: null` e falha com `TRANSACTION_SERIES_NOT_FOUND`; `delete(id)` é lógico
  - a projeção traz os nomes de conta, cartão, subcategoria e categoria por `select` das relações, em uma ida só (mesma seleção do `TransactionPrisma` — extrair para constante compartilhada se ela for local)
  - a remontagem da `RecurrenceRule` a partir das colunas planas lê só as âncoras da unidade gravada; o caminho inverso grava `null` nas âncoras que não pertencem à unidade
  - a listagem usa `skip`/`take`/`orderBy` (`startDate` desc, `createdAt` desc) + `count` em `Promise.all`, sempre com `userId` e `deletedAt: null`, e devolve `{ data, meta }`; busca por nome parcial e case-insensitive
- Criar `apps/backend/src/modules/transaction/transaction-series.controller.ts` (`TransactionSeriesController`) como `@Controller('transaction-series')` (skill: backend-controller):
  - rotas: `POST` (201, `SaveTransactionSeries` **sem** `id`, respondendo `{ id }`), `PUT /:id` (com o `id` da rota, respondendo `{ id }`), `GET` paginado (`page` mínimo 1, `pageSize` padrão 10 e teto 50, `search`, `kind`, `direction`, `accountId`), `GET /:id` (`null` vira `NotFoundException('TRANSACTION_SERIES_NOT_FOUND')`) e `DELETE /:id`
  - injetar `TransactionSeriesPrisma` **e** `TransactionPrisma`, usando deste último apenas o `movementReferences` já implementado — a consulta de posse não é reescrita
  - montar os casos de uso à mão dentro do método, como o `TransactionController` faz
  - o corpo carrega a regra **achatada** (`unit`, `interval`, `weekDay`, `dayOfMonth`, `month`), que o controller remonta como `RecurrenceRuleInput`. `unit`, `kind` e `direction` seguem como string crua para o domínio reprovar
  - `value`, `interval`, `weekDay`, `dayOfMonth`, `month` e `installments` podem chegar como string: converter para número num helper privado e deixar o valor não numérico virar erro de validação do domínio, nunca `NaN` silencioso
  - mapear falhas: `NotFoundException` quando os erros contiverem `TRANSACTION_SERIES_NOT_FOUND`; `BadRequestException` com a lista de códigos para o resto, inclusive os três `*_NOT_FOUND` de vínculo
  - `@CurrentUser()` como única fonte do dono
- Registrar o controller e o provider novos em `transaction.module.ts`
- Criar `apps/backend/src/modules/transaction/transaction-series.integration.http` no formato Rest Client, cobrindo: criar parcelamento mensal de 12 (conferindo o `endDate` calculado), criar recorrência semanal sem fim, criar recorrência trimestral (mensal a cada 3), atualizar uma série (conferindo o `endDate` recalculado), `PUT` com id inexistente (404), listar (2 páginas e com filtro de `kind`), buscar por id, excluir e buscar de novo (404), `CLOSED` sem parcelas (400), âncora faltando para a unidade escolhida (400), conta de outro usuário (400) e acesso sem token (401)

## Frontend

> Executar na ordem. Cada passo só depende dos anteriores.

1. **Cliente HTTP** (`data/transaction-series-api.client.ts`), no formato de `transaction-api.client.ts` (`headers(token)`, `handleError`, classe `TransactionSeriesApiError`): `TransactionSeriesDTO`, `SaveTransactionSeriesInput` e **só** `createTransactionSeries` — a interface desta mudança só cria; buscar, atualizar e excluir chegam no prompt 19, com a edição a partir da ocorrência. O payload leva a regra achatada (`unit`, `interval`, `weekDay`, `dayOfMonth`, `month`) e nunca o `userId`. Enums importados de `@poupig/transaction`
2. **Rótulos em pt-BR** (`data/transaction-series.labels.ts`): `SERIES_KIND_LABELS` (`CLOSED` = `Parcelamento`, `OPEN` = `Recorrência`), `FREQUENCY_UNIT_LABELS` (`Semanal`, `Mensal`, `Anual`), `DAY_OF_WEEK_LABELS` (segunda a domingo) e `MONTH_LABELS` (janeiro a dezembro), tipados por `Record` sobre os enums do domínio (um valor novo no enum quebra o build aqui). Os nomes de dia e mês podem ser derivados do `ptBR` do `date-fns`, como o `month.util.ts` faz
3. **Dicionário de erros**: acrescentar em `shared/i18n/messages.pt.ts` **e** `messages.en.ts` os códigos novos (`INVALID_SERIES_KIND`, `INVALID_TRANSACTION_SERIES_INSTALLMENTS`, `INVALID_TRANSACTION_SERIES_ACCOUNT_ID`, `INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID`, `INVALID_TRANSACTION_SERIES_START_DATE`, `INVALID_TRANSACTION_SERIES_END_DATE`, `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`, `TRANSACTION_SERIES_END_DATE_BEFORE_START`, `TRANSACTION_SERIES_NOT_FOUND`, `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND`, `TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND`, `TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND`, `INVALID_RECURRENCE_FREQUENCY_UNIT`, `INVALID_RECURRENCE_INTERVAL`, `INVALID_RECURRENCE_WEEK_DAY`, `INVALID_RECURRENCE_DAY_OF_MONTH`, `INVALID_RECURRENCE_MONTH`), reaproveitando as chaves que já existem (`MOVEMENT_*`, `INVALID_DIRECTION`, `INVALID_MONEY_AMOUNT`, `INVALID_DATE_ONLY`, `REQUIRED_FIELD`). Nenhum código de erro aparece cru na tela
4. **Schema do formulário** (`data/transaction-series.schema.ts`, skill: frontend-form-schema), no desenho de `transaction.schema.ts`: `name: MovementName`, `note` opcional com `MovementNote`, `value: Money`, `startDate: DateOnly`, `endDate` opcional com `DateOnly`, `accountId: Text`, `creditCardId`/`subcategoryId` opcionais com `Id`. `kind`, `direction`, `unit`, `weekDay` e `month` são escolhas de conjunto fechado e ficam fora do schema, tipados pelos enums. Os refinamentos espelham a entidade chamando o **próprio domínio**, sem reescrever regra: `tryCreateRecurrenceRule` para a regra, `CLOSED` exigindo `installments` (com `PositiveInteger` e `MAX_INSTALLMENTS`) e `endDate` de `OPEN` comparado com `RecurrenceScheduleCalculator.firstOccurrence`
5. **Hook de gravação** (`data/use-transaction-series.ts`): `useCreateTransactionSeries`, no formato de `use-transactions.ts` (token via `useAuth`, erro via `getErrorMessage`, sem `any`)
6. **Formulário** (`components/transaction-series-form.component.tsx`), com `react-hook-form` + `v.resolver` e `FormSectionLayout`, uma seção por grupo:
   - `Lançamento`: nome (`Input`), valor (`MoneyInput`), direção (`RadioGroup` com os rótulos de `transaction.labels.ts`)
   - `Vínculos`: conta, cartão e subcategoria (`Combobox`), com as opções do `useTransactionOptions` que já existe — nenhum carregamento novo
   - `Recorrência`: `RadioGroup` de `Parcelamento` x `Recorrência`; `DatePickerInput` para o início; `Combobox` de frequência; campo numérico de intervalo com a frase natural ao lado ("a cada 3 meses"); o campo de âncora que a unidade pede (`Combobox` de dia da semana, número do dia do mês, ou mês + dia); em `CLOSED`, a quantidade de parcelas e a **data fim calculada** em `ReadonlyTextField`; em `OPEN`, `DatePickerInput` opcional de data fim
   - `Observação`: `Textarea`
   - Padrões de uma série nova: `direction: OUT`, `kind: CLOSED`, `unit: MONTH`, `interval: 1`, `startDate` hoje (data local em `YYYY-MM-DD`) e âncora **derivada da data de início** (dia do mês para `MONTH`, dia da semana para `WEEK`, dia e mês para `YEAR`). A âncora é recalculada **no handler** de troca da data de início e da frequência enquanto o usuário não mexer nela à mão — sem `useEffect` que grave estado
   - **Prévia da agenda** como texto de apoio da seção `Recorrência`: as três primeiras ocorrências e, em `CLOSED`, a data da última parcela, calculadas com `RecurrenceScheduleCalculator` importado de `@poupig/transaction` a partir dos valores atuais do formulário (valor derivado na renderização, não estado). Nada de reimplementar a conta no front: a tela mostra exatamente o que o backend vai gravar
   - Trocar de frequência troca o campo de âncora sem apagar o resto do formulário; trocar de `kind` esconde e limpa o campo que deixou de valer, espelhando a normalização da entidade
7. **Modo novo na página** (`pages/monthly-statement.page.tsx`): `mode` ganha `'series-form'`, renderizando `PageSectionHeader` (badge `Extrato Mensal`, título `Nova série de transações`) e o `TransactionSeriesFormComponent`. Ao salvar, `toast` de sucesso e volta para o modo lista; cancelar também volta. A lista não é recarregada, porque a série ainda não gera nada no extrato
8. **Dropdown do "Nova transação"** (`components/statement-toolbar.component.tsx`): o botão vira `DropdownMenuTrigger` (com `ChevronDown`) e abre duas opções — `Transação avulsa` (modo `form`, como hoje) e `Série parcelada ou recorrente` (modo `series-form`). A prop de criação dá lugar a `onCreateSingle` e `onCreateSeries`, ligadas na página. O rótulo do botão continua `Nova transação` e a barra não ganha nenhum controle a mais
9. **Barris**: exportar o que foi criado em `modules/transaction/data/index.ts` e `modules/transaction/index.ts`
10. **Fechar a mudança**:
    - `npm run build` verde no workspace e testes do domínio e do backend verdes
    - `npx eslint` **sem `--fix`** nos arquivos criados ou alterados, de frontend e de backend, sem nenhum erro — os erros pré-existentes (88 no frontend, 58 no backend) continuam como estão. **Não** rodar `npm run lint` no backend, que aplica `--fix` em todos os arquivos
    - Diff limitado a `modules/transaction`, `apps/backend/prisma` (inclusive as relações inversas), `apps/backend/src/modules/transaction`, `apps/frontend/src/modules/transaction` e `apps/frontend/src/shared/i18n`

## Fora de Escopo

- A entidade `ScheduledTransaction` e a geração das ocorrências a partir da série: é o prompt 19, que vai reaproveitar o `RecurrenceScheduleCalculator` entregue aqui
- Exibir a série (ou qualquer ocorrência dela) no extrato mensal, no dashboard ou em qualquer total
- Listagem de séries, item de menu e rota própria; edição e exclusão pela interface chegam no prompt 19, a partir da ocorrência — o backend desta mudança já entrega as rotas
- Editar uma parcela isolada, pular uma ocorrência, pausar, reajustar valor no meio da série e "editar daqui para frente"
- Recorrências que a `RecurrenceRule` não descreve: "última sexta-feira do mês", "todo dia útil", "a cada 15 dias" fora do passo semanal, dias múltiplos na mesma regra
- Fatura de cartão, ciclo de fatura, saldo de conta e limite utilizado a partir das séries
- Vincular uma série a transações avulsas já existentes, e importar parcelamento de extrato/OFX
- Política para séries de conta, cartão ou subcategoria excluídas logicamente, restaurar série excluída, e refatorar `account`, `category` ou `credit-card`
- Multi-moeda, câmbio, juros e correção de parcela
- Corrigir os 88 erros de lint pré-existentes

## Pasta do Módulo

- Domínio: `modules/transaction/src/transaction-series` (irmã de `src/movement` e `src/transaction`)
- Testes do domínio: `modules/transaction/test/transaction-series` e `modules/transaction/test/mock`
- Modelo do prisma: `apps/backend/prisma/models/transaction.model.prisma` (+ relações inversas em `auth`, `account`, `credit-card` e `category`)
- Backend do módulo: `apps/backend/src/modules/transaction` (`transaction-series.controller.ts`, `transaction-series.prisma.ts`, `transaction.module.ts` e, se preciso, o utilitário de conversão compartilhado com `transaction.prisma.ts`)
- Testes de integração: `apps/backend/src/modules/transaction/transaction-series.integration.http`
- Página (modo novo): `apps/frontend/src/modules/transaction/pages/monthly-statement.page.tsx`
- Componentes: `apps/frontend/src/modules/transaction/components` (`transaction-series-form.component.tsx` e o ajuste em `statement-toolbar.component.tsx`)
- Ger. de Estado: `apps/frontend/src/modules/transaction/data` (`transaction-series-api.client.ts`, `transaction-series.schema.ts`, `transaction-series.labels.ts`, `use-transaction-series.ts`)
- Dicionário de erros: `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`

## Instruções

- O código deverá ser escrito em inglês, usando os termos da linguagem ubíqua exatamente como estão (`TransactionSeries`, `SeriesKind`, `FrequencyUnit`, `DayOfWeek`, `RecurrenceRule`, `Direction`, `Movement*`)
- A especificação deverá ser escrita em português do brasil
- Concluir antes os prompts 15 e 16
- Use as skills mencionadas (`module-aggregate`, `module-entity`, `module-domain-service`, `module-dto`, `module-repository`, `module-query-cqrs`, `module-use-case`, `backend-prisma-data`, `backend-controller`, `frontend-form-schema`)
- Reaproveitar o que já existe (`Money`, `DateOnly`, `Id`, `DayOfMonth`, `PositiveInteger`, paginação e `CrudRepository` do `@poupig/shared`, núcleo `movement` com a `MovementReferencesQuery`, conversões de data em UTC do adapter, `useTransactionOptions`, `DropdownMenu`, `MoneyInput`, `DatePickerInput`, `Combobox`, `RadioGroup`, `ReadonlyTextField`, `FormSectionLayout` e o validador do form), sem duplicar
- Não criar nenhum VO novo: se parecer que falta um, é sinal de que o `@poupig/shared` ou o núcleo `movement` já resolve
- Seguir o padrão estabelecido pelo agregado `transaction`, sem alterar o comportamento dele — no backend, a única mudança aceitável nele é extrair conversões/seleção para reaproveitamento
- Nada de aritmética de data com fuso, nada de `setState` síncrono em `useEffect` e nada de `any`
- Executar a seção de negócio, backend e frontend em sub agentes separados, mas de forma sequencial
- Garantir no final o build do projeto funcionando, os testes de domínio/backend verdes e nenhum erro de lint novo (o frontend não tem suíte de testes)
- Não executar teste via Web Browser (farei testes manuais)
