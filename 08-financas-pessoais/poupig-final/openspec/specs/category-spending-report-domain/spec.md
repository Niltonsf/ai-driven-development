# category-spending-report-domain Specification

## Purpose
Definir a leitura dos gastos por categoria do módulo `category`: quanto saiu em cada subcategoria num período fechado de datas, juntando transações avulsas, ocorrências gravadas e ocorrências geradas das séries com a mesma regra do extrato, já com a aparência da subcategoria e da categoria dona.
## Requirements
### Requirement: Período do relatório validado pelo domínio
O relatório SHALL receber o período cru, como a API recebe, com `from` e `to` inclusivos. O período SHALL ser aceito somente quando:
- `from` e `to` são textos no formato exato `YYYY-MM-DD` e correspondem a datas existentes;
- `from` é menor ou igual a `to`;
- o período tem no máximo 366 dias, contando as duas pontas, calculado sem depender de fuso horário.

Qualquer outro caso — valor ausente, texto vazio, formato diferente, data impossível, período invertido ou longo demais — SHALL falhar com `INVALID_CATEGORY_REPORT_PERIOD`, sem consultar nenhum dado. O teto de 366 dias SHALL ser exportado para os consumidores como constante única.

#### Scenario: Mês comum
- **WHEN** o relatório é pedido com `from` `"2026-09-01"` e `to` `"2026-09-30"`
- **THEN** o período é aceito

#### Scenario: Um dia só
- **WHEN** o relatório é pedido com `from` e `to` iguais a `"2026-09-15"`
- **THEN** o período é aceito

#### Scenario: Teto de 366 dias
- **WHEN** o relatório é pedido de `"2027-01-01"` a `"2028-01-01"` (366 dias) e de `"2028-01-01"` a `"2028-12-31"` (366 dias em ano bissexto)
- **THEN** os dois períodos são aceitos

#### Scenario: Acima do teto
- **WHEN** o relatório é pedido de `"2028-01-01"` a `"2029-01-01"` (367 dias)
- **THEN** o relatório falha com `INVALID_CATEGORY_REPORT_PERIOD`

#### Scenario: Período inválido
- **WHEN** o relatório é pedido com período invertido (`from` `"2026-09-30"`, `to` `"2026-09-01"`), com `"2026-13-01"`, com `"2026-02-30"`, com texto vazio, com valor ausente ou com `"2026-9-1"`
- **THEN** todos falham com `INVALID_CATEGORY_REPORT_PERIOD` e nenhuma consulta é executada

---

### Requirement: O relatório enxerga o período como o extrato
Para o usuário e o período pedidos, o relatório SHALL somar, pela data prevista, somente saídas (`OUT`) com situação `PENDING` ou `SETTLED`:
- as transações avulsas não excluídas;
- as ocorrências gravadas de séries não excluídas;
- as ocorrências **geradas** das séries de saída não excluídas que ainda não foram gravadas, sempre como `PENDING` e com data prevista igual à data da ocorrência.

Entradas (`IN`) e transações `CANCELED` SHALL NOT entrar. Uma ocorrência gravada cuja data da ocorrência cai no período SHALL suprimir a geração do mesmo par série e índice com **qualquer** situação, inclusive `CANCELED`, mesmo que a data prevista dela tenha sido movida para fora do período. Dados de outro usuário SHALL NOT entrar. O relatório SHALL NOT gravar nada.

#### Scenario: Série sem nada gravado
- **WHEN** o usuário tem uma série de saída mensal de `R$ 1.500,00` na subcategoria Aluguel e nenhuma ocorrência gravada, e pede setembro de 2026
- **THEN** a linha de Aluguel soma `1500`

#### Scenario: Ocorrência gravada substitui a gerada
- **WHEN** a ocorrência de setembro dessa série está gravada com valor `1550`
- **THEN** a linha de Aluguel soma `1550`, uma única vez

#### Scenario: Ocorrência gravada cancelada
- **WHEN** a ocorrência de setembro dessa série está gravada como `CANCELED`
- **THEN** nada dessa série entra em setembro, nem gravado nem gerado

#### Scenario: Entradas e canceladas fora
- **WHEN** o período tem uma entrada avulsa, uma série de entrada e uma saída avulsa `CANCELED`
- **THEN** nenhuma delas entra no relatório

#### Scenario: Pendentes e efetivadas dentro
- **WHEN** o período tem uma saída avulsa `PENDING` de `100` e outra `SETTLED` de `50` na mesma subcategoria
- **THEN** a linha da subcategoria soma `150`

---

### Requirement: Uma linha por subcategoria com gasto, com aparência
O resultado SHALL ter uma linha por subcategoria com gasto no período, com:
- `total` positivo em reais, com duas casas, somando gravadas e geradas daquela subcategoria;
- identificador, nome, cor e ícone da subcategoria e da categoria dona, com cor e ícone como estão gravados (podem ser `null`).

Subcategoria ou categoria sem gasto SHALL NOT aparecer. Subcategoria ou categoria **inativa** ou **excluída logicamente** com gasto no período SHALL aparecer com o próprio nome. A aparência SHALL ser buscada somente entre as subcategorias cuja categoria pertence ao usuário. Período sem nenhum gasto SHALL devolver lista vazia, e não erro.

#### Scenario: Duas categorias
- **WHEN** o usuário gastou `300` em Supermercado e `120` em Padaria (Alimentação) e `200` em Combustível (Transporte)
- **THEN** o resultado tem três linhas, cada uma com o total, o nome, a cor e o ícone da subcategoria e da categoria dona

#### Scenario: Gasto só gerado
- **WHEN** uma subcategoria tem gasto no período apenas por ocorrência gerada de série
- **THEN** ela aparece com total, nome, cor e ícone

#### Scenario: Categoria excluída com gasto
- **WHEN** a categoria Lazer foi excluída logicamente e tem uma saída no período
- **THEN** a subcategoria de Lazer aparece com o nome da subcategoria e da categoria

#### Scenario: Sem gasto
- **WHEN** o usuário não tem nenhuma saída no período
- **THEN** o resultado é uma lista vazia

---

### Requirement: Balde sem classificação
Todas as saídas sem subcategoria — avulsas, gravadas e geradas — SHALL ser somadas numa única linha com identificador, nome, cor e ícone de subcategoria e de categoria todos `null`. Uma subcategoria somada para a qual a aparência não é encontrada SHALL ter seu total somado a essa mesma linha, para que a soma das linhas seja sempre o total gasto do período. Fora dessa linha, categoria e subcategoria SHALL vir sempre preenchidas.

#### Scenario: Saída sem subcategoria
- **WHEN** o período tem uma saída avulsa de `80` sem subcategoria e uma série de saída de `20` sem subcategoria
- **THEN** o resultado tem uma linha com os campos de identidade `null` e total `100`

#### Scenario: Aparência não encontrada
- **WHEN** a soma devolve um identificador de subcategoria que a busca de aparência não encontra
- **THEN** o total dela entra na linha sem classificação e a soma das linhas continua igual ao total do período

---

### Requirement: Soma exata e ordem estável
Os valores SHALL ser somados em centavos inteiros, sem erro de arredondamento de ponto flutuante. O resultado SHALL vir ordenado por `total` decrescente, com desempate pelo nome da categoria e depois pelo nome da subcategoria (ordem alfabética `pt-BR`), e a linha sem classificação por último em caso de empate. Falha de qualquer consulta SHALL ser devolvida como falha do relatório.

#### Scenario: Centavos
- **WHEN** uma subcategoria tem uma saída gravada de `0.10` e uma ocorrência gerada de `0.20`
- **THEN** o total é exatamente `0.3`

#### Scenario: Ordem
- **WHEN** as linhas têm totais `100` (Transporte › Combustível), `300` (Alimentação › Supermercado) e `100` (Alimentação › Padaria)
- **THEN** a ordem é Supermercado, Padaria e Combustível

#### Scenario: Falha de consulta
- **WHEN** a consulta das séries ativas falha
- **THEN** o relatório devolve a falha, e não um resultado parcial

