## ADDED Requirements

### Requirement: User menu in private area header
The application header in the private area SHALL display the logged-in user's name and avatar (if available) by consuming `useAuth`. No profile screen SHALL be created. The user menu MUST only display information — no navigation to a profile page.

#### Scenario: Logged-in user info is displayed
- **WHEN** an authenticated user views any private page
- **THEN** the header shows the user's name and avatar (or a default avatar placeholder if none is set)

#### Scenario: No profile page is linked
- **WHEN** the user interacts with the user menu
- **THEN** no navigation to a profile screen occurs (display only)

#### Scenario: Unauthenticated state does not render user info
- **WHEN** `useAuth` returns null (should not happen in private routes due to guard, but defensive)
- **THEN** the user menu area is empty or hidden
