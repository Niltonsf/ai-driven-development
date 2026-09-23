# sidebar-navigation Specification

## Purpose
Define a navegação da área privada da aplicação: quais grupos e links o menu lateral apresenta ao usuário autenticado e para onde cada um leva.
## Requirements
### Requirement: Private area sidebar menu
The sidebar navigation of the private area SHALL include a "Cadastros" (registrations) group containing links to all registration modules. The group SHALL contain at minimum a link to `/accounts` (Contas), a link to `/cards` (Cartões) and a link to `/categories` (Categorias).

#### Scenario: Sidebar displays Cards link
- **WHEN** an authenticated user views the private area sidebar
- **THEN** a "Cartões" link pointing to `/cards` is visible within the "Cadastros" group

#### Scenario: Cards link navigates to cards page
- **WHEN** the user clicks the "Cartões" link in the sidebar
- **THEN** the user is navigated to the `/cards` page

#### Scenario: Sidebar displays Categories link
- **WHEN** an authenticated user views the private area sidebar
- **THEN** a "Categorias" link pointing to `/categories` is visible within the "Cadastros" group

#### Scenario: Categories link navigates to categories page
- **WHEN** the user clicks the "Categorias" link in the "Cadastros" group
- **THEN** the user is navigated to the `/categories` page

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

### Requirement: Seção Extras condicionada ao ambiente de desenvolvimento
Quando o frontend é construído com `NEXT_PUBLIC_DEV_TOOLS_ENABLED` igual a `true`, o menu lateral da área privada SHALL terminar com a seção "Extras" contendo exatamente o item "Desenvolvimento" (`/dev`, com ícone de código), com destaque ativo para a própria rota e suas sub-rotas. Com a variável ausente ou com qualquer outro valor, a seção SHALL NOT aparecer. A seção "Extras" SHALL ser sempre a última do menu: seções acrescentadas depois SHALL ser inseridas antes dela, preservando a condição de ambiente. A presença ou ausência da seção SHALL NOT alterar a ordem nem o conteúdo das demais seções, e nenhum item de desenvolvimento SHALL aparecer em outra seção. Esconder a seção SHALL NOT ser tratado como proteção: a rota `/dev` continua sujeita à disponibilidade informada pelo backend.

#### Scenario: Recurso ligado no frontend
- **WHEN** um usuário autenticado visualiza o menu lateral de um frontend construído com `NEXT_PUBLIC_DEV_TOOLS_ENABLED=true`
- **THEN** o menu mostra o grupo principal, depois "Cadastros", depois "Relatórios" e, por último, "Extras" com o item "Desenvolvimento"

#### Scenario: Recurso desligado no frontend
- **WHEN** um usuário autenticado visualiza o menu lateral de um frontend construído sem `NEXT_PUBLIC_DEV_TOOLS_ENABLED`
- **THEN** não há seção "Extras" nem item "Desenvolvimento", e as demais seções aparecem inalteradas, terminando em "Relatórios"

#### Scenario: Desenvolvimento navega para /dev
- **WHEN** o usuário clica em "Desenvolvimento"
- **THEN** o usuário é levado para `/dev` e o item fica destacado como ativo

#### Scenario: Nenhum item de desenvolvimento no grupo principal
- **WHEN** um usuário autenticado visualiza o menu lateral com o recurso ligado
- **THEN** o grupo principal contém apenas "Dashboard" e "Extrato Mensal"

### Requirement: Seção Relatórios no menu
O menu lateral da área privada SHALL exibir, logo depois do grupo "Cadastros", a seção "Relatórios" contendo, nesta ordem, os itens "Entradas x Saídas" (`/reports/cash-flow`, com ícone de gráfico de colunas) e "Gastos por Categoria" (`/reports/categories`, com ícone de gráfico de pizza), cada um com destaque ativo para a própria rota e suas sub-rotas. A seção SHALL aparecer independentemente do ambiente e SHALL ficar antes da seção "Extras" quando esta existir. Relatórios acrescentados depois SHALL entrar como itens dessa mesma seção.

#### Scenario: Seção Relatórios visível
- **WHEN** um usuário autenticado visualiza o menu lateral
- **THEN** depois do grupo "Cadastros" aparece a seção "Relatórios" com os itens "Entradas x Saídas" e "Gastos por Categoria", nessa ordem

#### Scenario: Entradas x Saídas navega para o relatório
- **WHEN** o usuário clica em "Entradas x Saídas"
- **THEN** o usuário é levado para `/reports/cash-flow` e o item fica destacado como ativo

#### Scenario: Gastos por Categoria navega para o relatório
- **WHEN** o usuário clica em "Gastos por Categoria"
- **THEN** o usuário é levado para `/reports/categories` e somente esse item fica destacado como ativo

