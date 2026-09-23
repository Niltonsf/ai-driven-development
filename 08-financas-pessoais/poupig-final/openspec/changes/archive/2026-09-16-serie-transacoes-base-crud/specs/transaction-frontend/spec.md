## MODIFIED Requirements

### Requirement: Formulário único de criação e edição
A tela SHALL alternar entre o extrato e o formulário na mesma página, sem modal e sem rota própria. O botão "Nova transação" da barra de ferramentas SHALL abrir um menu com exatamente duas opções, `Transação avulsa` e `Série parcelada ou recorrente`, mantendo o rótulo "Nova transação" (em telas estreitas, só o ícone, com o mesmo nome acessível) e sem acrescentar nenhum outro controle à barra. `Transação avulsa` SHALL abrir o formulário de criação de transação; `Série parcelada ou recorrente` SHALL abrir o formulário de série. O botão "Nova transação" do estado vazio SHALL continuar abrindo diretamente o formulário de criação de transação. O formulário SHALL ser o mesmo para criar e editar, mudando apenas título e texto do botão, e SHALL ser organizado em três seções com título e descrição: `Lançamento` (nome, valor, direção, data prevista), `Vínculos` (conta, cartão, subcategoria) e `Situação` (status, data de efetivação, observação). O valor SHALL usar o campo monetário compartilhado; as datas, seletor de data; a direção, opções exclusivas `Entrada`/`Saída`; status, conta, cartão e subcategoria, seleção com busca; a observação, área de texto. Ao criar, o formulário SHALL abrir com direção `Saída`, status `Pendente` e data prevista igual ao dia de hoje no fuso local. Clicar em uma linha da tabela ou em um card SHALL abrir o formulário de edição preenchido com aquela transação; a linha e o card SHALL ser alcançáveis por teclado e acionáveis com `Enter` e `Espaço`.

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
- **WHEN** o mês não tem transações, não há filtros ativos e o usuário clica em "Nova transação" no estado vazio
- **THEN** o formulário de criação de transação abre diretamente, sem menu

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
- **WHEN** o usuário abre o formulário por "Nova transação" › `Transação avulsa`
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
