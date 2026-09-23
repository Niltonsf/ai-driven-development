## REMOVED Requirements

### Requirement: Lista paginada de transações
**Reason**: O extrato passa a juntar transações avulsas e ocorrências de série que ainda não existem no banco; paginar essa união exigiria deslocamento sobre registros inexistentes. O mês passa a vir inteiro em uma única resposta.
**Migration**: Substituído pelo requisito "Extrato do mês inteiro em uma única lista", que consome `GET /statement`. O endpoint `GET /transactions` continua existindo no backend sem mudança; apenas o extrato deixa de consumi-lo.

### Requirement: Filtros da listagem
**Reason**: Os filtros deixam de conviver com paginação (os cenários de volta para a página 1 perdem o sentido) e passam a valer também para as ocorrências de série.
**Migration**: Substituído pelo requisito "Filtros do extrato", com os mesmos grupos, pílulas e semântica de cartão, sem página e aplicado aos dois tipos de entrada.

## ADDED Requirements

### Requirement: Extrato do mês inteiro em uma única lista
O extrato SHALL listar, em uma única lista e sem paginação, as transações avulsas e as ocorrências de séries cuja data prevista está dentro do período do mês selecionado, sem campos de período na tela, pedindo o mês inteiro ao endpoint do extrato com `from` e `to` do mês. A tela SHALL NOT exibir controles de paginação e SHALL exibir a quantidade total de entradas do mês em texto discreto na barra de ferramentas. Ocorrências e transações avulsas SHALL ser exibidas da mesma forma, exceto pelo sinal de recorrência. A lista SHALL NOT exibir coluna nem botões de editar e excluir. O valor SHALL ser formatado em reais no padrão pt-BR, com sinal e cor conforme a direção. A situação SHALL aparecer em badge com os rótulos `Pendente`, `Efetivada` e `Cancelada`. Datas SHALL ser montadas a partir da string `YYYY-MM-DD`, sem deslocamento pelo fuso do navegador. O extrato SHALL NOT calcular ocorrências no navegador. Sem entradas, a tela SHALL exibir um estado vazio que cite o mês: com filtros ativos, um texto de ajuste e o atalho `Limpar filtros`; sem filtros, o convite para registrar a primeira transação do mês.

#### Scenario: Extrato limitado ao mês selecionado
- **WHEN** o mês selecionado é setembro de 2026
- **THEN** o extrato é pedido com `from=2026-09-01` e `to=2026-09-30`, sem parâmetros de página

#### Scenario: Avulsas e ocorrências na mesma lista
- **WHEN** outubro de 2026 tem a transação avulsa "Mercado" e a parcela 1 do parcelamento "Notebook"
- **THEN** as duas aparecem na mesma lista e a barra de ferramentas mostra 2 entradas

#### Scenario: Mês com muitas entradas sem paginação
- **WHEN** o mês tem 140 entradas
- **THEN** todas aparecem na mesma lista e nenhum controle de paginação é exibido

#### Scenario: Data sem deslocamento de fuso
- **WHEN** uma entrada com `expectedOn: "2026-09-01"` é exibida em um navegador com fuso UTC-3
- **THEN** a data aparece como `01/09/2026`

#### Scenario: Valor de saída
- **WHEN** uma entrada com `direction: "OUT"` e `value: 1234.56` é exibida
- **THEN** o valor aparece como `R$ 1.234,56` com o sinal e a cor de saída

#### Scenario: Status em português
- **WHEN** uma entrada com `status: "SETTLED"` é exibida
- **THEN** o badge mostra `Efetivada` e nenhum código cru aparece

#### Scenario: Lista vazia
- **WHEN** setembro de 2026 está selecionado, não há filtros ativos e o mês não tem entradas
- **THEN** o estado vazio cita setembro de 2026 e convida a registrar a primeira transação do mês

#### Scenario: Estado vazio com filtros
- **WHEN** há filtros ativos e nenhuma entrada do mês os atende
- **THEN** o estado vazio cita o mês, sugere ajustar os filtros e oferece `Limpar filtros`

---

### Requirement: Filtros do extrato
O extrato SHALL oferecer busca por nome na barra de ferramentas e um painel retrátil de filtros, aberto e fechado por um botão `Filtros` que exibe a quantidade de filtros ativos quando houver. O painel SHALL apresentar, um grupo por linha e nesta ordem, pílulas de seleção única: `Direção` (`Entrada`, `Saída`), `Situação` (`Pendente`, `Efetivada`, `Cancelada`), `Conta` (uma por conta ativa) e `Cartão` (`Somente cartão` e uma por cartão ativo). Cada grupo SHALL começar com uma pílula neutra (`Todas`, `Todas as contas`, `Todos os cartões`), e clicar na pílula já ativa SHALL limpar o grupo. Grupo sem nenhuma opção SHALL NOT ser exibido. `Somente cartão` SHALL listar só entradas vinculadas a algum cartão; um cartão específico SHALL listar só as entradas dele; os dois SHALL NOT ser enviados juntos. Os filtros SHALL valer igualmente para transações avulsas e ocorrências de série. O painel SHALL exibir `Limpar filtros` somente quando houver filtro ativo. A contagem de filtros ativos SHALL considerar busca, direção, situação, conta e cartão, e SHALL NOT considerar o mês. O extrato SHALL NOT usar combo box para esses filtros nem oferecer filtro de período. Trocar o mês, a busca ou qualquer filtro SHALL pedir o extrato de novo. Quando mês ou filtros mudarem antes de uma resposta chegar, a tela SHALL exibir somente o resultado da requisição mais recente.

#### Scenario: Filtrar por situação
- **WHEN** o usuário abre o painel e clica na pílula `Pendente`
- **THEN** o extrato é pedido com `status=PENDING` e o botão `Filtros` mostra 1 filtro ativo

#### Scenario: Clicar na pílula ativa limpa o grupo
- **WHEN** a pílula `Saída` está ativa e o usuário clica nela de novo
- **THEN** o grupo `Direção` volta para a pílula neutra e o extrato é pedido sem `direction`

#### Scenario: Somente cartão
- **WHEN** o usuário clica em `Somente cartão`
- **THEN** o extrato é pedido com `onlyCreditCard=true` e sem `creditCardId`

#### Scenario: Cartão específico substitui Somente cartão
- **WHEN** `Somente cartão` está ativa e o usuário clica no cartão "Nubank"
- **THEN** o extrato é pedido com o `creditCardId` do "Nubank" e sem `onlyCreditCard`

#### Scenario: Usuário sem cartão
- **WHEN** o usuário não tem nenhum cartão ativo
- **THEN** o grupo `Cartão` não aparece no painel

#### Scenario: Limpar filtros
- **WHEN** há filtros de direção e conta ativos e o usuário clica em `Limpar filtros`
- **THEN** todos os grupos voltam para a pílula neutra, o botão `Filtros` deixa de mostrar contagem e o `Limpar filtros` some

#### Scenario: Filtro de situação vale para ocorrências
- **WHEN** o usuário clica na pílula `Efetivada` e o mês tem ocorrências de série ainda não gravadas
- **THEN** essas ocorrências não aparecem, porque toda ocorrência não gravada está pendente

#### Scenario: Trocar de mês pede o novo extrato
- **WHEN** o usuário troca o mês no seletor do cabeçalho
- **THEN** o extrato é pedido com o `from` e o `to` do novo mês e os filtros ativos

#### Scenario: Resposta obsoleta descartada
- **WHEN** o usuário troca o filtro de direção duas vezes seguidas e a primeira resposta chega depois da segunda
- **THEN** a lista exibe o resultado correspondente ao último filtro escolhido

## MODIFIED Requirements

### Requirement: Formulário único de criação e edição
A tela SHALL alternar entre o extrato e o formulário na mesma página, sem modal e sem rota própria. O botão "Nova transação" da barra de ferramentas SHALL abrir um menu com exatamente duas opções, `Transação avulsa` e `Série parcelada ou recorrente`, mantendo o rótulo "Nova transação" (em telas estreitas, só o ícone, com o mesmo nome acessível) e sem acrescentar nenhum outro controle à barra. `Transação avulsa` SHALL abrir o formulário de criação de transação; `Série parcelada ou recorrente` SHALL abrir o formulário de série. O botão "Nova transação" do estado vazio SHALL continuar abrindo diretamente o formulário de criação de transação. O formulário SHALL ser o mesmo para criar e editar, mudando apenas título e texto do botão, e SHALL ser organizado em três seções com título e descrição: `Lançamento` (nome, valor, direção, data prevista), `Vínculos` (conta, cartão, subcategoria) e `Situação` (status, data de efetivação, observação). O valor SHALL usar o campo monetário compartilhado; as datas, seletor de data; a direção, opções exclusivas `Entrada`/`Saída`; status, conta, cartão e subcategoria, seleção com busca; a observação, área de texto. Ao criar, o formulário SHALL abrir com direção `Saída`, status `Pendente` e data prevista igual ao dia de hoje no fuso local. Clicar em uma linha da tabela ou em um card SHALL abrir o formulário conforme o tipo da entrada: para transação avulsa, o formulário de edição preenchido com aquela transação; para ocorrência de série, o formulário da ocorrência. A linha e o card SHALL ser alcançáveis por teclado e acionáveis com `Enter` e `Espaço`.

#### Scenario: Menu de criação
- **WHEN** o usuário clica em "Nova transação" na barra de ferramentas
- **THEN** um menu com as opções `Transação avulsa` e `Série parcelada ou recorrente` é exibido e nenhum formulário é aberto ainda

#### Scenario: Abrir criação
- **WHEN** o usuário clica em "Nova transação" e escolhe `Transação avulsa`
- **THEN** o formulário abre vazio com direção `Saída`, status `Pendente` e data prevista de hoje

#### Scenario: Menu pelo teclado
- **WHEN** o usuário foca "Nova transação" com `Tab`, pressiona `Enter` e escolhe uma opção com as setas e `Enter`
- **THEN** o formulário correspondente à opção é aberto

#### Scenario: Criação pelo estado vazio
- **WHEN** o mês não tem entradas, não há filtros ativos e o usuário clica em "Nova transação" no estado vazio
- **THEN** o formulário de criação de transação abre diretamente, sem menu

#### Scenario: Abrir edição
- **WHEN** o usuário clica em uma linha de transação avulsa do extrato
- **THEN** o formulário abre com todos os campos preenchidos com os dados dessa transação

#### Scenario: Abrir ocorrência de série
- **WHEN** o usuário clica em uma linha de ocorrência de série do extrato
- **THEN** o formulário da ocorrência é aberto para aquela série e índice

#### Scenario: Abrir edição pelo teclado
- **WHEN** o usuário navega com `Tab` até um card e pressiona `Enter`
- **THEN** o formulário correspondente ao tipo daquela entrada é aberto

#### Scenario: Cancelar
- **WHEN** o usuário cancela o formulário
- **THEN** a tela volta para o extrato sem salvar

---

### Requirement: Agrupamento configurável do extrato
O extrato SHALL agrupar as entradas do mês por data (padrão), conta, categoria ou subcategoria, escolhido na barra de ferramentas sem competir em peso visual com os filtros. O agrupamento SHALL ser só apresentação e SHALL NOT alterar a ordem vinda da API (data prevista decrescente e, em empate, transações avulsas antes de ocorrências gravadas e estas antes de ocorrências não gravadas). Por data, os grupos SHALL seguir a ordem recebida e ter o rótulo do dia em pt-BR (`12 de setembro · sábado`), sem deslocamento de fuso. Por conta, categoria ou subcategoria (`Categoria › Subcategoria`), os grupos SHALL ser ordenados alfabeticamente em pt-BR, mantendo a data decrescente dentro de cada grupo; entradas sem categoria ou subcategoria SHALL formar o grupo `Sem classificação`, sempre por último. Cada cabeçalho de grupo SHALL mostrar o rótulo e a quantidade de entradas do grupo e SHALL NOT mostrar soma em dinheiro. Transações avulsas e ocorrências SHALL ser agrupadas pela mesma regra.

#### Scenario: Agrupamento padrão por data
- **WHEN** o usuário abre o extrato sem preferência gravada e há três entradas em `2026-09-12`
- **THEN** a lista mostra o grupo `12 de setembro · sábado` com a contagem 3

#### Scenario: Agrupar por conta em ordem alfabética
- **WHEN** o usuário escolhe agrupar por conta e há entradas nas contas "Nubank" e "Itaú"
- **THEN** o grupo "Itaú" aparece antes do grupo "Nubank" e, dentro de cada um, as entradas seguem a data decrescente

#### Scenario: Sem classificação por último
- **WHEN** o agrupamento é por categoria e existe uma entrada sem subcategoria
- **THEN** ela aparece no grupo `Sem classificação`, depois de todos os grupos de categoria

#### Scenario: Ocorrência no mesmo grupo da avulsa
- **WHEN** o agrupamento é por data e em `2026-10-10` há uma transação avulsa e uma ocorrência de série
- **THEN** as duas aparecem no mesmo grupo `10 de outubro · sábado`, com a contagem 2

#### Scenario: Cabeçalho sem soma
- **WHEN** qualquer agrupamento é exibido
- **THEN** o cabeçalho de cada grupo mostra rótulo e quantidade, e nenhum total em reais

---

### Requirement: Efetivação em um clique
Cada linha e cada card SHALL ter, no início, um botão de efetivar em forma de check: preenchido para `Efetivada`, contornado para `Pendente`. Clicar em uma entrada `Pendente` SHALL salvá-la como `Efetivada` com data de efetivação igual à sua data prevista, preservando todos os demais campos. Clicar em uma entrada `Efetivada` SHALL salvá-la como `Pendente` sem data de efetivação. Para transação avulsa, o salvamento SHALL usar a atualização de transação já existente; para ocorrência de série, SHALL usar a gravação da ocorrência pela série e índice, enviando o `id` da entrada — o que grava a ocorrência quando ela ainda não estava gravada. Nenhum endpoint próprio de efetivação SHALL existir. Para entrada `Cancelada`, o botão SHALL ficar desabilitado com uma dica explicando que a situação muda pelo formulário. Enquanto o salvamento de uma entrada está em andamento, o botão dela SHALL ficar desabilitado. Clicar no botão SHALL NOT abrir o formulário. O botão SHALL ter rótulo acessível com o nome da entrada e anunciar como pressionado quando `Efetivada`. Em caso de sucesso sem filtro de situação ativo, a linha SHALL refletir a nova situação sem recarregar a lista inteira; com filtro de situação ativo, a lista SHALL ser recarregada para que a entrada que deixou de atender ao filtro saia. Em caso de falha, SHALL ser exibido toaster de erro com a mensagem traduzida e a linha SHALL permanecer como estava.

#### Scenario: Efetivar transação pendente
- **WHEN** o usuário clica no check de "Aluguel", transação avulsa pendente com `expectedOn: "2026-09-05"`
- **THEN** a transação é salva com `status: "SETTLED"` e `settledOn: "2026-09-05"`, mantendo nome, valor, direção, conta, cartão, subcategoria e observação, e o check aparece preenchido

#### Scenario: Efetivar ocorrência ainda não gravada
- **WHEN** o usuário clica no check da parcela 3 do "Notebook", ainda não gravada, com `expectedOn: "2027-01-10"`
- **THEN** a ocorrência é gravada pela série e índice com o `id` da entrada, `status: "SETTLED"` e `settledOn: "2027-01-10"`, mantendo os demais campos, e o check aparece preenchido

#### Scenario: Desfazer efetivação
- **WHEN** o usuário clica no check de uma entrada efetivada
- **THEN** a entrada é salva com `status: "PENDING"` e `settledOn: null`, e o check aparece contornado

#### Scenario: Transação cancelada
- **WHEN** o usuário passa o foco no check de uma entrada cancelada
- **THEN** o botão está desabilitado e uma dica informa que a situação é alterada pelo formulário

#### Scenario: Check não abre o formulário
- **WHEN** o usuário clica no check de uma linha
- **THEN** somente a efetivação é disparada e a tela continua no extrato

#### Scenario: Linha some com filtro de situação
- **WHEN** o filtro `Pendente` está ativo e o usuário efetiva uma entrada com sucesso
- **THEN** a lista é recarregada e a entrada deixa de aparecer

#### Scenario: Falha ao efetivar
- **WHEN** o usuário clica no check e a API responde com erro
- **THEN** um toaster de erro exibe a mensagem traduzida e a linha continua com a situação anterior

#### Scenario: Clique duplo durante o salvamento
- **WHEN** o usuário clica no check e clica de novo antes da resposta
- **THEN** somente uma gravação é enviada, porque o botão fica desabilitado enquanto aguarda
