# 001-criar-projeto

## Objetivo

Criar a base do projeto monorepo com backend, frontend, pacote compartilhado, Prisma e a infraestrutura de autenticação e tratamento de erros do backend.

## Contexto Técnico

- Monorepo Turbo com `apps/frontend` (Next.js na porta 3000) e `apps/backend` (NestJS na porta 4000).
- Namespace npm do workspace: `@sdd`.
- Persistência via Prisma, com schema modular por domínio.
- Autenticação baseada em JWT no backend, com tratamento de erros centralizado.
- Esta spec entrega apenas a base técnica. Módulos de negócio (ex.: `auth`/cadastro de usuário) são criados em specs posteriores.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- Nenhum módulo de domínio deve ser criado nesta spec; foco exclusivo em infraestrutura compartilhada.

## Tasks

### Tasks - Configuração

- [x] Criar a estrutura base do monorepo com a skill [config-project-fullstack](../../../.claude/skills/config-project-fullstack) usando o namespace `@sdd`.
  > ✅ 2026-04-24 — Turbo monorepo criado via `create-project.js --namespace @sdd`. Gerou `apps/frontend` (Next.js) e `apps/backend` (NestJS) com namespace `@sdd`. Script encontrado em `.claude/skills/` (não em `.agents/skills/` como referenciado no SKILL.md), executado com caminho correto. Pacote raiz: `@sdd/sdd`.
- [x] Configurar a infraestrutura do Prisma no backend com a skill [config-prisma](../../../.claude/skills/config-prisma).
  > ✅ 2026-04-24 — `init-prisma-backend.js --apply --install` criou `prisma/schema.prisma`, `docker-compose.yml`, `DbModule`, `PrismaService`, seed neutro e scripts npm. Banco PostgreSQL subiu via `db:start`. `prisma:generate` executou com sucesso (Prisma Client v7.8.0).
- [x] Criar o pacote compartilhado com a skill [config-package-shared](../../../.claude/skills/config-package-shared) usando o namespace `@sdd`.
  > ✅ 2026-04-24 — `rebuild-shared.js` recriou `packages/shared` com scope `@sdd`. Desvio: template tinha `@sdd/shared` mas o script exige `@temp/shared`; corrigido o template da skill conforme instrução de manutenção. Build validado via `turbo run build --filter=@sdd/shared`.
- [x] Configurar a base de tratamento de erros e autenticação JWT no backend com a skill [backend-nest-config](../../../.claude/skills/backend-nest-config).
  > ✅ 2026-04-24 — `apply-backend-shared.js` instalou `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@sdd/shared`. Gerou `apps/backend/src/shared/` com `ApiExceptionFilter`, `JwtAuthGuard`, `JwtAuthModule`, decorators e types. Reescreveu `app.module.ts` e `app.controller.ts`. Build do backend validado com sucesso.

## Resultado Esperado

- Monorepo funcional com `apps/backend` (NestJS, porta 4000) e `apps/frontend` (Next.js, porta 3000) sob o namespace `@sdd`.
- Prisma configurado com schema modular e infraestrutura (`DbModule`, `PrismaService`, seed técnico, docker compose) pronta para receber models de módulos.
- Pacote compartilhado disponível para backend, frontend e módulos de negócio.
- Backend com tratamento de erros centralizado e base de autenticação JWT prontos para serem consumidos por módulos futuros.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
