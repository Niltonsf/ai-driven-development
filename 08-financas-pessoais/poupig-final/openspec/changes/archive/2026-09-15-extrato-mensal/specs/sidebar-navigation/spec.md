## REMOVED Requirements

### Requirement: Link de Transações no menu principal
**Reason**: O item "Transações" é substituído pelo "Extrato Mensal", que aponta para a mesma rota `/transactions` e passa a ser a forma de acessar as transações.
**Migration**: Usar o item "Extrato Mensal" do grupo principal; a URL `/transactions` não muda.

## ADDED Requirements

### Requirement: Grupo principal do menu com Dashboard e Extrato Mensal
O menu lateral da área privada SHALL abrir com um grupo principal **sem rótulo** contendo, nesta ordem, exatamente os itens "Dashboard" (`/dashboard`) e "Extrato Mensal" (`/transactions`, com ícone de recibo), cada um com destaque ativo para a própria rota e suas sub-rotas. Em seguida SHALL vir o grupo "Cadastros" com "Contas", "Cartões" e "Categorias", nesta ordem e sem alteração. O menu SHALL NOT conter os itens "Transações", "Autenticação" (`/auth`) nem o "Categorias" do grupo principal (`/category`). A remoção desses itens SHALL NOT remover as rotas `/auth` e `/category`, que continuam acessíveis pela URL.

#### Scenario: Estrutura do menu
- **WHEN** um usuário autenticado visualiza o menu lateral da área privada
- **THEN** o menu mostra, em sequência, "Dashboard" e "Extrato Mensal" sem rótulo de grupo, e depois o grupo "Cadastros" com "Contas", "Cartões" e "Categorias"

#### Scenario: Extrato Mensal navega para /transactions
- **WHEN** o usuário clica em "Extrato Mensal"
- **THEN** o usuário é levado para `/transactions` e o item fica destacado como ativo

#### Scenario: Atalhos de scaffold removidos
- **WHEN** um usuário autenticado visualiza o menu lateral
- **THEN** não há itens "Transações", "Autenticação" nem um segundo "Categorias" apontando para `/category`

#### Scenario: Rotas de scaffold continuam existindo
- **WHEN** o usuário autenticado acessa `/auth` ou `/category` digitando a URL
- **THEN** a página correspondente continua sendo exibida
