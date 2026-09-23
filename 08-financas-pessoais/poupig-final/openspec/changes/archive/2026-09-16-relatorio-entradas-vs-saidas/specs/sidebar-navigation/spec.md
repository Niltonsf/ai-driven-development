## ADDED Requirements

### Requirement: Seção Relatórios no menu
O menu lateral da área privada SHALL exibir, logo depois do grupo "Cadastros", a seção "Relatórios" contendo o item "Entradas x Saídas" (`/reports/cash-flow`, com ícone de gráfico de colunas), com destaque ativo para a própria rota e suas sub-rotas. A seção SHALL aparecer independentemente do ambiente e SHALL ficar antes da seção "Extras" quando esta existir. Relatórios acrescentados depois SHALL entrar como itens dessa mesma seção.

#### Scenario: Seção Relatórios visível
- **WHEN** um usuário autenticado visualiza o menu lateral
- **THEN** depois do grupo "Cadastros" aparece a seção "Relatórios" com o item "Entradas x Saídas"

#### Scenario: Entradas x Saídas navega para o relatório
- **WHEN** o usuário clica em "Entradas x Saídas"
- **THEN** o usuário é levado para `/reports/cash-flow` e o item fica destacado como ativo

## MODIFIED Requirements

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
