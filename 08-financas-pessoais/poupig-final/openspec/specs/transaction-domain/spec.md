# transaction-domain Specification

## Purpose
Definir o agregado `Transaction` do módulo `transaction`: os atributos e invariantes de um lançamento financeiro do usuário, os códigos de erro próprios, o contrato de persistência e as projeções de leitura consumidas pela API e pela tela.
## Requirements
### Requirement: Entidade Transaction possui os atributos definidos
A entidade `Transaction` SHALL conter: `id` (gerado quando ausente), `userId`, `name` (`MovementName`), `note` (`MovementNote`, opcional), `value` (`Money`), `direction` (`Direction`), `accountId`, `creditCardId` (opcional), `subcategoryId` (opcional), `status` (`TransactionStatus`, padrão `PENDING`), `expectedOn` (`DateOnly`) e `settledOn` (`DateOnly`, opcional), além de `createdAt`, `updatedAt` e `deletedAt` herdados das propriedades base de entidade. Todos os identificadores SHALL usar o `Id` do `@poupig/shared`. A entidade SHALL NOT introduzir nenhum VO além dos do núcleo `movement` e do `@poupig/shared`.

#### Scenario: Criação apenas com obrigatórios
- **WHEN** a entidade é criada com `userId`, `name`, `value`, `direction`, `accountId` e `expectedOn` válidos
- **THEN** a criação é bem-sucedida com um `id` gerado, `status` igual a `PENDING` e `note`, `creditCardId`, `subcategoryId` e `settledOn` iguais a `null`

#### Scenario: Valor arredondado para duas casas
- **WHEN** a entidade é criada com `value: 10.126`
- **THEN** o `value` da entidade é `10.13`

#### Scenario: Conta e cartão preenchidos ao mesmo tempo
- **WHEN** a entidade é criada com `accountId` e `creditCardId` válidos
- **THEN** a criação é bem-sucedida, sem regra de exclusão entre os dois vínculos

---

### Requirement: Obrigatórios inválidos ou ausentes são reprovados com códigos próprios
A entidade SHALL reprovar: `name` inválido com o código do `MovementName`; `value` ausente, zero ou negativo com `INVALID_MONEY_AMOUNT`; `direction` fora do conjunto com `INVALID_DIRECTION`; `status` informado fora do conjunto com `INVALID_TRANSACTION_STATUS`; `expectedOn` ausente ou inválido com `INVALID_TRANSACTION_EXPECTED_ON`; e `accountId` ausente, vazio ou inválido com `INVALID_TRANSACTION_ACCOUNT_ID`, **sem** gerar um identificador novo para a conta. `id` e `userId` inválidos SHALL continuar reprovados com `INVALID_ID`.

#### Scenario: Nome ausente
- **WHEN** a entidade é criada sem `name`
- **THEN** a criação falha com um código de erro do `MovementName`

#### Scenario: Valor zero ou negativo
- **WHEN** a entidade é criada com `value: 0` ou `value: -5`
- **THEN** a criação falha com `INVALID_MONEY_AMOUNT`

#### Scenario: Direção fora do conjunto
- **WHEN** a entidade é criada com `direction: "INFLOW"`
- **THEN** a criação falha com `INVALID_DIRECTION`

#### Scenario: Status fora do conjunto
- **WHEN** a entidade é criada com `status: "COMPLETED"`
- **THEN** a criação falha com `INVALID_TRANSACTION_STATUS`

#### Scenario: Data prevista inválida
- **WHEN** a entidade é criada com `expectedOn: "2026-02-30"` ou sem `expectedOn`
- **THEN** a criação falha com `INVALID_TRANSACTION_EXPECTED_ON`

#### Scenario: Conta ausente ou vazia
- **WHEN** a entidade é criada sem `accountId` ou com `accountId: ""`
- **THEN** a criação falha com `INVALID_TRANSACTION_ACCOUNT_ID`

#### Scenario: Conta com identificador malformado
- **WHEN** a entidade é criada com `accountId: "abc"`
- **THEN** a criação falha com `INVALID_TRANSACTION_ACCOUNT_ID`

---

### Requirement: Opcionais ausentes ou vazios viram null e preenchidos são validados
`note`, `creditCardId`, `subcategoryId` e `settledOn` SHALL ser armazenados como `null` quando ausentes ou informados como string vazia. Quando preenchidos, SHALL ser validados pelo VO correspondente, com os códigos: `MOVEMENT_NOTE_TOO_LONG` para observação longa demais, `INVALID_TRANSACTION_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SUBCATEGORY_ID` e `INVALID_TRANSACTION_SETTLED_ON`.

#### Scenario: Opcionais como string vazia
- **WHEN** a entidade é criada com `note: ""`, `creditCardId: ""` e `subcategoryId: ""`
- **THEN** a criação é bem-sucedida com os três atributos iguais a `null`

#### Scenario: Cartão com identificador malformado
- **WHEN** a entidade é criada com `creditCardId: "abc"`
- **THEN** a criação falha com `INVALID_TRANSACTION_CREDIT_CARD_ID`

#### Scenario: Subcategoria com identificador malformado
- **WHEN** a entidade é criada com `subcategoryId: "abc"`
- **THEN** a criação falha com `INVALID_TRANSACTION_SUBCATEGORY_ID`

#### Scenario: Data de efetivação inválida
- **WHEN** a entidade é criada com `status: "SETTLED"` e `settledOn: "31/12/2026"`
- **THEN** a criação falha com `INVALID_TRANSACTION_SETTLED_ON`

#### Scenario: Observação longa demais
- **WHEN** a entidade é criada com `note` de 501 caracteres
- **THEN** a criação falha com `MOVEMENT_NOTE_TOO_LONG`

---

### Requirement: Status e data de efetivação são coerentes
Com `status: SETTLED`, a entidade SHALL exigir `settledOn` e SHALL falhar com `TRANSACTION_SETTLED_ON_REQUIRED` quando ele não vier. Com `status: PENDING` ou `CANCELED`, a entidade SHALL normalizar `settledOn` para `null`, sem falhar. A entidade SHALL NOT validar a ordem entre `settledOn` e `expectedOn`.

#### Scenario: Efetivada sem data de efetivação
- **WHEN** a entidade é criada com `status: "SETTLED"` e sem `settledOn`
- **THEN** a criação falha com `TRANSACTION_SETTLED_ON_REQUIRED`

#### Scenario: Pendente com data de efetivação
- **WHEN** a entidade é criada com `status: "PENDING"` e `settledOn: "2026-09-10"`
- **THEN** a criação é bem-sucedida e `settledOn` é `null`

#### Scenario: Cancelada com data de efetivação
- **WHEN** a entidade é criada com `status: "CANCELED"` e `settledOn: "2026-09-10"`
- **THEN** a criação é bem-sucedida e `settledOn` é `null`

#### Scenario: Efetivação anterior à data prevista
- **WHEN** a entidade é criada com `status: "SETTLED"`, `expectedOn: "2026-09-20"` e `settledOn: "2026-09-10"`
- **THEN** a criação é bem-sucedida com as duas datas preservadas

---

### Requirement: Transaction é excluída logicamente e não tem chave única de negócio
A entidade SHALL oferecer exclusão lógica que preenche `deletedAt` sem alterar os demais atributos. O agregado SHALL NOT ter checagem de unicidade: duas transações do mesmo usuário com mesmo nome, valor e data SHALL ser válidas.

#### Scenario: Exclusão lógica
- **WHEN** `softDelete()` é chamado em uma transação válida
- **THEN** a nova instância tem `deletedAt` preenchido e os demais atributos iguais aos originais

#### Scenario: Transações idênticas coexistem
- **WHEN** duas transações do mesmo usuário são criadas com o mesmo `name`, `value` e `expectedOn`
- **THEN** ambas são válidas e nenhum código de duplicidade é produzido

---

### Requirement: TransactionErrors reúne só os códigos próprios do agregado
`TransactionErrors` SHALL conter exatamente `TRANSACTION_NOT_FOUND`, `TRANSACTION_SETTLED_ON_REQUIRED`, `INVALID_TRANSACTION_ACCOUNT_ID`, `INVALID_TRANSACTION_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SUBCATEGORY_ID`, `INVALID_TRANSACTION_EXPECTED_ON` e `INVALID_TRANSACTION_SETTLED_ON`, com valor igual à chave e sem tradução. SHALL NOT repetir códigos do núcleo `movement` ou dos VOs, nem conter `TRANSACTION_ALREADY_EXISTS`.

#### Scenario: Conteúdo de TransactionErrors
- **WHEN** as chaves de `TransactionErrors` são inspecionadas
- **THEN** existem exatamente os sete códigos listados, cada um com valor igual ao próprio nome

---

### Requirement: Contrato de repositório com leitura que ignora excluídas
`TransactionRepository` SHALL estender o `CrudRepository` do `@poupig/shared` (`create`, `update`, `findById`, `delete`), sem consulta de unicidade. `findById` SHALL devolver falha com `TRANSACTION_NOT_FOUND` quando o registro não existe ou está excluído logicamente. `delete` SHALL ser lógico.

#### Scenario: Busca de transação excluída
- **WHEN** `findById` é chamado com o id de uma transação com `deletedAt` preenchido
- **THEN** o resultado é falha com `TRANSACTION_NOT_FOUND`

#### Scenario: Busca de id inexistente
- **WHEN** `findById` é chamado com um id que não existe
- **THEN** o resultado é falha com `TRANSACTION_NOT_FOUND`

---

### Requirement: TransactionDTO projeta a transação com os nomes dos vínculos
`TransactionDTO` SHALL conter `id`, `userId`, `name`, `note`, `value`, `direction`, `accountId`, `accountName`, `creditCardId`, `creditCardName`, `subcategoryId`, `subcategoryName`, `categoryName`, `status`, `expectedOn`, `settledOn`, `createdAt` e `updatedAt`. `value` SHALL ser `number`; `expectedOn` e `settledOn` SHALL estar no formato `YYYY-MM-DD`; `createdAt` e `updatedAt` SHALL ser `Date`; todo opcional ausente SHALL ser `null` (nunca `undefined`). O DTO SHALL NOT expor `deletedAt`. Os nomes de vínculo SHALL existir apenas na projeção.

#### Scenario: Transação sem vínculos opcionais
- **WHEN** uma transação sem cartão, subcategoria, observação e data de efetivação é projetada
- **THEN** `creditCardId`, `creditCardName`, `subcategoryId`, `subcategoryName`, `categoryName`, `note` e `settledOn` são `null`

#### Scenario: Transação com subcategoria
- **WHEN** uma transação vinculada à subcategoria "Mercado" da categoria "Alimentação" é projetada
- **THEN** `subcategoryName` é `"Mercado"` e `categoryName` é `"Alimentação"`

---

### Requirement: Consultas de leitura escopadas pelo usuário
O agregado SHALL definir `FindTransactionByIdQuery`, com `execute(id, userId)` devolvendo `Result<TransactionDTO | null>` — `null` quando a transação não existe, está excluída ou é de outro usuário —, e `ListTransactionsQuery`, com `execute(input)` devolvendo `Result<PaginatedResultDTO<TransactionDTO>>`. A entrada da listagem SHALL estender `PaginatedInputDTO` com `userId` e os filtros opcionais `search`, `direction`, `status`, `accountId`, `expectedFrom`, `expectedTo`, `creditCardId` (transações de um cartão específico) e `onlyCreditCard` (apenas transações vinculadas a algum cartão, ignorado quando `creditCardId` vier junto). O contrato SHALL documentar o significado de cada filtro de cartão. SHALL NOT existir tipo de paginação próprio do módulo, e os filtros de cartão SHALL NOT introduzir entidade, VO, caso de uso ou código de erro novo.

#### Scenario: Busca por id de outro usuário
- **WHEN** `FindTransactionByIdQuery.execute` é chamado com o id de uma transação de outro usuário
- **THEN** o resultado é sucesso com `null`

#### Scenario: Formato do resultado paginado
- **WHEN** `ListTransactionsQuery.execute` é chamado
- **THEN** o resultado é `{ data, meta: { page, pageSize, total, totalPages } }`

#### Scenario: Filtros de cartão opcionais
- **WHEN** `ListTransactionsQuery.execute` é chamado sem `creditCardId` e sem `onlyCreditCard`
- **THEN** a entrada é aceita pelo contrato e a listagem não é filtrada por cartão

#### Scenario: Cartão específico com o booleano
- **WHEN** `ListTransactionsQuery.execute` é chamado com `creditCardId` e `onlyCreditCard: true`
- **THEN** somente as transações daquele cartão são consideradas

