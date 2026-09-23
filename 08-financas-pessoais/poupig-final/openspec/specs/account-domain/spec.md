## ADDED Requirements

### Requirement: Agregado Account existe no módulo compartilhado
O sistema SHALL expor um agregado `account` no pacote `modules/account`, criado via `module-aggregate`, sem casos de uso iniciais.

#### Scenario: Módulo account está disponível para importação
- **WHEN** outro módulo importa de `modules/account`
- **THEN** o pacote resolve sem erros e exporta o agregado `Account`

---

### Requirement: Entidade Account possui os atributos obrigatórios e opcionais definidos
A entidade `Account` SHALL conter os campos: `id` (obrigatório), `userId` (obrigatório), `name` (obrigatório), `description` (opcional), `type` (obrigatório, enum `AccountType`), `accountNumber` (opcional), `agency` (opcional), `financialInstitution` (opcional), `color` (opcional, hex), `icon` (opcional), `isActive` (obrigatório, padrão `true`).

#### Scenario: Criação de conta com campos obrigatórios
- **WHEN** `Account.create` é chamado com `id`, `userId`, `name` e `type` válidos
- **THEN** a entidade é criada com `isActive = true` e campos opcionais como `undefined`

#### Scenario: Criação de conta com name vazio
- **WHEN** `Account.create` é chamado com `name` vazio ou em branco
- **THEN** um erro de domínio é retornado indicando que o nome é obrigatório

#### Scenario: Criação de conta com color em formato inválido
- **WHEN** `Account.create` é chamado com `color` que não segue o padrão hexadecimal (#RRGGBB)
- **THEN** um erro de domínio é retornado indicando formato de cor inválido

#### Scenario: Criação de conta com color válido
- **WHEN** `Account.create` é chamado com `color: "#FF5733"`
- **THEN** a entidade é criada com `color` armazenado como informado

---

### Requirement: Enum AccountType define os tipos de conta aceitos
O sistema SHALL definir o enum `AccountType` com os valores: `CHECKING`, `SAVINGS`, `CASH`, `INVESTMENT`, `OTHER`.

#### Scenario: Tipo de conta válido é aceito
- **WHEN** `Account.create` é chamado com `type: AccountType.SAVINGS`
- **THEN** a entidade é criada com o tipo correto

#### Scenario: Tipo de conta inválido é rejeitado
- **WHEN** `Account.create` é chamado com um valor de `type` fora do enum
- **THEN** um erro de domínio é retornado

---

### Requirement: Interface AccountRepository define operações de persistência
O sistema SHALL definir a interface `AccountRepository` com os métodos: `save(account: Account): Promise<Result<void>>`, `findById(id: string): Promise<Result<Account | null>>`, `delete(id: string): Promise<Result<void>>`.

#### Scenario: Interface exportada do módulo
- **WHEN** o módulo `modules/account` é importado
- **THEN** `AccountRepository` está disponível como tipo TypeScript

---

### Requirement: AccountDTO expõe os dados da conta para consumidores
O sistema SHALL definir `AccountDTO` em `modules/account/src/account/dto/account.dto.ts` representando os dados da conta serializados, herdando ou baseando-se em `AccountProps`.

#### Scenario: DTO contém todos os campos da entidade
- **WHEN** uma conta é mapeada para `AccountDTO`
- **THEN** todos os campos definidos na entidade estão presentes no DTO

---

### Requirement: FindAccountsByUserIdQuery define contrato de consulta por usuário
O sistema SHALL definir a interface `FindAccountsByUserIdQuery` em `modules/account/src/account/provider/find-accounts-by-user-id.query.ts` com o método `execute(userId: string): Promise<Result<AccountDTO[]>>`.

#### Scenario: Interface de query exportada do módulo
- **WHEN** o módulo `modules/account` é importado
- **THEN** `FindAccountsByUserIdQuery` está disponível como tipo TypeScript
