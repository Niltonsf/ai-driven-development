## Context

O Poupig é um monorepo TurboRepo com frontend Next.js e backend NestJS. A autenticação já está implementada (JWT + guards). O Prisma está configurado com schema modular por domínio. Esta mudança adiciona o primeiro módulo de entidade financeira — `account` — seguindo os padrões já estabelecidos pelos módulos de auth.

As três camadas (Negócio, Backend, Frontend) MUST ser implementadas por subagentes separados com contexto limpo, conforme observação no prompt original.

## Goals / Non-Goals

**Goals:**
- Criar módulo `account` completo no pacote compartilhado (domínio + aplicação)
- Expor 4 endpoints REST no backend, todos protegidos por JWT
- Implementar CRUD completo no frontend com listagem e formulário
- Migrations, seed e testes de integração

**Non-Goals:**
- Associar transações a contas (escopo futuro)
- Saldo calculado ou agregado por conta (escopo futuro)
- Paginação na listagem de contas (escopo inicial sem paginação)
- Upload de ícone personalizado (apenas nome/identificador como string)

## Decisions

**D1: Upsert por ID no save-account**
O caso de uso `save-account` recebe sempre um `id`. A distinção criação/edição é feita pela busca no repositório — se não encontrar, é criação; se encontrar, é edição. Isso elimina endpoints POST/PUT duplicados no caso de uso e centraliza a lógica de validação de nome duplicado apenas no fluxo de criação.

**D2: FindAccountsByUserIdQuery como atributo público em AccountPrismaRepository**
A query implementada diretamente na classe Prisma (como atributo público tipado) evita criar uma classe separada só para query, reduzindo boilerplate. O controller injeta o repositório e acessa `repo.findAccountsByUserId` diretamente no método GET.

**D3: Formulário sem modal, usando form-section-layout**
O formulário de conta usa `form-section-layout` (padrão do projeto) em vez de modal, mantendo consistência com os demais formulários da aplicação e facilitando a adição de campos futuros sem restrição de espaço.

**D4: isActive oculto no formulário de criação**
No fluxo de criação, `isActive` é sempre `true` e não deve ser exposto ao usuário. No fluxo de edição, o campo é exibido para permitir ativar/desativar a conta sem excluí-la.

**D5: Subagentes separados por camada**
A implementação segue o requisito explícito do prompt: Negócio, Backend e Frontend executados em subagentes com contexto limpo para evitar interferência entre camadas.

## Risks / Trade-offs

- **[Risco] Enum AccountType duplicado entre domínio e Prisma** → Manter os valores do enum sincronizados manualmente; o mapeamento Prisma→Domínio deve ser testado via integração.
- **[Risco] Soft delete sem campo `deletedAt` definido no agregado** → O agregado deve incluir `deletedAt?: Date` ou equivalente para suportar o fluxo de delete-account.use-case sem depender de campo externo.
- **[Trade-off] Query acoplada ao repositório Prisma** → Simplifica o wiring no NestJS mas impede mockar a query independente do repositório em testes unitários; aceitável dado que o padrão do projeto já usa integração como estratégia de teste primária.

## Migration Plan

1. Implementar domínio (`module-aggregate`, `module-entity`, `module-repository`, `module-dto`, `module-query-cqrs`, `module-use-case`)
2. Mapear Prisma e executar migration (`prisma migrate dev`)
3. Implementar repositório Prisma e controller no backend
4. Executar seed de contas
5. Criar testes `.http`
6. Implementar frontend (página, componentes, data layer, menu)

Rollback: a migration pode ser revertida com `prisma migrate reset` em ambiente de desenvolvimento; em produção, criar migration de drop da tabela `account`.

## Open Questions

- O soft delete usa `deletedAt: DateTime?` no Prisma ou um campo `isActive` direto no banco? → Recomendado: `deletedAt` seguindo padrão do projeto (verificar schema existente de `User`).
- O seed deve verificar idempotência (upsert) ou assumir banco limpo? → Recomendado: upsert por id para evitar duplicatas em reexecuções.
