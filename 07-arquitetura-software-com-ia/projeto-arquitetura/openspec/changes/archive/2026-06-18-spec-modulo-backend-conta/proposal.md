## Why

A camada de **backend** do cadastro de Conta (`apps/backend/src/modules/contas` + Prisma) já está implementada e funcional, mas o conhecimento de **como** ela conecta o núcleo de negócio (`@arquitetura/contas`) ao banco e ao HTTP está implícito no código. Precisamos de uma especificação escrita "à mão", no nível de um dev experiente, que descreva essa camada de forma reaproveitável — para servir de molde ao plugar os próximos cadastros no backend.

## What Changes

- Criar uma especificação da **camada de backend** do cadastro de Conta, obtida por engenharia reversa do código atual.
- A spec cobre apenas o que vive em `apps/backend`: modelo Prisma + migração, seed, adapter de persistência/consulta (`*.prisma.ts`), controller HTTP, módulo Nest e testes de integração (REST Client).
- A spec descreve **passos detalhados** de construção (o que criar e por quê), em nível de contrato e responsabilidade — sem reproduzir o código linha a linha.
- Explicitamente **fora de escopo**: a camada de negócio (`modules/contas/src/conta`, já coberta por `spec-modulo-negocio-conta`), o frontend e o setup base do projeto/Prisma. A spec referencia essas fronteiras mas não as especifica.

## Capabilities

### New Capabilities
- `modulo-backend-conta`: Especificação reaproveitável da camada de backend de um cadastro (modelada sobre Conta) — modelo Prisma com soft delete e unicidade, seed idempotente, adapter que implementa o `ContaRepository` e as queries CQRS com mapeamento `toDomain`/`fromDomain`/`toDTO`, controller HTTP traduzindo `Result` em status code, e testes de integração `.http`.

### Modified Capabilities
<!-- Nenhuma. A camada de negócio é coberta por spec-modulo-negocio-conta e não muda aqui. -->

## Impact

- Novo artefato de especificação em `openspec/changes/spec-modulo-backend-conta/specs/modulo-backend-conta/spec.md`.
- Nenhuma alteração de código de produção — é um trabalho de documentação/engenharia reversa.
- Fonte de verdade da engenharia reversa: `apps/backend/src/modules/contas`, `apps/backend/prisma` (model/migração/seed) e a seção "Backend" de `.docs/sequencia.md`.
- Contratos consumidos (somente como fronteira): `@arquitetura/contas` (`Conta`, `ContaDTO`, casos de uso, contratos de repository/query) e `@arquitetura/shared` (`Result`, `PaginatedInputDTO/ResultDTO`, `TransactionContext`).
- Skills do projeto usadas como base do "como": **backend-prisma-data**, **backend-controller** e **config-prisma**.
