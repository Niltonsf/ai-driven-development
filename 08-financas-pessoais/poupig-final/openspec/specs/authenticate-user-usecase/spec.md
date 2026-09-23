# authenticate-user-usecase Specification

## Purpose

Domain use case that authenticates a user by validating email and password credentials, returning user data without exposing the password.

## Requirements

### Requirement: Authenticate user use case
The system SHALL provide an `authenticate-user.usecase` at `modules/auth/src/app/usecase` that receives as parameters the `user` repository, the `password` repository, and the `password-crypto` interface. The use case MUST: (1) find the user by email — failing with a not-found error if absent; (2) find the password by the user's id; (3) compare the provided plaintext password with the stored encrypted password — failing with an invalid-credentials error if the comparison fails; (4) return the authenticated user's data. The use case MUST NEVER return the password in its output.

#### Scenario: Successful authentication
- **WHEN** the use case is called with a valid email and correct password
- **THEN** it returns the user's data (id, name, email, avatarUrl) without any password field

#### Scenario: User not found
- **WHEN** the use case is called with an email that does not exist in the repository
- **THEN** it returns a failure (not-found error) and stops processing

#### Scenario: Invalid password
- **WHEN** the use case is called with a valid email but an incorrect password
- **THEN** it returns a failure (invalid-credentials error) and stops processing

#### Scenario: Password never exposed
- **WHEN** the use case completes successfully
- **THEN** the returned output contains no password hash or plaintext
