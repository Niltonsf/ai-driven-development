## Purpose

Mostrar ao usuário autenticado, em `/reports/categories`, a distribuição das saídas do mês selecionado no cabeçalho por categoria ou por subcategoria, num gráfico de rosca interativo em que cada fatia pode ser desligada e religada sem nova requisição.

## ADDED Requirements

### Requirement: Relatório Gastos por Categoria em /reports/categories
A área privada SHALL servir em `/reports/categories` o relatório de gastos por categoria. A tela SHALL ter no topo o badge `Relatórios`, o título `Gastos por Categoria` e um subtítulo com o mês por extenso (por exemplo `Distribuição das saídas de setembro de 2026`), com o alternador de granularidade ao lado. O período SHALL ser do primeiro ao último dia do mês selecionado no seletor do cabeçalho, e trocá-lo SHALL refazer o relatório. A tela SHALL NOT ter seletor de mês próprio e SHALL NOT implementar proteção própria, dependendo da proteção do grupo de rotas privadas. Os blocos SHALL aparecer nesta ordem: faixa de totais, card do gráfico e nota de rodapé. A tela SHALL ser só de leitura: nenhum dado SHALL ser criado ou alterado e nenhuma fatia SHALL navegar para outra tela.

#### Scenario: Abertura do relatório
- **WHEN** o usuário autenticado acessa `/reports/categories` com setembro de 2026 selecionado
- **THEN** a tela mostra o badge `Relatórios`, o título `Gastos por Categoria`, o subtítulo `Distribuição das saídas de setembro de 2026` e os blocos na ordem definida

#### Scenario: Troca de mês no cabeçalho
- **WHEN** o usuário está no relatório de setembro de 2026 e escolhe agosto de 2026 no cabeçalho
- **THEN** o subtítulo passa a citar agosto de 2026 e o gráfico mostra as saídas de agosto

#### Scenario: Troca rápida de mês
- **WHEN** o usuário troca de mês duas vezes antes da primeira resposta chegar
- **THEN** a tela termina mostrando o último mês escolhido, nunca uma resposta anterior

---

### Requirement: Granularidade lembrada no navegador
A tela SHALL exibir as opções `Categorias` e `Subcategorias` como pílulas sempre visíveis, com a opção corrente anunciada como pressionada e cada uma com rótulo acessível dizendo o que mostra. A granularidade padrão SHALL ser `Categorias`. Escolher uma granularidade SHALL ser gravado no navegador e restaurado ao voltar à tela ou recarregar a página; um valor gravado ausente, de outra versão ou desconhecido SHALL ser ignorado em favor do padrão. Trocar a granularidade SHALL NOT fazer nova requisição ao servidor.

#### Scenario: Visão por subcategoria
- **WHEN** o usuário clica em `Subcategorias`
- **THEN** a pílula `Subcategorias` fica pressionada e o gráfico passa a ter uma fatia por subcategoria, sem nova requisição

#### Scenario: Granularidade restaurada
- **WHEN** o usuário escolhe `Subcategorias`, recarrega a página e volta ao relatório
- **THEN** `Subcategorias` continua selecionada

#### Scenario: Valor gravado inválido
- **WHEN** o navegador tem gravada uma granularidade desconhecida
- **THEN** a tela abre com `Categorias`

---

### Requirement: Fatias por categoria e por subcategoria
Na granularidade `Categorias` a tela SHALL somar as subcategorias de cada categoria numa fatia, ordenadas por total decrescente e, no empate, por nome. Na granularidade `Subcategorias` SHALL haver uma fatia por subcategoria, **agrupadas pela categoria dona**: os grupos na ordem do total da categoria e, dentro de cada grupo, por total da subcategoria. Nas duas granularidades as saídas sem subcategoria SHALL formar uma única fatia `Sem classificação`, ordenada pelo total como um grupo próprio. Nenhuma soma SHALL ser feita dentro de componente visual.

#### Scenario: Soma por categoria
- **WHEN** a resposta tem Supermercado `300` e Padaria `120` (Alimentação) e Combustível `200` (Transporte)
- **THEN** na visão por categoria há as fatias Alimentação `420` e Transporte `200`, nessa ordem

#### Scenario: Agrupamento por categoria
- **WHEN** a mesma resposta é vista por subcategoria
- **THEN** a ordem das fatias é Supermercado, Padaria e Combustível

#### Scenario: Sem classificação
- **WHEN** a resposta tem um item com os campos de identidade `null`
- **THEN** as duas visões mostram a fatia `Sem classificação` com esse total

---

### Requirement: Cores das fatias
A cor da fatia SHALL vir do cadastro de categorias:
- na visão por categoria, a cor da categoria ou, sem cor, o neutro `#64748B`;
- na visão por subcategoria, a cor da subcategoria, senão a da categoria, senão o neutro; quando fatias da mesma categoria repetem a mesma cor, a primeira SHALL manter a cor e as seguintes SHALL receber tons diferentes dela, claros e escuros, nunca branco ou preto puros;
- a fatia `Sem classificação` sempre no neutro.

A lista lateral SHALL usar a mesma cor de cada fatia. O cadastro de categorias SHALL NOT mudar a forma como pinta categorias e subcategorias.

#### Scenario: Categoria sem cor
- **WHEN** uma categoria com gasto não tem cor gravada
- **THEN** a fatia dela é pintada com `#64748B`

#### Scenario: Subcategorias com a cor da categoria
- **WHEN** as subcategorias Supermercado e Padaria têm a mesma cor gravada da categoria Alimentação
- **THEN** na visão por subcategoria as duas fatias ficam em tons distinguíveis dessa cor, uma ao lado da outra

---

### Requirement: Ligar e desligar fatias
A lista lateral SHALL ter um item por fatia, na mesma ordem do gráfico, como botão que anuncia se a fatia está ligada, mostrando o ícone da fatia sobre a cor dela (ou só a cor quando não há ícone), o rótulo, o valor em reais e o percentual. Na visão por subcategoria os itens SHALL ficar agrupados sob o nome da categoria. Clicar numa fatia do gráfico SHALL desligá-la; clicar no item da lista SHALL alternar a fatia. A fatia desligada SHALL sair do gráfico e SHALL continuar listada, apagada e sem percentual. Quando houver fatia desligada, um botão `Mostrar todas` com a contagem das fatias fora SHALL aparecer no topo da lista e religar todas. Passar o mouse ou o foco numa fatia ou num item SHALL realçar os dois. As fatias desligadas SHALL NOT ser gravadas no navegador e SHALL voltar a aparecer ao trocar de mês ou de granularidade. Nenhuma dessas ações SHALL fazer requisição ao servidor.

#### Scenario: Desligar pelo gráfico e religar pela lista
- **WHEN** o usuário clica na fatia Moradia do gráfico e depois no item Moradia da lista
- **THEN** a fatia sai do gráfico e fica apagada na lista, e depois volta ao gráfico

#### Scenario: Mostrar todas
- **WHEN** o usuário desliga três fatias
- **THEN** o botão `Mostrar todas` aparece com a contagem 3 e, ao ser clicado, as três voltam

#### Scenario: Troca de mês religa as fatias
- **WHEN** o usuário desliga uma fatia e troca o mês no cabeçalho
- **THEN** o novo mês abre com todas as fatias ligadas

#### Scenario: Recarregar não esconde gastos
- **WHEN** o usuário desliga uma fatia e recarrega a página
- **THEN** todas as fatias aparecem ligadas

#### Scenario: Realce sincronizado
- **WHEN** o usuário passa o mouse no item Transporte da lista
- **THEN** a fatia Transporte fica realçada no gráfico

---

### Requirement: Totais e percentuais sobre o visível
Os percentuais da lista SHALL ser calculados sobre o total das fatias ligadas, com `0%` quando nada está ligado. O centro da rosca SHALL mostrar o total das fatias ligadas com o rótulo `Total do mês` quando todas estão ligadas e `Total visível` quando há fatia desligada. Com fatia desligada, uma linha discreta abaixo do gráfico SHALL informar o total do mês inteiro e quantas fatias estão fora. A faixa de totais SHALL mostrar:
- `Total gasto no mês`: o total do mês inteiro, independente das fatias desligadas;
- `Maior gasto`: o rótulo e o valor da maior fatia ligada, ou um traço quando não há;
- `Sem classificação`: o valor e o percentual sobre o total do mês da fatia sem classificação, ou um traço quando não há.

Valores SHALL ser formatados em reais.

#### Scenario: Todas ligadas
- **WHEN** o mês tem Alimentação `600` e Transporte `400`, tudo ligado
- **THEN** a lista mostra `60%` e `40%`, e o centro mostra `R$ 1.000,00` com `Total do mês`

#### Scenario: Uma fatia desligada
- **WHEN** o usuário desliga Alimentação
- **THEN** Transporte mostra `100%`, o centro mostra `R$ 400,00` com `Total visível`, a linha abaixo informa o total de `R$ 1.000,00` e 1 fatia fora, e `Total gasto no mês` continua `R$ 1.000,00`

#### Scenario: Sem saídas sem classificação
- **WHEN** todas as saídas do mês têm subcategoria
- **THEN** o card `Sem classificação` mostra um traço

---

### Requirement: Nota de rodapé, carregamento, erro e mês vazio
A tela SHALL exibir, abaixo do card do gráfico, uma nota discreta dizendo que o relatório soma as saídas pendentes e efetivadas do mês pela data prevista, incluindo as ocorrências previstas das séries e sem as canceladas. Enquanto carrega, a tela SHALL mostrar blocos de esqueleto com a altura final dos blocos, sem a altura da tela mudar a cada busca. Em erro, SHALL mostrar a mensagem traduzida e um botão `Tentar de novo` que refaz a busca. Mês sem nenhuma saída SHALL mostrar a faixa de totais zerada e o gráfico em estado vazio com um texto dizendo que não há saídas no mês, e não um erro.

#### Scenario: Erro na busca
- **WHEN** a API responde com erro
- **THEN** a tela mostra a mensagem e o botão `Tentar de novo`, que refaz a busca ao ser clicado

#### Scenario: Mês vazio
- **WHEN** o mês selecionado não tem saídas
- **THEN** o gráfico mostra o texto de mês sem saídas e `Total gasto no mês` é `R$ 0,00`

#### Scenario: Código de período inválido traduzido
- **WHEN** a API responde `400` com `INVALID_CATEGORY_REPORT_PERIOD`
- **THEN** a mensagem exibida é o texto do dicionário, e não o código

---

### Requirement: Gráfico de pizza compartilhado compatível
O gráfico de pizza compartilhado SHALL aceitar, de forma opcional, um identificador por fatia, aviso de clique e de passagem do mouse com esse identificador, a fatia realçada e um conteúdo no centro da rosca. Quem já usa o gráfico sem essas opções SHALL continuar compilando e se comportando como antes, com a mesma legenda, dica e estado vazio.

#### Scenario: Uso existente
- **WHEN** o card de detalhamento compartilhado usa o gráfico sem as opções novas
- **THEN** ele compila sem mudança e continua com legenda, dica e cores como antes
