# Negócio

- Criar o agregado de `card` sem nenhum caso de uso. (skill: module-aggregate)

- Alterar a entidade `card` para possuir os seguintes atributos:
  - `id` — identificador único do cartão
  - `userId` — id do usuário dono do cartão (relacionamento por ID)
  - `name` — nome do cartão (obrigatório)
  - `description` — descrição do cartão (opcional)
  - `brand` — bandeira do cartão: enum `CardBrand` com os valores `VISA`, `MASTERCARD`, `ELO`, `AMEX` (American Express), `HIPERCARD`, `DINERS` (Diners Club) e `OTHER` (Outro)
  - `lastFourDigits` — 4 últimos dígitos do cartão (opcional)
  - `closingDay` — dia do mês de fechamento da fatura (número inteiro de 1 a 31)
  - `dueDay` — dia do mês de vencimento da fatura (número inteiro de 1 a 31)
  - `limit` — limite do cartão em centavos (opcional)
  - `color` — cor em hexadecimal, ex: `#FF5733` (opcional)
  - `icon` — nome ou identificador do ícone (opcional)
  - `isActive` — indica se o cartão está ativo; padrão `true`

  Usar objetos de valor para validar os atributos (ex.: validar formato hexadecimal da cor, garantir que `name` não seja vazio, validar que `lastFourDigits` contenha exatamente 4 dígitos numéricos, validar que `closingDay` e `dueDay` estejam entre 1 e 31). (skill: module-entity)

- Criar a interface de `card.repository` para persistir a entidade `card`, incluindo: salvar, buscar por id e deletar. Seguir o padrão de nomenclatura do projeto. (skill: module-repository)

- Criar o DTO `CardDTO` em `modules/card/src/card/dto/card.dto.ts`. No primeiro momento pode herdar de `CardProps` diretamente, caso isso seja apropriado, ou com `Omit` se algum campo não fizer sentido expor ao consumidor. (skill: module-dto)

- Criar a interface de query `FindCardsByUserIdQuery` em `modules/card/src/card/provider/find-cards-by-user-id.query.ts` seguindo o contrato `execute(userId: string): Promise<Result<CardDTO[]>>`. (skill: module-query-cqrs)

- Criar o caso de uso `save-card.use-case` dentro de `modules/card/src/card/use-case` que recebe por parâmetro o repositório `card`. O `id` sempre é informado. O caso de uso suporta os fluxos de criação e alteração determinados pela busca no repositório: se o cartão **não existir** para o `id` informado, é um fluxo de criação (verificar se já existe cartão com o mesmo nome para o usuário — pode gerar erro, criar a entidade com `isActive = true` por padrão e persistir); se o cartão **já existir**, é um fluxo de alteração (verificar se pertence ao usuário autenticado — pode gerar erro de autorização, aplicar as alterações permitidas e persistir). (skill: module-use-case)

- Criar o caso de uso `delete-card.use-case` dentro de `modules/card/src/card/use-case` que recebe por parâmetro o repositório `card`. O fluxo é: buscar o cartão por id (pode gerar erro caso não exista), verificar se pertence ao usuário autenticado (pode gerar erro de autorização) e deletar via soft delete usando o campo apropriado da entidade (ex.: `deletedAt`). (skill: module-use-case)

> Os passos dos casos de uso podem gerar erros e parar o processo.

# Backend

- Mapear a entidade `card` com o Prisma, incluindo o enum `CardBrand`. O campo `userId` deve ter uma relação com o model `User`. (skill: backend-prisma-data)
- Executar as migrations do Prisma para criar a tabela `card`

- Criar uma implementação do repositório de `card` usando o Prisma (`apps/backend/src/modules/card/card.prisma.ts`). As queries também são implementadas nessa mesma classe, cada uma exposta como um atributo público tipado com a interface correspondente (ex.: `findCardsByUserId: FindCardsByUserIdQuery`), retornando `CardDTO[]` mapeado diretamente do resultado do banco.

- Criar o `card.controller` em `apps/backend/src/modules/card/card.controller.ts` com os seguintes endpoints (todos protegidos por JWT):
  - `POST /cards` — criar cartão, instanciando `save-card.use-case` sem `id`
  - `GET /cards` — listar cartões do usuário autenticado, chamando `FindCardsByUserIdQuery` diretamente no método do controller (sem caso de uso)
  - `PUT /cards/:id` — atualizar cartão, instanciando `save-card.use-case` com `id`
  - `DELETE /cards/:id` — desativar cartão (exclusão lógica), instanciando `delete-card.use-case`

  O `userId` deve ser extraído do token JWT em todos os endpoints, nunca vir do body da requisição.

- Criar o seed de banco de dados em `apps/backend/prisma/seed/data/cards.json` com ao menos 5 cartões de exemplo vinculados ao usuário `usuario@formacao.dev`, distribuindo as diferentes bandeiras (`CardBrand`).
- Executar o seed para popular o banco com os cartões de exemplo.

- Criar os testes de integração (usando o padrão do Rest Client — Plugin do VS Code) para todos os endpoints de cartão.

# Frontend

- Criar a página `cards.page.tsx` em `apps/frontend/src/modules/card/pages` que lista os cartões do usuário autenticado. A lista deve exibir: nome, bandeira, 4 últimos dígitos, limite, cor (indicador visual) e ícone do cartão. Rota: `/cards`.

- Criar o componente `card-list.component.tsx` em `apps/frontend/src/modules/card/components` responsável por renderizar a lista de cartões recebida como prop.

- Criar o componente `card-form.component.tsx` em `apps/frontend/src/modules/card/components` com suporte aos fluxos de criação e edição. O formulário **não deve ser implementado via modal** — deve utilizar o componente `form-section-layout` como estrutura de layout. O formulário deve conter os campos da entidade `card`. Usar validação com schema (mesmo padrão dos formulários existentes no projeto) (skill: frontend-form-schema). O campo `brand` deve ser um select com os valores do enum `CardBrand` traduzidos para português. O campo `color` deve ter um color picker ou input de texto aceitando hex. O campo `isActive` deve aparecer apenas no fluxo de edição.

- Separar as chamadas de API e o gerenciamento de estado em `apps/frontend/src/modules/card/data`:
  - `card-api.client.ts` — funções de chamada à API (criar, listar, atualizar, deletar)
  - `card.schema.ts` — schema de validação do formulário
  - Hooks do React necessários para consumir os dados e disparar as ações

- Alterar o menu lateral da área privada da aplicação para incluir o link para `/cards` dentro do grupo de cadastros, ao lado do link de contas já existente.

- Em caso de sucesso em qualquer operação (criar, editar, excluir), exibir toaster de sucesso e atualizar a lista de cartões.

> Obs: IMPORTANTE!!! Executar as três partes (Negócio, Backend e Frontend) em subagentes separados com contexto limpo em cada um deles
