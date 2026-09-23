# transaction-series-use-cases Specification

## Purpose
Definir os casos de uso de escrita do agregado `TransactionSeries` — salvar (criar ou atualizar) e excluir — com as regras de posse do usuário e de conferência dos vínculos com conta, cartão e subcategoria.
## Requirements
### Requirement: SaveTransactionSeries cria quando a entrada não tem id
O caso de uso `SaveTransactionSeries` SHALL, quando a entrada não tiver `id`, criar a entidade com um identificador gerado, persistir por `create` e devolver `Result<{ id: string }>` com o id da série gravada. O `userId` SHALL ser sempre o do usuário autenticado recebido pelo caso de uso.

#### Scenario: Criação bem-sucedida
- **WHEN** `SaveTransactionSeries` é executado sem `id`, com dados válidos e vínculos do próprio usuário
- **THEN** o resultado é sucesso com `{ id }` e a série passa a existir no repositório com esse id

#### Scenario: Id devolvido identifica a série criada
- **WHEN** `SaveTransactionSeries` cria um parcelamento de 12 parcelas
- **THEN** o `id` devolvido carrega do repositório a série com as 12 parcelas e a `endDate` calculada

---

### Requirement: SaveTransactionSeries atualiza quando a entrada tem id
Quando a entrada tiver `id`, `SaveTransactionSeries` SHALL carregar a série por `findById`, SHALL propagar a falha do repositório, SHALL falhar com `TRANSACTION_SERIES_NOT_FOUND` quando a série pertencer a outro usuário e, caso contrário, SHALL substituir todos os campos editáveis da série carregada pelos da entrada — opcional ausente vira `null` —, preservando `id`, `userId` e `createdAt`, persistir por `update` e devolver `{ id }` com o mesmo id. A `endDate` de um parcelamento SHALL ser recalculada pela entidade. Um id inexistente SHALL NOT resultar na criação de um registro novo.

#### Scenario: Atualização recalcula a data fim
- **WHEN** `SaveTransactionSeries` é executado com o `id` de um parcelamento mensal no dia 10, início `2026-09-15` e 12 parcelas, trocando para 6 parcelas
- **THEN** o resultado é sucesso com o mesmo `id` e a série persistida tem `endDate` igual a `2027-03-10`

#### Scenario: Atualização limpa opcional omitido
- **WHEN** `SaveTransactionSeries` é executado com o `id` de uma série que tinha `note` e `creditCardId`, sem enviar esses dois campos
- **THEN** a série persistida fica com `note` e `creditCardId` iguais a `null`

#### Scenario: Id inexistente
- **WHEN** `SaveTransactionSeries` é executado com um `id` que não existe
- **THEN** o resultado é falha com `TRANSACTION_SERIES_NOT_FOUND` e nenhum registro é criado

#### Scenario: Série excluída
- **WHEN** `SaveTransactionSeries` é executado com o `id` de uma série excluída logicamente
- **THEN** o resultado é falha com `TRANSACTION_SERIES_NOT_FOUND`

#### Scenario: Série de outro usuário
- **WHEN** `SaveTransactionSeries` é executado com o `id` de uma série de outro usuário
- **THEN** o resultado é falha com `TRANSACTION_SERIES_NOT_FOUND` e a série não é alterada

---

### Requirement: SaveTransactionSeries confere os vínculos depois de validar a entidade
`SaveTransactionSeries` SHALL validar a entidade antes de consultar os vínculos: entidade inválida SHALL falhar com os códigos da entidade, sem consultar vínculos e sem persistir. Com a entidade válida, SHALL conferir pela consulta de vínculos do núcleo `movement` a conta, e o cartão e a subcategoria somente quando informados. Conta inexistente, excluída ou de outro usuário SHALL falhar com `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND`; cartão, com `TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND`; subcategoria, com `TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND`. Os códigos de vínculo falhos SHALL ser acumulados numa única falha e nenhuma falha de vínculo SHALL persistir a série. `SaveTransactionSeriesErrors` SHALL conter exatamente esses três códigos.

#### Scenario: Entidade inválida não consulta vínculos
- **WHEN** `SaveTransactionSeries` é executado com `kind: "CLOSED"` e sem `installments`
- **THEN** o resultado é falha com `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED` e nenhuma consulta de vínculo é feita

#### Scenario: Conta de outro usuário
- **WHEN** `SaveTransactionSeries` é executado com o `accountId` de uma conta de outro usuário
- **THEN** o resultado é falha com `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND` e nada é persistido

#### Scenario: Cartão inexistente ou excluído
- **WHEN** `SaveTransactionSeries` é executado com um `creditCardId` inexistente ou de cartão excluído
- **THEN** o resultado é falha com `TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND`

#### Scenario: Subcategoria de outro usuário
- **WHEN** `SaveTransactionSeries` é executado com o `subcategoryId` de uma subcategoria de outro usuário
- **THEN** o resultado é falha com `TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND`

#### Scenario: Vínculos opcionais ausentes não são consultados
- **WHEN** `SaveTransactionSeries` é executado sem `creditCardId` e sem `subcategoryId`
- **THEN** apenas a conta é conferida e a série é salva

---

### Requirement: DeleteTransactionSeries exclui logicamente a série do usuário
O caso de uso `DeleteTransactionSeries` SHALL carregar a série por `findById`, SHALL falhar com `TRANSACTION_SERIES_NOT_FOUND` quando ela não existir, estiver excluída ou pertencer a outro usuário e, caso contrário, SHALL aplicar a exclusão lógica e persistir por `update`.

#### Scenario: Exclusão bem-sucedida
- **WHEN** `DeleteTransactionSeries` é executado com o id de uma série do usuário
- **THEN** o resultado é sucesso e a série passa a se comportar como inexistente em `findById`

#### Scenario: Exclusão de série de outro usuário
- **WHEN** `DeleteTransactionSeries` é executado com o id de uma série de outro usuário
- **THEN** o resultado é falha com `TRANSACTION_SERIES_NOT_FOUND` e a série continua ativa

#### Scenario: Exclusão repetida
- **WHEN** `DeleteTransactionSeries` é executado novamente com o id de uma série já excluída
- **THEN** o resultado é falha com `TRANSACTION_SERIES_NOT_FOUND`

---

### Requirement: Agregado coberto por testes com dublês em memória
O módulo SHALL ter testes, sem banco de dados, dos conjuntos fechados, da regra de recorrência, do cálculo da agenda, da entidade e dos casos de uso, usando um repositório de séries em memória e a consulta de vínculos em memória já existente. SHALL cobrir no mínimo os cenários das specs `recurrence-schedule`, `transaction-series-domain` e deste documento: enums, cada unidade com sua âncora, âncora faltando e descartada, números como string, intervalo inválido e no teto; primeira ocorrência antes e depois da âncora, semanal a cada 2, trimestral, anual, dia 31 em meses de 30 e em fevereiro (comum e bissexto), 29 de fevereiro anual, âncora voltando a 31 e última parcela de 12; obrigatórios e opcionais, valor zero e negativo, direção e tipo inválidos, parcelamento sem parcelas e acima do teto, recorrência descartando parcelas, data fim calculada e anterior à primeira ocorrência, códigos remapeados de id e data e exclusão lógica; criação x atualização, id inexistente, outro usuário, excluída, cada vínculo inválido e exclusão.

#### Scenario: Suíte do módulo verde
- **WHEN** os testes de `@poupig/transaction` são executados
- **THEN** todos os cenários listados passam, e os testes de `movement` e `transaction` continuam passando
