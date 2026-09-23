# auth-domain Specification

## Purpose

User and Password aggregates (entities with value-object validation, repository interfaces, and a password-crypto provider interface) plus the `create-user` use case that orchestrates them transactionally, all framework-agnostic and built on `@poupig/shared` primitives.

## Requirements

### Requirement: User aggregate
The system SHALL provide a `user` aggregate under `modules/auth/src/user/model` with a `User` entity exposing the attributes `id`, `name`, `email`, and an optional `avatarUrl`. The `id`, `name`, and `email` MUST be validated through `@poupig/shared` value objects (`Id`, `PersonName`, `Email`); `avatarUrl` is optional and, when provided, MUST be validated through `Url` (it MAY be `null`/absent). Construction MUST return a `Result<User>` so that invalid input fails without throwing. The aggregate MUST be created without any use case inside it.

#### Scenario: Valid user is created
- **WHEN** `User` is built with a valid id, name, and email (with or without an `avatarUrl`)
- **THEN** a `Result.ok` wrapping the `User` is returned with all value objects populated

#### Scenario: Invalid attribute fails construction
- **WHEN** `User` is built with an invalid email (or name, or a malformed `avatarUrl`)
- **THEN** a `Result.fail` is returned carrying the value-object validation error messages and no entity instance

### Requirement: User repository contract
The system SHALL define a `user.repository` interface in the `user` aggregate that persists the `User` entity and supports lookup by email. It MUST reuse the shared persistence contracts (e.g. `CrudRepository`/`CreateRepository`) and add an email-lookup method following the project's `findByX` naming convention. All operations MUST accept an optional transaction context and return `Result`-based outcomes.

#### Scenario: Persist a user
- **WHEN** `create` is called with a `User` (optionally within a transaction context)
- **THEN** the entity is persisted and a successful `Result` is returned

#### Scenario: Look up by email
- **WHEN** `findByEmail` is called with an existing user's email
- **THEN** the corresponding `User` is returned; when no user matches, an empty/absent result is returned

### Requirement: Password aggregate
The system SHALL provide a `password` aggregate under `modules/auth/src/password/model` with a `Password` entity exposing the attributes `id` and `value`. The `value` MUST be validated as a strong password through the appropriate `@poupig/shared` value object (`StrongPassword`), and construction MUST return a `Result<Password>`. The aggregate MUST be created without any use case inside it. The entity MAY expose a means to derive a persistable form carrying the encrypted (bcrypt) value (validated via `EncryptedPassword`).

#### Scenario: Valid password is created
- **WHEN** `Password` is built with a valid id and a strong password value
- **THEN** a `Result.ok` wrapping the `Password` is returned

#### Scenario: Weak password fails construction
- **WHEN** `Password` is built with a value that does not meet strong-password rules
- **THEN** a `Result.fail` is returned with the strong-password validation messages

### Requirement: Password repository contract
The system SHALL define a `password.repository` interface in the `password` aggregate that persists the `Password` entity, reusing the shared persistence contracts and accepting an optional transaction context, returning `Result`-based outcomes.

#### Scenario: Persist a password
- **WHEN** `create` is called with a `Password` within a transaction context
- **THEN** the password is persisted and a successful `Result` is returned

### Requirement: Password crypto provider contract
The system SHALL define a `password-crypto.provider` interface in the `password` aggregate exposing operations to encrypt a plaintext password and to compare a plaintext password against an encrypted value.

#### Scenario: Encrypt a password
- **WHEN** `encrypt` is called with a plaintext password
- **THEN** an encrypted (hashed) representation is returned

#### Scenario: Compare a password
- **WHEN** `compare` is called with a plaintext password and a matching encrypted value
- **THEN** it resolves to true; when they do not match it resolves to false

### Requirement: Create user use case
The system SHALL provide a `create-user` use case under `modules/auth/src/app/use-case` (module-root `app` folder, since it works across both the `user` and `password` aggregates). It MUST receive the `user` and `password` repositories, the `password-crypto.provider`, and the `TransactionManager` by parameter (constructor injection) and implement the shared `UseCase` contract. The flow MUST, in order: verify the email does not already exist (failing if it does), validate the name, validate the email, validate the strong password, build the `User` entity, build the `Password` entity (sharing the user's id so the persisted relation is a shared-primary-key 1:1), encrypt the password, and persist both entities within a single transaction. Any step MAY produce an error that stops the process and is returned as a `Result.fail`.

#### Scenario: Successful registration
- **WHEN** `execute` is called with a non-existing email, a valid name, a valid email, and a strong password
- **THEN** the password is encrypted, both entities are created and persisted within one transaction, and a successful `Result` is returned

#### Scenario: Email already exists
- **WHEN** `execute` is called with an email that already belongs to a user
- **THEN** the process stops before any write and a `Result.fail` is returned indicating the email is already in use

#### Scenario: Invalid input stops the flow
- **WHEN** any validation step (name, email, or strong password) fails
- **THEN** the use case returns a `Result.fail` with the validation messages and no entity is persisted

#### Scenario: Persistence is transactional
- **WHEN** persisting the user or the password fails
- **THEN** the transaction is rolled back so neither entity is persisted and a `Result.fail` is returned
