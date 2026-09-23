## Purpose

Mostrar ao usuário autenticado, em `/reports/cash-flow`, a linha do tempo das entradas, saídas e saldo de cada mês de uma janela de 6, 12, 18 ou 24 meses que termina no mês selecionado no cabeçalho, com totais do período e dois gráficos de leitura.

## ADDED Requirements

### Requirement: Relatório Entradas x Saídas em /reports/cash-flow
A área privada SHALL servir em `/reports/cash-flow` o relatório de entradas e saídas. A tela SHALL ter no topo o badge `Relatórios`, o título `Entradas x Saídas` e um subtítulo com a janela e o mês de referência por extenso (por exemplo `Últimos 12 meses, até setembro de 2026`), com o seletor de janela ao lado. O mês de referência SHALL ser o mês selecionado no seletor do cabeçalho, e trocá-lo SHALL refazer o relatório. A tela SHALL NOT ter seletor de mês próprio e SHALL NOT implementar proteção própria, dependendo da proteção do grupo de rotas privadas. Os blocos SHALL aparecer nesta ordem: faixa de totais, gráfico de comparação, gráfico de saldo e nota de rodapé. A tela SHALL ser só de leitura: nenhum dado SHALL ser criado ou alterado e nenhum ponto do gráfico SHALL ser clicável.

#### Scenario: Abertura do relatório
- **WHEN** o usuário autenticado acessa `/reports/cash-flow` com setembro de 2026 selecionado e sem janela gravada
- **THEN** a tela mostra o badge `Relatórios`, o título `Entradas x Saídas`, o subtítulo `Últimos 12 meses, até setembro de 2026` e os blocos na ordem definida

#### Scenario: Troca de mês no cabeçalho
- **WHEN** o usuário está no relatório de setembro de 2026 e escolhe março de 2026 no cabeçalho
- **THEN** o subtítulo passa a citar março de 2026 e os gráficos passam a terminar em `mar/2026`

---

### Requirement: Seletor de janela lembrado no navegador
A tela SHALL exibir as janelas `6 meses`, `12 meses`, `18 meses` e `24 meses` como pílulas sempre visíveis, na ordem do conjunto do domínio, com a janela corrente anunciada como pressionada e o grupo com rótulo acessível. A janela padrão SHALL ser `12 meses`. Escolher uma janela SHALL refazer o relatório e SHALL ser gravado no navegador, sendo restaurado ao voltar à tela ou recarregar a página. Um valor gravado ausente, de outra versão ou fora do conjunto SHALL ser ignorado em favor do padrão. O mês de referência SHALL NOT ser gravado.

#### Scenario: Escolher janela
- **WHEN** o usuário clica em `24 meses`
- **THEN** a pílula `24 meses` fica pressionada, o subtítulo passa a `Últimos 24 meses, até ...` e os gráficos mostram 24 meses

#### Scenario: Janela restaurada
- **WHEN** o usuário escolhe `6 meses`, recarrega a página e volta ao relatório
- **THEN** a janela `6 meses` continua selecionada, e o mês de referência volta a ser o mês corrente

#### Scenario: Valor gravado inválido
- **WHEN** o navegador tem gravada a janela `7`
- **THEN** a tela abre com `12 meses`

#### Scenario: Troca rápida de janela
- **WHEN** o usuário clica em `6 meses` e logo em seguida em `24 meses`, antes da primeira resposta chegar
- **THEN** a tela termina mostrando 24 meses, nunca a resposta de 6

---

### Requirement: Faixa de totais do período
A tela SHALL exibir quatro cards com título e ícone: `Entradas` (soma das entradas da janela), `Saídas` (soma das saídas da janela), `Saldo do período` (entradas menos saídas) e `Média mensal` (saldo do período dividido pela quantidade de meses da janela, e não pelos meses com movimento). Os valores SHALL estar em reais no padrão pt-BR, com saldo e média coloridos pelo sinal. Os cards SHALL ficar em uma coluna no mobile, duas em telas médias e quatro em telas largas, com a mesma superfície e os mesmos tons de entrada, saída e resultado dos indicadores do dashboard do mês.

#### Scenario: Totais de uma janela de 12 meses
- **WHEN** a janela de 12 meses soma R$ 60.000,00 de entradas e R$ 54.000,00 de saídas
- **THEN** os cards mostram `R$ 60.000,00`, `R$ 54.000,00`, `R$ 6.000,00` e média mensal `R$ 500,00`

#### Scenario: Saldo negativo
- **WHEN** a janela soma mais saídas do que entradas
- **THEN** `Saldo do período` e `Média mensal` aparecem com valor negativo na cor de saída

---

### Requirement: Gráfico de comparação mês a mês
A tela SHALL exibir um card com um gráfico de barras agrupadas com uma barra de `Entradas` e uma de `Saídas` lado a lado para cada mês da janela, nessa ordem, com o eixo horizontal no rótulo curto do mês (`set/2026`), o eixo vertical e o tooltip em reais pt-BR e legenda com os nomes. Entradas e saídas SHALL usar as cores de entrada e saída da tela. A cor SHALL NOT ser a única forma de identificar a série: legenda e tooltip SHALL nomeá-la.

#### Scenario: Tooltip do mês
- **WHEN** o usuário passa o mouse sobre março de 2026
- **THEN** o tooltip mostra o mês e os valores de `Entradas` e `Saídas` em reais

---

### Requirement: Gráfico de saldo e acumulado do período
A tela SHALL exibir um card com um gráfico de barra e linha: a barra `Saldo do mês` com o saldo de cada mês e a linha `Acumulado no período` com a soma corrida dos saldos a partir do primeiro mês da janela. O acumulado SHALL começar do zero no primeiro mês da janela e SHALL NOT representar o saldo de nenhuma conta. Valores em reais pt-BR no eixo e no tooltip.

#### Scenario: Acumulado da janela
- **WHEN** os três primeiros meses da janela têm saldo R$ 500,00, R$ -200,00 e R$ 300,00
- **THEN** a linha do acumulado passa por R$ 500,00, R$ 300,00 e R$ 600,00 nesses meses

---

### Requirement: Nota de rodapé sobre o que o relatório soma
A tela SHALL exibir ao final uma nota discreta explicando que o relatório soma entradas e saídas pendentes e efetivadas pela data prevista, incluindo as ocorrências previstas das séries, sem as canceladas, com os mesmos números do extrato de cada mês, e que meses futuros são previsão.

#### Scenario: Nota visível
- **WHEN** o relatório é exibido com dados
- **THEN** a nota aparece abaixo dos gráficos

---

### Requirement: Estados de carregamento, erro e janela sem movimento
Enquanto o relatório carrega, a faixa de totais e os dois gráficos SHALL exibir esqueletos com a mesma organização e altura aproximada do conteúdo final, sem a altura da tela mudar bruscamente ao trocar de mês ou de janela. Em caso de erro, a tela SHALL exibir no lugar dos blocos um card com mensagem legível traduzida e o botão `Tentar de novo`, que refaz a leitura. Quando nenhum mês da janela tiver entrada ou saída, a faixa de totais SHALL mostrar os valores zerados e os dois gráficos SHALL mostrar um estado vazio com texto curto dentro do próprio card, nunca uma tela vazia. Os códigos `INVALID_REPORT_REFERENCE` e `INVALID_REPORT_WINDOW` SHALL ter mensagem nos dicionários pt e en.

#### Scenario: Carregando
- **WHEN** a leitura do relatório ainda não respondeu
- **THEN** os esqueletos aparecem no lugar dos totais e dos gráficos

#### Scenario: Erro na leitura
- **WHEN** a leitura falha
- **THEN** a tela mostra a mensagem de erro e o botão `Tentar de novo`, e clicar nele refaz a leitura

#### Scenario: Janela sem movimento
- **WHEN** o usuário não tem nenhuma transação nem série na janela
- **THEN** os quatro totais mostram `R$ 0,00` e os dois gráficos mostram o estado vazio
