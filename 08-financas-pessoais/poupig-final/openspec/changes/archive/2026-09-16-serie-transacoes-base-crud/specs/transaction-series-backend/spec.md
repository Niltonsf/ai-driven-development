## Purpose

Expor o cadastro de séries de transações pela API REST do backend: persistência da série e da regra de recorrência no banco relacional, endpoints protegidos em `/transaction-series`, conversões de valor e data sem perda e mapeamento dos códigos de domínio para respostas HTTP.

## ADDED Requirements

### Requirement: Model TransactionSeries mapeado no banco com enums, relações e índices
O schema do banco SHALL conter os enums `SeriesKind` (`OPEN`, `CLOSED`) e `FrequencyUnit` (`WEEK`, `MONTH`, `YEAR`), espelhando os do domínio, e a tabela `transaction_series` com colunas em snake_case: `name` limitado a 100 caracteres, `note` limitado a 500 e anulável, `value` decimal com 14 dígitos e 2 casas, `direction`, `kind`, `frequency_unit`, `frequency_interval` inteiro pequeno, `week_day`, `day_of_month`, `month` e `installments` inteiros pequenos anuláveis, `start_date` e `end_date` (anulável) como data pura, `created_at`, `updated_at` e `deleted_at` anulável. As relações SHALL ser: usuário e conta obrigatórios com exclusão em cascata; cartão e subcategoria opcionais com anulação na exclusão. SHALL existir índices por (`user_id`, `start_date`), `account_id`, `credit_card_id` e `subcategory_id`, e nenhuma restrição única de negócio. A migração SHALL se chamar `add_transaction_series`. Nos models de outros módulos, a única alteração permitida SHALL ser o campo de relação inversa com as séries.

#### Scenario: Migração aplicada
- **WHEN** as migrações são aplicadas em um banco na versão anterior
- **THEN** a migração `add_transaction_series` cria os dois enums, a tabela `transaction_series`, as chaves estrangeiras e os índices, sem alterar colunas das tabelas existentes

#### Scenario: Exclusão física de subcategoria
- **WHEN** uma subcategoria referenciada por uma série é removida fisicamente do banco
- **THEN** a série permanece com `subcategory_id` nulo

---

### Requirement: Regra de recorrência gravada em colunas planas
A persistência SHALL gravar a unidade e o intervalo em suas colunas e, das colunas de âncora, somente as da unidade da regra, gravando `null` nas demais. Na leitura, a regra SHALL ser remontada a partir da unidade gravada, lendo apenas as âncoras daquela unidade.

#### Scenario: Série mensal gravada
- **WHEN** uma série com regra `{ unit: "MONTH", interval: 3, dayOfMonth: 5 }` é gravada
- **THEN** a linha tem `frequency_unit = MONTH`, `frequency_interval = 3`, `day_of_month = 5` e `week_day` e `month` nulos

#### Scenario: Série anual lida
- **WHEN** uma série gravada com `frequency_unit = YEAR`, `month = 3` e `day_of_month = 10` é consultada pela API
- **THEN** o JSON contém `"recurrence": { "unit": "YEAR", "interval": 1, "month": 3, "dayOfMonth": 10 }`, sem `weekDay`

---

### Requirement: Persistência preserva valor monetário e datas puras
O adapter de persistência SHALL implementar o repositório de séries gravando todos os campos em `create` e `update`, inclusive `deletedAt`; `findById` SHALL ignorar registros excluídos e falhar com `TRANSACTION_SERIES_NOT_FOUND`; `delete` SHALL preencher `deletedAt`. O valor decimal lido do banco SHALL ser convertido para `number` ao montar a entidade e o DTO, e SHALL NOT ser serializado como string ou objeto. As datas puras SHALL ser convertidas de e para `YYYY-MM-DD` em UTC, sem deslocamento de dia pelo fuso do servidor. As conversões de data e a seleção dos nomes de vínculo SHALL ser as mesmas usadas pelas transações, e compartilhá-las SHALL NOT alterar nenhuma resposta de `/transactions`.

#### Scenario: Valor sai como número
- **WHEN** uma série gravada com `value: 250.5` é consultada pela API
- **THEN** o JSON contém `"value": 250.5` (número, não string)

#### Scenario: Data pura sem deslocamento de fuso
- **WHEN** uma série é gravada com `startDate: "2026-09-01"` em um servidor com fuso diferente de UTC
- **THEN** a consulta devolve `"startDate": "2026-09-01"`

#### Scenario: Transações inalteradas
- **WHEN** `GET /transactions` e `GET /transactions/:id` são chamados depois desta mudança
- **THEN** as respostas têm o mesmo formato, valores e datas de antes

---

### Requirement: Endpoints de série protegidos e escopados pelo usuário autenticado
Todas as rotas em `/transaction-series` SHALL exigir autenticação JWT e SHALL identificar o dono sempre pelo usuário autenticado. `userId` enviado no corpo ou na query SHALL ser ignorado.

#### Scenario: Acesso sem token
- **WHEN** qualquer rota de `/transaction-series` é chamada sem token
- **THEN** a resposta é `401`

#### Scenario: userId no corpo ignorado
- **WHEN** `POST /transaction-series` é chamado com um `userId` de outro usuário no corpo
- **THEN** a série criada pertence ao usuário autenticado

---

### Requirement: POST /transaction-series cria e PUT /transaction-series/:id atualiza
`POST /transaction-series` SHALL criar uma série e responder `201` com `{ id }`, ignorando qualquer `id` no corpo. `PUT /transaction-series/:id` SHALL atualizar a série identificada pela rota e responder com `{ id }`. O corpo SHALL carregar a regra achatada nos campos `unit`, `interval`, `weekDay`, `dayOfMonth` e `month`, além de `name`, `note`, `value`, `direction`, `accountId`, `creditCardId`, `subcategoryId`, `kind`, `startDate`, `endDate` e `installments`. `value`, `interval`, `weekDay`, `dayOfMonth`, `month` e `installments` recebidos como string SHALL ser convertidos para número antes da validação; valor não numérico SHALL resultar no código de validação do atributo, e SHALL NOT ser gravado. `unit`, `kind` e `direction` SHALL ser repassados como chegaram para a validação do domínio. A `endDate` enviada para um parcelamento SHALL ser ignorada. `PUT` com id inexistente, excluído ou de outro usuário SHALL responder `404` com `TRANSACTION_SERIES_NOT_FOUND`, sem criar registro.

#### Scenario: Parcelamento mensal de 12
- **WHEN** `POST /transaction-series` é chamado com `kind: "CLOSED"`, `unit: "MONTH"`, `interval: 1`, `dayOfMonth: 10`, `startDate: "2026-09-15"`, `installments: 12` e `endDate: "2030-01-01"`
- **THEN** a resposta é `201` com `{ id }` e a busca desse id traz `endDate` igual a `"2027-09-10"`

#### Scenario: Recorrência semanal sem fim
- **WHEN** `POST /transaction-series` é chamado com `kind: "OPEN"`, `unit: "WEEK"`, `interval: 1`, `weekDay: 5`, sem `endDate` e com `installments: 3`
- **THEN** a resposta é `201` e a busca traz `endDate` e `installments` iguais a `null`

#### Scenario: Recorrência trimestral
- **WHEN** `POST /transaction-series` é chamado com `kind: "OPEN"`, `unit: "MONTH"`, `interval: 3` e `dayOfMonth: 5`
- **THEN** a resposta é `201` e a busca traz `recurrence` igual a `{ "unit": "MONTH", "interval": 3, "dayOfMonth": 5 }`

#### Scenario: Números como string
- **WHEN** `POST /transaction-series` é chamado com `"value": "89.90"`, `"interval": "1"`, `"dayOfMonth": "10"` e `"installments": "12"`
- **THEN** a série é criada com esses atributos numéricos

#### Scenario: Número não numérico
- **WHEN** `POST /transaction-series` é chamado com `"interval": "abc"`
- **THEN** a resposta é `400` contendo `INVALID_RECURRENCE_INTERVAL`

#### Scenario: Atualização recalcula a data fim
- **WHEN** `PUT /transaction-series/:id` é chamado para o parcelamento de 12 parcelas com `installments: 6` e os demais campos iguais
- **THEN** a resposta traz `{ id }` igual ao da rota e a busca traz `endDate` igual a `"2027-03-10"`

#### Scenario: Atualização de id inexistente
- **WHEN** `PUT /transaction-series/:id` é chamado com um id que não existe
- **THEN** a resposta é `404` com `TRANSACTION_SERIES_NOT_FOUND`

---

### Requirement: GET /transaction-series lista paginado, ordenado e filtrado
`GET /transaction-series` SHALL responder `{ data, meta: { page, pageSize, total, totalPages } }` somente com séries ativas do usuário, ordenadas por `startDate` decrescente e, em empate, por `createdAt` decrescente. `page` SHALL ter mínimo 1 e `pageSize` SHALL ter padrão 10 e teto 50. Os filtros opcionais SHALL ser `search` (parte do nome, sem diferenciar maiúsculas), `kind`, `direction` e `accountId`; filtro ausente SHALL significar sem filtro. `kind` ou `direction` fora do conjunto SHALL responder `400` com `INVALID_SERIES_KIND` ou `INVALID_DIRECTION`. Cada item SHALL trazer os nomes de conta, cartão, subcategoria e categoria resolvidos na própria consulta.

#### Scenario: Duas páginas
- **WHEN** o usuário tem 12 séries e chama `GET /transaction-series?page=2&pageSize=10`
- **THEN** `data` tem 2 itens e `meta` é `{ page: 2, pageSize: 10, total: 12, totalPages: 2 }`

#### Scenario: Teto de pageSize
- **WHEN** `GET /transaction-series?pageSize=500` é chamado
- **THEN** `meta.pageSize` é `50`

#### Scenario: Filtro por tipo
- **WHEN** `GET /transaction-series?kind=CLOSED` é chamado
- **THEN** `data` contém apenas parcelamentos

#### Scenario: Tipo fora do conjunto no filtro
- **WHEN** `GET /transaction-series?kind=INSTALLMENT` é chamado
- **THEN** a resposta é `400` com `INVALID_SERIES_KIND`

#### Scenario: Busca por nome sem diferenciar maiúsculas
- **WHEN** `GET /transaction-series?search=alug` é chamado e existe a série "Aluguel"
- **THEN** a série aparece em `data`

#### Scenario: Séries excluídas e de outros usuários fora da lista
- **WHEN** `GET /transaction-series` é chamado
- **THEN** nenhuma série excluída logicamente ou de outro usuário aparece e nenhum item expõe `deletedAt`

---

### Requirement: GET /transaction-series/:id busca uma série do usuário
`GET /transaction-series/:id` SHALL responder o DTO da série ativa do usuário, com `value` numérico, datas em `YYYY-MM-DD` e a regra com o discriminante `unit`. Série inexistente, excluída ou de outro usuário SHALL responder `404` com `TRANSACTION_SERIES_NOT_FOUND`.

#### Scenario: Busca bem-sucedida
- **WHEN** `GET /transaction-series/:id` é chamado com o id de uma série do usuário
- **THEN** a resposta traz o DTO com `value` numérico, `startDate` em `YYYY-MM-DD`, `recurrence` com `unit` e opcionais ausentes como `null`

#### Scenario: Série de outro usuário
- **WHEN** `GET /transaction-series/:id` é chamado com o id de uma série de outro usuário
- **THEN** a resposta é `404` com `TRANSACTION_SERIES_NOT_FOUND`

---

### Requirement: DELETE /transaction-series/:id exclui logicamente
`DELETE /transaction-series/:id` SHALL excluir logicamente a série do usuário e responder com sucesso. Depois da exclusão, `GET /transaction-series/:id` SHALL responder `404` e a série SHALL NOT aparecer na listagem. Série inexistente, já excluída ou de outro usuário SHALL responder `404` com `TRANSACTION_SERIES_NOT_FOUND`.

#### Scenario: Excluir e buscar de novo
- **WHEN** `DELETE /transaction-series/:id` é chamado e, em seguida, `GET /transaction-series/:id`
- **THEN** a exclusão responde com sucesso e a busca responde `404` com `TRANSACTION_SERIES_NOT_FOUND`

---

### Requirement: Falhas de domínio mapeadas para respostas HTTP
A API SHALL responder `404` quando os códigos de falha contiverem `TRANSACTION_SERIES_NOT_FOUND` e `400` com a lista de códigos para qualquer outra falha, inclusive `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND`, `TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND` e `TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND`. O backend SHALL NOT traduzir códigos de erro.

#### Scenario: Parcelamento sem parcelas
- **WHEN** `POST /transaction-series` é chamado com `kind: "CLOSED"` e sem `installments`
- **THEN** a resposta é `400` contendo `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`

#### Scenario: Âncora faltando para a unidade
- **WHEN** `POST /transaction-series` é chamado com `unit: "MONTH"` e sem `dayOfMonth`
- **THEN** a resposta é `400` contendo `INVALID_RECURRENCE_DAY_OF_MONTH`

#### Scenario: Conta de outro usuário
- **WHEN** `POST /transaction-series` é chamado com o `accountId` de uma conta de outro usuário
- **THEN** a resposta é `400` contendo `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND`

---

### Requirement: Testes de integração via Rest Client cobrem os endpoints de série
O módulo SHALL ter um arquivo `.http` no formato do Rest Client cobrindo: criar parcelamento mensal de 12 conferindo a `endDate` calculada; criar recorrência semanal sem fim; criar recorrência trimestral (mensal a cada 3); atualizar uma série conferindo a `endDate` recalculada; `PUT` com id inexistente (404); listar em 2 páginas e com filtro de `kind`; buscar por id; excluir e buscar de novo (404); parcelamento sem parcelas (400); âncora faltando para a unidade escolhida (400); conta de outro usuário (400); e acesso sem token (401).

#### Scenario: Roteiro de integração executável
- **WHEN** as requisições do arquivo `.http` são executadas em ordem contra o backend com banco migrado
- **THEN** cada resposta tem o status e o conteúdo esperados descritos na própria requisição
