# 002-cadastro-cliente

## Objetivo

Entregar o cadastro de usuário no módulo `auth`, com entidade, caso de uso `register-user`, persistência via Prisma e endpoint HTTP protegido por criptografia de senha com bcrypt.

## Contexto Técnico

- Módulo de negócio novo: `auth`, com agregado `user`.
- Persistência via Prisma; criptografia de senha via biblioteca `bcrypt`.
- Endpoint de registro exposto no backend via controller simples que instancia o caso de uso no corpo do método.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- As interfaces definidas no módulo `auth` (repositório de `user` e `crypto.provider.ts`) não podem ser alteradas pelas implementações.
- As implementações técnicas (repositório Prisma e provider bcrypt) devem ficar diretamente em `apps/backend/src/modules/auth`, sem subpasta.
- No `auth.controller.ts`, o caso de uso `register-user` deve ser instanciado no corpo do método, recebendo as implementações injetadas no próprio controller como parâmetro.

## Tasks

### Tasks - Módulo auth

- [x] Criar o módulo `auth` com a skill [config-new-module](../../../.claude/skills/config-new-module).
  > ✅ 2026-04-24 18:22 — Módulo `auth` criado em `modules/auth` com namespace `@cadastro-base`. Placeholder `@sdd/__module_name__` no `package.json` foi corrigido manualmente para `@cadastro-base/auth`. Build e testes do workspace passaram com sucesso.

- [x] Criar o agregado `user` dentro do módulo `auth` com a skill [module-aggregate](../../../.claude/skills/module-aggregate), contendo apenas um caso de uso de exemplo.
  > ✅ 2026-04-24 18:22 — Agregado `user` criado em `modules/auth/src/user/` com modo `example`. Estrutura: `model/`, `provider/`, `usecase/` com `create-user.usecase.ts` como exemplo mínimo.

- [x] Implementar a entidade `user` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos `id`, `name` (rule: person name), `email` (rule: email) e `password` (rule: hash pass).
  > ✅ 2026-04-24 18:23 — Entidade `User` implementada com `UserState` estendendo `EntityState`. Campos: `name` (RequiredRule, MinLengthRule(3), MaxLengthRule(80), PersonNameRule), `email` (RequiredRule, EmailRule), `password` (BcryptHashRule). Teste unitário com 17 casos, coverage 100%.

- [x] Criar a interface `crypto.provider.ts` em `modules/auth/.../user/provider` com os métodos de criptografar senha e comparar senhas.
  > ✅ 2026-04-24 18:24 — Interface `CryptoProvider` criada em `modules/auth/src/user/provider/crypto.provider.ts` com métodos `hashPassword(password: string): Promise<string>` e `comparePassword(password: string, hash: string): Promise<boolean>`. Exportada no barrel `provider/index.ts`.

- [x] Implementar o caso de uso `register-user` com a skill [module-use-case](../../../.claude/skills/module-use-case), cobrindo o fluxo: validar dados de entrada (`name`, `email`, `password`), validar se o usuário já está cadastrado, criptografar a senha, criar a entidade `user` e persistir via repositório. O retorno do caso de uso deve ser `void`.
  > ✅ 2026-04-24 18:25 — Caso de uso `RegisterUser` implementado em `modules/auth/src/user/usecase/register-user.usecase.ts`. Fluxo: valida entrada (Validator + StrongPasswordRule para senha raw), busca usuário por email (lança DomainError 409 se existir), criptografa senha, cria entidade User, chama `user.validate()` e persiste. Interface `UserRepository` atualizada com `findByEmail`. Fakes `FakeUserRepository` e `FakeCryptoProvider` criadas em `test/mock/`. Teste com 7 casos, coverage 100%.

### Tasks - Back-end

- [x] Sincronizar o módulo `auth` com o Prisma criando o model da entidade `user` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module).
  > ✅ 2026-04-24 18:28 — Model `User` criado em `apps/backend/prisma/models/auth.model.prisma` com campos `id`, `name`, `email` (unique), `password`, `createdAt`, `updatedAt`, `deletedAt`. Tabela mapeada para `users`. Migration `20260424182802_auth` aplicada. Client Prisma gerado. `bootstrap.model.prisma` removido. Banco resetado previamente por drift de migration anterior (desvio autorizado pelo usuário).

- [x] Implementar o repositório Prisma de `user` diretamente em `apps/backend/src/modules/auth` (sem subpasta) com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo `auth`.
  > ✅ 2026-04-24 18:29 — `PrismaUserRepository` criada em `apps/backend/src/modules/auth/user.prisma.ts` implementando `UserRepository` com todos os métodos do `CrudRepository` mais `findByEmail`. Usa `PrismaService` injetado. `AuthModule` atualizado com `DbModule` e `PrismaUserRepository`.

- [x] Instalar `bcrypt` no backend e implementar `crypto.provider.ts` diretamente em `apps/backend/src/modules/auth` (sem subpasta) usando bcrypt, sem alterar a interface definida no módulo `auth`.
  > ✅ 2026-04-24 18:30 — `bcrypt` e `@types/bcrypt` instalados no workspace `@sdd/backend`. `BcryptCryptoProvider` criada em `apps/backend/src/modules/auth/crypto.provider.ts` implementando `CryptoProvider` com `saltRounds = 10`.

- [x] Criar `auth.controller.ts` no backend com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller) expondo o endpoint de registrar usuário: injetar repositório e `crypto.provider` diretamente no controller, instanciar o caso de uso `register-user` no corpo do método e passar as dependências via parâmetro.
  > ✅ 2026-04-24 18:31 — `AuthController` atualizado com endpoint `POST /auth/register` (público via `@Public()`, retorno 201). `RegisterUser` instanciado no corpo do método recebendo `cryptoProvider` e `userRepository` injetados. `AuthModule` registra `AuthController`, `PrismaUserRepository` e `BcryptCryptoProvider`. `AuthModule` adicionado ao `AppModule`.

- [x] Criar os testes de integração HTTP em `auth.integration.http` (Rest Client) cobrindo o fluxo de registro de usuário.
  > ✅ 2026-04-24 18:32 — Arquivo `apps/backend/src/modules/auth/auth.integration.http` criado com 5 cenários: registro válido (201), e-mail duplicado (409), nome inválido (422), e-mail inválido (422), senha fraca (422). Cenários validados com `curl` contra o servidor em execução local.

## Resultado Esperado

- Módulo `auth` com agregado `user`, entidade validada e caso de uso `register-user` implementado e testado.
- Model `user` sincronizado no Prisma com migration aplicada.
- Endpoint de cadastro de usuário exposto no backend, com senha armazenada criptografada via bcrypt.
- Testes de integração em `auth.integration.http` executando com sucesso.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
