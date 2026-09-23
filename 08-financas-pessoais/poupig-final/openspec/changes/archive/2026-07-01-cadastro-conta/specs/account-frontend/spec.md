## ADDED Requirements

### Requirement: Página accounts.page.tsx lista contas do usuário autenticado
O sistema SHALL implementar `accounts.page.tsx` em `apps/frontend/src/modules/account/pages` na rota `/accounts`. A página MUST exibir: nome, tipo, instituição financeira, cor (indicador visual) e ícone da conta.

#### Scenario: Listagem de contas carrega e exibe dados
- **WHEN** usuário autenticado acessa /accounts
- **THEN** a lista de contas é buscada na API e exibida com nome, tipo, instituição, cor e ícone

#### Scenario: Sem contas cadastradas
- **WHEN** usuário autenticado acessa /accounts e não possui contas
- **THEN** a página exibe mensagem informando que não há contas cadastradas

---

### Requirement: account-list.component.tsx renderiza lista de contas como prop
O sistema SHALL implementar `account-list.component.tsx` em `apps/frontend/src/modules/account/components` que recebe a lista de `AccountDTO[]` como prop e renderiza os cards de conta.

#### Scenario: Componente renderiza lista com múltiplas contas
- **WHEN** `AccountListComponent` recebe um array de contas válidas
- **THEN** cada conta é exibida com seus campos visuais

---

### Requirement: account-form.component.tsx suporta criação e edição sem modal
O sistema SHALL implementar `account-form.component.tsx` em `apps/frontend/src/modules/account/components` usando `form-section-layout` como estrutura. O formulário MUST NÃO ser modal. O campo `type` MUST ser um select com os valores do `AccountType` traduzidos para português. O campo `color` MUST aceitar valor hexadecimal. O campo `isActive` MUST aparecer apenas no fluxo de edição. Validação MUST usar schema (padrão do projeto, skill: `frontend-form-schema`).

#### Scenario: Formulário de criação sem campo isActive
- **WHEN** o formulário é aberto para criação (sem id)
- **THEN** o campo `isActive` NÃO é exibido

#### Scenario: Formulário de edição com campo isActive
- **WHEN** o formulário é aberto para edição (com id existente)
- **THEN** o campo `isActive` é exibido com o valor atual da conta

#### Scenario: Submissão de formulário com name vazio
- **WHEN** o formulário é submetido com `name` vazio
- **THEN** erro de validação é exibido e o envio é bloqueado

#### Scenario: Campo type exibe opções traduzidas
- **WHEN** o select de tipo é aberto
- **THEN** as opções exibidas são: Corrente, Poupança, Dinheiro Físico, Investimento, Outro

---

### Requirement: Camada de dados account separada em account-api.client, account.schema e hooks
O sistema SHALL implementar em `apps/frontend/src/modules/account/data`:
- `account-api.client.ts` com funções para criar, listar, atualizar e deletar contas
- `account.schema.ts` com schema de validação do formulário
- Hooks do React necessários para consumir dados e disparar ações

#### Scenario: Hook de listagem retorna dados da API
- **WHEN** o hook de listagem de contas é chamado em um componente autenticado
- **THEN** a requisição GET /accounts é feita e o resultado populado no estado

---

### Requirement: Menu lateral possui link para /accounts dentro de seção de cadastros
O sistema SHALL atualizar o menu lateral da área privada para incluir o link `/accounts` dentro de uma nova seção ou label denominada "Cadastros".

#### Scenario: Menu exibe seção Cadastros com link Contas
- **WHEN** o usuário acessa qualquer página da área privada
- **THEN** o menu lateral exibe a seção "Cadastros" com o item "Contas" linkado para /accounts

---

### Requirement: Exclusão de conta exige confirmação via delete-confirmation-dialog
O sistema SHALL utilizar o componente `delete-confirmation-dialog` para solicitar confirmação explícita do usuário antes de executar a exclusão de uma conta. A ação de deletar na API MUST ser disparada somente após o usuário confirmar no dialog. Cancelar o dialog MUST NÃO disparar nenhuma requisição.

#### Scenario: Usuário confirma exclusão
- **WHEN** o usuário clica em excluir uma conta e confirma no `delete-confirmation-dialog`
- **THEN** a requisição DELETE /accounts/:id é enviada à API

#### Scenario: Usuário cancela exclusão
- **WHEN** o usuário clica em excluir uma conta mas cancela no `delete-confirmation-dialog`
- **THEN** nenhuma requisição é feita e a lista de contas permanece inalterada

#### Scenario: Dialog exibe o nome da conta a ser excluída
- **WHEN** o `delete-confirmation-dialog` é aberto para exclusão de uma conta
- **THEN** o nome da conta é exibido no dialog para que o usuário possa confirmar a ação correta

---

### Requirement: Toaster de sucesso exibido após operações de conta
O sistema SHALL exibir uma notificação toaster de sucesso após criar, editar ou excluir uma conta com êxito, e a lista de contas MUST ser atualizada automaticamente.

#### Scenario: Toaster após criação de conta
- **WHEN** o formulário de criação é submetido com sucesso
- **THEN** um toaster de sucesso é exibido e a listagem de contas é recarregada

#### Scenario: Toaster após exclusão de conta
- **WHEN** usuário confirma exclusão de uma conta
- **THEN** um toaster de sucesso é exibido e a conta é removida da listagem
