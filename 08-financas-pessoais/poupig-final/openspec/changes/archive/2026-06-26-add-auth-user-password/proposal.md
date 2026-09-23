## Why

The `auth` module is currently scaffolding only — there is no domain model for users or credentials, no persistence, and the `/join` route shows a placeholder. To enable account creation (and the future login flow), we need a complete, vertically-sliced authentication feature spanning domain, backend, and frontend, built on the existing DDD primitives (`Entity`, `ValueObject`, `Result`, `TransactionManager`) and shared value objects already provided by `@poupig/shared`.

## What Changes

- **Domain (`modules/auth`)**: add a `user` aggregate (entity with `id`, `name`, `email`, `avatarUrl` validated by value objects) and its `user.repository` interface (persist + lookup by email); add a `password` aggregate (entity with `id`, `value` validated for password strength) and its `password.repository` interface; add a `password-crypto.provider` interface (encrypt/compare); add a `create-user.usecase` that orchestrates both aggregates inside a transaction.
- **Backend (`apps/backend`)**: map `user` and `password` (with a relation) in Prisma, run migrations; implement `user.prisma` and `password.prisma` repositories; implement a bcrypt-based `password-crypto.provider`; update `auth.controller` to receive the concrete `*.prisma` repositories and expose a public **register** endpoint that instantiates `create-user.usecase` directly; seed 80 users (password always `#Senha123`, first email `usuario@formacao.dev`); add Rest Client integration tests for register.
- **Frontend (`apps/frontend`)**: add an `auth-form.component` supporting register and login flows, with API calls and state in a `data/` folder (hooks as needed), full form validation, a success toaster, wired into the `/join` route, redirecting to `/dashboard` on successful login. No route guards (deferred).

## Capabilities

### New Capabilities
- `auth-domain`: User and Password aggregates (entities, value-object validation, repository interfaces, password-crypto provider interface) and the `create-user` use case orchestrating them transactionally.
- `auth-backend`: Prisma persistence for User/Password (with relation), repository and bcrypt crypto implementations, the public register endpoint on `auth.controller`, database seed (80 users), and Rest Client integration tests.
- `auth-frontend`: The `auth-form` component (register + login), its data/state layer, validations, success toaster, `/join` wiring, and dashboard redirect on login.

### Modified Capabilities
<!-- None: this change introduces new behavior only; existing specs (monorepo-bootstrap, shared layers, prisma-setup) are unchanged. -->

## Impact

- **Domain**: `modules/auth/src/**` (new `model/`, `provider/`, `app/usecase/` folders and files). Depends on `@poupig/shared` value objects (`Id`, `PersonName`, `Email`, `Url`, `StrongPassword`, `EncryptedPassword`) and base types (`Entity`, `Result`, `UseCase`, `CrudRepository`, `TransactionManager`).
- **Backend**: `apps/backend/prisma/models/auth.model.prisma`, new migration(s), `apps/backend/src/modules/auth/{user.prisma,password.prisma,password-crypto.bcrypt,auth.controller,auth.module}.ts`, `apps/backend/prisma/seed/{main.ts,data/users.json}`, new `.http` integration test file. New dependency: `bcrypt`.
- **Frontend**: `apps/frontend/src/modules/auth/{components/auth-form.component.tsx,data/*}`, `apps/frontend/src/app/(public)/join/page.tsx`.
- **No breaking changes**; no route protection added.
