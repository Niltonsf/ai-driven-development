## MODIFIED Requirements

### Requirement: Private area sidebar menu
The sidebar navigation of the private area SHALL include a "Cadastros" (registrations) group containing links to all registration modules. The group SHALL contain at minimum a link to `/accounts` (Contas), a link to `/cards` (Cartões) and a link to `/categories` (Categorias).

#### Scenario: Sidebar displays Cards link
- **WHEN** an authenticated user views the private area sidebar
- **THEN** a "Cartões" link pointing to `/cards` is visible within the "Cadastros" group

#### Scenario: Cards link navigates to cards page
- **WHEN** the user clicks the "Cartões" link in the sidebar
- **THEN** the user is navigated to the `/cards` page

#### Scenario: Sidebar displays Categories link
- **WHEN** an authenticated user views the private area sidebar
- **THEN** a "Categorias" link pointing to `/categories` is visible within the "Cadastros" group

#### Scenario: Categories link navigates to categories page
- **WHEN** the user clicks the "Categorias" link in the "Cadastros" group
- **THEN** the user is navigated to the `/categories` page
