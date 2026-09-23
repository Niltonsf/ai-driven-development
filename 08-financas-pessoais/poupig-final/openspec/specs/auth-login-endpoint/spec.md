# auth-login-endpoint Specification

## Purpose

Public REST endpoint for user authentication that issues a JWT token on successful credential validation.

## Requirements

### Requirement: Login endpoint on auth controller
The `auth.controller` SHALL expose a public `POST /auth/login` endpoint that instantiates the `authenticate-user.usecase` directly inside the handler, passing the injected repositories and the bcrypt crypto provider. On success, the handler MUST generate and return a JWT token along with the authenticated user's data. On failure, the handler MUST map use-case errors to appropriate HTTP responses (user not found or invalid credentials → 401 Unauthorized).

#### Scenario: Successful login returns JWT
- **WHEN** a client POSTs a valid email and correct password to the login endpoint
- **THEN** the response contains a JWT token and the authenticated user's data (without password)

#### Scenario: Unknown email returns 401
- **WHEN** a client POSTs an email that does not exist
- **THEN** the response is HTTP 401 Unauthorized

#### Scenario: Wrong password returns 401
- **WHEN** a client POSTs a valid email with an incorrect password
- **THEN** the response is HTTP 401 Unauthorized

#### Scenario: Endpoint is public
- **WHEN** the login endpoint is called without authentication
- **THEN** the request is allowed (the route is marked public and not blocked by the JWT guard)

### Requirement: Rest Client integration tests for login
The system SHALL provide Rest Client (`.http`) test files for the login endpoint following the existing test file conventions in `apps/backend/src/http/`.

#### Scenario: Tests cover happy and error paths
- **WHEN** the Rest Client test files are executed against a running backend
- **THEN** the successful login, unknown email, and wrong password scenarios are all exercised
