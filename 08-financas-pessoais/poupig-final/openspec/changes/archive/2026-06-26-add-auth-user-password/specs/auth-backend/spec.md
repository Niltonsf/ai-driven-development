## ADDED Requirements

### Requirement: Prisma data model for user and password
The system SHALL map the `user` and `password` entities in Prisma within `apps/backend/prisma/models/auth.model.prisma`. The `password` model MUST have a relation to `user`. The migrations MUST be generated and applied so the corresponding tables exist in the database.

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
- **THEN** the user is written to and read from the database, mapping correctly to/from the `UserEntity`

#### Scenario: Password prisma repository persists within a transaction
- **WHEN** the password prisma repository `create` is invoked with a transaction context
- **THEN** the password row is written using the same transaction client as the user write

### Requirement: Bcrypt password crypto provider
The system SHALL implement the `password-crypto.provider` contract using bcrypt in `apps/backend/src/modules/auth`, encrypting plaintext passwords into bcrypt hashes and comparing plaintext against stored hashes.

#### Scenario: Encrypt produces a bcrypt hash
- **WHEN** `encrypt` is called with a plaintext password
- **THEN** a valid bcrypt hash is returned

#### Scenario: Compare verifies a password
- **WHEN** `compare` is called with the original plaintext and its bcrypt hash
- **THEN** it returns true; with a wrong plaintext it returns false

### Requirement: Register endpoint on auth controller
The `auth.controller` SHALL receive the concrete `*.prisma` repository implementations directly (no interface indirection) and expose a public endpoint to register a user. The handler MUST instantiate `create-user.usecase` directly inside the method, passing the injected repositories and the bcrypt crypto provider, execute it, and map failures to the appropriate HTTP error.

#### Scenario: Successful registration over HTTP
- **WHEN** a client POSTs valid name, email, and password to the register endpoint
- **THEN** the user and password are created and the response indicates success

#### Scenario: Duplicate email over HTTP
- **WHEN** a client POSTs an email that already exists
- **THEN** the response is an HTTP error indicating the email is already in use and nothing is persisted

#### Scenario: Endpoint is public
- **WHEN** the register endpoint is called without authentication
- **THEN** the request is allowed (the route is marked public and not blocked by the JWT guard)

### Requirement: Database seed
The system SHALL provide a seed at `apps/backend/prisma/seed/data/users.json` containing 80 users with their passwords, where every password is `#Senha123` and the first user's email is `usuario@formacao.dev`. The seed runner MUST insert these users and passwords (hashing the password) when executed, producing a populated database.

#### Scenario: Seed populates 80 users
- **WHEN** the seed is executed against an empty database
- **THEN** 80 users exist, the first having email `usuario@formacao.dev`, each with an associated encrypted password

### Requirement: Register integration tests
The system SHALL provide integration tests for the register endpoint using the Rest Client (VS Code plugin) `.http` pattern, covering at least a successful registration and a duplicate-email failure.

#### Scenario: Rest Client request registers a user
- **WHEN** the success request in the `.http` file is sent
- **THEN** the endpoint returns a successful registration response

#### Scenario: Rest Client request rejects duplicate email
- **WHEN** a second request reuses an already-registered email
- **THEN** the endpoint returns the duplicate-email error response
