# transaction-use-cases Specification

## Purpose
Definir os casos de uso de escrita do agregado `Transaction` — salvar (criar ou atualizar) e excluir — com as regras de posse do usuário e de conferência dos vínculos com conta, cartão e subcategoria.
## Requirements
### Requirement: SaveTransaction cria quando a entrada não tem id
O caso de uso `SaveTransaction` SHALL, quando a entrada não tiver `id`, criar a entidade com um identificador gerado, persistir por `create` e devolver `Result<{ id: string }>` com o id gravado. O `userId` SHALL ser sempre o do usuário autenticado recebido pelo caso de uso.

#### Scenario: Criação bem-sucedida
- **WHEN** `SaveTransaction` é executado sem `id`, com dados válidos e vínculos do próprio usuário
- **THEN** o resultado é sucesso com `{ id }` e a transação passa a existir no repositório com esse id

---

### Requirement: SaveTransaction atualiza quando a entrada tem id
Quando a entrada tiver `id`, `SaveTransaction` SHALL carregar a transação por `findById`, SHALL propagar a falha do repositório, SHALL falhar com `TRANSACTION_NOT_FOUND` quando a transação pertencer a outro usuário e, caso contrário, SHALL substituir todos os campos editáveis da entidade carregada pelos da entrada — opcional ausente vira `null` —, preservando `id`, `userId` e `createdAt`, persistir por `update` e devolver `{ id }` com o mesmo id. Um id inexistente SHALL NOT resultar na criação de um registro novo.

#### Scenario: Atualização bem-sucedida
- **WHEN** `SaveTransaction` é executado com o `id` de uma transação do usuário e um novo `name`
- **THEN** o resultado é sucesso com o mesmo `id` e a transação persistida tem o novo nome

#### Scenario: Atualização limpa opcional omitido
- **WHEN** `SaveTransaction` é executado com o `id` de uma transação que tinha `note` e `creditCardId`, sem enviar esses dois campos
- **THEN** a transação persistida fica com `note` e `creditCardId` iguais a `null`

#### Scenario: Id inexistente
- **WHEN** `SaveTransaction` é executado com um `id` que não existe
- **THEN** o resultado é falha com `TRANSACTION_NOT_FOUND` e nenhum registro é criado

#### Scenario: Transação excluída
- **WHEN** `SaveTransaction` é executado com o `id` de uma transação excluída logicamente
- **THEN** o resultado é falha com `TRANSACTION_NOT_FOUND`

#### Scenario: Transação de outro usuário
- **WHEN** `SaveTransaction` é executado com o `id` de uma transação de outro usuário
- **THEN** o resultado é falha com `TRANSACTION_NOT_FOUND` e a transação não é alterada

---

### Requirement: SaveTransaction confere os vínculos depois de validar a entidade
`SaveTransaction` SHALL validar a entidade antes de consultar os vínculos: entidade inválida SHALL falhar com os códigos da entidade, sem consultar vínculos e sem persistir. Com a entidade válida, SHALL conferir pela `MovementReferencesQuery` a conta, e o cartão e a subcategoria somente quando informados. Conta inexistente, excluída ou de outro usuário SHALL falhar com `TRANSACTION_ACCOUNT_NOT_FOUND`; cartão, com `TRANSACTION_CREDIT_CARD_NOT_FOUND`; subcategoria, com `TRANSACTION_SUBCATEGORY_NOT_FOUND`. Nenhuma falha de vínculo SHALL persistir a transação. `SaveTransactionErrors` SHALL conter exatamente esses três códigos.

#### Scenario: Entidade inválida não consulta vínculos
- **WHEN** `SaveTransaction` é executado com `value: 0`
- **THEN** o resultado é falha com `INVALID_MONEY_AMOUNT` e nenhuma consulta de vínculo é feita

#### Scenario: Conta de outro usuário
- **WHEN** `SaveTransaction` é executado com o `accountId` de uma conta de outro usuário
- **THEN** o resultado é falha com `TRANSACTION_ACCOUNT_NOT_FOUND` e nada é persistido

#### Scenario: Cartão inexistente ou excluído
- **WHEN** `SaveTransaction` é executado com um `creditCardId` inexistente ou de cartão excluído
- **THEN** o resultado é falha com `TRANSACTION_CREDIT_CARD_NOT_FOUND`

#### Scenario: Subcategoria de outro usuário
- **WHEN** `SaveTransaction` é executado com o `subcategoryId` de uma subcategoria de outro usuário
- **THEN** o resultado é falha com `TRANSACTION_SUBCATEGORY_NOT_FOUND`

#### Scenario: Vínculos opcionais ausentes não são consultados
- **WHEN** `SaveTransaction` é executado sem `creditCardId` e sem `subcategoryId`
- **THEN** apenas a conta é conferida e a transação é salva

---

### Requirement: DeleteTransaction exclui logicamente a transação do usuário
O caso de uso `DeleteTransaction` SHALL carregar a transação por `findById`, SHALL falhar com `TRANSACTION_NOT_FOUND` quando ela não existir, estiver excluída ou pertencer a outro usuário e, caso contrário, SHALL aplicar a exclusão lógica e persistir por `update`.

#### Scenario: Exclusão bem-sucedida
- **WHEN** `DeleteTransaction` é executado com o id de uma transação do usuário
- **THEN** o resultado é sucesso e a transação passa a se comportar como inexistente em `findById`

#### Scenario: Exclusão de transação de outro usuário
- **WHEN** `DeleteTransaction` é executado com o id de uma transação de outro usuário
- **THEN** o resultado é falha com `TRANSACTION_NOT_FOUND` e a transação continua ativa

#### Scenario: Exclusão repetida
- **WHEN** `DeleteTransaction` é executado novamente com o id de uma transação já excluída
- **THEN** o resultado é falha com `TRANSACTION_NOT_FOUND`

---

### Requirement: Agregado coberto por testes com dublês em memória
O módulo SHALL ter testes da entidade e dos casos de uso que usam um repositório de transações e uma consulta de vínculos em memória, cobrindo: obrigatórios ausentes; opcionais ausentes e string vazia virando `null`; valor zero e negativo reprovados; valor arredondado para duas casas; direção e status inválidos (inclusive `INFLOW` e `COMPLETED`); status padrão `PENDING`; `SETTLED` sem `settledOn` reprovado; `settledOn` descartado em `PENDING` e `CANCELED`; `settledOn` anterior a `expectedOn` aceito; data inválida e id de vínculo inválido com os códigos próprios; criação sem id e atualização com id; id inexistente; transação de outro usuário; transação excluída tratada como inexistente; e cada um dos três vínculos inválidos.

#### Scenario: Suíte do módulo verde
- **WHEN** os testes de `@poupig/transaction` são executados
- **THEN** todos os cenários listados passam sem depender de banco de dados

