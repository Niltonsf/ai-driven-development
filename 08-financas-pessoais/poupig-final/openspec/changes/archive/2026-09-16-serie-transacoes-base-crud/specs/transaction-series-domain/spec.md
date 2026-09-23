## Purpose

Definir o agregado `TransactionSeries` do módulo `transaction`: o molde de um parcelamento ou de uma recorrência do usuário, com suas invariantes de parcelas e data fim, os códigos de erro próprios, o contrato de persistência e as projeções de leitura.

## ADDED Requirements

### Requirement: Entidade TransactionSeries possui os atributos definidos
A entidade `TransactionSeries` SHALL conter: `id` (gerado quando ausente), `userId`, `name` (`MovementName`), `note` (`MovementNote`, opcional), `value` (`Money`), `direction` (`Direction`), `accountId`, `creditCardId` (opcional), `subcategoryId` (opcional), `kind` (`SeriesKind`), `recurrence` (regra de recorrência), `startDate` (`DateOnly`), `endDate` (data ou `null`), `installments` (inteiro ou `null`), além de `createdAt`, `updatedAt` e `deletedAt` herdados das propriedades base de entidade. Todos os identificadores SHALL usar o `Id` do `@poupig/shared`. A série SHALL NOT ter `status` nem data de efetivação, e a entidade SHALL NOT introduzir nenhum VO além dos do núcleo `movement` e do `@poupig/shared`. O valor SHALL ser sempre positivo; o sentido SHALL vir de `direction`.

#### Scenario: Parcelamento apenas com obrigatórios
- **WHEN** a entidade é criada com `userId`, `name`, `value`, `direction`, `accountId`, `kind: "CLOSED"`, `recurrence` mensal no dia 10, `startDate: "2026-09-15"` e `installments: 12`
- **THEN** a criação é bem-sucedida com um `id` gerado, `endDate` igual a `2027-09-10` e `note`, `creditCardId` e `subcategoryId` iguais a `null`

#### Scenario: Recorrência sem fim
- **WHEN** a entidade é criada com `kind: "OPEN"`, regra semanal válida e sem `endDate`
- **THEN** a criação é bem-sucedida com `endDate` e `installments` iguais a `null`

---

### Requirement: SeriesKind distingue parcelamento de recorrência
O módulo SHALL definir `SeriesKind` com exatamente `CLOSED` (parcelamento, com fim calculado) e `OPEN` (recorrência, com fim opcional), e o type guard `isSeriesKind`, que SHALL aceitar somente esses dois valores.

#### Scenario: Valores do conjunto
- **WHEN** `isSeriesKind` é chamado com `"OPEN"`, `"CLOSED"`, `"open"` e `"INSTALLMENT"`
- **THEN** os dois primeiros são aceitos e os dois últimos reprovados

---

### Requirement: Obrigatórios inválidos ou ausentes são reprovados com códigos próprios
A entidade SHALL reprovar: `name` inválido com o código do `MovementName`; `value` ausente, zero ou negativo com `INVALID_MONEY_AMOUNT`; `direction` fora do conjunto com `INVALID_DIRECTION`; `kind` ausente ou fora do conjunto com `INVALID_SERIES_KIND`; `recurrence` inválida com os códigos da regra de recorrência; `startDate` ausente ou inválida com `INVALID_TRANSACTION_SERIES_START_DATE`; e `accountId` ausente, vazio ou malformado com `INVALID_TRANSACTION_SERIES_ACCOUNT_ID`, **sem** gerar um identificador novo para a conta. `id` e `userId` inválidos SHALL continuar reprovados com `INVALID_ID`. As falhas SHALL ser acumuladas.

#### Scenario: Valor zero ou negativo
- **WHEN** a entidade é criada com `value: 0` ou `value: -5`
- **THEN** a criação falha com `INVALID_MONEY_AMOUNT`

#### Scenario: Direção fora do conjunto
- **WHEN** a entidade é criada com `direction: "INFLOW"`
- **THEN** a criação falha com `INVALID_DIRECTION`

#### Scenario: Tipo de série fora do conjunto
- **WHEN** a entidade é criada com `kind: "INSTALLMENT"` ou sem `kind`
- **THEN** a criação falha com `INVALID_SERIES_KIND`

#### Scenario: Regra de recorrência inválida
- **WHEN** a entidade é criada com `recurrence: { unit: "MONTH", interval: 0, dayOfMonth: 10 }`
- **THEN** a criação falha com `INVALID_RECURRENCE_INTERVAL`

#### Scenario: Data de início inválida
- **WHEN** a entidade é criada com `startDate: "2026-02-30"` ou sem `startDate`
- **THEN** a criação falha com `INVALID_TRANSACTION_SERIES_START_DATE`

#### Scenario: Conta ausente, vazia ou malformada
- **WHEN** a entidade é criada sem `accountId`, com `accountId: ""` ou com `accountId: "abc"`
- **THEN** a criação falha com `INVALID_TRANSACTION_SERIES_ACCOUNT_ID`

#### Scenario: Nome ausente
- **WHEN** a entidade é criada sem `name`
- **THEN** a criação falha com um código de erro do `MovementName`

---

### Requirement: Opcionais ausentes ou vazios viram null e preenchidos são validados
`note`, `creditCardId` e `subcategoryId` SHALL ser armazenados como `null` quando ausentes ou informados como string vazia. Quando preenchidos, SHALL ser validados, com os códigos `MOVEMENT_NOTE_TOO_LONG` para observação longa demais, `INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID` e `INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID`.

#### Scenario: Opcionais como string vazia
- **WHEN** a entidade é criada com `note: ""`, `creditCardId: ""` e `subcategoryId: ""`
- **THEN** a criação é bem-sucedida com os três atributos iguais a `null`

#### Scenario: Cartão malformado
- **WHEN** a entidade é criada com `creditCardId: "abc"`
- **THEN** a criação falha com `INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID`

#### Scenario: Subcategoria malformada
- **WHEN** a entidade é criada com `subcategoryId: "abc"`
- **THEN** a criação falha com `INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID`

#### Scenario: Observação longa demais
- **WHEN** a entidade é criada com `note` de 501 caracteres
- **THEN** a criação falha com `MOVEMENT_NOTE_TOO_LONG`

---

### Requirement: Parcelamento exige parcelas e tem data fim calculada
Com `kind: CLOSED`, a entidade SHALL exigir `installments` e SHALL falhar com `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED` quando ele não vier. `installments` informado SHALL ser inteiro de 1 a 480, e fora disso SHALL falhar com `INVALID_TRANSACTION_SERIES_INSTALLMENTS`; o teto SHALL ser exportado pelo módulo. A `endDate` SHALL ser sempre a data da última parcela, calculada a partir de `startDate`, `recurrence` e `installments`; qualquer `endDate` recebida SHALL ser ignorada e SHALL NOT ser validada. O cálculo SHALL acontecer somente quando esses três atributos forem válidos.

#### Scenario: Parcelamento sem parcelas
- **WHEN** a entidade é criada com `kind: "CLOSED"` e sem `installments`
- **THEN** a criação falha com `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`

#### Scenario: Parcelas inválidas
- **WHEN** a entidade é criada com `kind: "CLOSED"` e `installments` igual a `0`, `1.5` ou `481`
- **THEN** cada criação falha com `INVALID_TRANSACTION_SERIES_INSTALLMENTS`

#### Scenario: Parcelas no teto
- **WHEN** a entidade é criada com `kind: "CLOSED"`, uma regra válida e `installments: 480`
- **THEN** a criação é bem-sucedida

#### Scenario: Data fim do payload ignorada
- **WHEN** a entidade é criada com `kind: "CLOSED"`, `startDate: "2026-09-15"`, regra mensal no dia 10, `installments: 12` e `endDate: "2030-01-01"`
- **THEN** a criação é bem-sucedida com `endDate` igual a `2027-09-10`

#### Scenario: Data fim malformada ignorada no parcelamento
- **WHEN** a entidade é criada com `kind: "CLOSED"`, dados válidos e `endDate: "31/12/2026"`
- **THEN** a criação é bem-sucedida com a `endDate` calculada

---

### Requirement: Recorrência descarta parcelas e aceita data fim opcional
Com `kind: OPEN`, a entidade SHALL normalizar `installments` para `null` sem validar nem falhar. A `endDate` SHALL ser opcional: ausente ou vazia vira `null`; preenchida e inválida SHALL falhar com `INVALID_TRANSACTION_SERIES_END_DATE`; preenchida e anterior à primeira ocorrência da série SHALL falhar com `TRANSACTION_SERIES_END_DATE_BEFORE_START`. A comparação SHALL acontecer somente quando `startDate`, `recurrence` e `endDate` forem válidos.

#### Scenario: Recorrência com parcelas informadas
- **WHEN** a entidade é criada com `kind: "OPEN"` e `installments: 12`
- **THEN** a criação é bem-sucedida e `installments` é `null`

#### Scenario: Data fim anterior à primeira ocorrência
- **WHEN** a entidade é criada com `kind: "OPEN"`, `startDate: "2026-01-20"`, regra mensal no dia 15 e `endDate: "2026-02-01"`
- **THEN** a criação falha com `TRANSACTION_SERIES_END_DATE_BEFORE_START`

#### Scenario: Data fim igual à primeira ocorrência
- **WHEN** a entidade é criada com `kind: "OPEN"`, `startDate: "2026-01-20"`, regra mensal no dia 15 e `endDate: "2026-02-15"`
- **THEN** a criação é bem-sucedida com `endDate` igual a `2026-02-15`

#### Scenario: Data fim inválida
- **WHEN** a entidade é criada com `kind: "OPEN"` e `endDate: "2026-13-01"`
- **THEN** a criação falha com `INVALID_TRANSACTION_SERIES_END_DATE`

---

### Requirement: Nova instância derivada reaplica validação e invariantes
Toda instância derivada de uma série existente com atributos alterados SHALL passar pelas mesmas validações e invariantes da criação, de modo que a `endDate` de um parcelamento seja recalculada e as parcelas de uma recorrência sejam descartadas.

#### Scenario: Reduzir parcelas recalcula a data fim
- **WHEN** um parcelamento mensal no dia 10 com início `2026-09-15` e 12 parcelas é derivado com `installments: 6`
- **THEN** a nova instância tem `endDate` igual a `2027-03-10`

#### Scenario: Parcelamento vira recorrência
- **WHEN** um parcelamento de 12 parcelas é derivado com `kind: "OPEN"` e `endDate: null`
- **THEN** a nova instância tem `installments` e `endDate` iguais a `null`

---

### Requirement: TransactionSeries é excluída logicamente e não tem chave única de negócio
A entidade SHALL oferecer exclusão lógica que preenche `deletedAt` sem alterar os demais atributos. O agregado SHALL NOT ter checagem de unicidade: duas séries do mesmo usuário com o mesmo nome, valor e frequência SHALL ser válidas.

#### Scenario: Exclusão lógica
- **WHEN** a exclusão lógica é aplicada em uma série válida
- **THEN** a nova instância tem `deletedAt` preenchido e os demais atributos iguais aos originais

#### Scenario: Séries idênticas coexistem
- **WHEN** duas séries do mesmo usuário são criadas com o mesmo `name`, `value` e `recurrence`
- **THEN** ambas são válidas e nenhum código de duplicidade é produzido

---

### Requirement: TransactionSeriesErrors reúne só os códigos próprios do agregado
`TransactionSeriesErrors` SHALL conter exatamente `TRANSACTION_SERIES_NOT_FOUND`, `INVALID_SERIES_KIND`, `INVALID_TRANSACTION_SERIES_INSTALLMENTS`, `INVALID_TRANSACTION_SERIES_ACCOUNT_ID`, `INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID`, `INVALID_TRANSACTION_SERIES_START_DATE`, `INVALID_TRANSACTION_SERIES_END_DATE`, `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED` e `TRANSACTION_SERIES_END_DATE_BEFORE_START`, com valor igual à chave e sem tradução. SHALL NOT repetir códigos do núcleo `movement`, dos VOs ou da regra de recorrência, SHALL NOT reaproveitar os códigos `TRANSACTION_*` da `Transaction` e SHALL NOT conter `TRANSACTION_SERIES_ALREADY_EXISTS`.

#### Scenario: Conteúdo de TransactionSeriesErrors
- **WHEN** as chaves de `TransactionSeriesErrors` são inspecionadas
- **THEN** existem exatamente os dez códigos listados, cada um com valor igual ao próprio nome

---

### Requirement: Contrato de repositório com leitura que ignora excluídas
`TransactionSeriesRepository` SHALL estender o `CrudRepository` do `@poupig/shared` (`create`, `update`, `findById`, `delete`), sem operação extra. `findById` SHALL devolver falha com `TRANSACTION_SERIES_NOT_FOUND` quando o registro não existe ou está excluído logicamente. `delete` SHALL ser lógico.

#### Scenario: Busca de série excluída
- **WHEN** `findById` é chamado com o id de uma série com `deletedAt` preenchido
- **THEN** o resultado é falha com `TRANSACTION_SERIES_NOT_FOUND`

#### Scenario: Busca de id inexistente
- **WHEN** `findById` é chamado com um id que não existe
- **THEN** o resultado é falha com `TRANSACTION_SERIES_NOT_FOUND`

---

### Requirement: TransactionSeriesDTO projeta a série com a regra e os nomes dos vínculos
`TransactionSeriesDTO` SHALL conter `id`, `userId`, `name`, `note`, `value`, `direction`, `accountId`, `accountName`, `creditCardId`, `creditCardName`, `subcategoryId`, `subcategoryName`, `categoryName`, `kind`, `recurrence`, `startDate`, `endDate`, `installments`, `createdAt` e `updatedAt`. `value` SHALL ser `number`; `startDate` e `endDate` SHALL estar em `YYYY-MM-DD`; `recurrence` SHALL ser a própria regra, com o discriminante `unit` e somente as âncoras daquela unidade; `createdAt` e `updatedAt` SHALL ser `Date`; todo opcional ausente SHALL ser `null`. O DTO SHALL NOT expor `deletedAt`.

#### Scenario: Recorrência semanal projetada
- **WHEN** uma recorrência semanal a cada 2 na segunda-feira, sem cartão, subcategoria, observação e data fim, é projetada
- **THEN** `recurrence` é `{ unit: "WEEK", interval: 2, weekDay: 1 }` e `creditCardName`, `subcategoryName`, `categoryName`, `note`, `endDate` e `installments` são `null`

#### Scenario: Parcelamento com subcategoria
- **WHEN** um parcelamento vinculado à subcategoria "Eletrônicos" da categoria "Compras" é projetado
- **THEN** `subcategoryName` é `"Eletrônicos"`, `categoryName` é `"Compras"` e `installments` e `endDate` estão preenchidos

---

### Requirement: Consultas de leitura escopadas pelo usuário
O agregado SHALL definir `FindTransactionSeriesByIdQuery`, com `execute(id, userId)` devolvendo `Result<TransactionSeriesDTO | null>` — `null` quando a série não existe, está excluída ou é de outro usuário —, e `ListTransactionSeriesQuery`, com `execute(input)` devolvendo `Result<PaginatedResultDTO<TransactionSeriesDTO>>`, ordenado por `startDate` decrescente e, em empate, por `createdAt` decrescente. A entrada da listagem SHALL estender `PaginatedInputDTO` com `userId` e os filtros opcionais `search`, `kind`, `direction` e `accountId`. SHALL NOT existir tipo de paginação próprio do módulo nem caso de uso para essas consultas.

#### Scenario: Busca por id de outro usuário
- **WHEN** `FindTransactionSeriesByIdQuery.execute` é chamado com o id de uma série de outro usuário
- **THEN** o resultado é sucesso com `null`

#### Scenario: Formato do resultado paginado
- **WHEN** `ListTransactionSeriesQuery.execute` é chamado
- **THEN** o resultado é `{ data, meta: { page, pageSize, total, totalPages } }`
