## 1. Domínio — Módulo `credit-card`

- [x] 1.1 Criar o agregado `credit-card` usando a skill `module-aggregate` em `modules/credit-card`
- [x] 1.2 Implementar value objects para validação (`Color`, `LastFourDigits`, `ClosingDay`, `DueDay`) usando a skill `module-value-object`
- [x] 1.3 Alterar a entidade `credit-card` com todos os atributos especificados e o enum `CardBrand` usando a skill `module-entity`
- [x] 1.4 Criar a interface `CreditCardRepository` com operações `save`, `findById` e `delete` usando a skill `module-repository`
- [x] 1.5 Criar o `CreditCardDTO` em `modules/credit-card/src/credit-card/dto/credit-card.dto.ts` usando a skill `module-dto`
- [x] 1.6 Criar a interface `FindCreditCardsByUserIdQuery` em `modules/credit-card/src/credit-card/provider/find-credit-cards-by-user-id.query.ts` com contrato `execute(userId: string, page: number, pageSize: number): Promise<Result<PaginatedResult<CreditCardDTO>>>` usando a skill `module-query-cqrs`
- [x] 1.7 Criar o caso de uso `save-credit-card.use-case` em `modules/credit-card/src/credit-card/use-case` usando a skill `module-use-case`
- [x] 1.8 Criar o caso de uso `delete-credit-card.use-case` em `modules/credit-card/src/credit-card/use-case` usando a skill `module-use-case`

## 2. Backend — Prisma e Migration

- [x] 2.1 Mapear a entidade `credit-card` no schema Prisma com o enum `CardBrand` e relação com `User` usando a skill `backend-prisma-data`
- [x] 2.2 Executar a migration do Prisma para criar a tabela `card`

## 3. Backend — Infraestrutura NestJS

- [x] 3.1 Criar `credit-card.prisma.ts` em `apps/backend/src/modules/credit-card/` implementando `CreditCardRepository` e expondo `findCreditCardsByUserId: FindCreditCardsByUserIdQuery` como atributo público; a implementação deve repassar `page` e `pageSize` ao Prisma usando `skip`/`take` e retornar `PaginatedResult<CreditCardDTO>`
- [x] 3.2 Criar `credit-card.controller.ts` em `apps/backend/src/modules/credit-card/` com os endpoints `POST /cards`, `GET /cards`, `PUT /cards/:id` e `DELETE /cards/:id`, todos protegidos por JWT, extraindo `userId` do token; o endpoint `GET /cards` aceita query params `page` (default `1`) e `pageSize` (default `20`) e valida `pageSize <= 50` retornando HTTP 400 se excedido

## 4. Backend — Seed e Testes

- [x] 4.1 Criar `apps/backend/prisma/seed/data/credit-cards.json` com ao menos 25 cartões de exemplo vinculados (quero testar a paginação) ao usuário `usuario@formacao.dev`, distribuindo diferentes `CardBrand`
- [x] 4.2 Executar o seed para popular o banco com os cartões de exemplo
- [x] 4.3 Criar testes de integração com o Rest Client (VS Code) para todos os endpoints de cartão

## 5. Frontend — Página e Componentes

- [x] 5.1 Criar `credit-cards.page.tsx` em `apps/frontend/src/modules/credit-card/pages` com rota `/cards`, listando nome, bandeira, 4 últimos dígitos, limite, cor e ícone, com controles de paginação (pageSize padrão `10`)
- [x] 5.2 Criar `credit-card-list.component.tsx` em `apps/frontend/src/modules/credit-card/components` para renderizar a lista de cartões recebida como prop
- [x] 5.3 Criar `credit-card-form.component.tsx` em `apps/frontend/src/modules/credit-card/components` com suporte a criação e edição, usando `form-section-layout`, select traduzido para `brand`, color picker para `color` e `isActive` apenas no fluxo de edição

## 6. Frontend — Dados e Estado

- [x] 6.1 Criar `credit-card-api.client.ts` em `apps/frontend/src/modules/credit-card/data` com funções de chamada à API (criar, listar, atualizar, deletar); a função de listar recebe `{ page, pageSize }` e repassa como query params para `GET /cards`
- [x] 6.2 Criar `credit-card.schema.ts` em `apps/frontend/src/modules/credit-card/data` com schema de validação do formulário usando a skill `frontend-form-schema`
- [x] 6.3 Criar hooks React necessários para consumir os dados e disparar as ações (listar, salvar, deletar)

## 7. Frontend — Navegação e Feedback

- [x] 7.1 Adicionar link `/cards` (Cartões) ao grupo de cadastros no menu lateral da área privada, ao lado do link de contas já existente
- [x] 7.2 Garantir que toasters de sucesso são exibidos e a lista de cartões é atualizada após qualquer operação de criação, edição ou exclusão
