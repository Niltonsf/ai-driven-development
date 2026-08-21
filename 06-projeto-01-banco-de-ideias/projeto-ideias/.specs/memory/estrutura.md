# Estrutura do Projeto

Monorepo Turbo com três grupos de workspaces: `apps/*` (executáveis), `modules/*`
(módulos de negócio puros) e `packages/*` (compartilhados/config).

## Raiz

```
package.json          # workspaces, scripts turbo
turbo.json            # tasks build/lint/check-types/dev
.specs/               # specs e memória do projeto (ver abaixo)
.claude/skills/       # skills geradoras/validadoras do projeto
apps/  modules/  packages/
```

## `.specs/`

```
.specs/
  memory/      # ESTE diretório — memória viva do projeto (produto, contexto, estrutura, módulos)
  shared/      # como-executar.md, regras-de-nomenclatura.md
  templates/   # modelo-base.md, modelo-crud.md
  changes/     # specs ativas (atualmente vazio)
  archive/     # 12 specs concluídas (prefixo = timestamp de arquivamento)
```

Specs arquivadas (ordem de execução): criar-projeto → registrar-usuario → login-usuario →
personalizar-aplicacao → cadastro-tipo-de-ideia → carregar-tipos-padrao → cadastro-ideia →
modulo-de-ia-texto → modulo-de-ia-voz → recursos-da-ideia → processamento-da-ideia →
dashboard.

## `packages/`

- **`packages/shared`** (`@ideias/shared`) — base do domínio:
  - `model/entity.ts` — classe `Entity<TState>` (id uuid, timestamps, `validate()`
    abstrato, `clone()`).
  - `usecase/use-case.ts` — `interface UseCase<IN, OUT>`.
  - `db/` — contratos de repositório: `CrudRepository` e granulares
    (`create/update/delete/find-by-id/find-page`), `PageResult`.
  - `error/` — `DomainError`, erros de validação/not-found/unauthorized.
  - `validation/` — `Validator`, interfaces de regra e `rules/*` (~80 regras:
    required, uuid, min/max-length, email, cpf/cnpj, strong-password, etc.).
- **`packages/eslint-config`**, **`packages/typescript-config`** — configs compartilhadas.

## `modules/` (negócio puro — sem NestJS/Prisma/HTTP)

Organização por **agregado**; cada agregado tem `model/`, `provider/` (interfaces + fakes),
`usecase/`, opcionalmente `constant/`. Barrels `index.ts` em cada nível. Testes em
`modules/<m>/test/` espelhando `src/`.

- **`modules/auth`** (`@ideias/auth`) — agregado `user`:
  `model/user.entity.ts`, `provider/{user.repository,crypto.provider}.ts`,
  `usecase/{register-user,login-user}.usecase.ts`.
- **`modules/ideas`** (`@ideias/ideas`) — quatro agregados:
  - `idea-type/` — `model/idea-type.entity.ts`, `provider/idea-type.repository.ts`,
    `usecase/{save,delete,load-default}-idea-type.usecase.ts`,
    `constant/default-idea-types.constant.ts`.
  - `idea/` — `model/{idea,resource}.entity.ts`, `provider/idea.repository.ts`,
    `usecase/{save,delete}-idea.usecase.ts`.
  - `processing/` — `model/{processing,processing-iteration}.entity.ts`,
    `model/{processing-resource,prompt-composer}.ts`,
    `provider/{processing.repository,ai-provider}.ts`,
    `usecase/{start,refine,delete}-processing.usecase.ts`.
  - `dashboard/` — somente leitura: `model/dashboard.dto.ts`,
    `usecase/load-dashboard-summary.usecase.ts`.

## `apps/backend` (NestJS — adaptadores)

```
src/
  main.ts  app.module.ts  app.controller.ts  app.service.ts
  db/                # DbModule + PrismaService
  shared/
    auth/            # jwt strategy/guard/module, auth-user.mapper
    decorators/      # @Public(), @CurrentUser()
    errors/          # ApiExceptionFilter, error-response.type
    types/           # jwt-payload, current-user, authenticated-request
  modules/
    auth/            # auth.controller, user.prisma, crypto.bcrypt, jwt.util, auth.module
    ideas/           # idea-type/idea/processing/dashboard controllers + *.prisma
                     # + ai-provider.adapter, ideas.module, *.integration.http
    ai/              # ai.module/controller/provider (infra pura, sem agregado)
prisma/
  schema.prisma            # root (generator + datasource)
  models/*.model.prisma    # auth, ideas
  migrations/              # 5 migrations (auth, idea_types, ideas, resources, processings)
  seed/main.ts
```

`AppModule` registra `JwtAuthGuard` como `APP_GUARD` e `ApiExceptionFilter` como
`APP_FILTER` (ambos globais).

## `apps/frontend` (Next.js App Router)

```
src/
  app/
    layout.tsx  page.tsx  globals.css  favicon.ico
    (public)/    # layout + join/ (cadastro/login)
    (private)/   # layout (AuthGuard + AdminShell + SidebarMenu) + rotas:
                 #   dashboard/, idea-types/[new|[id]/edit], ideas/[new|[id]/edit],
                 #   processings/[new|[id]]
  shared/
    components/ui/        # design system (button, table, dialog, ai-text-field,
                          #   metric-card, composed-bar-line-chart, sidebar-menu, ...)
    components/form/      # validator client-side
    components/branding/  # app-logo
    template/             # admin-shell, app-shell, public-boxed-layout
    context/  hooks/  api/  i18n/  lib/  util/  types/
  modules/
    auth/    # context (AuthContext), guard (AuthGuard), pages, components, util/jwt
    ideas/   # pages, components, api, util, types (idea-type, idea,
             #   processing, dashboard, recursos, ai-text-field)
```

Menu lateral da área privada (`(private)/layout.tsx`), ordem fixa: **Dashboard → Tipos de
Ideia → Ideias → Processamentos**. Identidade visual: nome "Banco de Ideias", ícone
`BrainCircuit` (lucide-react), paleta escura zinc + âmbar.
