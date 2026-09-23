## ADDED Requirements

### Requirement: Auth form component
The system SHALL provide an `auth-form.component` at `apps/frontend/src/modules/auth/components` that supports both the register and login flows. API calls and state management MUST live under `apps/frontend/src/modules/auth/data` (creating React hooks where appropriate), keeping the component focused on presentation.

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
The `/join` route SHALL render the `auth-form.component`, and on a correct login the application MUST redirect to `/dashboard`. No route protection (component guard) SHALL be added in this change.

#### Scenario: Join route shows the form
- **WHEN** the user navigates to `/join`
- **THEN** the `auth-form.component` is rendered in place of the previous placeholder

#### Scenario: Successful login redirects
- **WHEN** the user completes a correct login
- **THEN** the application redirects to `/dashboard`

#### Scenario: No guards added
- **WHEN** this change is implemented
- **THEN** no route-protection guard component is introduced (deferred to a future feature)
