## Purpose

Definir a leitura das recorrências do módulo `transaction`: quanto cada série aberta movimentou em cada mês de uma janela que termina no mês de referência, juntando ocorrências gravadas e geradas com a mesma regra do extrato.

## ADDED Requirements

### Requirement: Referência e janela validadas como no relatório de entradas x saídas
O relatório SHALL receber a entrada crua, como a API recebe: `reference` (`YYYY-MM`, último mês da janela) e `months` (tamanho da janela, incluindo o mês de referência). A referência SHALL ser aceita pela mesma regra do relatório de entradas x saídas e, caso contrário, SHALL falhar com `INVALID_REPORT_REFERENCE`. A janela SHALL ser aceita somente quando é o número `6`, `12`, `18` ou `24` — o mesmo conjunto fechado do relatório de entradas x saídas, sem uma segunda definição — e, caso contrário, SHALL falhar com `INVALID_REPORT_WINDOW`. Nos dois casos de falha nenhuma consulta SHALL ser executada.

#### Scenario: Entrada válida
- **WHEN** o relatório é pedido com `reference` `"2026-09"` e `months` `12`
- **THEN** a janela vai de outubro de 2025 a setembro de 2026

#### Scenario: Referência inválida
- **WHEN** o relatório é pedido com `reference` `"2026-13"`, `"2026-9"`, `"2026-09-01"`, texto vazio ou ausente
- **THEN** o relatório falha com `INVALID_REPORT_REFERENCE` e nenhuma consulta é executada

#### Scenario: Janela inválida
- **WHEN** o relatório é pedido com `months` `7`, `0`, `-6`, `12.5`, `NaN` ou o texto `"12"`
- **THEN** o relatório falha com `INVALID_REPORT_WINDOW` e nenhuma consulta é executada

---

### Requirement: Só séries abertas são recorrências
O relatório SHALL considerar somente séries de transações do tipo aberto (`OPEN`). Séries do tipo parcelamento (`CLOSED`) SHALL NOT aparecer nem ter ocorrências geradas ou somadas. Transações avulsas SHALL NOT entrar.

#### Scenario: Parcelamento fora
- **WHEN** o usuário tem uma recorrência mensal "Internet" e um parcelamento "Notebook" vigentes na janela
- **THEN** a resposta tem só a linha de "Internet"

#### Scenario: Avulsa fora
- **WHEN** o usuário tem uma saída avulsa na janela e nenhuma série
- **THEN** a resposta é uma lista vazia

---

### Requirement: Cada mês enxerga as ocorrências como o extrato
Para cada recorrência e cada mês da janela, o relatório SHALL somar, pela data prevista, as ocorrências com situação `PENDING` ou `SETTLED`:
- as ocorrências gravadas de séries não excluídas, com o valor gravado nelas;
- as ocorrências **geradas** das séries abertas vigentes que ainda não foram gravadas, sempre como `PENDING`, com data prevista igual à data da ocorrência e com o valor atual da série.

Ocorrências `CANCELED` SHALL NOT entrar. Uma ocorrência gravada cuja data da ocorrência cai na janela SHALL suprimir a geração do mesmo par série e índice com **qualquer** situação, inclusive `CANCELED`, mesmo que a data prevista dela tenha sido movida para fora da janela. Dados de outro usuário SHALL NOT entrar. O relatório SHALL NOT gravar nada.

#### Scenario: Recorrência mensal sem nada gravado
- **WHEN** o usuário tem uma recorrência de saída mensal "Aluguel" de `R$ 1.500,00` iniciada antes da janela e pede a janela de 6 meses até setembro de 2026
- **THEN** a linha de "Aluguel" tem `1500` em cada um dos 6 meses e `total` `9000`

#### Scenario: Recorrência semanal
- **WHEN** o usuário tem uma recorrência semanal de `R$ 100,00` toda segunda-feira, iniciada antes da janela
- **THEN** agosto de 2026 soma `500` (cinco segundas) e setembro de 2026 soma `400` (quatro segundas)

#### Scenario: Ocorrência gravada substitui a gerada
- **WHEN** a ocorrência de setembro do "Aluguel" está gravada como `SETTLED` com valor `1550`
- **THEN** setembro soma `1550`, uma única vez

#### Scenario: Ocorrência gravada cancelada
- **WHEN** a ocorrência de setembro do "Aluguel" está gravada como `CANCELED`
- **THEN** setembro soma `0` para o "Aluguel", sem a ocorrência reaparecer gerada

#### Scenario: Ocorrência adiada dentro da janela
- **WHEN** a ocorrência de agosto do "Aluguel" está gravada com data prevista movida para `2026-09-02`
- **THEN** agosto soma `0` e setembro soma `3000` para o "Aluguel"

#### Scenario: Série excluída
- **WHEN** o usuário exclui a série "Aluguel", que tinha ocorrências gravadas na janela
- **THEN** nem as ocorrências gravadas nem as geradas dela entram, e a linha não aparece

---

### Requirement: Quais recorrências aparecem
A resposta SHALL ter uma linha para cada série aberta, não excluída, do usuário que pode ter ocorrência na janela (início até o fim da janela e fim ausente ou a partir do início da janela), **mesmo que todos os meses somem zero**. A resposta SHALL ter também uma linha para a série aberta não excluída que está fora dessa vigência mas tem ocorrência gravada não cancelada com data prevista dentro da janela. Quando o usuário não tem nenhuma recorrência nessas condições, a resposta SHALL ser uma lista vazia, e não uma falha.

#### Scenario: Recorrência anual fora da janela
- **WHEN** o usuário tem uma recorrência anual em dezembro e pede a janela de 6 meses até setembro de 2026
- **THEN** a linha dela aparece com os 6 meses em `0` e `total` `0`

#### Scenario: Recorrência encerrada antes da janela
- **WHEN** uma recorrência terminou em janeiro de 2026 e o usuário pede a janela de 6 meses até setembro de 2026
- **THEN** a linha dela não aparece

#### Scenario: Encerrada com ocorrência adiada para a janela
- **WHEN** essa recorrência encerrada tem a ocorrência de janeiro gravada com data prevista `2026-05-10` e valor `200`
- **THEN** a linha dela aparece com `200` em maio de 2026 e `0` nos demais meses

#### Scenario: Recorrência que começa no meio da janela
- **WHEN** uma recorrência mensal começa em julho de 2026 e a janela vai de abril a setembro de 2026
- **THEN** a linha dela aparece com `0` de abril a junho e o valor da série de julho a setembro

#### Scenario: Usuário sem recorrência
- **WHEN** o usuário não tem série aberta vigente na janela
- **THEN** o relatório devolve uma lista vazia

---

### Requirement: Linha da recorrência
Cada linha SHALL trazer: identificador da série, nome, direção, valor atual da série, regra de recorrência, nome da conta, nome do cartão, nomes da categoria e da subcategoria (nulos quando ausentes), data de início, data de fim (nula quando ausente), `total` do período e `months`. `months` SHALL ter exatamente o número de meses da janela, um item `{ month, total }` por mês, com `month` no formato `YYYY-MM`, em ordem cronológica crescente, terminando no mês de referência, com `0` no mês sem ocorrência. Todos os valores SHALL ser em reais, positivos (a direção carrega o sentido) e com no máximo duas casas. `total` SHALL ser a soma dos meses da linha.

#### Scenario: Baldes completos
- **WHEN** o relatório é pedido com janela de 24 meses até setembro de 2026
- **THEN** cada linha tem 24 meses, de `"2024-10"` a `"2026-09"`, em ordem crescente

#### Scenario: Valores positivos
- **WHEN** a recorrência é uma entrada "Salário" de `R$ 8.000,00`
- **THEN** a linha tem direção de entrada e os meses com `8000`, sem sinal

---

### Requirement: Soma sem erro de arredondamento
As somas por mês e o `total` de cada linha SHALL ser feitos sem acumular erro de ponto flutuante.

#### Scenario: Centavos somados
- **WHEN** um mês de uma recorrência junta ocorrências de `0.1` e `0.2`
- **THEN** o mês soma exatamente `0.3`

---

### Requirement: Ordem da resposta
As linhas SHALL vir com as entradas antes das saídas e, dentro de cada direção, ordenadas pelo nome da série em ordem alfabética do português, sem diferenciar acento e caixa, com desempate estável pelo identificador da série. A ordem SHALL NOT depender dos valores, para a linha de uma recorrência não mudar de lugar ao trocar de janela.

#### Scenario: Entradas primeiro, por nome
- **WHEN** o usuário tem as saídas "Internet" e "Água" e a entrada "Salário"
- **THEN** a resposta vem na ordem "Salário", "Água", "Internet"

---

### Requirement: Falha de leitura é propagada
Quando qualquer leitura usada pelo relatório falha, o relatório SHALL falhar com os erros dela, sem devolver resultado parcial.

#### Scenario: Consulta falha
- **WHEN** a leitura das ocorrências gravadas, das chaves gravadas, das séries vigentes ou de uma série encerrada falha
- **THEN** o relatório falha com os erros dessa leitura

---

### Requirement: Contrato da soma das ocorrências gravadas
O domínio SHALL declarar uma consulta que, para o usuário e um período inclusivo de datas `YYYY-MM-DD`, soma por série e por mês da data prevista as ocorrências **gravadas** de séries abertas não excluídas, sem `CANCELED`, devolvendo `{ seriesId, month, total }` com `total` positivo em reais com duas casas. Só os pares com ocorrência SHALL aparecer, sem ordem garantida. A consulta SHALL NOT incluir ocorrências geradas nem transações avulsas.

#### Scenario: Pares sem ocorrência ausentes
- **WHEN** uma série tem ocorrência gravada só em setembro dentro do período
- **THEN** a consulta devolve um único par dessa série, com `month` `"2026-09"`
