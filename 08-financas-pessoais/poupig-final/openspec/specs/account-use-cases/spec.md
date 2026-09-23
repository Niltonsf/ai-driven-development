## ADDED Requirements

### Requirement: save-account.use-case suporta criação e edição da conta
O sistema SHALL implementar `SaveAccountUseCase` em `modules/account/src/account/use-case/save-account.use-case.ts`. O caso de uso recebe `id`, `userId`, `name`, `type` e demais campos opcionais. Sempre recebe `id`. Determina criação ou edição pela presença da conta no repositório.

#### Scenario: Criação de nova conta com nome único para o usuário
- **WHEN** `SaveAccountUseCase.execute` é chamado com um `id` inexistente no repositório e o `userId` não possui outra conta com o mesmo `name`
- **THEN** uma nova conta é criada com `isActive = true` e persistida no repositório

#### Scenario: Criação com nome duplicado para o mesmo usuário
- **WHEN** `SaveAccountUseCase.execute` é chamado com um `id` inexistente mas o `userId` já possui conta com o mesmo `name`
- **THEN** o caso de uso retorna erro indicando nome de conta já existe para o usuário

#### Scenario: Edição de conta existente pelo dono
- **WHEN** `SaveAccountUseCase.execute` é chamado com `id` de uma conta existente e o `userId` corresponde ao dono da conta
- **THEN** os campos alteráveis são atualizados e a conta é persistida

#### Scenario: Edição de conta de outro usuário
- **WHEN** `SaveAccountUseCase.execute` é chamado com `id` de uma conta cujo `userId` difere do `userId` fornecido
- **THEN** o caso de uso retorna erro de autorização

---

### Requirement: delete-account.use-case realiza soft delete da conta
O sistema SHALL implementar `DeleteAccountUseCase` em `modules/account/src/account/use-case/delete-account.use-case.ts`. O caso de uso busca a conta por id, valida autoria e realiza soft delete.

#### Scenario: Exclusão lógica de conta existente pelo dono
- **WHEN** `DeleteAccountUseCase.execute` é chamado com `id` de conta existente e `userId` correspondente ao dono
- **THEN** o campo de soft delete da entidade é preenchido e a conta é persistida como inativa

#### Scenario: Tentativa de exclusão de conta inexistente
- **WHEN** `DeleteAccountUseCase.execute` é chamado com `id` que não existe no repositório
- **THEN** o caso de uso retorna erro indicando conta não encontrada

#### Scenario: Tentativa de exclusão de conta de outro usuário
- **WHEN** `DeleteAccountUseCase.execute` é chamado com `id` de conta existente mas `userId` diferente do dono
- **THEN** o caso de uso retorna erro de autorização
