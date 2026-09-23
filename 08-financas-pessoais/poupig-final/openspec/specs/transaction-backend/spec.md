# transaction-backend Specification

## Purpose
Expor o cadastro de transações pela API REST do backend: persistência no banco relacional, endpoints protegidos em `/transactions`, conversões de valor e data sem perda e mapeamento dos códigos de domínio para respostas HTTP.
## Requirements
### Requirement: Model Transaction mapeado no banco com enums, relações e índices
O schema do banco SHALL conter os enums `Direction` (`IN`, `OUT`) e `TransactionStatus` (`PENDING`, `SETTLED`, `CANCELED`), espelhando os do domínio, e a tabela `transaction` com colunas em snake_case: `value` decimal com 14 dígitos e 2 casas, `expected_on` e `settled_on` como data pura (sem hora), `name` limitado a 100 caracteres, `note` limitado a 500, `created_at`, `updated_at` e `deleted_at` anulável. As relações SHALL ser: usuário e conta obrigatórios com exclusão em cascata; cartão e subcategoria opcionais com anulação na exclusão. SHALL existir índices por (`user_id`, `expected_on`), `account_id`, `credit_card_id` e `subcategory_id`, e nenhuma restrição única de negócio. A migração SHALL se chamar `add_transaction`. Nos models de outros módulos, a única alteração permitida SHALL ser o campo de relação inversa com as transações.

#### Scenario: Migração aplicada
- **WHEN** as migrações são aplicadas em um banco na versão anterior
- **THEN** a migração `add_transaction` cria os dois enums, a tabela `transaction`, as chaves estrangeiras e os índices sem alterar colunas das tabelas existentes

#### Scenario: Exclusão física de cartão
- **WHEN** um cartão referenciado por uma transação é removido fisicamente do banco
- **THEN** a transação permanece com `credit_card_id` nulo

---

### Requirement: Persistência preserva valor monetário e datas puras
O adapter de persistência SHALL implementar o repositório de transações gravando todos os campos em `create` e `update`, inclusive `deletedAt`; `findById` SHALL ignorar registros excluídos e falhar com `TRANSACTION_NOT_FOUND`; `delete` SHALL preencher `deletedAt`. O valor decimal lido do banco SHALL ser convertido para `number` ao montar a entidade e o DTO, e SHALL NOT ser serializado como string ou objeto no JSON. As datas puras SHALL ser convertidas de e para `YYYY-MM-DD` em UTC, sem deslocamento de dia pelo fuso do servidor.

#### Scenario: Valor sai como número
- **WHEN** uma transação gravada com `value: 150.5` é consultada pela API
- **THEN** o JSON contém `"value": 150.5` (número, não string)

#### Scenario: Data pura sem deslocamento de fuso
- **WHEN** uma transação é gravada com `expectedOn: "2026-09-01"` em um servidor com fuso diferente de UTC
- **THEN** a consulta devolve `"expectedOn": "2026-09-01"`

---

### Requirement: Endpoints de transação protegidos e escopados pelo usuário autenticado
Todas as rotas em `/transactions` SHALL exigir autenticação JWT e SHALL identificar o dono sempre pelo usuário autenticado. `userId` enviado no corpo ou na query SHALL ser ignorado. O endpoint de exemplo `GET /transaction` SHALL deixar de existir.

#### Scenario: Acesso sem token
- **WHEN** qualquer rota de `/transactions` é chamada sem token
- **THEN** a resposta é `401`

#### Scenario: userId no corpo ignorado
- **WHEN** `POST /transactions` é chamado com um `userId` de outro usuário no corpo
- **THEN** a transação criada pertence ao usuário autenticado

---

### Requirement: POST /transactions cria e PUT /transactions/:id atualiza
`POST /transactions` SHALL criar uma transação e responder `201` com `{ id }`, ignorando qualquer `id` no corpo. `PUT /transactions/:id` SHALL atualizar a transação identificada pela rota e responder com `{ id }`. Nos dois, `value` recebido como string SHALL ser convertido para número antes da validação, e um valor não numérico SHALL resultar em `INVALID_MONEY_AMOUNT`; `direction` e `status` SHALL ser repassados como chegaram para a validação do domínio. `PUT` com id inexistente, excluído ou de outro usuário SHALL responder `404` com `TRANSACTION_NOT_FOUND`, sem criar registro.

#### Scenario: Criação
- **WHEN** `POST /transactions` é chamado com dados válidos
- **THEN** a resposta é `201` com `{ id }`

#### Scenario: Valor como string numérica
- **WHEN** `POST /transactions` é chamado com `"value": "89.90"`
- **THEN** a transação é criada com `value` `89.9`

#### Scenario: Valor não numérico
- **WHEN** `POST /transactions` é chamado com `"value": "abc"`
- **THEN** a resposta é `400` contendo `INVALID_MONEY_AMOUNT`

#### Scenario: Atualização
- **WHEN** `PUT /transactions/:id` é chamado com o id de uma transação do usuário e dados válidos
- **THEN** a resposta é de sucesso com `{ id }` igual ao da rota

#### Scenario: Atualização de id inexistente
- **WHEN** `PUT /transactions/:id` é chamado com um id que não existe
- **THEN** a resposta é `404` com `TRANSACTION_NOT_FOUND`

---

### Requirement: GET /transactions lista paginado, ordenado e filtrado
`GET /transactions` SHALL responder `{ data, meta: { page, pageSize, total, totalPages } }` somente com transações ativas do usuário, ordenadas por `expectedOn` decrescente e, em empate, por `createdAt` decrescente. `page` SHALL ter mínimo 1 e `pageSize` SHALL ter padrão 10, mínimo 1 e teto 100; o teto dos endpoints de listagem de outros módulos SHALL NOT mudar. Os filtros opcionais SHALL ser: `search` (parte do nome, sem diferenciar maiúsculas), `direction`, `status`, `accountId`, `expectedFrom` e `expectedTo` (inclusivos sobre `expectedOn`, podendo vir só um dos lados), `creditCardId` (transações daquele cartão) e `onlyCreditCard` (transações vinculadas a algum cartão). `creditCardId` SHALL ter espaços nas pontas removidos e, vazio, SHALL significar sem filtro. `onlyCreditCard` SHALL ser considerado verdadeiro somente com os valores `true` ou `1`; qualquer outro valor SHALL significar sem filtro. Quando `creditCardId` e `onlyCreditCard` vierem juntos, `creditCardId` SHALL prevalecer. Filtro ausente SHALL significar sem filtro, e o escopo pelo usuário autenticado e a exclusão das excluídas logicamente SHALL valer com qualquer combinação de filtros. `direction` ou `status` fora do conjunto SHALL responder `400` com `INVALID_DIRECTION` ou `INVALID_TRANSACTION_STATUS`. Cada item SHALL trazer os nomes de conta, cartão, subcategoria e categoria resolvidos na própria consulta.

#### Scenario: Duas páginas
- **WHEN** o usuário tem 12 transações e chama `GET /transactions?page=2&pageSize=10`
- **THEN** `data` tem 2 itens e `meta` é `{ page: 2, pageSize: 10, total: 12, totalPages: 2 }`

#### Scenario: Página de 100 aceita
- **WHEN** `GET /transactions?pageSize=100` é chamado
- **THEN** `meta.pageSize` é `100`

#### Scenario: Teto de pageSize
- **WHEN** `GET /transactions?pageSize=101` é chamado
- **THEN** `meta.pageSize` é `100`

#### Scenario: Ordenação estável no mesmo dia
- **WHEN** duas transações têm o mesmo `expectedOn`
- **THEN** a criada por último aparece primeiro

#### Scenario: Busca por nome sem diferenciar maiúsculas
- **WHEN** `GET /transactions?search=merc` é chamado e existe a transação "Mercado do mês"
- **THEN** a transação aparece em `data`

#### Scenario: Filtros de status, direção e período
- **WHEN** `GET /transactions?status=SETTLED&direction=OUT&expectedFrom=2026-09-01&expectedTo=2026-09-30` é chamado
- **THEN** `data` contém apenas saídas efetivadas com `expectedOn` entre `2026-09-01` e `2026-09-30`, inclusive

#### Scenario: Período com um só lado
- **WHEN** `GET /transactions?expectedFrom=2026-09-01` é chamado
- **THEN** `data` contém as transações com `expectedOn` a partir de `2026-09-01`, sem limite superior

#### Scenario: Filtro por cartão específico
- **WHEN** `GET /transactions?creditCardId=<id do cartão A>&expectedFrom=2026-09-01&expectedTo=2026-09-30` é chamado
- **THEN** `data` contém apenas transações do cartão A com `expectedOn` em setembro de 2026

#### Scenario: Somente transações de cartão
- **WHEN** `GET /transactions?onlyCreditCard=true` é chamado e o usuário tem transações com e sem cartão
- **THEN** `data` contém apenas transações com `creditCardId` preenchido

#### Scenario: Cartão específico prevalece sobre o booleano
- **WHEN** `GET /transactions?creditCardId=<id do cartão A>&onlyCreditCard=true` é chamado
- **THEN** `data` contém apenas transações do cartão A

#### Scenario: Booleano malformado não estreita a listagem
- **WHEN** `GET /transactions?onlyCreditCard=yes` é chamado
- **THEN** `data` inclui transações com e sem cartão, como se o filtro não tivesse sido enviado

#### Scenario: creditCardId vazio
- **WHEN** `GET /transactions?creditCardId=%20` é chamado
- **THEN** a listagem é devolvida sem filtro de cartão

#### Scenario: Cartão de outro usuário não vaza transações
- **WHEN** `GET /transactions?creditCardId=<id de cartão de outro usuário>` é chamado
- **THEN** a resposta é de sucesso com `data` vazio e `meta.total` `0`

#### Scenario: Direção fora do conjunto no filtro
- **WHEN** `GET /transactions?direction=INFLOW` é chamado
- **THEN** a resposta é `400` com `INVALID_DIRECTION`

#### Scenario: Transações excluídas e de outros usuários fora da lista
- **WHEN** `GET /transactions` é chamado
- **THEN** nenhuma transação excluída logicamente ou de outro usuário aparece e nenhum item expõe `deletedAt`

---

### Requirement: GET /transactions/:id busca uma transação do usuário
`GET /transactions/:id` SHALL responder o `TransactionDTO` da transação ativa do usuário, com `value` numérico e datas em `YYYY-MM-DD`. Transação inexistente, excluída ou de outro usuário SHALL responder `404` com `TRANSACTION_NOT_FOUND`.

#### Scenario: Busca bem-sucedida
- **WHEN** `GET /transactions/:id` é chamado com o id de uma transação do usuário
- **THEN** a resposta traz o DTO com `value` numérico, `expectedOn` em `YYYY-MM-DD` e opcionais ausentes como `null`

#### Scenario: Transação de outro usuário
- **WHEN** `GET /transactions/:id` é chamado com o id de uma transação de outro usuário
- **THEN** a resposta é `404` com `TRANSACTION_NOT_FOUND`

---

### Requirement: DELETE /transactions/:id exclui logicamente
`DELETE /transactions/:id` SHALL excluir logicamente a transação do usuário e responder com sucesso. Depois da exclusão, `GET /transactions/:id` SHALL responder `404` e a transação SHALL NOT aparecer na listagem. Transação inexistente, já excluída ou de outro usuário SHALL responder `404` com `TRANSACTION_NOT_FOUND`.

#### Scenario: Excluir e buscar de novo
- **WHEN** `DELETE /transactions/:id` é chamado e, em seguida, `GET /transactions/:id`
- **THEN** a exclusão responde com sucesso e a busca responde `404` com `TRANSACTION_NOT_FOUND`

---

### Requirement: Falhas de domínio mapeadas para respostas HTTP
A API SHALL responder `404` quando os códigos de falha contiverem `TRANSACTION_NOT_FOUND` e `400` com a lista de códigos para qualquer outra falha, inclusive `TRANSACTION_ACCOUNT_NOT_FOUND`, `TRANSACTION_CREDIT_CARD_NOT_FOUND` e `TRANSACTION_SUBCATEGORY_NOT_FOUND`. O backend SHALL NOT traduzir códigos de erro.

#### Scenario: Efetivada sem data de efetivação
- **WHEN** `POST /transactions` é chamado com `"status": "SETTLED"` e sem `settledOn`
- **THEN** a resposta é `400` contendo `TRANSACTION_SETTLED_ON_REQUIRED`

#### Scenario: Valor zero
- **WHEN** `POST /transactions` é chamado com `"value": 0`
- **THEN** a resposta é `400` contendo `INVALID_MONEY_AMOUNT`

#### Scenario: Direção fora do conjunto
- **WHEN** `POST /transactions` é chamado com `"direction": "INFLOW"`
- **THEN** a resposta é `400` contendo `INVALID_DIRECTION`

#### Scenario: Conta de outro usuário
- **WHEN** `POST /transactions` é chamado com o `accountId` de uma conta de outro usuário
- **THEN** a resposta é `400` contendo `TRANSACTION_ACCOUNT_NOT_FOUND`

---

### Requirement: Testes de integração via Rest Client cobrem os endpoints de transação
O módulo SHALL ter um arquivo `.http` no formato do Rest Client cobrindo: criar; atualizar; `PUT` com id inexistente (404); listar em 2 páginas conferindo `meta`; listar com busca e com filtros de status, direção e período; listar por `creditCardId`; listar com `onlyCreditCard=true`; os dois filtros de cartão combinados com o período de um mês; filtro de cartão de outro usuário sem vazar transações; `pageSize=100` aceito e `pageSize=101` limitado a `100` no `meta`; buscar por id conferindo `value` numérico e datas em `YYYY-MM-DD`; excluir e buscar de novo (404); `SETTLED` sem `settledOn` (400); valor zero (400, `INVALID_MONEY_AMOUNT`); direção fora do conjunto (400, `INVALID_DIRECTION`); conta de outro usuário (400); e acesso sem token (401).

#### Scenario: Roteiro de integração executável
- **WHEN** as requisições do arquivo `.http` são executadas em ordem contra o backend com banco migrado
- **THEN** cada resposta tem o status e o conteúdo esperados descritos na própria requisição

