## Purpose

Expor o relatório de fluxo de caixa mensal pela API REST do backend em uma única resposta por janela, com referência e janela obrigatórias, a soma das linhas gravadas feita no banco sem dependência de fuso e o mapeamento das falhas para respostas HTTP.

## ADDED Requirements

### Requirement: GET /reports/cash-flow devolve a janela inteira em uma resposta
`GET /reports/cash-flow` SHALL exigir autenticação JWT, identificar o dono sempre pelo usuário autenticado e aceitar os parâmetros obrigatórios `reference` (`YYYY-MM`) e `months`. A resposta SHALL ser um array JSON com exatamente `months` itens `{ month, inflow, outflow, balance }`, em ordem cronológica crescente terminando no mês de referência, com os valores numéricos. A resposta SHALL NOT ser paginada nem envelopada. A rota SHALL NOT aceitar filtros de conta, cartão, categoria, direção ou situação. Nenhuma rota existente (`/statement`, `/transactions`, `/transaction-series`, `/scheduled-transactions`) SHALL mudar.

#### Scenario: Janela de 6 meses
- **WHEN** um usuário autenticado chama `GET /reports/cash-flow?reference=2026-09&months=6`
- **THEN** a resposta é `200` com 6 itens de `"2026-04"` a `"2026-09"`

#### Scenario: Janela de 24 meses sem movimento
- **WHEN** um usuário recém-registrado chama `GET /reports/cash-flow?reference=2026-09&months=24`
- **THEN** a resposta é `200` com 24 itens, todos com `inflow`, `outflow` e `balance` iguais a `0`

#### Scenario: Acesso sem token
- **WHEN** a rota é chamada sem token
- **THEN** a resposta é `401`

---

### Requirement: Relatório da API bate com o extrato
Para cada mês da resposta, `inflow` e `outflow` SHALL ser iguais às somas das entradas e das saídas não canceladas que `GET /statement` devolve para o mesmo mês, sem filtros, enquanto o extrato do mês não atinge o teto de entradas. Isso SHALL valer para transações avulsas, ocorrências gravadas e ocorrências geradas.

#### Scenario: Série criada sem nada gravado
- **WHEN** o usuário cria um parcelamento pela API e chama o relatório
- **THEN** cada mês com parcela soma o valor da série, igual ao que o extrato do mês mostra, sem que nenhuma ocorrência tenha sido gravada

#### Scenario: Ocorrência gravada substitui a gerada
- **WHEN** o usuário grava uma ocorrência com valor alterado por `PUT /scheduled-transactions/:seriesId/:occurrenceIndex`
- **THEN** o mês dela soma o valor gravado, uma única vez

#### Scenario: Ocorrência revertida volta a ser gerada
- **WHEN** o usuário remove a ocorrência gravada por `DELETE /scheduled-transactions/:seriesId/:occurrenceIndex`
- **THEN** o mês dela volta a somar o valor da série

#### Scenario: Série excluída
- **WHEN** o usuário exclui a série
- **THEN** nem as ocorrências gravadas nem as geradas dela entram em mês nenhum

#### Scenario: Dados de outro usuário
- **WHEN** outro usuário tem transações e séries na mesma janela
- **THEN** nenhuma delas entra no relatório do primeiro usuário

---

### Requirement: Soma das linhas gravadas no banco sem dependência de fuso
O backend SHALL somar as transações avulsas e as ocorrências gravadas por mês em uma única consulta ao banco, com todos os valores recebidos passados como parâmetros e nunca concatenados ao texto da consulta. O mês de cada linha SHALL ser o da data prevista gravada, sem conversão por fuso horário: o mesmo dado SHALL produzir o mesmo mês com qualquer fuso configurado no servidor ou na sessão do banco. Os valores decimais SHALL ser convertidos para número sem perda das duas casas, e nenhum tipo do banco SHALL chegar ao domínio. A consulta das chaves das ocorrências gravadas SHALL filtrar pelo usuário, ignorar ocorrências de série excluída e não filtrar por situação.

#### Scenario: Transação no último dia do mês
- **WHEN** existe uma saída avulsa com data prevista `2026-09-30` e o relatório de setembro de 2026 é pedido
- **THEN** a saída entra no balde `"2026-09"`, e não no de outubro

#### Scenario: Transação no primeiro dia do mês
- **WHEN** existe uma entrada avulsa com data prevista `2026-10-01`
- **THEN** a entrada entra no balde `"2026-10"`, e não no de setembro

---

### Requirement: Referência e janela inválidas respondem 400
A rota SHALL repassar `reference` e `months` ao domínio sem valor padrão. Referência ausente ou inválida SHALL responder `400` com `INVALID_REPORT_REFERENCE`; janela ausente, vazia, não numérica ou fora de `6`, `12`, `18` e `24` SHALL responder `400` com `INVALID_REPORT_WINDOW`. Qualquer outra falha SHALL responder `400` com a lista de códigos. O backend SHALL NOT traduzir códigos de erro.

#### Scenario: Janela fora do conjunto
- **WHEN** a rota é chamada com `months=7` ou `months=0`
- **THEN** a resposta é `400` com `INVALID_REPORT_WINDOW`

#### Scenario: Janela ausente
- **WHEN** a rota é chamada só com `reference=2026-09`
- **THEN** a resposta é `400` com `INVALID_REPORT_WINDOW`

#### Scenario: Referência ausente ou inválida
- **WHEN** a rota é chamada sem `reference` ou com `reference=2026-13`
- **THEN** a resposta é `400` com `INVALID_REPORT_REFERENCE`

---

### Requirement: Testes de integração via Rest Client cobrem o relatório
O módulo SHALL ter o arquivo `transaction-report.integration.http` no formato do Rest Client cobrindo:
- janelas de 6 e 24 meses e a quantidade de itens;
- mês de referência sem movimento com os itens zerados;
- entrada e saída avulsas conferindo `inflow`, `outflow` e `balance`, com `SETTLED` e `PENDING` somando e `CANCELED` e excluída fora;
- série criada sem nada gravado aparecendo em todos os meses com parcela, e parcelamento parando na última parcela;
- ocorrência gravada com valor alterado somando uma vez; ocorrência movida para o mês seguinte; ocorrência gravada cancelada sem reaparecer gerada; ocorrência revertida voltando a ser gerada; série excluída fora;
- comparação com `GET /statement` de dois meses da janela;
- dados de outro usuário fora;
- `months=7`, `months=0` e `months` ausente (400); `reference` ausente e `reference=2026-13` (400); acesso sem token (401).

#### Scenario: Roteiro executável
- **WHEN** o arquivo é executado em ordem contra o backend local
- **THEN** cada requisição tem comentado o status e o corpo esperados, e os casos acima são exercitados
