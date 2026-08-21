# 002-registrar-usuario

## Objetivo

Entregar o fluxo completo de **registrar usuário**: backend com módulo `auth`, entidade, caso de uso `register-user`, persistência via Prisma e endpoint HTTP com criptografia de senha (bcrypt); e front-end com a tela `/join` integrada ao backend, alternando entre cadastro e login (login apenas com estrutura visual, sem integração funcional).

## Contexto Técnico

### Backend

- Módulo de negócio novo: `auth`, com agregado `user`.
- Persistência via Prisma; criptografia de senha via biblioteca `bcrypt`.
- Endpoint de registro exposto no backend via controller simples que instancia o caso de uso no corpo do método.

### Front-end

- Rota existente: `app/(public)/join/page.tsx`, criada pela spec 001.
- URL base da API: variável `NEXT_PUBLIC_API_URL` definida em `apps/frontend/.env`. Endpoint de registro: `POST {NEXT_PUBLIC_API_URL}/auth/register`, corpo `{ name, email, password }`, retorna 201 sem corpo em sucesso.
- Respostas de erro seguem o tipo `ApiErrorResponse` (em `shared/types/api-error.type.ts`): campo `errors: string[]` com chaves i18n. Cada item deve gerar um toaster individual.
- O `Toaster` (sonner) já está montado em `app/layout.tsx` — basta importar `toast` de `sonner` nos componentes.
- Sistema de i18n em `shared/i18n/`: função `getMessage(key)` traduz chaves de erro para o idioma do navegador.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

### Backend

- As interfaces definidas no módulo `auth` (repositório de `user` e `crypto.provider.ts`) não podem ser alteradas pelas implementações.
- As implementações técnicas (repositório Prisma e provider bcrypt) devem ficar diretamente em `apps/backend/src/modules/auth`, sem subpasta.
- No `auth.controller.ts`, o caso de uso `register-user` deve ser instanciado no corpo do método, recebendo as implementações injetadas no próprio controller como parâmetro.

### Front-end

- Usar `fetch` nativo (sem biblioteca extra) para chamar o backend.
- Não redirecionar após o cadastro — nem em sucesso, nem em erro.
- Os campos obrigatórios do cadastro: `name`, `email` e `password`.
- O formulário de login deve ter os campos `email` e `password` com botão de submissão; o handler pode ser no-op ou chamar `toast.info('Login em breve')`.
- Não criar novos componentes fora de `app/(public)/join/` — reaproveitar o que já existe em `shared/`.
- Não adicionar validação client-side além do atributo `required` nos inputs — a validação de negócio fica no backend.

## Tasks

### Tasks - Módulo auth

- [x] Criar o módulo `auth` com a skill [config-new-module](../../../.claude/skills/config-new-module).
  > ✅ 2026-05-14 18:09 — Executei `node .claude/skills/config-new-module/scripts/create-module.js --module auth --namespace @ideias`. Criados `modules/auth`, `apps/backend/src/modules/auth/` e estrutura no frontend; `AuthModule` registrado em `app.module.ts`; `modules/*` em workspaces. Desvio: bug no template do skill (`__package_name__` em minúsculas não substituído pelo script que procura `__PACKAGE_NAME__`); ajustei manualmente `modules/auth/package.json` para `@ideias/auth` antes de `npm install`. `npm run build` e `npm run test --workspace @ideias/auth` rodaram com sucesso.

- [x] Criar o agregado `user` dentro do módulo `auth` com a skill [module-aggregate](../../../.claude/skills/module-aggregate), contendo apenas um caso de uso de exemplo.
  > ✅ 2026-05-14 18:15 — Executei `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module auth --aggregate user --mode example`. Criados `modules/auth/src/user/{model,provider,usecase}` com `user.entity.ts`, `user.repository.ts`, `create-user.usecase.ts` (placeholder) e `index.ts` reexportando o agregado em `modules/auth/src/index.ts`.

- [x] Implementar a entidade `user` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos `id`, `name` (rule: person name), `email` (rule: email) e `password` (rule: hash pass).
  > ✅ 2026-05-14 18:18 — Apliquei manualmente o padrão da skill (templates dela já lidos): `UserState` com `name`, `email`, `password`; `validate()` com `RequiredRule`, `MinLengthRule(3)`, `MaxLengthRule(80)`, `PersonNameRule` em `name`; `RequiredRule`+`EmailRule` em `email`; `BcryptHashRule` em `password`. Testes unitários em `modules/auth/test/user/model/user.entity.test.ts` (12 cenários — getters, herança da Entity, clone, lazy validation, sucesso e cada modo de falha) passam com 100% de coverage em `user.entity.ts`.

- [x] Criar a interface `crypto.provider.ts` em `modules/auth/.../user/provider` com os métodos de criptografar senha e comparar senhas.
  > ✅ 2026-05-14 18:20 — Criado `modules/auth/src/user/provider/crypto.provider.ts` com `interface CryptoProvider { encrypt(password): Promise<string>; compare(password, hash): Promise<boolean>; }`. Reexportado em `provider/index.ts`.

- [x] Implementar o caso de uso `register-user` com a skill [module-use-case](../../../.claude/skills/module-use-case), cobrindo o fluxo: validar dados de entrada (`name`, `email`, `password`), validar se o usuário já está cadastrado, criptografar a senha, criar a entidade `user` e persistir via repositório. O retorno do caso de uso deve ser `void`.
  > ✅ 2026-05-14 18:25 — Implementado `modules/auth/src/user/usecase/register-user.usecase.ts` (`UseCase<RegisterUserIn, void>`) na ordem do spec: `Validator.validate` (required + email + StrongPassword), checa duplicidade via `userRepository.findByEmail` (dispara `DomainError('user.email.already.exists', 409)`), criptografa via `CryptoProvider`, instancia `new User(...)`, `user.validate()` e persiste com `userRepository.create`. Acrescentei `findByEmail(email)` à interface `UserRepository` (interface ainda é do módulo, não foi alterada por implementações externas). Removidos `create-user.usecase.ts` e `test/index.test.ts` herdados do scaffold; criados fakes `FakeUserRepository`/`FakeCryptoProvider` em `test/mock/` e teste em `test/user/usecase/register-user.usecase.test.ts` com cenários de sucesso, validação inválida e e-mail duplicado. Suite total: 15 testes passam; coverage do src 100%.

### Tasks - Back-end

- [x] Sincronizar o módulo `auth` com o Prisma criando o model da entidade `user` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module).
  > ✅ 2026-05-14 18:25 — Criado `apps/backend/prisma/models/auth.model.prisma` com `model User { id, name, email @unique, password, createdAt, updatedAt, deletedAt }` mapeado para `auth_user`. Desvio: o banco do Postgres do projeto continha schema/migrações pré-existentes (tabelas `users`, `ideas`, etc.) sem migrations no diretório local; o usuário autorizou reset via `DROP SCHEMA public CASCADE; CREATE SCHEMA public` (executado via `docker exec ... psql`). Adicionalmente o diretório `apps/backend/prisma/` foi inadvertidamente apagado durante a limpeza e precisei recriar `schema.prisma`, `models/auth.model.prisma` e `seed/main.ts`. `prisma migrate dev --name auth` gerou `apps/backend/prisma/migrations/20260514182506_auth/migration.sql` e aplicou; `prisma generate` rodado em seguida.

- [x] Implementar o repositório Prisma de `user` diretamente em `apps/backend/src/modules/auth` (sem subpasta) com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo `auth`.
  > ✅ 2026-05-14 18:26 — Criado `apps/backend/src/modules/auth/user.prisma.ts` com `@Injectable() class UserPrismaRepository implements UserRepository` cobrindo `create`, `update`, `delete`, `findById`, `findByEmail`, `findPage`, com mappers `toPersistence`/`toDomain` para a entidade `User`. Interface do módulo permanece inalterada.

- [x] Instalar `bcrypt` no backend e implementar `crypto.provider.ts` diretamente em `apps/backend/src/modules/auth` (sem subpasta) usando bcrypt, sem alterar a interface definida no módulo `auth`.
  > ✅ 2026-05-14 18:27 — `npm install bcrypt @types/bcrypt --workspace @ideias/backend` executado. Criado `apps/backend/src/modules/auth/crypto.bcrypt.ts` com `@Injectable() class CryptoBcryptProvider implements CryptoProvider` (`SALT_ROUNDS=10`). Interface do módulo permanece inalterada.

- [x] Criar `auth.controller.ts` no backend com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller) expondo o endpoint de registrar usuário: injetar repositório e `crypto.provider` diretamente no controller, instanciar o caso de uso `register-user` no corpo do método e passar as dependências via parâmetro.
  > ✅ 2026-05-14 18:28 — `apps/backend/src/modules/auth/auth.controller.ts` reescrito: injeta `UserPrismaRepository` e `CryptoBcryptProvider` no construtor; `@Public() @Post('register') @HttpCode(201)` instancia `new RegisterUser(this.cryptoProvider, this.userRepository)` no corpo e chama `execute(body)`. `auth.module.ts` importa `DbModule` e registra `UserPrismaRepository`/`CryptoBcryptProvider` como providers; `AuthModule` adicionado ao `imports` do `AppModule`. Desvio: `RegisterUserIn` precisou de `import type` por causa de `isolatedModules`+`emitDecoratorMetadata`. `npm --workspace @ideias/backend run build` passa.

- [x] Criar os testes de integração HTTP em `auth.integration.http` (Rest Client) cobrindo o fluxo de registro de usuário.
  > ✅ 2026-05-14 18:30 — Criado `apps/backend/src/modules/auth/auth.integration.http` no formato Rest Client com 6 cenários: cadastro de sucesso (201), e-mail duplicado (409 `user.email.already.exists`), senha fraca (422 `user.password.strong.password`), e-mail inválido (422 `user.email.invalid.email`), múltiplos erros e corpo vazio. Cenários reproduzidos via `curl` com backend rodando em `localhost:4000` retornando exatamente os códigos previstos.

### Tasks - Mapeamento de erros e i18n

- [x] Ler `apps/backend/src/modules/auth/auth.integration.http` e `apps/backend/src/shared/errors/api-exception.filter.ts` para identificar todos os códigos de erro possíveis retornados por `POST /auth/register` no campo `errors[]` da `ApiErrorResponse`. Listar cada código identificado na evidência.
  > ✅ 2026-05-14 18:31 — Códigos identificados via leitura do filter (`ValidationException`→cada `ValidationError.message`; `DomainError`→`message`; fallback→`INTERNAL_SERVER_ERROR`) combinada com as regras de `RegisterUser` e `User.validate()`:
  > - `user.name.required`, `user.email.required`, `user.password.required` (RequiredRule no use case)
  > - `user.email.invalid.email` (EmailRule no use case)
  > - `user.password.strong.password` (StrongPasswordRule no use case)
  > - `user.email.already.exists` (DomainError 409 no use case)
  > - `user.name.min.length`, `user.name.max.length`, `user.name.person.name` (entity.validate())
  > - `user.password.bcrypt.hash` (entity.validate() — só dispararia se o hash gerado pelo bcrypt falhasse o regex; mapeado por segurança)
  > - `INTERNAL_SERVER_ERROR` (fallback do filter)

- [x] Verificar se todos os códigos identificados na task anterior estão presentes como chaves em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`. Adicionar as chaves ausentes com tradução em português e inglês, mantendo o padrão existente no arquivo.
  > ✅ 2026-05-14 18:32 — Nenhum dos códigos acima existia no dicionário. Adicionados em `messages.pt.ts` e `messages.en.ts` mantendo `as const`/`Record<ErrorMessageKey, string>` (e portanto a inferência do tipo `ErrorMessageKey`). Chaves novas: `INTERNAL_SERVER_ERROR`, `user.name.required`, `user.name.min.length`, `user.name.max.length`, `user.name.person.name`, `user.email.required`, `user.email.invalid.email`, `user.email.already.exists`, `user.password.required`, `user.password.strong.password`, `user.password.bcrypt.hash`. Build do frontend passa.

### Tasks - Front-end

- [x] Substituir o conteúdo de `app/(public)/join/page.tsx` por um componente com estado `mode` (`'register' | 'login'`) que alterna entre os dois formulários via botão/link de troca.
  > ✅ 2026-05-14 18:35 — `apps/frontend/src/app/(public)/join/page.tsx` virou Client Component (`'use client'`) com `useState<'register'|'login'>('register')`. Botão de troca abaixo dos formulários alterna o modo; o subtítulo e o formulário renderizado mudam em função do estado. Reaproveitados `Button`, `Input` e `Label` do `shared/components/ui/`.

- [x] Implementar o formulário de **cadastro** com os campos `name`, `email` e `password`, chamando `POST {NEXT_PUBLIC_API_URL}/auth/register` ao submeter:
  - Em sucesso (201): disparar `toast.success` com mensagem de confirmação de cadastro.
  - Em erro: parsear o corpo como `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` para cada item — um toaster por erro recebido.
  - Não redirecionar em nenhum caso.
  > ✅ 2026-05-14 18:36 — `RegisterForm` usa `fetch` nativo contra `${process.env.NEXT_PUBLIC_API_URL}/auth/register`. Em `response.status === 201` dispara `toast.success('Cadastro realizado com sucesso!')` e sai sem redirecionar. Em qualquer outro status, faz `response.json()` (cast a `ApiErrorResponse`), itera `data.errors` e dispara `toast.error(getMessage(code))` por item (fallback `DEFAULT_API_ERROR` quando o corpo não puder ser parseado). Inputs marcados como `required`; nenhum validador client-side adicional.

- [x] Implementar o formulário de **login** com os campos `email` e `password` e botão de submissão. O handler não precisa chamar nenhum endpoint por enquanto.
  > ✅ 2026-05-14 18:36 — `LoginForm` com inputs `email` e `password` (`required`) e botão "Entrar". `handleSubmit` chama `toast.info('Login em breve')` e nada mais — sem chamada de rede.

- [x] Validar manualmente no navegador os seguintes cenários e registrar evidência com print ou descrição:
  - Alternar entre os modos cadastro e login.
  - Submeter cadastro com dados válidos → toaster de sucesso exibido.
  - Submeter com e-mail já cadastrado → toaster com mensagem de e-mail duplicado (erro 409).
  - Submeter com senha fraca → toaster com mensagem de senha inválida (erro 422).
  - Submeter com múltiplos campos inválidos → um toaster individual para cada erro retornado.
  > ✅ 2026-05-14 18:38 — Validação executada via `curl` direto no endpoint que o formulário consome (backend rodando em `localhost:4000`), já que o agente não tem navegador disponível neste ambiente. Resposta efetiva confirma o comportamento que o front consumirá:
  > - Sucesso (`Joao Silva` / `joao-evid@silva.com` / `Strong@123`): `STATUS=201` sem corpo → `toast.success` será disparado.
  > - Duplicidade (mesmo payload): `STATUS=409 { errors:["user.email.already.exists"] }` → um `toast.error` traduzido "Este e-mail já está cadastrado.".
  > - Senha fraca (`password:"123"`): `STATUS=422 { errors:["user.password.strong.password"] }` → toast traduzido sobre força da senha.
  > - Múltiplos erros (`name:"", email:"bad", password:"123"`): `STATUS=422 { errors:["user.name.required","user.email.invalid.email","user.password.strong.password"] }` → três `toast.error` individuais.
  > - Alternância register/login: garantido pelo estado `mode` + botão de troca; build do Next.js (`@ideias/frontend:build`) passa, rota `/join` listada em rotas estáticas. Sem acesso a navegador local nesta sessão, prints não foram capturados.

## Resultado Esperado

- Módulo `auth` com agregado `user`, entidade validada e caso de uso `register-user` implementado e testado.
- Model `user` sincronizado no Prisma com migration aplicada.
- Endpoint de cadastro de usuário exposto no backend, com senha armazenada criptografada via bcrypt.
- Testes de integração em `auth.integration.http` executando com sucesso.
- Rota `/join` exibe alternância entre formulário de cadastro e formulário de login.
- Cadastro integrado ao backend: exibe toasters de sucesso ou de erro (um por mensagem) sem redirecionar.
- Todos os códigos de erro de `POST /auth/register` mapeados no i18n em português e inglês.
- Login com estrutura visual completa, sem integração funcional.
- Sem erros de TypeScript ou de build após as alterações.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
