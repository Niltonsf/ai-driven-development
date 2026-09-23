# auth-guard Specification

## Purpose

Client-side route guard component that protects private routes by redirecting unauthenticated users to the login page.

## Requirements

### Requirement: Auth guard component for private routes
The system SHALL provide an `auth-guard.component` at `apps/frontend/src/modules/auth/components` that checks whether a user is authenticated via `useAuth`. If no authenticated user exists, the guard MUST redirect to `/join`. The guard MUST be referenced in the layout of the private route group so all private routes are protected.

#### Scenario: Authenticated user passes through
- **WHEN** an authenticated user navigates to any private route
- **THEN** the route content renders normally

#### Scenario: Unauthenticated user is redirected
- **WHEN** an unauthenticated user attempts to access any private route
- **THEN** the application redirects to `/join`

#### Scenario: Guard is wired in private layout
- **WHEN** the private route group layout renders
- **THEN** the `auth-guard.component` is invoked before rendering child routes
