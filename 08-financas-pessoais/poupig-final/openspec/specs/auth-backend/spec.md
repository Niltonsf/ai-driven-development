# auth-backend Specification

## Purpose

Prisma persistence for User and Password (with a shared-primary-key 1:1 relation), repository and bcrypt crypto implementations, the public register endpoint on `auth.controller`, a database seed (80 users), and Rest Client integration tests.

## Requirements

### Requirement: Prisma data model for user and password
The system SHALL map the `user` and `password` entities in Prisma within `apps/backend/prisma/models/auth.model.prisma`. The `password` model MUST have a relation to `user` (a shared-primary-key 1:1, where `password.id` is both the primary key and the foreign key to `user.id`). The `user` email MUST be unique and the `avatarUrl` column is nullable. The migrations MUST be generated and applied so the corresponding tables exist in the database.

#### Scenario: Migrations create the tables
- **WHEN** the Prisma migrations are executed
- **THEN** `user` and `password` tables are created with the password→user relation and the unique constraint on user email

#### Scenario: Generated client reflects the models
- **WHEN** the Prisma client is generated
- **THEN** the client exposes typed `user` and `password` models usable by the repository adapters

### Requirement: Prisma repository implementations
The system SHALL implement the `user` repository in `apps/backend/src/modules/auth/user.prisma` and the `password` repository in `apps/backend/src/modules/auth/password.prisma`, each fulfilling its domain contract, mapping between Prisma rows and domain entities, and honoring the provided transaction context.

#### Scenario: User prisma repository persists and queries
- **WHEN** the user prisma repository `create` and `findByEmail` methods are invoked
- **THEN** the user is written to and read from the database, mapping correctly to/from the `User` entity

#### Scenario: Password prisma repository persists within a transaction
- **WHEN** the password prisma repository `create` is invoked with a transaction context
- **THEN** the password row is written using the same transaction client as the user write

### Requirement: Bcrypt password crypto provider
The system SHALL implement the `password-crypto.provider` contract using bcrypt in `apps/backend/src/modules/auth`, encrypting plaintext passwords into bcrypt hashes and comparing plaintext against stored hashes. The produced hash MUST be compatible with the shared `EncryptedPassword` bcrypt format.

#### Scenario: Encrypt produces a bcrypt hash
- **WHEN** `encrypt` is called with a plaintext password
- **THEN** a valid bcrypt hash is returned

#### Scenario: Compare verifies a password
- **WHEN** `compare` is called with the original plaintext and its bcrypt hash
- **THEN** it returns true; with a wrong plaintext it returns false

### Requirement: Register endpoint on auth controller
The `auth.controller` SHALL receive the concrete `*.prisma` repository implementations directly (no interface indirection) and expose public endpoints to register and authenticate a user. The register handler MUST instantiate the `create-user` use case directly inside the method, passing the injected repositories, the bcrypt crypto provider, and the transaction manager, execute it, and map failures to the appropriate HTTP error (duplicate email → 409 Conflict; validation failures → 400 Bad Request). The login handler MUST instantiate the `authenticate-user` use case directly inside the method, passing the injected repositories and the bcrypt crypto provider, execute it, generate and return a JWT token on success, and map failures to 401 Unauthorized.

#### Scenario: Successful registration over HTTP
- **WHEN** a client POSTs valid name, email, and password to the register endpoint
- **THEN** the user and password are created and the response indicates success

#### Scenario: Duplicate email over HTTP
- **WHEN** a client POSTs an email that already exists
- **THEN** the response is an HTTP error indicating the email is already in use and nothing is persisted

#### Scenario: Register endpoint is public
- **WHEN** the register endpoint is called without authentication
- **THEN** the request is allowed (the route is marked public and not blocked by the JWT guard)

#### Scenario: Successful login returns JWT
- **WHEN** a client POSTs a valid email and correct password to the login endpoint
- **THEN** the response contains a JWT token and the authenticated user's data (without password)

#### Scenario: Login with unknown email returns 401
- **WHEN** a client POSTs an email that does not exist to the login endpoint
- **THEN** the response is HTTP 401 Unauthorized

#### Scenario: Login with wrong password returns 401
- **WHEN** a client POSTs a valid email with an incorrect password to the login endpoint
- **THEN** the response is HTTP 401 Unauthorized

#### Scenario: Login endpoint is public
- **WHEN** the login endpoint is called without authentication
- **THEN** the request is allowed (the route is marked public and not blocked by the JWT guard)

### Requirement: Database seed
The system SHALL provide a seed at `apps/backend/prisma/seed/data/users.json` containing 80 users with their passwords, where every password is `#Senha123` and the first user's email is `usuario@formacao.dev`. The seed runner MUST insert these users and passwords (hashing the password) when executed, producing a populated database, and MUST be idempotent by email so re-running does not violate the unique constraint.

#### Scenario: Seed populates 80 users
- **WHEN** the seed is executed against an empty database
- **THEN** 80 users exist, the first having email `usuario@formacao.dev`, each with an associated encrypted password

#### Scenario: Seed is idempotent
- **WHEN** the seed is executed again
- **THEN** it does not crash and the user count remains 80

### Requirement: Register integration tests
The system SHALL provide integration tests for the register endpoint using the Rest Client (VS Code plugin) `.http` pattern, covering at least a successful registration and a duplicate-email failure.

#### Scenario: Rest Client request registers a user
- **WHEN** the success request in the `.http` file is sent
- **THEN** the endpoint returns a successful registration response

#### Scenario: Rest Client request rejects duplicate email
- **WHEN** a second request reuses an already-registered email
- **THEN** the endpoint returns the duplicate-email error response

### Requirement: Login integration tests
The system SHALL provide integration tests for the login endpoint using the Rest Client (VS Code plugin) `.http` pattern, covering a successful login, an unknown-email failure (401), and a wrong-password failure (401).

#### Scenario: Rest Client request authenticates a user
- **WHEN** the success request in the `.http` file is sent with valid credentials
- **THEN** the endpoint returns a JWT token and the authenticated user's data

#### Scenario: Rest Client request rejects unknown email
- **WHEN** a request is sent with an email that does not exist
- **THEN** the endpoint returns 401 Unauthorized

#### Scenario: Rest Client request rejects wrong password
- **WHEN** a request is sent with a valid email but incorrect password
- **THEN** the endpoint returns 401 Unauthorized
