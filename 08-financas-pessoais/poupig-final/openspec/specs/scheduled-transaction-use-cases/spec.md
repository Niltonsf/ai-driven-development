# scheduled-transaction-use-cases Specification

## Purpose
Definir os casos de uso do agregado `ScheduledTransaction` — gravar (inserir ou alterar) uma ocorrência, abrir uma ocorrência gravada ou gerada e reverter uma ocorrência para a série — com a posse do usuário, a validação da ocorrência contra a série e a conferência dos vínculos.
## Requirements
### Requirement: SaveScheduledTransaction valida a série e a ocorrência antes de gravar
O caso de uso `SaveScheduledTransaction` SHALL receber `seriesId`, `occurrenceIndex`, o `userId` do usuário autenticado, o `id` da ocorrência aberta e os campos editáveis (`name`, `note`, `value`, `direction`, `accountId`, `creditCardId`, `subcategoryId`, `status`, `expectedOn`, `settledOn`). SHALL buscar a série do usuário e falhar com `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND` quando ela não existir, estiver excluída ou for de outro usuário. SHALL calcular a data da ocorrência pela série e falhar com `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND` quando o índice não pertencer à série. `occurrenceOn` SHALL ser sempre a data calculada pela série: um `occurrenceOn` recebido na entrada SHALL ser ignorado. Nenhuma dessas falhas SHALL persistir nada.

#### Scenario: Série de outro usuário
- **WHEN** `SaveScheduledTransaction` é executado com o `seriesId` de uma série de outro usuário
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND` e nada é gravado

#### Scenario: Série excluída
- **WHEN** `SaveScheduledTransaction` é executado com o `seriesId` de uma série excluída logicamente
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND`

#### Scenario: Índice fora de um parcelamento
- **WHEN** `SaveScheduledTransaction` é executado com `occurrenceIndex: 12` em um parcelamento de 12
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`

#### Scenario: Ocorrência depois do fim de uma recorrência
- **WHEN** `SaveScheduledTransaction` é executado com o índice de uma ocorrência que cairia depois da `endDate` da recorrência
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`

#### Scenario: occurrenceOn do cliente ignorado
- **WHEN** `SaveScheduledTransaction` é executado para o índice 3 de um parcelamento cuja ocorrência 3 é `2027-01-10`, com `occurrenceOn: "2027-01-25"` na entrada
- **THEN** a ocorrência gravada tem `occurrenceOn: "2027-01-10"`

---

### Requirement: SaveScheduledTransaction confere os vínculos depois de validar a entidade
Com a série e a ocorrência válidas, `SaveScheduledTransaction` SHALL validar a entidade antes de consultar os vínculos: entidade inválida SHALL falhar com os códigos da entidade, sem consultar vínculos e sem gravar. Com a entidade válida, SHALL conferir a conta, e o cartão e a subcategoria somente quando informados. Conta inexistente, excluída ou de outro usuário SHALL falhar com `SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND`; cartão, com `SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND`; subcategoria, com `SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND`. `SaveScheduledTransactionErrors` SHALL conter exatamente `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND`, `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND` e esses três códigos de vínculo.

#### Scenario: Entidade inválida não consulta vínculos
- **WHEN** `SaveScheduledTransaction` é executado com `value: 0`
- **THEN** o resultado é falha com `INVALID_MONEY_AMOUNT`, nenhuma consulta de vínculo é feita e nada é gravado

#### Scenario: Conta de outro usuário
- **WHEN** `SaveScheduledTransaction` é executado com o `accountId` de uma conta de outro usuário
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND` e nada é gravado

#### Scenario: Cartão inexistente
- **WHEN** `SaveScheduledTransaction` é executado com um `creditCardId` inexistente
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND`

#### Scenario: Subcategoria de outro usuário
- **WHEN** `SaveScheduledTransaction` é executado com o `subcategoryId` de uma subcategoria de outro usuário
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND`

---

### Requirement: SaveScheduledTransaction insere ou altera pela ocorrência
Passadas as validações, `SaveScheduledTransaction` SHALL decidir entre inserir e alterar consultando a ocorrência gravada pelo par `(seriesId, occurrenceIndex)` do usuário, e SHALL NOT decidir pelo `id` da entrada. Quando a ocorrência não estiver gravada, SHALL gravá-la por `create` usando o `id` da entrada. Quando já estiver gravada, SHALL carregar o registro pelo `id` **gravado**, substituir somente os campos editáveis — opcional ausente vira `null` —, preservando `id`, `userId`, `seriesId`, `occurrenceIndex`, `occurrenceOn` e `createdAt`, e gravar por `update`. Nos dois casos SHALL devolver `Result<{ id: string }>` com o id do registro gravado. Um `id` de entrada diferente do gravado SHALL NOT renumerar o registro.

#### Scenario: Primeira gravação
- **WHEN** `SaveScheduledTransaction` é executado para uma ocorrência ainda não gravada com `id: "a1"` e `value: 300`
- **THEN** o resultado é sucesso com `{ id: "a1" }` e a ocorrência passa a estar gravada com esse id e o novo valor

#### Scenario: Segunda gravação altera a mesma ocorrência
- **WHEN** `SaveScheduledTransaction` é executado de novo para a mesma série e índice com `id: "a1"` e `status: "CANCELED"`
- **THEN** o resultado é sucesso com `{ id: "a1" }`, continua existindo uma única ocorrência gravada para o par e ela tem `status: "CANCELED"`

#### Scenario: Id de cliente diferente do gravado
- **WHEN** a ocorrência está gravada com `id: "a1"` e `SaveScheduledTransaction` é executado para o mesmo par com `id: "b2"`
- **THEN** o resultado é sucesso com `{ id: "a1" }`, nenhum registro com `id: "b2"` é criado e a ocorrência gravada é alterada

#### Scenario: Alteração limpa opcional omitido
- **WHEN** a ocorrência gravada tem `note` e `creditCardId` e é salva de novo sem esses dois campos
- **THEN** a ocorrência gravada fica com `note` e `creditCardId` iguais a `null`

---

### Requirement: FindScheduledTransaction abre a ocorrência gravada ou gerada
O caso de uso `FindScheduledTransaction` SHALL receber `seriesId`, `occurrenceIndex` e `userId`. Quando a ocorrência estiver gravada para o usuário, SHALL devolver o DTO gravado (`materialized: true`). Caso contrário, SHALL buscar a série, falhar com `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND` quando ela não existir, estiver excluída ou for de outro usuário, falhar com `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND` quando o índice não pertencer à série e, com a ocorrência válida, SHALL devolver o DTO da ocorrência gerada em memória (`materialized: false`), sem gravar nada.

#### Scenario: Ocorrência gravada
- **WHEN** `FindScheduledTransaction` é executado para uma ocorrência gravada com `value: 300`
- **THEN** o resultado é o DTO com `materialized: true` e `value: 300`

#### Scenario: Ocorrência ainda não gravada
- **WHEN** `FindScheduledTransaction` é executado para o índice 3 de um parcelamento de R$ 250,00 sem ocorrência gravada
- **THEN** o resultado é o DTO com `materialized: false`, `value: 250`, `status: "PENDING"`, `occurrenceIndex: 3`, `occurrenceOn` e `expectedOn` iguais à data da ocorrência, e nada é gravado

#### Scenario: Índice fora da série
- **WHEN** `FindScheduledTransaction` é executado com um índice que não pertence à série
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`

#### Scenario: Série de outro usuário
- **WHEN** `FindScheduledTransaction` é executado com o `seriesId` de uma série de outro usuário
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND`

---

### Requirement: ResetScheduledTransaction reverte a ocorrência para a série
O caso de uso `ResetScheduledTransaction` SHALL receber `seriesId`, `occurrenceIndex` e `userId`, localizar a ocorrência gravada do usuário pelo par, falhar com `SCHEDULED_TRANSACTION_NOT_FOUND` quando ela não estiver gravada, for de outro usuário ou pertencer a série excluída e, caso contrário, SHALL remover o registro fisicamente pelo id gravado. Depois da reversão, a ocorrência SHALL voltar a ser gerada a partir da série.

#### Scenario: Reversão bem-sucedida
- **WHEN** `ResetScheduledTransaction` é executado para uma ocorrência gravada do usuário
- **THEN** o resultado é sucesso, o registro deixa de existir e `FindScheduledTransaction` passa a devolver a ocorrência com `materialized: false`

#### Scenario: Ocorrência não gravada
- **WHEN** `ResetScheduledTransaction` é executado para uma ocorrência que nunca foi gravada
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_NOT_FOUND`

#### Scenario: Ocorrência de outro usuário
- **WHEN** `ResetScheduledTransaction` é executado com o `userId` de outro usuário
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_NOT_FOUND` e o registro continua existindo

---

### Requirement: Agregado coberto por testes com dublês em memória
O módulo SHALL ter testes, sem banco de dados, cobrindo: as ocorrências em um período do cálculo de agenda (todos os cenários do requisito correspondente); a entidade (obrigatórios ausentes, série e conta vazias com os códigos próprios, índice 0 aceito e negativo/fracionário recusado, `SETTLED` sem `settledOn`, `settledOn` descartado fora de `SETTLED`, `expectedOn` antes e depois de `occurrenceOn`, derivação preservando a identidade da ocorrência e revalidando a efetivação); a geração (data dentro e fora de parcelamento e de recorrência com fim, supressão da gravada, campos copiados, entidade válida com `id`, `PENDING` e datas iguais, projeção com `materialized: false`); e todos os cenários de `SaveScheduledTransaction`, `FindScheduledTransaction` e `ResetScheduledTransaction`, usando um repositório de ocorrências em memória.

#### Scenario: Suíte do módulo verde
- **WHEN** os testes de `@poupig/transaction` são executados
- **THEN** todos os cenários listados passam sem depender de banco de dados

