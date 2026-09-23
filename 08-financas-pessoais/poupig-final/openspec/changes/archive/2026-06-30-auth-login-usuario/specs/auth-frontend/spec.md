## MODIFIED Requirements

### Requirement: Join route and dashboard redirect
The `/join` route SHALL render the `auth-form.component`, and on a correct login the application MUST redirect to `/dashboard`. Route protection via a guard component SHALL be introduced in this change to protect private routes.

#### Scenario: Join route shows the form
- **WHEN** the user navigates to `/join`
- **THEN** the `auth-form.component` is rendered

#### Scenario: Successful login redirects
- **WHEN** the user completes a correct login
- **THEN** the application redirects to `/dashboard`

#### Scenario: Private routes are protected by auth guard
- **WHEN** this change is implemented
- **THEN** an `auth-guard.component` is referenced in the private route group layout to protect all private routes

## ADDED Requirements

### Requirement: Auth context provider wired in application root
The application root (or appropriate layout) SHALL wrap its children with `AuthProvider` from `auth.context` so that `useAuth` is available in all routes.

#### Scenario: Provider wraps the application
- **WHEN** any page in the application calls `useAuth`
- **THEN** it resolves without a missing-provider error

### Requirement: User menu in private layout header
The private area header SHALL display the logged-in user's name and avatar (if available) using `useAuth`.

#### Scenario: Header shows user info
- **WHEN** an authenticated user views any private page
- **THEN** the header displays the user's name and avatar or a default placeholder
