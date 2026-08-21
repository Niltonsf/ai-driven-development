# Contexto Técnico Global

Stack, restrições e decisões transversais que valem para todo o projeto. Specs individuais
referenciam este arquivo em vez de repetir o conteúdo.

## Monorepo

- **Turborepo** (`turbo` 2.x), gerenciado por **npm workspaces** (`npm@10.9.2`,
  Node >= 18). Namespace npm do workspace: **`@ideias`**.
- Workspaces: `apps/*`, `modules/*`, `packages/*`.
- Scripts na raiz: `npm run build|dev|lint|check-types` (delegam ao `turbo`) e
  `npm run format` (prettier em `**/*.{ts,tsx,md}`).
- Linguagem 100% **TypeScript** (5.x). Prettier + ESLint configurados.

## Aplicações

- **`apps/backend`** — NestJS 11, porta **4000**. CORS habilitado, `@nestjs/config`
  global. Build com `nest build`. Testes com Jest + ts-jest (`*.spec.ts`, rootDir `src`).
- **`apps/frontend`** — Next.js 16 (App Router, React 19), porta **3000**. Tailwind CSS v4
  - `@tailwindcss/typography`. UI sobre Radix UI + `lucide-react` + `class-variance-authority`.
    Gráficos com `recharts`. Markdown com `react-markdown` + `remark-gfm`. Toaster `sonner`.
    Sessão em cookie via `js-cookie`. Formulários com `react-hook-form` + `@hookform/resolvers`.

## Persistência

- **PostgreSQL** via **Prisma 7** (`@prisma/client`, `@prisma/adapter-pg`, `pg`).
- Schema **modular por domínio**: `apps/backend/prisma/schema.prisma` é só o root
  (generator + datasource); os models ficam em
  `apps/backend/prisma/models/<modulo>.model.prisma` (`auth.model.prisma`,
  `ideas.model.prisma`).
- Migrations incrementais nomeadas por módulo em `apps/backend/prisma/migrations/`.
- Seed técnico em `apps/backend/prisma/seed/main.ts` (sem seeds de módulo).
- `DATABASE_URL` no `.env` do backend; Postgres sobe via `docker compose`
  (`npm run db:start` no backend).

## Arquitetura (clean architecture / portas e adaptadores)

- **Módulos de negócio** vivem em `modules/*` (pacotes npm puros, sem NestJS, sem Prisma,
  sem HTTP). Contêm: `model/` (entidades), `provider/` (interfaces de repositório e portas
  - fakes), `usecase/` (casos de uso), `constant/`. Organizados por **agregado**.
- **Pacote compartilhado** `packages/shared` (`@ideias/shared`) concentra: `Entity` base,
  contrato `UseCase<IN,OUT>`, interfaces de repositório (`CrudRepository` e granulares),
  `DomainError`, e uma biblioteca extensa de regras de validação (`Validator` + ~80
  `*.rule.ts`).
- **Backend** apenas adapta: controllers finos em `apps/backend/src/modules/<modulo>`, implementações Prisma dos repositórios (`*.prisma.ts`) e providers técnicos, registrados no módulo Nest correspondente. Infra pura (ex.: IA) é módulo Nest sem agregado em `modules/` (`apps/backend/src/modules/ai`).

## Convenções fixas

- **Linguagem do código em inglês** (identificadores: `IdeaType`, `SaveIdea`,
  `StartProcessing`, `ideaTypeId`); **conceitos do domínio em português** apenas em telas,
  mensagens e documentação ("Tipo de Ideia", "Processamentos", "Reprocessar").
- **Nomenclatura**: arquivos/diretórios em `kebab-case`, sufixos por responsabilidade
  (`*.entity.ts`, `*.use-case.ts`, `*.repository.ts`, `*.controller.ts`, `*.page.tsx`,
  `*.component.tsx`, etc.). Detalhe em [Regras de nomenclatura](../shared/regras-de-nomenclatura.md).
- **Sem DTOs de entrada** no backend: o controller recebe o `Body` cru e monta o input do
  caso de uso. **Respostas de leitura são mapeadas explicitamente** para objetos simples no
  controller — entidades usam `protected readonly props` com getters de prototype, que
  serializam como `{}` via `JSON.stringify`.
- **Casos de uso de comando retornam `void`**. Consultas (`findById`, `findPage`) **não**
  viram caso de uso — o controller chama o repositório direto.
- Caso de uso instanciado **no corpo do método** do controller, recebendo
  repositórios/providers injetados no construtor do controller.
- **Validação de negócio dentro da entidade** (`validate()` com `Validator.validate`);
  client-side só `required` nos inputs.
- **Propriedade por usuário**: todo agregado grava `userId` (extraído do JWT) e filtra por
  ele. `findById(id)` não recebe `userId`; a checagem de propriedade é feita no
  caso de uso/controller — 403 em mutações cross-user, 404 em leituras por id (não vazar
  existência alheia).

## Autenticação

- JWT no backend (`@nestjs/jwt` + `passport-jwt`, libs `jsonwebtoken`/`bcrypt`).
  `JwtAuthGuard` é **guard global** (`APP_GUARD`); endpoints públicos marcados com
  `@Public()`. Senha com `bcrypt`.
- **O módulo de negócio `auth` não conhece JWT/token/sessão**. O caso de uso `login-user`
  só devolve `{ id, name, email }`; o JWT é gerado **no `auth.controller.ts`** a partir
  dessa saída. Segredo em `JWT_SECRET`, expiração padrão ~7–14 dias.
- Frontend mantém sessão em cookie `auth_token` (`sameSite: lax`, `secure` em prod,
  sem `httpOnly` — o client lê para reidratar o `AuthContext`). Decodificação do payload
  com `TextDecoder('utf-8')` (preserva acentuação). Rotas privadas protegidas por
  `AuthGuard` envolvendo o grupo `(private)`.

## Tratamento de erros

- `DomainError(message, statusCode)` no domínio (`message` = chave i18n, ex.:
  `idea-type.forbidden`). `ApiExceptionFilter` global (`APP_FILTER`) converte em resposta
  padronizada `ApiErrorResponse` (`errors: string[]` com chaves i18n).
- Frontend traduz via `getMessage(key)` (`shared/i18n/`, pt/en por idioma do navegador) e
  dispara um `toast` por item.

## Integração com IA

- Provedor: **OpenAI** via SDK oficial `openai`. Variáveis no backend:
  `OPENAI_API_KEY` (obrigatória), `OPENAI_MODEL` (default `gpt-4o-mini`),
  `OPENAI_TRANSCRIPTION_MODEL` (default `whisper-1`). **Nunca** commitar a chave real.
- Implementação concreta em `apps/backend/src/modules/ai` (módulo Nest de infraestrutura).
  O domínio depende da porta abstrata `AiProvider` (em `modules/ideas`); o backend registra
  um adapter (`ModuleAiProviderAdapter`) sob esse token.
- Endpoints genéricos autenticados: `POST /ai/generate` (texto) e `POST /ai/transcribe`
  (voz). Geração síncrona, sem streaming, sem cache. Erros do SDK viram
  `DomainError("ai.generate.failed", 502)` (mensagem do provedor só em log).

## Validação automatizada

Padrão do projeto: testes automatizados cobrem **domínio + backend** (testes unitários dos
módulos com Jest + cenários HTTP em arquivos `*.integration.http` no formato Rest Client).
**Não há verificação automatizada de UI** — a interface é validada manualmente.
