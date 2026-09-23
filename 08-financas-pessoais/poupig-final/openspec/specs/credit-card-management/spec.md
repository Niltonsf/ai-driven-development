### Requirement: Card entity with validated attributes
The system SHALL define a `Card` entity with the following attributes: `id`, `userId`, `name` (required), `description` (optional), `brand` (enum `CardBrand`: VISA, MASTERCARD, ELO, AMEX, HIPERCARD, DINERS, OTHER), `lastFourDigits` (optional, exactly 4 numeric digits), `closingDay` (integer 1–31), `dueDay` (integer 1–31), `limit` (optional, in cents), `color` (optional, hexadecimal), `icon` (optional), `isActive` (default `true`). Value objects SHALL validate format constraints on `color`, `lastFourDigits`, `closingDay`, and `dueDay`.

#### Scenario: Valid card creation
- **WHEN** all required fields are provided with valid values
- **THEN** the Card entity is created successfully with `isActive = true`

#### Scenario: Invalid lastFourDigits
- **WHEN** `lastFourDigits` contains non-numeric characters or length is not 4
- **THEN** the entity creation fails with a validation error

#### Scenario: Invalid color format
- **WHEN** `color` is provided but does not match hexadecimal format (e.g. `#RRGGBB`)
- **THEN** the entity creation fails with a validation error

#### Scenario: Invalid closingDay or dueDay
- **WHEN** `closingDay` or `dueDay` is outside the range 1–31
- **THEN** the entity creation fails with a validation error

### Requirement: Card repository interface
The system SHALL define a `CreditCardRepository` interface exposing operations to save, find by id, and delete a `Card` entity.

#### Scenario: Save new card
- **WHEN** `save` is called with a new Card entity
- **THEN** the card is persisted and retrievable by its id

#### Scenario: Find card by id
- **WHEN** `findById` is called with a valid card id
- **THEN** the corresponding Card entity is returned

#### Scenario: Find card by id not found
- **WHEN** `findById` is called with an id that does not exist
- **THEN** `null` or a not-found result is returned

#### Scenario: Delete card
- **WHEN** `delete` is called with a card id
- **THEN** the card is soft-deleted (marked with `deletedAt`)

### Requirement: Save credit card use case (create and update)
The system SHALL provide a `save-credit-card` use case that receives the credit card repository and supports both creation and update flows based on whether a card with the given `id` already exists.

#### Scenario: Create new card — name already exists for user
- **WHEN** no card with the given `id` exists and a card with the same `name` already exists for the `userId`
- **THEN** the use case returns an error and no card is persisted

#### Scenario: Create new card — success
- **WHEN** no card with the given `id` exists and no card with the same `name` exists for the `userId`
- **THEN** the card is created with `isActive = true` and persisted

#### Scenario: Update card — unauthorized user
- **WHEN** a card with the given `id` exists but belongs to a different `userId`
- **THEN** the use case returns an authorization error and no changes are persisted

#### Scenario: Update card — success
- **WHEN** a card with the given `id` exists and belongs to the authenticated `userId`
- **THEN** the allowed fields are updated and persisted

### Requirement: Delete credit card use case (soft delete)
The system SHALL provide a `delete-credit-card` use case that receives the credit card repository, verifies ownership, and performs a soft delete.

#### Scenario: Delete card — not found
- **WHEN** no card with the given `id` exists
- **THEN** the use case returns a not-found error

#### Scenario: Delete card — unauthorized user
- **WHEN** the card exists but belongs to a different `userId`
- **THEN** the use case returns an authorization error

#### Scenario: Delete card — success
- **WHEN** the card exists and belongs to the authenticated `userId`
- **THEN** the card is soft-deleted via `deletedAt` and is no longer returned in active listings

### Requirement: FindCreditCardsByUserIdQuery
The system SHALL expose a `FindCreditCardsByUserIdQuery` interface with contract `execute(userId: string, page: number, pageSize: number): Promise<Result<PaginatedResult<CreditCardDTO>>>` that returns a paginated list of active cards belonging to the given user. `PaginatedResult` SHALL carry `items`, `total`, `page`, and `pageSize`.

#### Scenario: List cards for user with cards
- **WHEN** `execute` is called with a valid `userId`, `page`, and `pageSize`
- **THEN** a paginated result with the corresponding `CreditCardDTO` slice is returned

#### Scenario: List cards for user with no cards
- **WHEN** `execute` is called with a `userId` that has no cards
- **THEN** a paginated result with an empty `items` array and `total = 0` is returned

### Requirement: Card REST API endpoints
The system SHALL expose four JWT-protected REST endpoints for card management. The `userId` SHALL always be extracted from the JWT token, never from the request body.

#### Scenario: POST /cards — create card
- **WHEN** an authenticated user sends a POST request to `/cards` with valid card data
- **THEN** a new card is created and the created card data is returned

#### Scenario: GET /cards — list cards (paginated)
- **WHEN** an authenticated user sends a GET request to `/cards` with query params `page` (default `1`) and `pageSize` (default `20`)
- **THEN** a paginated result with the user's active cards for that page is returned

#### Scenario: GET /cards — pageSize exceeds limit
- **WHEN** an authenticated user sends a GET request to `/cards` with `pageSize` greater than `50`
- **THEN** the API returns HTTP 400 with a validation error message

#### Scenario: PUT /cards/:id — update card
- **WHEN** an authenticated user sends a PUT request to `/cards/:id` with updated card data
- **THEN** the card is updated if it belongs to the user, or an error is returned

#### Scenario: DELETE /cards/:id — soft delete card
- **WHEN** an authenticated user sends a DELETE request to `/cards/:id`
- **THEN** the card is soft-deleted if it belongs to the user, or an error is returned

### Requirement: Card listing page (paginated)
The system SHALL provide a `/cards` page in the frontend that lists the authenticated user's cards in a paginated manner, displaying per card: name, brand, last four digits, limit, color indicator, and icon. The page SHALL render pagination controls that allow navigating between pages. The default page size is `20`; users may not request more than `50` items per page.

#### Scenario: Cards listed successfully
- **WHEN** the user navigates to `/cards`
- **THEN** the first page of their active cards is displayed with name, brand, last four digits, limit, color indicator, and icon, alongside pagination controls

#### Scenario: User navigates to another page
- **WHEN** the user clicks a pagination control to go to page N
- **THEN** the corresponding slice of cards is loaded and displayed

#### Scenario: No cards available
- **WHEN** the user has no active cards
- **THEN** an empty state message is displayed and no pagination controls are shown

### Requirement: Card form component (create and edit)
The system SHALL provide a `card-form` component that supports both creation and editing flows, using `form-section-layout` as layout, with schema validation. The `brand` field SHALL be a select with translated Portuguese labels. The `color` field SHALL accept hex values. The `isActive` field SHALL only appear in the edit flow.

#### Scenario: Submit valid create form
- **WHEN** the user fills the create form with valid data and submits
- **THEN** the card is created, a success toaster is shown, and the card list is refreshed

#### Scenario: Submit valid edit form
- **WHEN** the user fills the edit form with valid data and submits
- **THEN** the card is updated, a success toaster is shown, and the card list is refreshed

#### Scenario: Submit form with validation error
- **WHEN** the user submits the form with invalid or missing required fields
- **THEN** validation errors are displayed and the form is not submitted

#### Scenario: Delete card from UI
- **WHEN** the user triggers a delete action for a card
- **THEN** the card is soft-deleted, a success toaster is shown, and the card list is refreshed
