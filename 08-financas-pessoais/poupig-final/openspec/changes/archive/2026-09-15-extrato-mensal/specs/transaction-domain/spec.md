## MODIFIED Requirements

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
