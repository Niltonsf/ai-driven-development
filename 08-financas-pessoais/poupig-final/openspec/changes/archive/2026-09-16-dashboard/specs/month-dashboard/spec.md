## Purpose

Mostrar ao usuário autenticado, na tela inicial da área privada, uma visão de leitura do mês selecionado: quanto entra e sai, o que já foi efetivado, o que está atrasado ou por vir, para onde vão as saídas (por categoria e por conta), atalhos para as telas do dia a dia e um guia de primeiros passos enquanto falta base cadastrada.

## ADDED Requirements

### Requirement: Dashboard do mês selecionado em /dashboard
A área privada SHALL servir em `/dashboard` o dashboard do mês selecionado no seletor de mês do cabeçalho, no lugar do placeholder com os cards "Métrica A/B/C". A tela SHALL ter no topo o badge `Dashboard`, o título com o mês selecionado e o subtítulo `Visão geral do mês selecionado`. Trocar o mês no cabeçalho SHALL refazer o dashboard para o novo mês. A tela SHALL NOT ter seletor de mês nem de período próprio e SHALL NOT implementar proteção própria, dependendo da proteção do grupo de rotas privadas. O item `Dashboard` do menu e o destino `/dashboard` do login e do logo SHALL continuar como estão. A tela SHALL ser só de leitura: nenhum dado SHALL ser criado ou alterado a partir dela.

Os blocos SHALL aparecer nesta ordem:
1. primeiros passos, quando houver
2. a linha de indicadores
3. os painéis do mês: gastos por categoria, saídas por conta e pendências
4. os atalhos
5. o aviso de corte, quando houver

Os painéis do mês SHALL se organizar pela largura disponível: empilhados em telas estreitas; em telas largas, os dois gráficos lado a lado com as pendências na linha de baixo ocupando a largura inteira; em telas muito largas, os três na mesma linha.

#### Scenario: Tela inicial do mês
- **WHEN** o usuário autenticado acessa `/dashboard` com setembro de 2026 selecionado
- **THEN** a tela mostra o badge `Dashboard`, o título `Setembro 2026` e os blocos do mês, sem nenhum card "Métrica A/B/C"

#### Scenario: Troca de mês no cabeçalho
- **WHEN** o usuário está no dashboard de setembro de 2026 e escolhe outubro de 2026 no seletor do cabeçalho
- **THEN** o título passa a `Outubro 2026` e todos os blocos passam a refletir outubro

#### Scenario: Sem seletor próprio
- **WHEN** o dashboard é exibido
- **THEN** o único controle de mês visível é o do cabeçalho

#### Scenario: Painéis em tela estreita
- **WHEN** o dashboard é exibido no mobile
- **THEN** os indicadores, os dois gráficos e as pendências aparecem empilhados em uma coluna

---

### Requirement: Fonte única no extrato do mês
Todos os números, gráficos, listas e contagens do dashboard SHALL vir de uma única leitura do extrato do mês selecionado (do primeiro ao último dia, sem filtros), a mesma fonte da tela de extrato. Com isso entram as transações avulsas, as ocorrências de série gravadas e as ocorrências ainda não gravadas. O dashboard SHALL NOT pedir outro endpoint para os indicadores, os gráficos ou as pendências. Entradas com situação `Cancelada` SHALL ficar fora de toda soma, gráfico, lista e contagem do dashboard.

#### Scenario: Mesma fonte do extrato
- **WHEN** o dashboard de setembro de 2026 é aberto
- **THEN** o extrato é pedido uma vez com `from=2026-09-01` e `to=2026-09-30`, sem filtros

#### Scenario: Ocorrência não gravada entra nas somas
- **WHEN** setembro de 2026 tem uma parcela ainda não gravada de R$ 300,00 de saída de um parcelamento
- **THEN** ela entra em `Saídas`, no `Resultado previsto`, na contagem de transações, nos gráficos e nas pendências

#### Scenario: Cancelada fora de tudo
- **WHEN** o mês tem uma saída cancelada de R$ 500,00
- **THEN** ela não entra em nenhum indicador, na efetivação, nos gráficos nem nas pendências

---

### Requirement: Indicadores previsto e efetivado
O dashboard SHALL exibir uma linha com quatro cards de indicador, cada um com título e ícone. Os valores SHALL estar em reais no padrão pt-BR, e os cards SHALL ficar em uma coluna no mobile, duas em telas médias e quatro em telas largas.

- `Resultado previsto`: o valor em destaque é entradas previstas menos saídas previstas. Logo abaixo, uma faixa `Resultado efetivado` mostra entradas efetivadas menos saídas efetivadas. O sinal de cada resultado SHALL ser indicado por cor (positivo ou zero e negativo com cores distintas).
- `Entradas` e `Saídas`: o valor em destaque é o total previsto (situações `Pendente` + `Efetivada`), com a legenda `previsto no mês`. Abaixo, uma barra no tom do card mostra a fração já efetivada do previsto, com o texto `Efetivado R$ …` e o percentual. Com previsto zero, a barra SHALL ficar vazia e o percentual em `0%`.
- `Efetivação`: requisito próprio.

Entradas SHALL usar o tom verde e saídas o tom vermelho.

#### Scenario: Previsto e efetivado
- **WHEN** o mês tem entrada efetivada de R$ 5.000,00, entrada pendente de R$ 1.000,00, saída efetivada de R$ 2.000,00 e saída pendente de R$ 1.500,00
- **THEN** `Entradas` mostra `R$ 6.000,00` com `Efetivado R$ 5.000,00` e 83%, `Saídas` mostra `R$ 3.500,00` com `Efetivado R$ 2.000,00` e 57%, `Resultado previsto` mostra `R$ 2.500,00` e a faixa `Resultado efetivado` mostra `R$ 3.000,00`

#### Scenario: Resultado negativo
- **WHEN** as saídas previstas do mês superam as entradas previstas
- **THEN** o `Resultado previsto` é exibido com a cor de valor negativo

---

### Requirement: Efetivação em anel
O card `Efetivação` SHALL exibir um anel de progresso com o percentual de entradas efetivadas no centro e, ao lado, o texto `N de M` com a legenda `transações efetivadas`. `N` é a quantidade de entradas `Efetivada` e `M` a quantidade de entradas não canceladas do mês. O anel SHALL representar um único valor sobre uma trilha, e não uma pizza de duas fatias. Com `M` igual a zero, o anel SHALL ficar vazio e o percentual em `0%`, sem erro.

#### Scenario: Progresso parcial
- **WHEN** o mês tem 20 entradas não canceladas, 12 delas efetivadas
- **THEN** o anel mostra 60% e o texto mostra `12 de 20` transações efetivadas

#### Scenario: Mês sem transações
- **WHEN** o mês não tem nenhuma entrada
- **THEN** o anel fica vazio com `0%` e o texto mostra `0 de 0`

---

### Requirement: Gráficos de saídas por categoria e por conta
O dashboard SHALL exibir dois cards com gráfico de rosca sobre as saídas não canceladas do mês: `Gastos por categoria` e `Saídas por conta`, cada um com título, descrição e ícone.

- **Agrupamento**: saídas sem categoria SHALL formar o grupo `Sem classificação`, o mesmo rótulo do agrupamento por categoria do extrato. Os grupos SHALL ser ordenados por total decrescente, com desempate por rótulo.
- **Fatias**: os cinco primeiros grupos SHALL ser fatias com nome, e os demais SHALL ser somados numa única fatia `Outras`, sempre a última, de modo que um gráfico nunca tenha mais de seis fatias.
- **Cores**: as fatias com nome SHALL usar uma sequência fixa de cores distinguíveis entre vizinhas, inclusive por pessoas com daltonismo, atribuída pela posição no ranking e nunca repetida dentro do gráfico. `Outras` SHALL usar um cinza neutro.
- **Legenda**: ao lado do gráfico (ou abaixo, quando o card é estreito), SHALL nomear cada fatia com a cor, o rótulo, o total em reais e o percentual sobre o total de saídas do mês.
- **Centro da rosca**: SHALL mostrar `Total` e o total de saídas do mês. Ao passar o mouse sobre uma fatia ou uma linha da legenda, ou ao focar a linha pelo teclado, a fatia correspondente SHALL ficar destacada (as demais esmaecidas), e o centro SHALL mostrar o rótulo, o total e o percentual `N% das saídas` daquela fatia.
- **Mês sem saídas**: cada card SHALL mostrar um texto curto (`Nenhum gasto neste mês` e `Nenhuma saída neste mês`), sem gráfico.

#### Scenario: Ranking com participação
- **WHEN** as saídas do mês somam R$ 4.000,00, sendo R$ 2.000,00 em `Moradia` e R$ 1.000,00 em `Alimentação`
- **THEN** o gráfico de categorias mostra `Moradia` como primeira fatia, com `R$ 2.000,00` e 50% na legenda, seguida de `Alimentação` com `R$ 1.000,00` e 25%, e o centro mostra `Total` com `R$ 4.000,00`

#### Scenario: Mais de cinco grupos
- **WHEN** o mês tem saídas em 8 categorias
- **THEN** o gráfico tem 6 fatias: as 5 categorias de maior total e `Outras` com a soma das outras 3

#### Scenario: Saída sem categoria
- **WHEN** o mês tem saídas sem subcategoria vinculada
- **THEN** elas somam na fatia `Sem classificação` do gráfico de categorias

#### Scenario: Saídas por conta
- **WHEN** o mês tem R$ 3.000,00 de saídas na conta `Nubank` e R$ 1.000,00 na conta `Itaú`
- **THEN** o gráfico de contas mostra `Nubank` com 75% e `Itaú` com 25%

#### Scenario: Destaque ao passar o mouse
- **WHEN** o usuário passa o mouse sobre a linha `Alimentação` da legenda
- **THEN** a fatia `Alimentação` fica destacada, as demais esmaecem e o centro mostra `Alimentação`, `R$ 1.000,00` e `25% das saídas`

#### Scenario: Mês sem gastos
- **WHEN** o mês só tem entradas
- **THEN** os dois cards mostram seus textos de mês sem saídas e nenhum gráfico

---

### Requirement: Pendências atrasadas e próximas
O dashboard SHALL exibir o card `Pendências`, com a descrição `O que ainda falta efetivar neste mês` e dois grupos sempre visíveis. Os dois grupos SHALL ficar lado a lado quando o card é largo e empilhados quando é estreito.

- **Critério**: `Atrasadas` são as entradas `Pendente` com data prevista anterior a hoje; `Próximas` são as `Pendente` com data prevista de hoje em diante. "Hoje" SHALL ser a data local do navegador, e as datas SHALL ser comparadas como `YYYY-MM-DD`, sem deslocamento de fuso.
- **Ordem e corte**: cada grupo SHALL mostrar até 5 entradas em ordem de data prevista crescente, com desempate por nome, e, havendo mais, o texto `e mais N`.
- **Cabeçalho do grupo**: ícone e contagem total. A contagem de `Atrasadas` SHALL ficar em tom de alerta quando for maior que zero.
- **Linha**:
  - um selo de data com o dia e o mês abreviado (lidos da string `YYYY-MM-DD`, sem fuso), em tom de alerta nas atrasadas
  - o nome e a conta
  - o valor com sinal e cor pela direção
  - quando for ocorrência de série, o mesmo sinal de recorrência do extrato
- **Grupo vazio**: SHALL mostrar um texto curto (`Nada atrasado neste mês` e `Nada por vir neste mês`) em vez de sumir.
- **Navegação**: o card SHALL ter o link `Ver no extrato` para `/transactions`, e cada linha SHALL levar ao extrato, que abre no mesmo mês selecionado. O dashboard SHALL NOT abrir formulário nem efetivar pendências.

#### Scenario: Mês corrente divide atrasadas e próximas
- **WHEN** hoje é 16/09/2026 e setembro de 2026 tem pendências previstas para 10/09, 16/09 e 25/09
- **THEN** `Atrasadas` mostra a de 10/09 e `Próximas` mostra as de 16/09 e 25/09, nessa ordem

#### Scenario: Mês passado
- **WHEN** hoje é 16/09/2026 e o mês selecionado é agosto de 2026 com pendências
- **THEN** todas aparecem em `Atrasadas` e `Próximas` mostra `Nada por vir neste mês`

#### Scenario: Mês futuro
- **WHEN** hoje é 16/09/2026 e o mês selecionado é outubro de 2026 com pendências
- **THEN** todas aparecem em `Próximas` e `Atrasadas` mostra `Nada atrasado neste mês`

#### Scenario: Mais de cinco pendências
- **WHEN** o grupo `Próximas` tem 8 entradas
- **THEN** as 5 de data prevista mais próxima são listadas, a contagem do grupo mostra 8 e o texto `e mais 3` é exibido

#### Scenario: Selo de data sem fuso
- **WHEN** uma pendência com `expectedOn: "2026-09-01"` é exibida em um navegador com fuso UTC-3
- **THEN** o selo mostra o dia `01` e o mês `set`

#### Scenario: Parcela de série
- **WHEN** uma pendência é a parcela 3 de um parcelamento em 12 vezes
- **THEN** a linha mostra o sinal de recorrência com `3/12`

#### Scenario: Ir para o extrato
- **WHEN** o usuário clica em uma pendência ou em `Ver no extrato` com outubro de 2026 selecionado
- **THEN** a aplicação navega para `/transactions`, que exibe outubro de 2026

---

### Requirement: Atalhos para as telas do dia a dia
O dashboard SHALL exibir a seção `Atalhos` com quatro cards horizontais. Cada card SHALL ter um ícone em destaque colorido (o mesmo ícone do item correspondente no menu), o título, uma descrição de uma linha e uma seta:
- `Extrato Mensal` (`/transactions`)
- `Contas` (`/accounts`)
- `Cartões` (`/cards`)
- `Categorias` (`/categories`)

Os cards SHALL ficar em uma coluna no mobile, duas em telas médias e quatro em telas largas. Os atalhos SHALL permanecer visíveis durante o carregamento e em caso de erro na leitura do extrato.

#### Scenario: Atalho para contas
- **WHEN** o usuário clica no atalho `Contas`
- **THEN** a aplicação navega para `/accounts`

---

### Requirement: Guia de primeiros passos
Quando falta base, o dashboard SHALL exibir no topo o card `Primeiros passos`, com a descrição `Complete a base para acompanhar o seu mês`, o contador `N de 3 concluídos` e três passos numerados. Os passos SHALL ficar lado a lado em telas médias ou maiores, e cada um SHALL ter título e descrição curta:
- `Cadastrar a primeira conta` (`/accounts`): feito quando o usuário tem ao menos uma conta
- `Aplicar as categorias padrão` (`/categories`): feito quando há ao menos uma categoria ativa
- `Registrar a primeira transação` (`/transactions`): feito quando o mês selecionado tem ao menos uma entrada não cancelada

Passo pendente SHALL mostrar seu número e ser um link para a tela que o resolve. Passo feito SHALL mostrar um ícone de check no lugar do número e o título riscado, sem link. O guia SHALL aparecer só quando algum passo está pendente e SHALL sumir sozinho quando os três estiverem feitos. A existência de conta e de categoria SHALL ser lida uma vez ao abrir a tela. Se essa leitura falhar ou ainda estiver em andamento, o guia SHALL NOT aparecer e nenhuma mensagem de erro SHALL ser exibida por causa dela. Como o terceiro passo depende do extrato do mês, o guia também SHALL NOT aparecer enquanto o extrato carrega ou quando a leitura dele falhou. O guia SHALL NOT ter opção de dispensar nem guardar estado no navegador.

#### Scenario: Usuário recém-cadastrado
- **WHEN** um usuário sem contas, sem categorias e sem transações abre o dashboard
- **THEN** o guia aparece no topo com `0 de 3 concluídos` e os três passos numerados como links

#### Scenario: Base parcial
- **WHEN** o usuário tem conta e categorias ativas, mas o mês selecionado não tem transações
- **THEN** o guia mostra `2 de 3 concluídos`, os dois primeiros passos com check e `Registrar a primeira transação` como link

#### Scenario: Base completa
- **WHEN** o usuário tem conta, categorias ativas e ao menos uma transação não cancelada no mês
- **THEN** o guia não é exibido

#### Scenario: Leitura dos cadastros falha
- **WHEN** a leitura de contas ou de categorias falha
- **THEN** o guia não é exibido, nenhuma mensagem de erro aparece por isso e o restante do dashboard funciona normalmente

---

### Requirement: Aviso de corte do extrato
Quando a leitura do mês devolver a quantidade máxima de entradas do extrato (500), o dashboard SHALL exibir, ao final, um aviso discreto de que os indicadores consideram as primeiras 500 transações do mês. Abaixo do teto, o aviso SHALL NOT aparecer.

#### Scenario: Mês no teto
- **WHEN** o extrato do mês volta com 500 entradas
- **THEN** o aviso de corte é exibido ao final da tela

#### Scenario: Mês abaixo do teto
- **WHEN** o extrato do mês volta com 120 entradas
- **THEN** nenhum aviso de corte é exibido

---

### Requirement: Estados de carregamento, erro e mês vazio
Enquanto o extrato do mês carrega, os blocos que dependem dele (indicadores, gráficos e pendências) SHALL exibir esqueletos com a mesma organização e altura aproximada do conteúdo final. A altura da tela não SHALL mudar bruscamente a cada troca de mês.

Em caso de erro, esses blocos SHALL dar lugar a um card com `Não foi possível carregar o mês.`, a mensagem do erro em cor legível sobre o fundo escuro e o botão `Tentar de novo`, que refaz a leitura. Os atalhos SHALL continuar visíveis; o guia de primeiros passos volta a aparecer, se ainda faltar base, quando a leitura tiver sucesso.

Mês sem nenhuma entrada SHALL exibir, e nunca uma tela vazia:
- indicadores zerados
- o anel de efetivação vazio
- os cards de gráfico com seus textos de mês sem saídas
- os grupos de pendência com seus textos curtos
- o passo `Registrar a primeira transação` pendente

#### Scenario: Carregando
- **WHEN** o usuário troca o mês e a resposta ainda não chegou
- **THEN** indicadores, gráficos e pendências mostram esqueletos e os atalhos continuam visíveis

#### Scenario: Erro com nova tentativa
- **WHEN** a leitura do extrato falha e o usuário clica em `Tentar de novo`
- **THEN** a leitura é refeita e, com sucesso, os blocos são exibidos

#### Scenario: Guia oculto durante o erro
- **WHEN** falta base cadastrada e a leitura do extrato falha
- **THEN** a mensagem de erro e os atalhos são exibidos e o guia de primeiros passos não aparece

#### Scenario: Mês vazio
- **WHEN** o mês selecionado não tem nenhuma entrada
- **THEN** os indicadores mostram `R$ 0,00`, o anel mostra `0%` com `0 de 0`, os gráficos mostram seus textos de mês sem saídas e as pendências mostram seus textos curtos
