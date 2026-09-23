## MODIFIED Requirements

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

### Requirement: Testes de integração via Rest Client cobrem os endpoints de transação
O módulo SHALL ter um arquivo `.http` no formato do Rest Client cobrindo: criar; atualizar; `PUT` com id inexistente (404); listar em 2 páginas conferindo `meta`; listar com busca e com filtros de status, direção e período; listar por `creditCardId`; listar com `onlyCreditCard=true`; os dois filtros de cartão combinados com o período de um mês; filtro de cartão de outro usuário sem vazar transações; `pageSize=100` aceito e `pageSize=101` limitado a `100` no `meta`; buscar por id conferindo `value` numérico e datas em `YYYY-MM-DD`; excluir e buscar de novo (404); `SETTLED` sem `settledOn` (400); valor zero (400, `INVALID_MONEY_AMOUNT`); direção fora do conjunto (400, `INVALID_DIRECTION`); conta de outro usuário (400); e acesso sem token (401).

#### Scenario: Roteiro de integração executável
- **WHEN** as requisições do arquivo `.http` são executadas em ordem contra o backend com banco migrado
- **THEN** cada resposta tem o status e o conteúdo esperados descritos na própria requisição
