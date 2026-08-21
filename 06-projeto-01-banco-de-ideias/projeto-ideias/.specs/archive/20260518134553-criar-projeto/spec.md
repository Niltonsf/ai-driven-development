# 001-criar-projeto

## Objetivo

Criar a base do projeto monorepo com backend, frontend, pacote compartilhado, Prisma, infraestrutura de autenticação e tratamento de erros do backend, e a estrutura compartilhada e rotas do frontend.

## Contexto Técnico

- Monorepo Turbo com `apps/frontend` (Next.js na porta 3000) e `apps/backend` (NestJS na porta 4000).
- Namespace npm do workspace: `@ideias`.
- Persistência via Prisma, com schema modular por domínio.
- Autenticação baseada em JWT no backend, com tratamento de erros centralizado.
- Frontend configurado com pasta `shared/` e grupos de rotas Next.js `(public)` e `(private)` com sidebar de navegação.
- Esta spec entrega apenas a base técnica. Módulos de negócio (ex.: `auth`/cadastro de usuário) são criados em specs posteriores.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- Nenhum módulo de domínio deve ser criado nesta spec; foco exclusivo em infraestrutura compartilhada.

## Tasks

### Tasks - Configuração

- [x] Criar a estrutura base do monorepo com a skill [config-project-fullstack](../../../.claude/skills/config-project-fullstack) usando o namespace `@ideias`.
  > ✅ 2026-05-14 15:01 — Executei `node .claude/skills/config-project-fullstack/scripts/create-project.js --namespace @ideias`. Gerado monorepo Turbo com `apps/frontend` (Next.js, porta 3000) e `apps/backend` (NestJS, porta 4000), `.env`/`.env.example` em ambos, `@nestjs/config` instalado e workspaces renomeados sob o scope `@ideias`.
- [x] Configurar a infraestrutura do Prisma no backend com a skill [config-prisma](../../../.claude/skills/config-prisma).
  > ✅ 2026-05-14 15:01 — Executei `node .claude/skills/config-prisma/scripts/init-prisma-backend.js --apply --install`. Criados `prisma/schema.prisma`, `prisma/models/bootstrap.model.prisma`, `prisma/seed/main.ts`, `prisma.config.ts`, `docker-compose.yml` alinhado ao `.env`, `src/db/db.module.ts` e `src/db/prisma.service.ts`, com `DbModule` registrado em `app.module.ts` e scripts npm de banco/Prisma adicionados. Rodei `npm --workspace apps/backend run prisma:generate` para gerar o client.
- [x] Criar o pacote compartilhado com a skill [config-package-shared](../../../.claude/skills/config-package-shared) usando o namespace `@ideias`.
  > ✅ 2026-05-14 15:01 — Executei `node .claude/skills/config-package-shared/scripts/rebuild-shared.js`. Scope `@ideias` detectado automaticamente; `packages/shared` reconstruído como `@ideias/shared` e validado via `turbo run build --filter=@ideias/shared` (1 task ok).
- [x] Configurar a base de tratamento de erros e autenticação JWT no backend com a skill [backend-nest-config](../../../.claude/skills/backend-nest-config).
  > ✅ 2026-05-14 15:01 — Executei `node .claude/skills/backend-nest-config/scripts/apply-backend-shared.js`. Camada `apps/backend/src/shared/` (auth, decorators, errors, types) criada; `ApiExceptionFilter` registrado como `APP_FILTER` e `JwtAuthGuard` como `APP_GUARD` no `AppModule`; `@Public()` aplicado ao endpoint raiz; `JWT_SECRET` e `JWT_EXPIRES_IN` adicionados ao `.env`/`.env.example`. Build inicial falhou por ausência do client Prisma; resolvido após `prisma:generate` e re-rodado `npm --workspace apps/backend run build` com sucesso.

### Tasks - Front-end

- [x] Executar a skill [frontend-next-config](../../../.claude/skills/frontend-next-config) para configurar a estrutura compartilhada (`shared/`) e as rotas Next.js com grupos public/private e sidebar de navegação.
  > ✅ 2026-05-14 15:01 — Apliquei manualmente o fluxo da skill (sem input interativo, conforme orientação para não pausar): copiados `assets/shared/` para `apps/frontend/src/shared/`, `assets/public/illustrations/` para `apps/frontend/public/`, `globals.css` substituído pelo design system dark, layouts `(public)`/`(private)` e páginas `page.tsx`, `(public)/join/page.tsx`, `(private)/example/dashboard/page.tsx` criadas, e `app-sidebar-navigation.component.tsx` em `shared/navigation/`. Instaladas dependências (`lucide-react`, `recharts`, `@hookform/resolvers`, `react-day-picker`, `@radix-ui/react-*`, `@ideias/shared`, etc.). Desvios: dois ajustes de compatibilidade com `react-day-picker` v9 — `calendar.tsx` envolveu `classNames` em cast `Record<string, string>` (chaves legadas) e `date-picker-input.tsx` removeu prop `initialFocus`. Build final `npm run build` em `apps/frontend` concluiu com sucesso (rotas `/`, `/join`, `/example/dashboard`).

## Resultado Esperado

- Monorepo funcional com `apps/backend` (NestJS, porta 4000) e `apps/frontend` (Next.js, porta 3000) sob o namespace `@ideias`.
- Prisma configurado com schema modular e infraestrutura (`DbModule`, `PrismaService`, seed técnico, docker compose) pronta para receber models de módulos.
- Pacote compartilhado disponível para backend, frontend e módulos de negócio.
- Backend com tratamento de erros centralizado e base de autenticação JWT prontos para serem consumidos por módulos futuros.
- Frontend com pasta `shared/` criada e grupos de rotas `(public)` e `(private)` configurados no Next.js com sidebar de navegação funcional, inicializando sem erros.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
