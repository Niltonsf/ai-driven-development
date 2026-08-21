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

- [ ] Criar a estrutura base do monorepo com a skill [config-project-fullstack](../../../.claude/skills/config-project-fullstack) usando o namespace `@ideias`.
- [ ] Configurar a infraestrutura do Prisma no backend com a skill [config-prisma](../../../.claude/skills/config-prisma).
- [ ] Criar o pacote compartilhado com a skill [config-package-shared](../../../.claude/skills/config-package-shared) usando o namespace `@ideias`.
- [ ] Configurar a base de tratamento de erros e autenticação JWT no backend com a skill [backend-nest-config](../../../.claude/skills/backend-nest-config).

### Tasks - Front-end

- [ ] Executar a skill [frontend-next-config](../../../.claude/skills/frontend-next-config) para configurar a estrutura compartilhada (`shared/`) e as rotas Next.js com grupos public/private e sidebar de navegação.

## Resultado Esperado

- Monorepo funcional com `apps/backend` (NestJS, porta 4000) e `apps/frontend` (Next.js, porta 3000) sob o namespace `@ideias`.
- Prisma configurado com schema modular e infraestrutura (`DbModule`, `PrismaService`, seed técnico, docker compose) pronta para receber models de módulos.
- Pacote compartilhado disponível para backend, frontend e módulos de negócio.
- Backend com tratamento de erros centralizado e base de autenticação JWT prontos para serem consumidos por módulos futuros.
- Frontend com pasta `shared/` criada e grupos de rotas `(public)` e `(private)` configurados no Next.js com sidebar de navegação funcional, inicializando sem erros.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
