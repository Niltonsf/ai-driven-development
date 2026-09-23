## Context

O Poupig é um monorepo TurboRepo com frontend Next.js e backend NestJS, usando Prisma para persistência e JWT para autenticação. O módulo de contas (`account`) já existe e serve como referência de arquitetura para o novo módulo de cartões (`credit-card`). O domínio de negócio reside em pacotes TypeScript independentes (`modules/*`), separados da infraestrutura NestJS (`apps/backend/src/modules/*`) e do frontend Next.js (`apps/frontend/src/modules/*`).

## Goals / Non-Goals

**Goals:**
- Implementar o módulo `credit-card` seguindo exatamente o mesmo padrão arquitetural do módulo `account`
- Expor CRUD completo de cartões via API REST protegida por JWT
- Renderizar listagem e formulário de cartões no frontend
- Adicionar link de cartões ao menu lateral dentro do grupo de cadastros

**Non-Goals:**
- Integração com APIs de bandeiras de cartão (consulta de limites, faturas reais)
- Controle de transações ou lançamentos associados ao cartão (escopo futuro)
- Notificações de vencimento de fatura

## Decisions

### 1. Seguir o padrão do módulo `account` como template
**Decisão**: O módulo `credit-card` replica a estrutura do módulo `account` em todos os layers (domínio, infraestrutura, frontend).  
**Rationale**: Garante consistência no projeto, reduz decisões arbitrárias e facilita manutenção futura.  
**Alternativa descartada**: Criar uma abstração genérica de "cadastro" — prematura e não solicitada.

### 2. `closingDay` e `dueDay` como inteiros (1–31)
**Decisão**: Armazenar os dias de fechamento e vencimento como inteiros simples, não como datas completas.  
**Rationale**: O dia do mês é recorrente mensalmente; uma data específica envelheceria rapidamente e exigiria lógica de atualização.  
**Alternativa descartada**: Usar `Date` — adicionaria complexidade sem benefício para o caso de uso atual.

### 3. `limit` armazenado em centavos (inteiro)
**Decisão**: O campo `limit` é armazenado como inteiro em centavos no banco de dados.  
**Rationale**: Evita imprecisão de ponto flutuante em valores monetários, consistente com práticas financeiras do setor.

### 4. Soft delete via `deletedAt`
**Decisão**: Exclusão lógica usando campo `deletedAt` na entidade e no modelo Prisma.  
**Rationale**: Permite auditoria e recuperação futura; consistente com o padrão já adotado no módulo `account`.

### 5. `userId` extraído do JWT, nunca do body
**Decisão**: Em todos os endpoints, o `userId` vem do token JWT decodificado pelo guard de autenticação.  
**Rationale**: Segurança — impede que um usuário manipule dados de outro usuário ao forjar o `userId` no body.

### 6. Paginação na consulta de cartões
**Decisão**: `FindCreditCardsByUserIdQuery` recebe `page` e `pageSize` e retorna um `PaginatedResult<CreditCardDTO>` com `items`, `total`, `page` e `pageSize`. O endpoint `GET /cards` aceita os query params `page` (default `1`) e `pageSize` (default `20`) e rejeita com HTTP 400 qualquer requisição com `pageSize > 50`. O frontend controla a página corrente via estado local e renderiza controles de paginação.  
**Rationale**: Protege a API contra listagens não limitadas; o teto de 50 é conservador o suficiente para cartões (poucos por usuário) e evita abuso intencional ou acidental.  
**Alternativa descartada**: Cursor-based pagination — desnecessária para este volume de dados.

## Risks / Trade-offs

- **Validação de `closingDay`/`dueDay`** → Meses com menos de 31 dias (fev, abr, jun etc.) podem tornar um dia inválido em determinado mês. Mitigação: a validação aceita 1–31 e a lógica de cobrança real (fora do escopo) lida com a diferença.
- **Enum `CardBrand` fixo** → Novas bandeiras exigem migration de schema. Mitigação: `OTHER` cobre casos não mapeados no curto prazo.
- **Seed acoplado ao e-mail `usuario@formacao.dev`** → Se o usuário não existir no banco, o seed falha. Mitigação: o seed de usuário deve ser executado antes do seed de cartões.

## Migration Plan

1. Criar pacote de domínio `modules/credit-card` com entidade, value objects, repositório, DTO, query e casos de uso
2. Adicionar model `Card` e enum `CardBrand` ao schema Prisma e executar migration
3. Implementar `card.prisma.ts` (repositório + query) e `card.controller.ts` no backend NestJS
4. Executar seed `cards.json` para popular dados de exemplo
5. Criar componentes e página no frontend Next.js
6. Atualizar menu lateral para incluir link `/cards`

**Rollback**: Reverter migration Prisma com `prisma migrate reset` em ambiente de desenvolvimento; em produção, criar migration de rollback explícita.

## Open Questions

- Nenhuma questão aberta no momento; todos os requisitos foram especificados no prompt de origem.
