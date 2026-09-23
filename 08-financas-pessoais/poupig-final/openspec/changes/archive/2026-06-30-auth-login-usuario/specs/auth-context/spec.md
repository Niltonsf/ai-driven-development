## ADDED Requirements

### Requirement: Auth context for global user state
The system SHALL provide an `auth.context` using React Context API at `apps/frontend/src/modules/auth/data` that holds the authenticated user's state (JWT token and user data). The context MUST expose a `useAuth` hook for consumption throughout the application. The context MUST initialize by reading the token from a cookie (non-HttpOnly, `path=/`, `SameSite=Lax`) so the authenticated state survives page reloads. The token MUST NOT be stored in `localStorage`.

#### Scenario: Authenticated state is globally accessible
- **WHEN** a component anywhere in the application calls `useAuth`
- **THEN** it receives the current JWT token and user data (or null if not authenticated)

#### Scenario: State persists across page reloads
- **WHEN** a user is authenticated and reloads the page
- **THEN** `useAuth` still returns the token and user data read from the cookie

#### Scenario: State clears on logout
- **WHEN** the user logs out (`clearAuth` is called)
- **THEN** the cookie is removed and `useAuth` returns null for both token and user data

### Requirement: Auth provider wraps the application
The `AuthProvider` component SHALL wrap the application (or the appropriate layout root) so that all routes have access to `useAuth`.

#### Scenario: Provider is wired at the root
- **WHEN** any page component calls `useAuth`
- **THEN** it resolves without a missing-provider error
