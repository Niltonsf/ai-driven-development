# auth-login-frontend Specification

## Purpose

Frontend login flow: API client integration, state management hook, and auth form integration with redirect on success.

## Requirements

### Requirement: Login API integration in auth data layer
The system SHALL provide an API call function and state management hook under `apps/frontend/src/modules/auth/data` that: sends a POST request to the login endpoint, stores the returned JWT token and user data on success, and exposes loading/error states to consumers. The component MUST NOT contain inline API logic.

#### Scenario: Successful login stores token and user
- **WHEN** the login hook is called with valid credentials and the endpoint responds successfully
- **THEN** the JWT token and user data are stored (e.g. localStorage or context) and the hook signals success

#### Scenario: Failed login exposes error state
- **WHEN** the endpoint returns a 401 error
- **THEN** the hook exposes an error state that the component can display

### Requirement: Auth form login flow with redirect
The `auth-form.component` SHALL integrate with the login data layer so that on successful login it displays a success toaster and redirects the application to `/dashboard`.

#### Scenario: Successful login shows toaster and redirects
- **WHEN** the user submits valid credentials in the login form
- **THEN** a success toaster is displayed and the application navigates to `/dashboard`

#### Scenario: Failed login shows error feedback
- **WHEN** the user submits invalid credentials
- **THEN** an error message is shown and no redirect occurs
