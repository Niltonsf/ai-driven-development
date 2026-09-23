## Purpose

Expor o relatório de gastos por categoria pela API REST do backend em uma única resposta por período, com as datas obrigatórias, a soma das linhas gravadas feita no banco sem dependência de fuso, a aparência das subcategorias restrita ao dono e o mapeamento das falhas para respostas HTTP.

## ADDED Requirements

### Requirement: GET /reports/categories devolve as fatias do período em uma resposta
`GET /reports/categories` SHALL exigir autenticação JWT, identificar o dono sempre pelo usuário autenticado e aceitar os parâmetros obrigatórios `from` e `to` (`YYYY-MM-DD`, inclusivos). A resposta SHALL ser um array JSON com um item por subcategoria com gasto, cada um com `categoryId`, `categoryName`, `categoryColor`, `categoryIcon`, `subcategoryId`, `subcategoryName`, `subcategoryColor`, `subcategoryIcon` e `total` numérico, ordenado por `total` decrescente. A resposta SHALL NOT ser paginada nem envelopada. A rota SHALL NOT aceitar filtros de conta, cartão, direção ou situação. Nenhuma rota existente (`/categories`, `/statement`, `/transactions`, `/transaction-series`, `/scheduled-transactions`, `/reports/cash-flow`) SHALL mudar.

#### Scenario: Mês com gastos
- **WHEN** um usuário autenticado com saídas em duas categorias chama `GET /reports/categories?from=2026-09-01&to=2026-09-30`
- **THEN** a resposta é `200` com um item por subcategoria com gasto, ordenados por `total` decrescente e com nome, cor e ícone preenchidos

#### Scenario: Mês sem gasto
- **WHEN** um usuário recém-registrado chama a rota para setembro de 2026
- **THEN** a resposta é `200` com `[]`

#### Scenario: Acesso sem token
- **WHEN** a rota é chamada sem token
- **THEN** a resposta é `401`

---

### Requirement: Relatório da API bate com o extrato
A soma dos `total` da resposta para um mês SHALL ser igual à soma das saídas não canceladas que `GET /statement` devolve para o mesmo mês, sem filtros, enquanto o extrato do mês não atinge o teto de entradas. Isso SHALL valer para transações avulsas, ocorrências gravadas e ocorrências geradas.

#### Scenario: Série criada sem nada gravado
- **WHEN** o usuário cria uma série de saída pela API e chama o relatório do mês de uma ocorrência
- **THEN** a subcategoria da série soma o valor dela, igual ao que o extrato do mês mostra, sem que nenhuma ocorrência tenha sido gravada

#### Scenario: Ocorrência gravada substitui a gerada
- **WHEN** o usuário grava uma ocorrência com valor alterado por `PUT /scheduled-transactions/:seriesId/:occurrenceIndex`
- **THEN** a subcategoria soma o valor gravado, uma única vez

#### Scenario: Ocorrência gravada cancelada
- **WHEN** o usuário grava a ocorrência como `CANCELED`
- **THEN** o valor dela não entra e não reaparece como gerado

#### Scenario: Ocorrência revertida volta a ser gerada
- **WHEN** o usuário remove a ocorrência gravada por `DELETE /scheduled-transactions/:seriesId/:occurrenceIndex`
- **THEN** a subcategoria volta a somar o valor da série

#### Scenario: Série excluída
- **WHEN** o usuário exclui a série
- **THEN** nem as ocorrências gravadas nem as geradas dela entram

#### Scenario: Entradas, canceladas e excluídas fora
- **WHEN** o mês tem uma entrada, uma saída `CANCELED` e uma saída avulsa excluída
- **THEN** nenhuma delas entra na resposta

#### Scenario: Dados de outro usuário
- **WHEN** outro usuário tem transações e séries de saída no mesmo mês
- **THEN** nenhuma delas entra no relatório do primeiro usuário

---

### Requirement: Categorias excluídas e saídas sem classificação
Uma categoria inativa, ou excluída por `DELETE /categories/:id`, com gasto no período SHALL aparecer na resposta com os nomes gravados. Uma saída sem subcategoria SHALL entrar num único item com os campos de identidade e aparência `null`. Uma subcategoria removida pelo formulário de edição (`PUT /categories/:id`) deixa as transações sem subcategoria no banco, e o gasto delas SHALL aparecer nesse item. A aparência de uma subcategoria SHALL ser lida somente quando a categoria dona pertence ao usuário autenticado.

#### Scenario: Categoria inativa e excluída
- **WHEN** o usuário inativa uma categoria com gasto e exclui outra com gasto
- **THEN** as subcategorias das duas continuam aparecendo com os nomes

#### Scenario: Saída sem subcategoria
- **WHEN** o mês tem uma saída avulsa sem subcategoria
- **THEN** a resposta tem um item com `categoryId`, `categoryName`, `subcategoryId` e demais campos de identidade `null` e o valor em `total`

#### Scenario: Subcategoria removida no formulário
- **WHEN** o usuário remove, pelo `PUT /categories/:id`, uma subcategoria que tinha gasto no mês
- **THEN** esse gasto passa a ser somado no item de campos `null`

#### Scenario: Categoria sem gasto
- **WHEN** o usuário tem uma categoria sem nenhuma saída no mês
- **THEN** ela não aparece na resposta

---

### Requirement: Soma das linhas gravadas no banco sem dependência de fuso
O backend SHALL somar as transações avulsas e as ocorrências gravadas por subcategoria em uma única consulta ao banco, com todos os valores recebidos passados como parâmetros e nunca concatenados ao texto da consulta. O período SHALL ser comparado com a data prevista gravada como data, sem conversão por fuso horário: o mesmo dado SHALL produzir o mesmo resultado com qualquer fuso configurado no servidor ou na sessão do banco. Os valores decimais SHALL ser convertidos para número sem perda das duas casas, e nenhum tipo do banco SHALL chegar ao domínio.

#### Scenario: Saída no último dia do mês
- **WHEN** existe uma saída com data prevista `2026-09-30` e o relatório de setembro de 2026 é pedido
- **THEN** a saída entra no relatório de setembro

#### Scenario: Saída no primeiro dia do mês seguinte
- **WHEN** existe uma saída com data prevista `2026-10-01` e o relatório de setembro de 2026 é pedido
- **THEN** a saída não entra

---

### Requirement: Período inválido responde 400
A rota SHALL repassar `from` e `to` ao domínio sem valor padrão. Parâmetro ausente, malformado, data impossível, período invertido ou maior que 366 dias SHALL responder `400` com `INVALID_CATEGORY_REPORT_PERIOD`. Qualquer outra falha SHALL responder `400` com a lista de códigos. O backend SHALL NOT traduzir códigos de erro.

#### Scenario: Parâmetros ausentes
- **WHEN** a rota é chamada sem `from`, sem `to` ou sem nenhum dos dois
- **THEN** a resposta é `400` com `INVALID_CATEGORY_REPORT_PERIOD`

#### Scenario: Datas inválidas
- **WHEN** a rota é chamada com `from=2026-13-01` ou `to=2026-02-30`
- **THEN** a resposta é `400` com `INVALID_CATEGORY_REPORT_PERIOD`

#### Scenario: Período invertido ou longo demais
- **WHEN** a rota é chamada com `from=2026-09-30&to=2026-09-01` ou com `from=2026-01-01&to=2027-01-02`
- **THEN** a resposta é `400` com `INVALID_CATEGORY_REPORT_PERIOD`

---

### Requirement: Testes de integração via Rest Client cobrem o relatório
O módulo SHALL ter o arquivo `category-report.integration.http` no formato do Rest Client cobrindo:
- mês com gastos em duas categorias e várias subcategorias, conferindo `total`, ordem e aparência;
- saída sem subcategoria no item de campos `null`;
- entrada, `CANCELED` e excluída fora; `PENDING` e `SETTLED` dentro;
- série de saída gerada somando com a avulsa da mesma subcategoria; ocorrência gravada somando uma vez; ocorrência gravada cancelada sem reaparecer gerada; ocorrência revertida voltando a ser gerada; série de entrada fora; série excluída fora;
- comparação da soma dos `total` com as saídas não canceladas de `GET /statement` do mesmo mês;
- categoria inativa e categoria excluída aparecendo; subcategoria removida pelo formulário indo para o item sem classificação; categoria sem gasto fora;
- dados de outro usuário fora; mês sem gasto devolvendo `[]`;
- `from`/`to` ausentes, `2026-13-01`, `2026-02-30`, período invertido e maior que 366 dias (400); acesso sem token (401).

#### Scenario: Roteiro executável
- **WHEN** o arquivo é executado em ordem contra o backend local
- **THEN** cada requisição tem comentado o status e o corpo esperados, e os casos acima são exercitados
