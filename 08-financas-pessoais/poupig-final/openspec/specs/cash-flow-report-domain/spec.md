# cash-flow-report-domain Specification

## Purpose
Definir a leitura do fluxo de caixa mensal do módulo `transaction`: quanto entrou e quanto saiu em cada mês de uma janela fechada de meses que termina num mês de referência, juntando transações avulsas, ocorrências gravadas e ocorrências geradas das séries com a mesma regra do extrato.
## Requirements
### Requirement: Janela do relatório é um conjunto fechado
O módulo SHALL declarar as janelas aceitas pelo relatório como o conjunto fechado `6`, `12`, `18` e `24` meses, exportado para os consumidores, com um verificador que aceita somente esses quatro números. Qualquer outro valor — outro inteiro, zero, negativo, fracionário, `NaN`, texto numérico, `null` ou ausente — SHALL ser recusado. O conjunto SHALL ser a única fonte das janelas: nenhum consumidor SHALL repetir a lista.

#### Scenario: Janelas aceitas
- **WHEN** os valores `6`, `12`, `18` e `24` são verificados
- **THEN** os quatro são aceitos

#### Scenario: Valores recusados
- **WHEN** os valores `7`, `0`, `-6`, `12.5`, `NaN`, `"12"`, `null` e `undefined` são verificados
- **THEN** todos são recusados

---

### Requirement: Mês de referência no formato YYYY-MM
O mês de referência SHALL ser um texto `YYYY-MM` com ano de quatro dígitos e mês de `01` a `12` que corresponda a um mês existente. Texto com mês fora do intervalo, mês sem zero à esquerda, data completa, texto vazio ou valor que não seja texto SHALL ser recusado.

#### Scenario: Referência válida
- **WHEN** a referência `"2026-09"` é verificada
- **THEN** ela é aceita

#### Scenario: Referências inválidas
- **WHEN** as referências `"2026-13"`, `"2026-9"`, `"2026-09-01"`, `""` e `undefined` são verificadas
- **THEN** todas são recusadas

---

### Requirement: Período da janela em meses inteiros
A partir da referência e do tamanho da janela, o módulo SHALL derivar, sem depender de fuso horário:
- as chaves `YYYY-MM` de exatamente `months` meses em ordem crescente, terminando no mês de referência e incluindo-o;
- o período fechado `from`–`to` em `YYYY-MM-DD`, com `from` no primeiro dia do primeiro mês e `to` no último dia do mês de referência.

A virada de ano e o último dia de fevereiro em ano bissexto SHALL ser respeitados.

#### Scenario: Janela de 12 meses
- **WHEN** o período é derivado para a referência `"2026-09"` e janela `12`
- **THEN** `from` é `"2025-10-01"`, `to` é `"2026-09-30"` e as chaves vão de `"2025-10"` a `"2026-09"`, 12 no total

#### Scenario: Janela de 6 meses dentro do ano
- **WHEN** o período é derivado para a referência `"2026-06"` e janela `6`
- **THEN** `from` é `"2026-01-01"`, `to` é `"2026-06-30"` e as chaves são `"2026-01"` a `"2026-06"`

#### Scenario: Janela de 24 meses
- **WHEN** o período é derivado para a referência `"2026-09"` e janela `24`
- **THEN** `from` é `"2024-10-01"`, `to` é `"2026-09-30"` e há 24 chaves

#### Scenario: Fevereiro bissexto
- **WHEN** o período é derivado para a referência `"2028-02"` e janela `6`
- **THEN** `to` é `"2028-02-29"`

#### Scenario: Fevereiro não bissexto
- **WHEN** o período é derivado para a referência `"2027-02"` e janela `6`
- **THEN** `to` é `"2027-02-28"`

---

### Requirement: Balde mensal do fluxo de caixa
Cada mês do relatório SHALL ser representado por um balde com `month` (chave `YYYY-MM`), `inflow` (soma em reais das entradas), `outflow` (soma em reais das saídas, sempre positiva) e `balance` (`inflow - outflow`, que pode ser negativo). Os três valores SHALL ser números com no máximo duas casas decimais. O balde SHALL NOT trazer transações, nomes ou qualquer outro campo.

#### Scenario: Mês com saldo negativo
- **WHEN** um mês tem R$ 1.000,00 de entradas e R$ 1.250,50 de saídas
- **THEN** o balde tem `inflow: 1000`, `outflow: 1250.5` e `balance: -250.5`

---

### Requirement: Relatório junta linhas gravadas e ocorrências geradas
O caso de uso do relatório SHALL receber `userId`, `reference` e `months` e SHALL devolver os baldes da janela somando, para o usuário:
- as transações avulsas não excluídas;
- as ocorrências gravadas de séries não excluídas;
- as ocorrências geradas das séries ativas no período que ainda não estão gravadas.

Cada transação ou ocorrência SHALL entrar no mês da sua data prevista (`expectedOn`), e somente quando essa data está no período da janela. Situações `PENDING` e `SETTLED` SHALL entrar; `CANCELED` SHALL ficar fora de toda soma. Uma ocorrência gerada SHALL ter sempre situação `PENDING`, o valor e a direção da série e data prevista igual à data da ocorrência.

Uma ocorrência gravada cuja data da ocorrência (`occurrenceOn`) está no período SHALL suprimir a geração do mesmo par série e índice, **qualquer que seja a situação dela** e mesmo que a data prevista tenha sido movida para fora do período. Nenhuma ocorrência SHALL ser contada duas vezes. O relatório SHALL NOT gravar nada.

#### Scenario: Série sem nada gravado aparece em todos os meses
- **WHEN** o usuário tem só um parcelamento de 12 com saída de R$ 300,00 no dia 10, início `2026-09-15`, nenhuma ocorrência gravada, e o relatório é pedido com referência `"2026-12"` e janela `6`
- **THEN** os baldes de `"2026-07"`, `"2026-08"` e `"2026-09"` são zerados e os de `"2026-10"`, `"2026-11"` e `"2026-12"` têm `outflow: 300`

#### Scenario: Ocorrência gravada com valor alterado
- **WHEN** a ocorrência de índice 1 desse parcelamento está gravada com valor R$ 350,00 e data prevista `2026-11-10`
- **THEN** o balde de `"2026-11"` tem `outflow: 350`, e não `650` nem `300`

#### Scenario: Ocorrência gravada movida para o mês seguinte
- **WHEN** a ocorrência de índice 0 está gravada com data da ocorrência `2026-10-10` e data prevista `2026-11-02`
- **THEN** o balde de `"2026-10"` não contém essa parcela e o de `"2026-11"` soma as parcelas de índice 0 e 1

#### Scenario: Ocorrência gravada cancelada
- **WHEN** a ocorrência de índice 2 está gravada com situação `CANCELED`
- **THEN** o balde de `"2026-12"` não soma essa parcela nem a gera de novo

#### Scenario: Parcelamento termina na última parcela
- **WHEN** um parcelamento de 2 parcelas mensais, sem nada gravado, tem as parcelas em `2026-08-05` e `2026-09-05`, e o relatório é pedido com referência `"2026-12"` e janela `6`
- **THEN** só os baldes de `"2026-08"` e `"2026-09"` somam a parcela

#### Scenario: Transações avulsas pendente, efetivada e cancelada
- **WHEN** setembro de 2026 tem uma entrada avulsa efetivada de R$ 5.000,00, uma saída avulsa pendente de R$ 200,00 e uma saída avulsa cancelada de R$ 80,00
- **THEN** o balde de `"2026-09"` tem `inflow: 5000`, `outflow: 200` e `balance: 4800`

---

### Requirement: Baldes completos e em ordem crescente
O relatório SHALL devolver exatamente `months` baldes, na ordem das chaves do período, do mês mais antigo até o mês de referência. Mês sem nenhuma transação ou ocorrência SHALL aparecer com `inflow`, `outflow` e `balance` iguais a `0`. O consumidor SHALL NOT precisar preencher meses ausentes.

#### Scenario: Usuário sem movimento
- **WHEN** um usuário sem transações nem séries pede o relatório com referência `"2026-09"` e janela `12`
- **THEN** o resultado tem 12 baldes de `"2025-10"` a `"2026-09"`, todos zerados

---

### Requirement: Soma sem erro de arredondamento
As somas do relatório SHALL ser feitas sem acúmulo de erro de ponto flutuante e SHALL sair com duas casas decimais exatas.

#### Scenario: Centavos somados
- **WHEN** um mês tem duas entradas de R$ 0,10 e R$ 0,20
- **THEN** o balde tem `inflow: 0.3`

---

### Requirement: Entrada inválida falha antes de qualquer leitura
O relatório SHALL falhar com `INVALID_REPORT_REFERENCE` quando a referência for inválida e com `INVALID_REPORT_WINDOW` quando a janela não pertencer ao conjunto fechado, conferindo a referência primeiro. Nesses casos nenhuma leitura de dados SHALL ser feita. Os dois códigos SHALL ser exatamente os códigos de erro do relatório, com valor igual à chave e sem tradução.

#### Scenario: Referência inválida
- **WHEN** o relatório é pedido com referência `"2026-13"` e janela `12`
- **THEN** o resultado é falha com `INVALID_REPORT_REFERENCE` e nenhuma consulta foi executada

#### Scenario: Janela inválida
- **WHEN** o relatório é pedido com referência `"2026-09"` e janela `7`
- **THEN** o resultado é falha com `INVALID_REPORT_WINDOW` e nenhuma consulta foi executada

---

### Requirement: Falha de leitura é propagada
Quando qualquer leitura usada pelo relatório falhar, o relatório SHALL falhar com os códigos dessa leitura e SHALL NOT devolver baldes parciais.

#### Scenario: Falha na soma das linhas gravadas
- **WHEN** a soma das linhas gravadas falha com `DATABASE_ERROR`
- **THEN** o resultado do relatório é falha com `DATABASE_ERROR`

---

### Requirement: Relatório equivale ao extrato de cada mês
Para qualquer mês da janela, `inflow` e `outflow` do balde SHALL ser iguais às somas das entradas e das saídas não canceladas do extrato daquele mês, pedido sem filtros, sempre que o extrato do mês não tiver atingido o teto de entradas. O relatório SHALL NOT aplicar o teto de entradas do extrato.

#### Scenario: Mesma massa, mesmos totais
- **WHEN** um usuário tem transações avulsas, uma série sem nada gravado, uma ocorrência gravada com valor alterado, uma movida para o mês seguinte e uma cancelada, e o extrato de cada mês da janela é comparado com o relatório
- **THEN** em todos os meses as entradas e saídas não canceladas do extrato são iguais a `inflow` e `outflow` do balde

---

### Requirement: Contrato da soma das linhas gravadas
O módulo SHALL definir uma leitura que recebe `userId`, `from` e `to` (`YYYY-MM-DD`) e devolve, por mês da data prevista, `month`, `inflow` e `outflow` somando somente as transações avulsas não excluídas e as ocorrências gravadas de séries não excluídas do usuário, com data prevista no período e situação diferente de `CANCELED`. Somente os meses com alguma linha SHALL aparecer. Os valores SHALL ser positivos, em reais, com duas casas. A leitura SHALL NOT incluir ocorrências geradas.

#### Scenario: Linhas gravadas de dois meses
- **WHEN** a leitura é executada de `2026-08-01` a `2026-09-30` e há uma saída avulsa de R$ 100,00 em agosto e uma ocorrência gravada de entrada de R$ 50,00 em setembro
- **THEN** o resultado tem `{ month: "2026-08", inflow: 0, outflow: 100 }` e `{ month: "2026-09", inflow: 50, outflow: 0 }`

