## MODIFIED Requirements

### Requirement: Rota /transactions substitui /transaction
A área privada SHALL servir o extrato mensal em `/transactions`. A rota `/transaction` e o dashboard placeholder do módulo SHALL continuar inexistentes. A página SHALL NOT implementar proteção própria, dependendo da proteção já aplicada ao grupo de rotas privadas. A tela SHALL ter uma única identidade no topo: badge `Extrato Mensal` e título com o mês selecionado, sem subtítulo, e SHALL NOT envolver a lista em card.

#### Scenario: Acesso à nova rota
- **WHEN** o usuário autenticado acessa `/transactions` com setembro de 2026 selecionado
- **THEN** o extrato é exibido com o badge `Extrato Mensal`, o título `Setembro 2026`, a barra de ferramentas e a lista

#### Scenario: Rota antiga removida
- **WHEN** o usuário acessa `/transaction`
- **THEN** a tela de transações não é exibida nessa rota

---

### Requirement: Lista paginada de transações
O extrato SHALL listar somente as transações cuja data prevista está dentro do período do mês selecionado, sem campos de período na tela. A lista SHALL pedir 100 transações por página, SHALL exibir os controles de paginação abaixo da lista somente quando houver mais de uma página e SHALL exibir a quantidade total de transações do mês em texto discreto na barra de ferramentas. A lista SHALL NOT exibir coluna nem botões de editar e excluir. O valor SHALL ser formatado em reais no padrão pt-BR, com sinal e cor conforme a direção. A situação SHALL aparecer em badge com os rótulos `Pendente`, `Efetivada` e `Cancelada`. Datas SHALL ser montadas a partir da string `YYYY-MM-DD`, sem deslocamento pelo fuso do navegador. Sem transações, a tela SHALL exibir um estado vazio que cite o mês: com filtros ativos, um texto de ajuste e o atalho `Limpar filtros`; sem filtros, o convite para registrar a primeira transação do mês.

#### Scenario: Extrato limitado ao mês selecionado
- **WHEN** o mês selecionado é setembro de 2026
- **THEN** a listagem é pedida com `expectedFrom=2026-09-01`, `expectedTo=2026-09-30` e `pageSize=100`

#### Scenario: Data sem deslocamento de fuso
- **WHEN** uma transação com `expectedOn: "2026-09-01"` é exibida em um navegador com fuso UTC-3
- **THEN** a data aparece como `01/09/2026`

#### Scenario: Valor de saída
- **WHEN** uma transação com `direction: "OUT"` e `value: 1234.56` é exibida
- **THEN** o valor aparece como `R$ 1.234,56` com o sinal e a cor de saída

#### Scenario: Status em português
- **WHEN** uma transação com `status: "SETTLED"` é exibida
- **THEN** o badge mostra `Efetivada` e nenhum código cru aparece

#### Scenario: Paginação oculta com uma página
- **WHEN** o mês tem 40 transações
- **THEN** todas aparecem na mesma página e os controles de paginação não são exibidos

#### Scenario: Lista vazia
- **WHEN** setembro de 2026 está selecionado, não há filtros ativos e o mês não tem transações
- **THEN** o estado vazio cita setembro de 2026 e convida a registrar a primeira transação do mês

#### Scenario: Estado vazio com filtros
- **WHEN** há filtros ativos e nenhuma transação do mês os atende
- **THEN** o estado vazio cita o mês, sugere ajustar os filtros e oferece `Limpar filtros`

---

### Requirement: Filtros da listagem
O extrato SHALL oferecer busca por nome na barra de ferramentas e um painel retrátil de filtros, aberto e fechado por um botão `Filtros` que exibe a quantidade de filtros ativos quando houver. O painel SHALL apresentar, um grupo por linha e nesta ordem, pílulas de seleção única: `Direção` (`Entrada`, `Saída`), `Situação` (`Pendente`, `Efetivada`, `Cancelada`), `Conta` (uma por conta ativa) e `Cartão` (`Somente cartão` e uma por cartão ativo). Cada grupo SHALL começar com uma pílula neutra (`Todas`, `Todas as contas`, `Todos os cartões`), e clicar na pílula já ativa SHALL limpar o grupo. Grupo sem nenhuma opção SHALL NOT ser exibido. `Somente cartão` SHALL listar só transações vinculadas a algum cartão; um cartão específico SHALL listar só as transações dele; os dois SHALL NOT ser enviados juntos. O painel SHALL exibir `Limpar filtros` somente quando houver filtro ativo. A contagem de filtros ativos SHALL considerar busca, direção, situação, conta e cartão, e SHALL NOT considerar o mês. O extrato SHALL NOT usar combo box para esses filtros nem oferecer filtro de período. Trocar o mês, a busca ou qualquer filtro SHALL levar a listagem para a página 1 sem enviar requisição com a página anterior. Quando mês, filtros ou página mudarem antes de uma resposta chegar, a tela SHALL exibir somente o resultado da requisição mais recente.

#### Scenario: Filtrar por situação
- **WHEN** o usuário abre o painel e clica na pílula `Pendente`
- **THEN** a listagem é pedida com `status=PENDING` e o botão `Filtros` mostra 1 filtro ativo

#### Scenario: Clicar na pílula ativa limpa o grupo
- **WHEN** a pílula `Saída` está ativa e o usuário clica nela de novo
- **THEN** o grupo `Direção` volta para a pílula neutra e a listagem é pedida sem `direction`

#### Scenario: Somente cartão
- **WHEN** o usuário clica em `Somente cartão`
- **THEN** a listagem é pedida com `onlyCreditCard=true` e sem `creditCardId`

#### Scenario: Cartão específico substitui Somente cartão
- **WHEN** `Somente cartão` está ativa e o usuário clica no cartão "Nubank"
- **THEN** a listagem é pedida com o `creditCardId` do "Nubank" e sem `onlyCreditCard`

#### Scenario: Usuário sem cartão
- **WHEN** o usuário não tem nenhum cartão ativo
- **THEN** o grupo `Cartão` não aparece no painel

#### Scenario: Limpar filtros
- **WHEN** há filtros de direção e conta ativos e o usuário clica em `Limpar filtros`
- **THEN** todos os grupos voltam para a pílula neutra, o botão `Filtros` deixa de mostrar contagem e o `Limpar filtros` some

#### Scenario: Trocar de mês volta para a página 1
- **WHEN** o usuário está na página 2 do extrato e troca o mês no seletor do cabeçalho
- **THEN** a única listagem pedida para o novo mês é a da página 1

#### Scenario: Filtro volta para a página 1
- **WHEN** o usuário está na página 2 e altera o filtro de situação
- **THEN** a listagem é recarregada na página 1 com o filtro aplicado

#### Scenario: Resposta obsoleta descartada
- **WHEN** o usuário troca o filtro de direção duas vezes seguidas e a primeira resposta chega depois da segunda
- **THEN** a lista exibe o resultado correspondente ao último filtro escolhido

---

### Requirement: Formulário único de criação e edição
A tela SHALL alternar entre o extrato e o formulário na mesma página, sem modal e sem rota própria. O formulário SHALL ser o mesmo para criar e editar, mudando apenas título e texto do botão, e SHALL ser organizado em três seções com título e descrição: `Lançamento` (nome, valor, direção, data prevista), `Vínculos` (conta, cartão, subcategoria) e `Situação` (status, data de efetivação, observação). O valor SHALL usar o campo monetário compartilhado; as datas, seletor de data; a direção, opções exclusivas `Entrada`/`Saída`; status, conta, cartão e subcategoria, seleção com busca; a observação, área de texto. Ao criar, o formulário SHALL abrir com direção `Saída`, status `Pendente` e data prevista igual ao dia de hoje no fuso local. Clicar em uma linha da tabela ou em um card SHALL abrir o formulário de edição preenchido com aquela transação; a linha e o card SHALL ser alcançáveis por teclado e acionáveis com `Enter` e `Espaço`.

#### Scenario: Abrir criação
- **WHEN** o usuário clica em "Nova transação"
- **THEN** o formulário abre vazio com direção `Saída`, status `Pendente` e data prevista de hoje

#### Scenario: Abrir edição
- **WHEN** o usuário clica em uma linha do extrato
- **THEN** o formulário abre com todos os campos preenchidos com os dados dessa transação

#### Scenario: Abrir edição pelo teclado
- **WHEN** o usuário navega com `Tab` até um card e pressiona `Enter`
- **THEN** o formulário de edição daquela transação é aberto

#### Scenario: Cancelar
- **WHEN** o usuário cancela o formulário
- **THEN** a tela volta para o extrato sem salvar

---

### Requirement: Salvar e excluir com feedback e recarga
Ao salvar com sucesso, a tela SHALL exibir toaster de sucesso, recarregar a lista e voltar para o extrato. A exclusão SHALL estar disponível somente no formulário de edição, por um botão `Excluir` no cabeçalho, e SHALL NOT aparecer no formulário de criação nem na lista. Ao excluir, a tela SHALL pedir confirmação deixando claro que a transação será excluída e, confirmada a exclusão, SHALL exibir toaster de sucesso, voltar para o extrato e recarregar a lista. Falhas de salvar ou excluir SHALL exibir toaster de erro com a mensagem traduzida, inclusive para `TRANSACTION_ACCOUNT_NOT_FOUND`, `TRANSACTION_CREDIT_CARD_NOT_FOUND`, `TRANSACTION_SUBCATEGORY_NOT_FOUND` e `TRANSACTION_NOT_FOUND`.

#### Scenario: Criação bem-sucedida
- **WHEN** o usuário preenche o formulário com dados válidos e salva
- **THEN** um toaster de sucesso aparece, a tela volta ao extrato e a nova transação está listada quando sua data prevista cai no mês selecionado

#### Scenario: Excluir não aparece na criação
- **WHEN** o usuário abre o formulário por "Nova transação"
- **THEN** o botão `Excluir` não é exibido

#### Scenario: Exclusão confirmada
- **WHEN** o usuário abre uma transação, clica em `Excluir` e confirma no diálogo
- **THEN** um toaster de sucesso aparece, a tela volta ao extrato e a transação some da lista

#### Scenario: Exclusão cancelada
- **WHEN** o usuário clica em `Excluir` no formulário de edição e fecha o diálogo sem confirmar
- **THEN** nenhuma requisição de exclusão é enviada e o formulário continua aberto

#### Scenario: Erro de vínculo vindo da API
- **WHEN** a API responde `400` com `TRANSACTION_ACCOUNT_NOT_FOUND`
- **THEN** um toaster de erro exibe a mensagem traduzida e o código não aparece cru

## ADDED Requirements

### Requirement: Agrupamento configurável do extrato
O extrato SHALL agrupar as transações da página exibida por data (padrão), conta, categoria ou subcategoria, escolhido na barra de ferramentas sem competir em peso visual com os filtros. O agrupamento SHALL ser só apresentação e SHALL NOT alterar a ordem vinda da API (data prevista decrescente e, em empate, criação decrescente). Por data, os grupos SHALL seguir a ordem recebida e ter o rótulo do dia em pt-BR (`12 de setembro · sábado`), sem deslocamento de fuso. Por conta, categoria ou subcategoria (`Categoria › Subcategoria`), os grupos SHALL ser ordenados alfabeticamente em pt-BR, mantendo a data decrescente dentro de cada grupo; transações sem categoria ou subcategoria SHALL formar o grupo `Sem classificação`, sempre por último. Cada cabeçalho de grupo SHALL mostrar o rótulo e a quantidade de transações do grupo e SHALL NOT mostrar soma em dinheiro. Com mais de uma página, um mesmo grupo SHALL poder reaparecer na página seguinte.

#### Scenario: Agrupamento padrão por data
- **WHEN** o usuário abre o extrato sem preferência gravada e há três transações em `2026-09-12`
- **THEN** a lista mostra o grupo `12 de setembro · sábado` com a contagem 3

#### Scenario: Agrupar por conta em ordem alfabética
- **WHEN** o usuário escolhe agrupar por conta e há transações nas contas "Nubank" e "Itaú"
- **THEN** o grupo "Itaú" aparece antes do grupo "Nubank" e, dentro de cada um, as transações seguem a data decrescente

#### Scenario: Sem classificação por último
- **WHEN** o agrupamento é por categoria e existe uma transação sem subcategoria
- **THEN** ela aparece no grupo `Sem classificação`, depois de todos os grupos de categoria

#### Scenario: Cabeçalho sem soma
- **WHEN** qualquer agrupamento é exibido
- **THEN** o cabeçalho de cada grupo mostra rótulo e quantidade, e nenhum total em reais

---

### Requirement: Visualizações em tabela e em cards
O extrato SHALL oferecer duas visualizações, alternadas por um controle na barra de ferramentas com dois botões identificados por rótulo acessível e com o ativo anunciado como pressionado. A **tabela** SHALL exibir, nesta ordem: botão de efetivar, `Data` (oculta quando o agrupamento é por data), `Nome` (com o cartão abaixo, quando houver), `Conta` (a partir de telas médias), `Classificação` (a partir de telas grandes), `Valor` e `Situação`, com o cabeçalho de grupo ocupando a linha inteira. Os **cards** SHALL exibir um card por transação, uma coluna no mobile e duas em telas grandes: na linha de cima, botão de efetivar, nome e valor; na linha de baixo, data, conta, cartão (quando houver), classificação e badge de situação. Sem preferência gravada, a visualização inicial SHALL ser cards em telas com largura menor que 1024px e tabela nas demais.

#### Scenario: Padrão em tela estreita
- **WHEN** o usuário abre o extrato pela primeira vez em uma tela de 390px
- **THEN** o extrato é exibido em cards

#### Scenario: Padrão em tela larga
- **WHEN** o usuário abre o extrato pela primeira vez em uma tela de 1440px
- **THEN** o extrato é exibido em tabela

#### Scenario: Coluna de data oculta no agrupamento por data
- **WHEN** a visualização é tabela e o agrupamento é por data
- **THEN** a coluna `Data` não é exibida

#### Scenario: Alternar visualização
- **WHEN** o extrato está em tabela e o usuário clica no botão de cards
- **THEN** o extrato passa a ser exibido em cards, com os mesmos grupos, e o botão de cards fica anunciado como pressionado

---

### Requirement: Efetivação em um clique
Cada linha e cada card SHALL ter, no início, um botão de efetivar em forma de check: preenchido para `Efetivada`, contornado para `Pendente`. Clicar em uma transação `Pendente` SHALL salvá-la como `Efetivada` com data de efetivação igual à sua data prevista, preservando todos os demais campos. Clicar em uma transação `Efetivada` SHALL salvá-la como `Pendente` sem data de efetivação. O salvamento SHALL usar a atualização de transação já existente, sem endpoint próprio. Para transação `Cancelada`, o botão SHALL ficar desabilitado com uma dica explicando que a situação muda pelo formulário. Enquanto o salvamento de uma transação está em andamento, o botão dela SHALL ficar desabilitado. Clicar no botão SHALL NOT abrir o formulário. O botão SHALL ter rótulo acessível com o nome da transação e anunciar como pressionado quando `Efetivada`. Em caso de sucesso sem filtro de situação ativo, a linha SHALL refletir a nova situação sem recarregar a lista inteira; com filtro de situação ativo, a lista SHALL ser recarregada para que a transação que deixou de atender ao filtro saia. Em caso de falha, SHALL ser exibido toaster de erro com a mensagem traduzida e a linha SHALL permanecer como estava.

#### Scenario: Efetivar transação pendente
- **WHEN** o usuário clica no check de "Aluguel", pendente com `expectedOn: "2026-09-05"`
- **THEN** a transação é salva com `status: "SETTLED"` e `settledOn: "2026-09-05"`, mantendo nome, valor, direção, conta, cartão, subcategoria e observação, e o check aparece preenchido

#### Scenario: Desfazer efetivação
- **WHEN** o usuário clica no check de uma transação efetivada
- **THEN** a transação é salva com `status: "PENDING"` e `settledOn: null`, e o check aparece contornado

#### Scenario: Transação cancelada
- **WHEN** o usuário passa o foco no check de uma transação cancelada
- **THEN** o botão está desabilitado e uma dica informa que a situação é alterada pelo formulário

#### Scenario: Check não abre o formulário
- **WHEN** o usuário clica no check de uma linha
- **THEN** somente a efetivação é disparada e a tela continua no extrato

#### Scenario: Linha some com filtro de situação
- **WHEN** o filtro `Pendente` está ativo e o usuário efetiva uma transação com sucesso
- **THEN** a lista é recarregada e a transação deixa de aparecer

#### Scenario: Falha ao efetivar
- **WHEN** o usuário clica no check e a API responde com erro
- **THEN** um toaster de erro exibe a mensagem traduzida e a linha continua com a situação anterior

#### Scenario: Clique duplo durante o salvamento
- **WHEN** o usuário clica no check e clica de novo antes da resposta
- **THEN** somente uma atualização é enviada, porque o botão fica desabilitado enquanto aguarda

---

### Requirement: Preferências do extrato guardadas no navegador
O extrato SHALL guardar no navegador a visualização, o agrupamento, o painel de filtros aberto ou fechado e os filtros de direção, situação, conta e cartão, e SHALL restaurá-los ao voltar à tela. A busca por nome e o mês SHALL NOT ser guardados. As preferências SHALL estar disponíveis já na primeira requisição do extrato. Preferência ausente, ilegível, de versão diferente ou com valores fora dos conjuntos conhecidos SHALL ser descartada em favor dos padrões (agrupamento por data, painel fechado, sem filtros e visualização conforme a largura da tela), sem quebrar a tela.

#### Scenario: Preferências restauradas
- **WHEN** o usuário escolhe cards, agrupamento por categoria, painel aberto e filtro `Saída`, sai da tela e volta
- **THEN** o extrato abre em cards, agrupado por categoria, com o painel aberto e o filtro `Saída` já aplicado na primeira requisição

#### Scenario: Escolha do usuário vale sobre a largura
- **WHEN** o usuário escolheu tabela e depois abre o extrato em uma tela de 390px
- **THEN** o extrato é exibido em tabela

#### Scenario: Busca não é guardada
- **WHEN** o usuário busca por "mercado", sai da tela e volta
- **THEN** o campo de busca está vazio

#### Scenario: Preferência corrompida
- **WHEN** o valor guardado no navegador não é um JSON válido ou traz `status: "COMPLETED"`
- **THEN** o extrato abre com os padrões e nenhum erro é exibido
