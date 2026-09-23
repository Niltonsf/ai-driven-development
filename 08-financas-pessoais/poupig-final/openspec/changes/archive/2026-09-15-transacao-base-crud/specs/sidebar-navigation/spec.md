## ADDED Requirements

### Requirement: Link de Transações no menu principal
O menu lateral da área privada SHALL conter, no grupo principal, um único item "Transações" apontando para `/transactions`, com o ícone de setas opostas já usado hoje e destaque ativo para `/transactions` e suas sub-rotas. O menu SHALL NOT conter link para `/transaction` nem um segundo item de transações.

#### Scenario: Menu exibe o link de Transações
- **WHEN** um usuário autenticado visualiza o menu lateral da área privada
- **THEN** o item "Transações" apontando para `/transactions` está visível no grupo principal

#### Scenario: Link navega para a tela de transações
- **WHEN** o usuário clica no item "Transações"
- **THEN** o usuário é levado para `/transactions` e o item fica destacado como ativo
