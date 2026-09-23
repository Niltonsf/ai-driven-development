## Purpose

Expor o extrato mensal unificado pela API REST do backend em uma única resposta por mês, com período obrigatório, os mesmos filtros da listagem de transações e o formato paginado compartilhado.

## ADDED Requirements

### Requirement: GET /statement devolve o mês inteiro em uma resposta
`GET /statement` SHALL exigir autenticação JWT, identificar o dono pelo usuário autenticado e aceitar os parâmetros obrigatórios `from` e `to` (`YYYY-MM-DD`) e os opcionais `search`, `direction`, `status`, `accountId`, `creditCardId` e `onlyCreditCard`. A resposta SHALL ser `{ data, meta: { page: 1, pageSize: 500, total, totalPages: 1 } }`, com `data` contendo as entradas do extrato (transações avulsas e ocorrências gravadas e geradas) com `value` numérico e datas em `YYYY-MM-DD`. `onlyCreditCard` SHALL ser interpretado exatamente como em `GET /transactions`. Período ausente, malformado ou invertido SHALL responder `400` com `INVALID_STATEMENT_PERIOD`. O endpoint SHALL NOT aceitar paginação. `GET /transactions` SHALL continuar com o comportamento, os filtros e o teto de antes.

#### Scenario: Extrato de um mês com parcelamento recém-criado
- **WHEN** um parcelamento mensal de 12 no dia 10 com início `2026-09-15` é criado e `GET /statement?from=2026-10-01&to=2026-10-31` é chamado
- **THEN** a resposta traz uma entrada `kind: "SCHEDULED"` com `occurrenceIndex: 0` e `expectedOn: "2026-10-10"`, e `meta` com `page: 1`, `pageSize: 500` e `totalPages: 1`

#### Scenario: Período ausente
- **WHEN** `GET /statement` é chamado sem `from` ou sem `to`
- **THEN** a resposta é `400` contendo `INVALID_STATEMENT_PERIOD`

#### Scenario: Período invertido
- **WHEN** `GET /statement?from=2026-10-31&to=2026-10-01` é chamado
- **THEN** a resposta é `400` contendo `INVALID_STATEMENT_PERIOD`

#### Scenario: Filtro de cartão igual ao das transações
- **WHEN** `GET /statement` é chamado com `onlyCreditCard=true`
- **THEN** somente entradas com cartão são devolvidas, com a mesma interpretação do parâmetro em `GET /transactions`

#### Scenario: Acesso sem token
- **WHEN** `GET /statement` é chamado sem token
- **THEN** a resposta é `401`

#### Scenario: Transações inalteradas
- **WHEN** `GET /transactions` é chamado depois desta mudança
- **THEN** a resposta tem o mesmo formato, filtros, paginação e teto de antes
