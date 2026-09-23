## MODIFIED Requirements

### Requirement: Seção Relatórios no menu
O menu lateral da área privada SHALL exibir, logo depois do grupo "Cadastros", a seção "Relatórios" contendo, nesta ordem, os itens "Entradas x Saídas" (`/reports/cash-flow`, com ícone de gráfico de colunas), "Gastos por Categoria" (`/reports/categories`, com ícone de gráfico de pizza) e "Recorrências" (`/reports/recurrences`, com ícone de repetição), cada um com destaque ativo para a própria rota e suas sub-rotas. A seção SHALL aparecer independentemente do ambiente e SHALL ficar antes da seção "Extras" quando esta existir. Relatórios acrescentados depois SHALL entrar como itens dessa mesma seção.

#### Scenario: Seção Relatórios visível
- **WHEN** um usuário autenticado visualiza o menu lateral
- **THEN** depois do grupo "Cadastros" aparece a seção "Relatórios" com os itens "Entradas x Saídas", "Gastos por Categoria" e "Recorrências", nessa ordem

#### Scenario: Entradas x Saídas navega para o relatório
- **WHEN** o usuário clica em "Entradas x Saídas"
- **THEN** o usuário é levado para `/reports/cash-flow` e o item fica destacado como ativo

#### Scenario: Gastos por Categoria navega para o relatório
- **WHEN** o usuário clica em "Gastos por Categoria"
- **THEN** o usuário é levado para `/reports/categories` e somente esse item fica destacado como ativo

#### Scenario: Recorrências navega para o relatório
- **WHEN** o usuário clica em "Recorrências"
- **THEN** o usuário é levado para `/reports/recurrences` e somente esse item fica destacado como ativo
