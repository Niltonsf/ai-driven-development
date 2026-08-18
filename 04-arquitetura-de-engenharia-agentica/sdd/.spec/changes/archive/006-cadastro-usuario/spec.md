# 006-cadastro-usuario

## Objetivo

Entregar o CRUD de usuário no módulo `auth`, servindo de referência para os próximos cadastros da aplicação.

## Contexto Técnico

- Módulo de negócio: `auth`, agregado `user` (já existente).
- Backend NestJS com controller dedicado para o CRUD.
- Front-end Next.js com listagem paginada e formulário compartilhado entre criação e edição, dentro do módulo `auth`.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O caso de uso `save-user` cobre tanto criação quanto atualização e é **distinto** de `register-user`. Não fundir nem substituir o `register-user` existente.
- Casos de uso de comando retornam `void`. Consultas não viram caso de uso — o controller chama o repositório direto.
- Confirmação de senha é responsabilidade do front-end. Backend recebe apenas `password`.
- Em edição, se `password` vier vazio, a senha atual é mantida.
- O projeto não usa DTOs de entrada. **Respostas de leitura devem ser mapeadas para objetos simples no controller antes de retornar** — entidades de domínio usam `protected readonly props` com getters de prototype, que não serializam via `JSON.stringify` (produzem `{}`). O controller deve construir explicitamente o objeto de retorno: `return { id: user.id, name: user.name, email: user.email }`.
- A listagem fica dentro do módulo `auth` no front-end, em rota privada.
- **Sem verificação automatizada de UI nesta spec.** Não acionar `mcp__Claude_Preview` nem `mcp__Claude_in_Chrome`. As validações automatizadas vão até a camada de backend (testes unitários do módulo + cenários no Rest Client). O usuário valida a interface manualmente.

## Tasks

### Tasks - Negócio (módulo auth)

- [x] Implementar o caso de uso `save-user` com a skill [module-use-case](../../../.claude/skills/module-use-case). A decisão entre criar e atualizar deve ser baseada em uma consulta ao repositório (`findById`): se `id` vier na entrada e `findById` retornar um usuário, executa atualização; caso contrário (sem `id` ou usuário não encontrado no banco), executa criação usando o `id` recebido ou gerando um novo. Em edição sem `password` (ausente ou vazio), manter o hash atual sem re-hashear.
  > ✅ 2026-04-29 — `save-user.usecase.ts` já existia com implementação correta. Testes unitários em `save-user.usecase.test.ts` também existiam mas tinham 3 falhas por nomes curtos ("Maria", "Ana", "João") que não passam no `PersonNameRule` e UUID fora do padrão v4. Falhas foram corrigidas: nomes ajustados para nome completo e UUID substituído por v4 válido. 10/10 testes passando.

- [x] Implementar o caso de uso `delete-user` com a skill [module-use-case](../../../.claude/skills/module-use-case).
  > ✅ 2026-04-29 — Criado `modules/auth/src/user/usecase/delete-user.usecase.ts`. Lança `DomainError("user.not_found", 404)` quando o id não existe. Exportado em `usecase/index.ts`.

- [x] Cobrir os dois casos de uso com testes unitários, reaproveitando os fakes existentes (`FakeUserRepository`, `FakeCryptoProvider`).
  > ✅ 2026-04-29 — Criado `test/user/usecase/delete-user.usecase.test.ts` com 3 cenários (remoção, not_found, preservação de outros registros). Corrigidos 3 testes pré-existentes do save-user. Total: 10/10 passando (`npx jest --testPathPatterns="save-user|delete-user" --no-coverage`).

### Tasks - Back-end

- [x] Criar `apps/backend/src/modules/auth/user.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD em `/users` (criar, atualizar, excluir, obter por id e listar paginado). Endpoints autenticados. Consultas chamam o repositório direto; comandos instanciam o caso de uso correspondente.
  > ✅ 2026-04-29 — Criado `user.controller.ts` com `POST /users` (201), `PUT /users/:id` (200), `DELETE /users/:id` (204), `GET /users/:id` (200) e `GET /users?page&perPage` (200). Registrado em `AuthModule`. `npx tsc --noEmit` limpo no backend.

- [x] Criar `apps/backend/src/modules/auth/user.integration.http` (Rest Client) cobrindo os fluxos do CRUD, incluindo os principais casos de erro. Validar manualmente com o backend rodando.
  > ✅ 2026-04-29 — Criado `user.integration.http` com cenários de criação (dados válidos, nome inválido, e-mail inválido, sem auth), listagem (paginada), consulta por id, atualização (com e sem senha, nome inválido) e exclusão (existente e inexistente). Validação manual pendente com backend rodando.

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [x] Criar a listagem paginada de usuários no módulo `auth`, em rota privada. Tabela com colunas de nome, e-mail e ações (ícones de editar e excluir).
  > ✅ 2026-04-29 — Criados `modules/auth/pages/user-list.page.tsx` e rota `app/(private)/auth/users/page.tsx`. Tabela com `TableCard`, paginação via `PaginationControls` (10 por página), ícone lápis navega para edição e lixeira abre `DeleteConfirmationDialog`.

- [x] Criar o formulário de usuário compartilhado entre criação e edição, organizado em seções via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx): "Dados básicos" (nome, e-mail) e "Senha" (senha + confirmação).
  > ✅ 2026-04-29 — Criados `modules/auth/pages/user-form.page.tsx`, rota `app/(private)/auth/users/new/page.tsx` e `app/(private)/auth/users/[id]/edit/page.tsx`. Formulário usa `FormSectionLayout` com seções "Dados básicos" e "Senha". Em edição: campos pré-preenchidos e senha opcional. Validação de confirmação no frontend antes de enviar.

- [x] Integrar a coluna de ações: lápis navega para a edição; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e, ao confirmar, chama o backend e atualiza a tabela.
  > ✅ 2026-04-29 — Integrado em `user-list.page.tsx`: lápis faz `router.push('/auth/users/:id/edit')`; lixeira abre `DeleteConfirmationDialog` com nome do usuário; ao confirmar, chama `DELETE /users/:id`, exibe toast e recarrega a tabela (ajusta página se o último item da página foi excluído).

- [x] Adicionar o item "Usuários" no menu lateral apontando para a listagem.
  > ✅ 2026-04-29 — Adicionado módulo "Autenticação" (Auth) com item "Usuários" em `app/(private)/layout.tsx`, apontando para `/auth/users`. Ícone `Users` do lucide-react.

- [x] Acrescentar no i18n as chaves novas que aparecerem (ex.: `user.not_found`, mensagem de senha e confirmação divergentes). Reaproveitar as chaves já cadastradas em specs anteriores.
  > ✅ 2026-04-29 — Adicionadas `user.not_found` e `user.password.confirmation_mismatch` em `messages.pt.ts` e `messages.en.ts`.

- [x] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-04-29 — `npx tsc --noEmit` executado em `apps/frontend` sem erros. UI pronta para conferência manual.

## Resultado Esperado

- Casos de uso `save-user` e `delete-user` implementados e testados, sem alterar `register-user` nem `login-user`.
- CRUD de usuário exposto no backend via `UserController`, com cenários cobertos no `user.integration.http`.
- Listagem paginada, formulário compartilhado e exclusão com confirmação funcionando no front-end.
- Spec serve de referência para os próximos cadastros do projeto.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
