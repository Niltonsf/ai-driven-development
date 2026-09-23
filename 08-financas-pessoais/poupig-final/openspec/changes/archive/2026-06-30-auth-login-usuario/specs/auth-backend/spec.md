## MODIFIED Requirements

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
