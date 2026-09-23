## Context

The monorepo (`@poupig/*`) follows a layered DDD architecture:

- **`modules/auth`** — framework-agnostic domain package. Today it is scaffolding only (`src/index.ts`). Domain primitives come from `@poupig/shared`: `Entity`, `ValueObject`, `Result`, `UseCase`, the `db` contracts (`CrudRepository`, `CreateRepository`, `FindByIdRepository`, `TransactionManager`, `TransactionContext`), and ready-made value objects (`Id`, `PersonName`, `Email`, `Url`, `StrongPassword`, `EncryptedPassword`).
- **`apps/backend`** — NestJS. `PrismaService` implements `TransactionManager` via `runInTransaction(ctx => ...)` where `ctx.client` is the transactional client. Prisma schema is modular (`prisma/models/*.model.prisma`, with `auth.model.prisma` currently empty). The `auth` module already has `auth.controller.ts`, `auth.module.ts`, and an `auth.prisma.ts` adapter holding a `PrismaService`. A global `JwtGuard` protects routes unless `@Public()` is applied; `ApiExceptionFilter` maps `ValidationError`/`HttpException`.
- **`apps/frontend`** — Next.js App Router. `/join` lives in the `(public)` group (placeholder today); `/dashboard` lives in `(private)`. Forms use the shared `v` validator integrating value objects with React Hook Form; a toaster and shared UI components exist under `src/shared`.

This change builds the first real feature on top of that foundation, deliberately split into three independent work streams (Domain, Backend, Frontend) so each can be implemented in a clean-context subagent.

## Goals / Non-Goals

**Goals:**
- Model `user` and `password` as two separate aggregates with value-object-validated attributes and `Result`-based construction.
- Provide repository interfaces (with email lookup for user) and a `password-crypto.provider` interface, all framework-agnostic.
- Orchestrate registration in `create-user.usecase` across both aggregates inside a single transaction.
- Persist via Prisma (user + password with a relation), expose a public register endpoint, seed 80 users, and supply Rest Client integration tests.
- Deliver an `auth-form` (register + login) wired into `/join`, with validation, a success toaster, and redirect to `/dashboard` on login.

**Non-Goals:**
- No route protection / guard components on the frontend (explicitly deferred).
- No backend login/authentication endpoint or token issuance in this change — the frontend login flow is the UI surface; only registration is wired end-to-end.
- No changes to the existing shared layers, JWT infrastructure, or monorepo bootstrap.

## Decisions

- **Two aggregates, not one.** `password` is modeled as its own aggregate (entity `id`, `value`) with its own repository, separate from `user`. Rationale: matches the request, keeps credential concerns isolated, and lets the use case persist both transactionally. Alternative (a single `User` with an embedded password hash) was rejected because the request explicitly asks for distinct aggregates and repositories.
- **Reuse shared value objects.** `Id`, `PersonName`, `Email`, `Url`, `StrongPassword`, `EncryptedPassword` already exist in `@poupig/shared` — entities compose these rather than defining new VOs. Avatar URL uses `Url`. This keeps validation consistent across the codebase.
- **Use case receives dependencies by parameter.** `create-user.usecase` takes `user.repository`, `password.repository`, and `password-crypto.provider` via its constructor and depends only on the domain interfaces (`TransactionManager` for the transaction). This keeps the domain free of NestJS/Prisma.
- **Controller wires concrete `*.prisma` repositories directly.** Per the request, `auth.controller` receives the concrete `user.prisma`/`password.prisma` (and bcrypt provider) and instantiates `create-user.usecase` inline in the register method — no DI token/interface indirection. Trade-off: less abstraction at the controller boundary, accepted for simplicity as requested.
- **bcrypt for crypto.** `password-crypto.provider` is implemented with `bcrypt` on the backend, producing hashes compatible with the shared `EncryptedPassword` bcrypt regex. The seed hashes `#Senha123` the same way.
- **Transaction via `PrismaService.runInTransaction`.** The use case persists user then password inside one `runInTransaction` call so the shared transaction context (`ctx.client`) is threaded into both prisma repositories' `create(entity, ctx)`.
- **Seed as JSON + runner task.** 80 users live in `prisma/seed/data/users.json` (first email `usuario@formacao.dev`, all passwords `#Senha123`); a seed task in `prisma/seed/main.ts` reads the JSON, hashes the password, and inserts user+password rows.
- **Frontend layering.** `auth-form.component` is presentational; request logic + state live in `modules/auth/data` (e.g. a `use-auth` hook and an API client), and validation uses the shared `v` validator with the same value objects as the domain. Success triggers the shared toaster; login success calls the App Router to `push('/dashboard')`.
- **Three clean-context subagents.** Implementation is partitioned Domain → Backend → Frontend. Domain must complete first (backend and frontend consume its contracts/types); backend and frontend can then proceed, with frontend depending on the backend register endpoint contract.

## Risks / Trade-offs

- **Login flow is partial** → The frontend exposes a login mode but no backend login endpoint exists yet. Mitigation: scope the login wiring to navigation/redirect behavior; document that real authentication is a follow-up.
- **Concrete repositories in the controller reduce testability** → Accepted per request; integration is covered by the Rest Client `.http` tests against a running backend.
- **Seed must be idempotent enough for repeated runs** → Mitigation: guard the seed task (skip when users already present, or upsert by email) so re-running does not crash on the unique email constraint.
- **Password value object vs. encrypted storage** → The `PasswordEntity.value` is validated as a strong (plaintext) password in the domain, but what is persisted is the bcrypt hash. Mitigation: the use case encrypts before persistence; the prisma password repository stores the encrypted value, keeping the domain invariant (strong password) at construction and the encrypted form at rest.
- **Cross-stream contract drift** → Backend/frontend depend on domain types and the register payload shape. Mitigation: domain stream lands first; the register endpoint's request/response contract is fixed in the backend spec and consumed by the frontend.

## Migration Plan

1. Implement and build the domain (`modules/auth`) aggregates, repositories, provider interface, and `create-user.usecase`.
2. Backend: map Prisma models, generate client, run migrations, implement prisma repositories + bcrypt provider, wire the controller register endpoint, add seed data and run it, add `.http` tests.
3. Frontend: build the `data/` layer + `auth-form.component`, wire `/join`, add validations + toaster + dashboard redirect.

Rollback: the change is additive (new files, new Prisma models, additive migration). Rolling back means reverting the new files and dropping the new tables via a down migration; existing functionality is unaffected.

## Open Questions

- Should the register endpoint return the created user (id/name/email) or just a success status? (Default assumption: return minimal created-user data without the password.)
- Exact route/verb for register (assumed `POST /auth/register`) — confirm against any API conventions during implementation.
