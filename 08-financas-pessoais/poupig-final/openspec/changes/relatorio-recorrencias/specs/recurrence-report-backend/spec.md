## Purpose

Expor o relatório de recorrências pela API REST do backend em uma única resposta por janela, com a soma das ocorrências gravadas feita no banco sem dependência de fuso e o mapeamento das falhas para respostas HTTP.

## ADDED Requirements

### Requirement: GET /reports/recurrences devolve a janela inteira em uma resposta
`GET /reports/recurrences` SHALL exigir autenticação JWT, identificar o dono sempre pelo usuário autenticado e aceitar os parâmetros obrigatórios `reference` (`YYYY-MM`) e `months`. A resposta SHALL ser um array JSON com uma linha por recorrência, cada uma com `seriesId`, `name`, `direction`, `value`, `recurrence`, `accountName`, `creditCardName`, `categoryName`, `subcategoryName`, `startDate`, `endDate`, `total` e `months` (exatamente `months` itens `{ month, total }` em ordem crescente terminando na referência), com valores numéricos. A resposta SHALL NOT ser paginada nem envelopada. A rota SHALL NOT aceitar filtros de conta, cartão, categoria, direção, tipo ou situação. Nenhuma rota existente (`/statement`, `/reports/cash-flow`, `/reports/categories`, `/transactions`, `/transaction-series`, `/scheduled-transactions`) SHALL mudar.

#### Scenario: Janela de 6 meses
- **WHEN** um usuário com uma recorrência de entrada e duas de saída chama `GET /reports/recurrences?reference=2026-09&months=6`
- **THEN** a resposta é `200` com três linhas, a entrada primeiro e as saídas por nome, cada uma com 6 meses de `"2026-04"` a `"2026-09"`

#### Scenario: Janela de 24 meses
- **WHEN** o mesmo usuário chama `GET /reports/recurrences?reference=2026-09&months=24`
- **THEN** cada linha tem 24 meses de `"2024-10"` a `"2026-09"`

#### Scenario: Usuário sem recorrência
- **WHEN** um usuário recém-registrado chama a rota com uma janela válida
- **THEN** a resposta é `200` com `[]`

#### Scenario: Acesso sem token
- **WHEN** a rota é chamada sem token
- **THEN** a resposta é `401`

---

### Requirement: Relatório da API bate com o extrato
Para cada mês da resposta, a soma dos `months[].total` das recorrências SHALL ser igual à soma das ocorrências não canceladas de séries abertas que `GET /statement` devolve para o mesmo mês, sem filtros, enquanto o extrato do mês não atinge o teto de entradas. Isso SHALL valer para ocorrências gravadas e geradas.

#### Scenario: Recorrência criada sem nada gravado
- **WHEN** o usuário cria uma recorrência mensal pela API e chama o relatório
- **THEN** cada mês da vigência soma o valor da série, igual ao que o extrato do mês mostra, sem que nenhuma ocorrência tenha sido gravada

#### Scenario: Ocorrência gravada substitui a gerada
- **WHEN** o usuário grava uma ocorrência com valor alterado por `PUT /scheduled-transactions/:seriesId/:occurrenceIndex`
- **THEN** o mês dela soma o valor gravado, uma única vez

#### Scenario: Ocorrência revertida volta a ser gerada
- **WHEN** o usuário remove a ocorrência gravada por `DELETE /scheduled-transactions/:seriesId/:occurrenceIndex`
- **THEN** o mês dela volta a somar o valor da série

#### Scenario: Parcelamento e avulsa fora
- **WHEN** o usuário tem um parcelamento e uma transação avulsa na janela
- **THEN** nenhum dos dois aparece no relatório

#### Scenario: Série excluída
- **WHEN** o usuário exclui uma recorrência
- **THEN** a linha dela deixa de aparecer

#### Scenario: Dados de outro usuário
- **WHEN** outro usuário tem recorrências na mesma janela
- **THEN** nenhuma delas entra no relatório do primeiro usuário

---

### Requirement: Soma das ocorrências gravadas no banco sem dependência de fuso
O backend SHALL somar as ocorrências gravadas por série e por mês em uma única consulta ao banco, com todos os valores recebidos passados como parâmetros e nunca concatenados ao texto da consulta. O mês de cada ocorrência SHALL ser o da data prevista gravada, sem conversão por fuso horário: o mesmo dado SHALL produzir o mesmo mês com qualquer fuso configurado no servidor ou na sessão do banco. Os valores decimais SHALL ser convertidos para número sem perda das duas casas, e nenhum tipo do banco SHALL chegar ao domínio.

#### Scenario: Ocorrência no último dia do mês
- **WHEN** uma ocorrência gravada tem data prevista `2026-09-30`
- **THEN** ela entra no mês `"2026-09"`, e não no de outubro

#### Scenario: Ocorrência no primeiro dia do mês
- **WHEN** uma ocorrência gravada tem data prevista `2026-10-01`
- **THEN** ela entra no mês `"2026-10"`, e não no de setembro

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
O módulo SHALL ter o arquivo `recurrence-report.integration.http` no formato do Rest Client cobrindo:
- janelas de 6 e 24 meses, a quantidade de meses por linha, a ordem e os campos de identidade;
- recorrência semanal com mês de quatro e de cinco ocorrências; recorrência anual fora da janela aparecendo zerada;
- parcelamento e transação avulsa fora;
- ocorrência gravada com valor alterado somando uma vez; ocorrência `SETTLED` somando; ocorrência `CANCELED` sem somar e sem reaparecer gerada; ocorrência movida para o mês seguinte; ocorrência revertida voltando a ser gerada;
- recorrência com fim no meio da janela e recorrência que começa no meio da janela;
- série excluída fora;
- comparação com `GET /statement` de um mês da janela;
- dados de outro usuário fora e usuário sem recorrência devolvendo `[]`;
- `months=7`, `months=0` e `months` ausente (400); `reference` ausente e `reference=2026-13` (400); acesso sem token (401).

#### Scenario: Roteiro executável
- **WHEN** o arquivo é executado em ordem contra o backend local
- **THEN** cada requisição tem comentado o status e o corpo esperados, e os casos acima são exercitados
