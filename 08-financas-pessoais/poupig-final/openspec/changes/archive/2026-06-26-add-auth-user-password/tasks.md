# Implementation Tasks

> **IMPORTANT — execution model:** Run the three parts (Domain / Backend / Frontend) in **separate subagents, each with a clean context**. Domain (section 1) MUST complete first; Backend (section 2) and Frontend (section 3) consume its contracts. Each subagent should use the referenced skills.

## 1. Domain — `modules/auth` (subagent A, clean context)

- [x] 1.1 Create the `user` aggregate scaffold (no use case) under `modules/auth/src/model` — folders `model`, `provider`, `app/usecase` as needed (skill: module-aggregate)
- [x] 1.2 Implement `User` with attributes `id`, `name`, `email`, `avatarUrl`, validating each via shared value objects (`Id`, `PersonName`, `Email`, `Url`) and returning `Result<User>` (skill: module-entity)
- [x] 1.3 Define the `user.repository` interface: persist `User` and add the email lookup (`findByEmail`) following the project's `findByX` naming, reusing shared persistence contracts and the transaction context (skill: module-repository)
- [x] 1.4 Create the `password` aggregate scaffold (no use case) under `modules/auth/src/model` (skill: module-aggregate)
- [x] 1.5 Implement `Password` with attributes `id`, `value`, validating `value` as a strong password (`StrongPassword`) and returning `Result<Password>` (skill: module-entity)
- [x] 1.6 Define the `password.repository` interface to persist `Password` (with transaction context) (skill: module-repository)
- [x] 1.7 Define the `password-crypto.provider` interface with `encrypt` and `compare` operations
- [x] 1.8 Implement `create-user.usecase` in `modules/auth/src/app/usecase` receiving the `user` + `password` repositories and the crypto provider by parameter; flow: verify email does not exist (error if it does) → validate name → validate email → validate strong password → encrypt password → build `Password` → build `User` → persist both inside one transaction; any step may fail and stop the flow via `Result.fail` (skill: module-use-case)
- [x] 1.9 Export the new aggregates, repositories, provider, and use case from `modules/auth/src/index.ts`; build/typecheck `modules/auth`

## 2. Backend — `apps/backend` (subagent B, clean context)

- [x] 2.1 Map the `user` entity in `apps/backend/prisma/models/auth.model.prisma` (unique email) (skill: backend-prisma-data)
- [x] 2.2 Map the `password` entity in `auth.model.prisma` with a relation to `user` (skill: backend-prisma-data)
- [x] 2.3 Generate the Prisma client and run the migrations to create the `user` and `password` tables
- [x] 2.4 Implement the `user` repository with Prisma at `apps/backend/src/modules/auth/user.prisma`, mapping to/from `User` and honoring the transaction context
- [x] 2.5 Implement the `password` repository with Prisma at `apps/backend/src/modules/auth/password.prisma`, honoring the transaction context
- [x] 2.6 Add `bcrypt` dependency and implement the `password-crypto.provider` with bcrypt (compatible with the shared `EncryptedPassword` hash format)
- [x] 2.7 Update `auth.controller` to receive the concrete `user.prisma` and `password.prisma` implementations directly (no interface) plus the bcrypt provider; register them in `auth.module`
- [x] 2.8 Add a public register method in `auth.controller` that instantiates `create-user.usecase` directly inside the method, executes it, and maps failures to the appropriate HTTP error (skill: backend-controller)
- [x] 2.9 Create `apps/backend/prisma/seed/data/users.json` with 80 users (every password `#Senha123`, first email `usuario@formacao.dev`) and a seed task in `prisma/seed/main.ts` that hashes the password and inserts user+password (idempotent by email)
- [x] 2.10 Execute the seed and verify the database is populated with 80 users
- [x] 2.11 Create Rest Client (`.http`) integration tests for the register endpoint covering success and duplicate-email cases

## 3. Frontend — `apps/frontend` (subagent C, clean context)

- [x] 3.1 Create the `data/` layer in `apps/frontend/src/modules/auth/data`: API client(s) for register (and login), state management, and React hooks (e.g. `use-auth`) as needed
- [x] 3.2 Create validation schema(s) for the auth form using the shared `v` validator with value objects (`PersonName`, `Email`, `StrongPassword`) (skill: frontend-form-schema)
- [x] 3.3 Implement `auth-form.component` in `apps/frontend/src/modules/auth/components` supporting both register and login flows, delegating requests/state to the `data/` layer, with all field validations applied
- [x] 3.4 Show a success toaster on a successful operation
- [x] 3.5 Reference `auth-form.component` from the `/join` route (replace the placeholder in `app/(public)/join/page.tsx`)
- [x] 3.6 On correct login, redirect the application to `/dashboard` (App Router navigation)
- [x] 3.7 Confirm NO route-protection (guard) component is added (deferred to a future feature)

## 4. Verification

- [x] 4.1 Typecheck/build all touched packages (`modules/auth`, `apps/backend`, `apps/frontend`)
- [x] 4.2 Run the register `.http` integration tests against the running backend and confirm success + duplicate-email behavior
- [x] 4.3 Manually exercise `/join`: validation errors block submit, success shows toaster, correct login redirects to `/dashboard`
