# auth-frontend Specification

## Purpose

The `auth-form` component (register + login), its `data/` API/state layer, field validations, success toaster, `/join` wiring, dashboard redirect on login, auth context, route guard, and user menu in the private header.

## Requirements

### Requirement: Auth form component
The system SHALL provide an `auth-form.component` at `apps/frontend/src/modules/auth/components` that supports both the register and login flows. API calls and state management MUST live under `apps/frontend/src/modules/auth/data` (creating React hooks where appropriate), keeping the component focused on presentation. Field validation MUST use the shared `v` validator with the value objects (`PersonName`, `Email`, `StrongPassword`).

#### Scenario: Component supports both flows
- **WHEN** the auth form is rendered
- **THEN** the user can switch between register and login modes, each presenting the appropriate fields

#### Scenario: API and state are separated
- **WHEN** the form submits
- **THEN** it delegates the request and state handling to the `data/` layer (hooks/clients), not inline in the component

### Requirement: Form validation and success feedback
The auth form SHALL apply all necessary validations to its fields, and on a successful operation it MUST display a success toaster.

#### Scenario: Invalid input blocks submission
- **WHEN** the user submits with invalid data (e.g. malformed email or weak password)
- **THEN** validation errors are shown and the request is not sent

#### Scenario: Success shows a toaster
- **WHEN** an operation completes successfully
- **THEN** a success toaster is displayed to the user

### Requirement: Join route and dashboard redirect
The `/join` route SHALL render the `auth-form.component`, and on a correct login the application MUST redirect to `/dashboard`. Route protection via a guard component SHALL be in place to protect private routes.

#### Scenario: Join route shows the form
- **WHEN** the user navigates to `/join`
- **THEN** the `auth-form.component` is rendered

#### Scenario: Successful login redirects
- **WHEN** the user completes a correct login
- **THEN** the application redirects to `/dashboard`

#### Scenario: Private routes are protected by auth guard
- **WHEN** this change is implemented
- **THEN** an `auth-guard.component` is referenced in the private route group layout to protect all private routes

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
