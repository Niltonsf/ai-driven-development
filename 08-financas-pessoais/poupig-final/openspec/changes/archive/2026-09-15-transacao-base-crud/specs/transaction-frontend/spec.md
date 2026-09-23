## Purpose

Oferecer ao usuário autenticado a tela `/transactions` para listar, filtrar, criar, editar e excluir transações, junto com o campo monetário compartilhado e as mensagens de erro traduzidas que o cadastro exige.

## ADDED Requirements

### Requirement: Rota /transactions substitui /transaction
A área privada SHALL servir a tela de transações em `/transactions`. A rota `/transaction` e o dashboard placeholder do módulo SHALL deixar de existir. A página SHALL NOT implementar proteção própria, dependendo da proteção já aplicada ao grupo de rotas privadas.

#### Scenario: Acesso à nova rota
- **WHEN** o usuário autenticado acessa `/transactions`
- **THEN** a tela de transações é exibida com o título, o botão "Nova transação", os filtros e a lista

#### Scenario: Rota antiga removida
- **WHEN** o usuário acessa `/transaction`
- **THEN** a tela de transações não é exibida nessa rota

---

### Requirement: Lista paginada de transações
A tela SHALL exibir as transações em tabela com as colunas: data prevista (`dd/MM/yyyy`), nome, conta, subcategoria acompanhada da categoria, valor e status, além das ações de editar e excluir. O valor SHALL ser formatado em reais no padrão pt-BR, com sinal e cor conforme a direção (entrada e saída distinguíveis). O status SHALL aparecer em badge com os rótulos `Pendente`, `Efetivada` e `Cancelada`. A data SHALL ser montada a partir da string `YYYY-MM-DD`, sem deslocamento pelo fuso do navegador. Sem transações, a tela SHALL exibir um estado de lista vazia. A tela SHALL oferecer controles de paginação.

#### Scenario: Data sem deslocamento de fuso
- **WHEN** uma transação com `expectedOn: "2026-09-01"` é exibida em um navegador com fuso UTC-3
- **THEN** a coluna de data mostra `01/09/2026`

#### Scenario: Valor de saída
- **WHEN** uma transação com `direction: "OUT"` e `value: 1234.56` é exibida
- **THEN** o valor aparece como `R$ 1.234,56` com o sinal e a cor de saída

#### Scenario: Status em português
- **WHEN** uma transação com `status: "SETTLED"` é exibida
- **THEN** o badge mostra `Efetivada` e nenhum código cru aparece

#### Scenario: Lista vazia
- **WHEN** o usuário não tem transações que atendam aos filtros
- **THEN** o estado de lista vazia é exibido no lugar da tabela

---

### Requirement: Filtros da listagem
A tela SHALL oferecer filtros de busca por nome, direção, status, conta e período (data prevista inicial e final). Filtro vazio SHALL significar sem filtro. Alterar qualquer filtro SHALL levar a listagem de volta para a página 1. Quando filtros ou página mudarem antes de uma resposta chegar, a tela SHALL exibir somente o resultado da requisição mais recente.

#### Scenario: Filtro volta para a página 1
- **WHEN** o usuário está na página 3 e altera o filtro de status
- **THEN** a listagem é recarregada na página 1 com o filtro aplicado

#### Scenario: Resposta obsoleta descartada
- **WHEN** o usuário troca o filtro de direção duas vezes seguidas e a primeira resposta chega depois da segunda
- **THEN** a lista exibe o resultado correspondente ao último filtro escolhido

---

### Requirement: Formulário único de criação e edição
A tela SHALL alternar entre lista e formulário na mesma página, sem modal e sem rota própria. O formulário SHALL ser o mesmo para criar e editar, mudando apenas título e texto do botão, e SHALL ser organizado em três seções com título e descrição: `Lançamento` (nome, valor, direção, data prevista), `Vínculos` (conta, cartão, subcategoria) e `Situação` (status, data de efetivação, observação). O valor SHALL usar o campo monetário compartilhado; as datas, seletor de data; a direção, opções exclusivas `Entrada`/`Saída`; status, conta, cartão e subcategoria, seleção com busca; a observação, área de texto. Ao criar, o formulário SHALL abrir com direção `Saída`, status `Pendente` e data prevista igual ao dia de hoje no fuso local. Ao editar, SHALL abrir preenchido com a transação escolhida na lista.

#### Scenario: Abrir criação
- **WHEN** o usuário clica em "Nova transação"
- **THEN** o formulário abre vazio com direção `Saída`, status `Pendente` e data prevista de hoje

#### Scenario: Abrir edição
- **WHEN** o usuário clica em editar em uma transação da lista
- **THEN** o formulário abre com todos os campos preenchidos com os dados dessa transação

#### Scenario: Cancelar
- **WHEN** o usuário cancela o formulário
- **THEN** a tela volta para a lista sem salvar

---

### Requirement: Validação do formulário alinhada ao domínio
O formulário SHALL validar com as mesmas regras do domínio: nome com os limites de `MovementName`, valor monetário positivo, data prevista válida, conta obrigatória (vazio bloqueia o envio), observação com os limites de `MovementNote` e cartão e subcategoria opcionais. Com status `Efetivada`, a data de efetivação SHALL ser obrigatória, com a mensagem de `TRANSACTION_SETTLED_ON_REQUIRED`. Com outro status, o campo de data de efetivação SHALL ficar desabilitado e limpo. Toda mensagem de erro SHALL ser exibida traduzida.

#### Scenario: Conta não escolhida
- **WHEN** o usuário tenta salvar sem escolher conta
- **THEN** o envio é bloqueado e uma mensagem traduzida é exibida no campo conta

#### Scenario: Efetivada sem data de efetivação
- **WHEN** o usuário escolhe status `Efetivada` e tenta salvar sem data de efetivação
- **THEN** o envio é bloqueado com a mensagem traduzida de `TRANSACTION_SETTLED_ON_REQUIRED`

#### Scenario: Troca de status limpa a data de efetivação
- **WHEN** o usuário preenche a data de efetivação com status `Efetivada` e muda o status para `Pendente`
- **THEN** o campo de data de efetivação fica desabilitado e vazio

#### Scenario: Valor zero
- **WHEN** o usuário informa valor `R$ 0,00` e tenta salvar
- **THEN** o envio é bloqueado com a mensagem traduzida de `INVALID_MONEY_AMOUNT`

---

### Requirement: Opções de conta, cartão e subcategoria vêm dos cadastros existentes
Os seletores de conta, cartão e subcategoria SHALL ser preenchidos com a primeira página (até 50 itens) de contas e de cartões e com as categorias do usuário, usando as APIs já existentes desses cadastros, sem endpoint novo. SHALL exibir apenas itens ativos. As subcategorias SHALL ser apresentadas com o rótulo `Categoria › Subcategoria`.

#### Scenario: Subcategoria com a categoria no rótulo
- **WHEN** o usuário abre o seletor de subcategoria e existe a subcategoria ativa "Mercado" na categoria ativa "Alimentação"
- **THEN** a opção aparece como `Alimentação › Mercado`

#### Scenario: Conta inativa fora das opções
- **WHEN** o usuário tem uma conta inativa
- **THEN** essa conta não aparece no seletor de conta

---

### Requirement: Salvar e excluir com feedback e recarga
Ao salvar com sucesso, a tela SHALL exibir toaster de sucesso, recarregar a lista e voltar para o modo lista. Ao excluir, a tela SHALL pedir confirmação deixando claro que a transação será excluída e, confirmada a exclusão, SHALL exibir toaster de sucesso e recarregar a lista. Falhas de salvar ou excluir SHALL exibir toaster de erro com a mensagem traduzida, inclusive para `TRANSACTION_ACCOUNT_NOT_FOUND`, `TRANSACTION_CREDIT_CARD_NOT_FOUND`, `TRANSACTION_SUBCATEGORY_NOT_FOUND` e `TRANSACTION_NOT_FOUND`.

#### Scenario: Criação bem-sucedida
- **WHEN** o usuário preenche o formulário com dados válidos e salva
- **THEN** um toaster de sucesso aparece, a tela volta à lista e a nova transação está listada

#### Scenario: Exclusão confirmada
- **WHEN** o usuário clica em excluir e confirma no diálogo
- **THEN** um toaster de sucesso aparece e a transação some da lista

#### Scenario: Exclusão cancelada
- **WHEN** o usuário clica em excluir e fecha o diálogo sem confirmar
- **THEN** nenhuma requisição de exclusão é enviada

#### Scenario: Erro de vínculo vindo da API
- **WHEN** a API responde `400` com `TRANSACTION_ACCOUNT_NOT_FOUND`
- **THEN** um toaster de erro exibe a mensagem traduzida e o código não aparece cru

---

### Requirement: Campo monetário e formatação de moeda compartilhados
A camada compartilhada de UI SHALL oferecer um campo monetário que trabalha em reais (valor numérico ou indefinido), exibe a máscara `R$ 1.234,56` e segue o estilo dos demais campos, e uma função `formatCurrency(value)` que formata números em reais no padrão pt-BR. Campo vazio SHALL produzir valor indefinido. Os componentes existentes de cartão e dashboard SHALL NOT ser alterados para usá-los.

#### Scenario: Digitação com máscara
- **WHEN** o usuário digita `123456` no campo monetário vazio
- **THEN** o campo exibe `R$ 1.234,56` e informa o valor numérico `1234.56`

#### Scenario: Campo limpo
- **WHEN** o usuário apaga todo o conteúdo do campo monetário
- **THEN** o valor informado é indefinido

#### Scenario: Formatação de moeda
- **WHEN** `formatCurrency(1234.56)` é chamado
- **THEN** o retorno é o valor em reais no padrão pt-BR, `R$ 1.234,56`

---

### Requirement: Dicionário de erros atualizado para movimento e transação
Os dicionários pt e en SHALL conter traduções para `INVALID_DIRECTION`, `INVALID_TRANSACTION_STATUS`, `MOVEMENT_NAME_TOO_SHORT`, `MOVEMENT_NAME_TOO_LONG`, `MOVEMENT_NOTE_TOO_SHORT`, `MOVEMENT_NOTE_TOO_LONG`, `TRANSACTION_SETTLED_ON_REQUIRED`, `INVALID_TRANSACTION_ACCOUNT_ID`, `INVALID_TRANSACTION_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SUBCATEGORY_ID`, `INVALID_TRANSACTION_EXPECTED_ON`, `INVALID_TRANSACTION_SETTLED_ON`, `TRANSACTION_ACCOUNT_NOT_FOUND`, `TRANSACTION_CREDIT_CARD_NOT_FOUND` e `TRANSACTION_SUBCATEGORY_NOT_FOUND`, mantendo as já existentes `TRANSACTION_NOT_FOUND`, `INVALID_MONEY_AMOUNT`, `INVALID_DATE_ONLY` e `REQUIRED_FIELD`. As chaves legadas `INVALID_FINANCIAL_DIRECTION`, `INVALID_FINANCIAL_RECORD_STATUS`, `TRANSACTION_NOTE_TOO_SHORT`, `TRANSACTION_NOTE_TOO_LONG`, `TRANSACTION_DESCRIPTION_TOO_SHORT` e `TRANSACTION_DESCRIPTION_TOO_LONG` SHALL ser removidas dos dois dicionários.

#### Scenario: Novos códigos traduzidos nos dois idiomas
- **WHEN** qualquer um dos novos códigos é traduzido em pt e em en
- **THEN** a mensagem correspondente ao idioma é devolvida, e não o código cru

#### Scenario: Chaves legadas removidas
- **WHEN** os dicionários pt e en são pesquisados pelas chaves legadas
- **THEN** nenhuma delas é encontrada
