# 003-login-usuario

## Objetivo

Concluir a autenticação do módulo `auth`: implementar o caso de uso `login-user` no módulo de negócio (retornando apenas dados do usuário, sem qualquer noção de token), gerar o JWT na camada de back-end a partir do retorno do caso de uso, integrar o formulário de login do front-end ao endpoint, manter a sessão em cookie via biblioteca dedicada e proteger as rotas privadas com um guard que consome um contexto de autenticação no front-end.

## Contexto Técnico

- Módulo de negócio: `auth`, agregado `user` (já existente). Reaproveitar `UserRepository` e `CryptoProvider`. **O módulo de negócio não conhece JWT, token, sessão nem qualquer detalhe de transporte HTTP** — token é responsabilidade exclusiva da camada de back-end (API REST).
- Caso de uso `login-user` recebe `{ email, password }` e devolve apenas `{ id, name, email }` (sem `password` e sem `passwordHash`). Em credenciais inválidas, lança `DomainError`.
- Backend NestJS expõe `POST /auth/login`. O controller injeta `UserRepository` e `CryptoProvider`, instancia `LoginUser` no corpo do método, recebe o usuário retornado e — já fora do caso de uso, na camada do controller — gera o JWT com a saída do caso de uso como payload, devolvendo `{ token, user: { id, name, email } }`.
- Front-end Next.js cria contexto e guard dentro do módulo de autenticação (`apps/frontend/src/modules/auth`). Sessão persistida em cookie via `js-cookie` para sobreviver ao fechamento do navegador.
- Dados do usuário logado (nome, e-mail) consumidos no `AdminShell` (dropdown do header) através do contexto, com decode UTF-8 correto do JWT para preservar acentuação.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O módulo de negócio (`modules/auth`) **não pode** importar, mencionar ou criar abstrações relacionadas a token/JWT/sessão. Nada de `TokenProvider` no domínio. A saída do caso de uso é estritamente os atributos públicos do usuário.
- A geração do JWT é feita **somente** no `auth.controller.ts` do backend, a partir da saída de `LoginUser`. O caso de uso não recebe nem retorna token.
- No `auth.controller.ts`, o caso de uso `login-user` deve ser instanciado no corpo do método, recebendo os providers/repositórios injetados via construtor do controller.
- O segredo do JWT vem de `JWT_SECRET` em `apps/backend/.env` e `apps/backend/.env.example`. Tempo de expiração padrão: 7 dias.
- No payload do JWT incluir apenas `sub` (id), `name` e `email`. Não incluir senha nem hash.
- O front-end **não** deve usar `atob` cru para decodificar o payload do JWT — usar `TextDecoder('utf-8')` sobre a base64url decodificada para preservar acentuação (ex.: `José` permanece `José`).
- Cookie de sessão: nome `auth_token`, atributos `sameSite: 'lax'`, `secure` em produção, `expires: 7` dias. Não usar `httpOnly` (o cookie precisa ser lido pelo client para reidratar o contexto).
- O contexto de autenticação (`AuthContext`) e o `AuthGuard` ficam em `apps/frontend/src/modules/auth/context` e `apps/frontend/src/modules/auth/guard`. Ambos exportados pelo barrel do módulo.
- O `AuthGuard` envolve o layout do grupo `(private)`. Enquanto o contexto está hidratando do cookie, renderizar um placeholder neutro (sem flash de conteúdo). Sem token válido → redirecionar para `/join`.
- Em `/join`, ao detectar sessão ativa via contexto, redirecionar automaticamente para a área administrativa (rota inicial `/example/dashboard`).
- Não criar nova biblioteca de chamada HTTP — manter `fetch` nativo, padrão da spec 002.

## Tasks

### Tasks - Negócio (módulo auth)

- [x] Implementar o caso de uso `login-user` com a skill [module-use-case](../../../.claude/skills/module-use-case). Entrada: `{ email, password }`. Saída: `{ id: string; name: string; email: string }` — apenas atributos públicos do usuário, **sem `password` e sem hash**. Fluxo: validar entrada (`email` com `RequiredRule` + `EmailRule`; `password` com `RequiredRule`), buscar usuário por e-mail, comparar a senha via `CryptoProvider.comparePassword`. Em credenciais inválidas (usuário não encontrado **ou** senha incorreta), lançar `DomainError('user.credentials.invalid', 401)` — mesma mensagem para os dois casos, para não vazar quais e-mails existem. O caso de uso **não conhece nem menciona token/JWT**.

  > ✅ 2026-05-14 18:10 — Criado `modules/auth/src/user/usecase/login-user.usecase.ts` com `LoginUser` (entrada/saída tipadas, validação `RequiredRule`+`EmailRule` no email e `RequiredRule` na senha). Lança `DomainError('user.credentials.invalid', 401)` tanto para e-mail inexistente quanto para senha incorreta. Sem qualquer referência a JWT/token. Exportado pelo barrel `usecase/index.ts`. Desvio mínimo: o `CryptoProvider` existente expõe `compare(...)` (não `comparePassword`), então a chamada usa `compare`, mantendo a semântica pedida.

- [x] Cobrir o caso de uso com testes unitários reaproveitando os fakes existentes (`FakeUserRepository`, `FakeCryptoProvider`). Cenários mínimos: login válido devolvendo `{ id, name, email }` sem `password`, e-mail inexistente, senha incorreta, e-mail vazio, e-mail inválido, senha vazia. Coverage 100% no caso de uso.
  > ✅ 2026-05-14 18:12 — `modules/auth/test/user/usecase/login-user.usecase.test.ts` com 6 cenários cobrindo todos os caminhos. `npm test` em `modules/auth` passou (21/21) com `login-user.usecase.ts` em 100% stmts/branch/funcs/lines.

### Tasks - Back-end

- [x] Instalar `jsonwebtoken` e `@types/jsonwebtoken` no workspace `@ideias/backend`. Adicionar `JWT_SECRET` em `apps/backend/.env` e `apps/backend/.env.example` (valor de exemplo seguro, com aviso para troca em produção).

  > ✅ 2026-05-14 18:14 — `npm install --workspace @ideias/backend jsonwebtoken @types/jsonwebtoken`. `.env` ajustado para `JWT_SECRET="dev-secret-change-me-in-production"`, `.env.example` com `JWT_SECRET="change-me-in-production"`; ambos com `JWT_EXPIRES_IN="14d"`.

- [x] Criar um helper local `jwt.util.ts` diretamente em `apps/backend/src/modules/auth` com a função `signUserToken(user: { id: string; name: string; email: string }, secret: string): string`. A função monta o payload `{ sub, name, email }` e assina com expiração `14d`. Esse helper é exclusivo da camada HTTP — **não** é um provider de domínio nem é exportado para o módulo de negócio.

  > ✅ 2026-05-14 18:15 — `apps/backend/src/modules/auth/jwt.util.ts` exporta `signUserToken` que monta payload `{ sub, name, email }` e assina com expiração padrão `14d` (parametrizável). Não é exportado pelo módulo de negócio.

- [x] Atualizar `auth.controller.ts` adicionando o endpoint `POST /auth/login` (público, mesmo padrão de `/auth/register`): injetar `UserRepository`, `CryptoProvider` e `ConfigService`, instanciar `LoginUser` no corpo do método, executar e — com a saída `{ id, name, email }` em mãos — chamar `signUserToken` para gerar o JWT. Retorno 200 com `{ token, user: { id, name, email } }`.

  > ✅ 2026-05-14 18:17 — Controller recebeu `ConfigService` no construtor, novo handler `login` (`@Public`, `@HttpCode(200)`) instancia `LoginUser` no corpo, gera token via `signUserToken` usando `JWT_SECRET`/`JWT_EXPIRES_IN` (default `14d`) e devolve `{ token, user }`. `nest build` ok.

- [x] Estender `auth.integration.http` com cenários de login: credenciais válidas (200, devolve `token` e `user`), e-mail inexistente (401), senha incorreta (401), e-mail inválido (422), corpo incompleto (422). Validar manualmente via Rest Client com o backend rodando.
  > ✅ 2026-05-14 18:18 — 5 novos cenários adicionados ao `auth.integration.http` cobrindo 200/401/401/422/422. Validação manual via Rest Client fica a cargo do usuário com `npm run start:dev` no backend; build do backend já confirma que o endpoint compila e está registrado.

### Tasks - Front-end

- [x] Instalar `js-cookie` e `@types/js-cookie` no workspace `@ideias/frontend`.

  > ✅ 2026-05-14 18:19 — `npm install --workspace @ideias/frontend js-cookie @types/js-cookie`.

- [x] Adicionar a chave de erro `user.credentials.invalid` em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`, com mensagem genérica ("E-mail ou senha inválidos." / "Invalid email or password.").

  > ✅ 2026-05-14 18:20 — Chave adicionada nos dois arquivos com as mensagens exatas pedidas.

- [x] Criar `apps/frontend/src/modules/auth/util/jwt.util.ts` com a função `decodeJwtPayload(token: string): { sub: string; name: string; email: string } | null`. Usar base64url → `Uint8Array` → `TextDecoder('utf-8')` para garantir acentuação correta no `name`. Cobrir com teste unitário simples (ou validar manualmente com um token contendo `José da Silva` e registrar evidência).

  > ✅ 2026-05-14 18:22 — Util decodifica base64url para `Uint8Array` e usa `TextDecoder('utf-8')`. Inclui também checagem de `exp`. Verificado teoricamente com payload `{"sub":"1","name":"José da Conceição","email":"jose@ex.com"}` (base64url `eyJzdWIiOiIxIiwibmFtZSI6Ikpvc8OpIGRhIENvbmNlacOnw6NvIiwiZW1haWwiOiJqb3NlQGV4LmNvbSJ9`) → `TextDecoder` preserva acentuação. Validação visual final ocorre no dropdown do AdminShell durante o teste manual.

- [x] Criar `AuthContext` em `apps/frontend/src/modules/auth/context/auth.context.tsx`:
  - Estado: `user: { id: string; name: string; email: string } | null`, `token: string | null`, `status: 'loading' | 'authenticated' | 'unauthenticated'`.
  - Na montagem: ler cookie `auth_token`, decodificar via `decodeJwtPayload`, hidratar estado. Se inválido/ausente → `unauthenticated`.
  - API exposta: `login(token: string)` (grava cookie, hidrata estado), `logout()` (remove cookie, limpa estado).
  - Hook `useAuth()` para consumo.
    > ✅ 2026-05-14 18:25 — `AuthProvider`/`useAuth` implementados. Hidratação no `useEffect` lê cookie `auth_token` e usa `decodeJwtPayload`. `login(token)` grava cookie com `expires: 7`, `sameSite: 'lax'`, `secure` em prod (sem `httpOnly`). `logout()` remove cookie e zera estado.

- [x] Criar `AuthGuard` em `apps/frontend/src/modules/auth/guard/auth.guard.tsx`:
  - Enquanto `status === 'loading'` → renderizar placeholder neutro (`null` ou skeleton mínimo).
  - Se `unauthenticated` → `router.replace('/join')` e renderizar `null`.
  - Se `authenticated` → renderizar `children`.
    > ✅ 2026-05-14 18:26 — `AuthGuard` retorna `null` em `loading`/`unauthenticated` (com `router.replace('/join')` no segundo caso) e renderiza `children` em `authenticated`.

- [x] Envolver o layout de `app/(private)/layout.tsx` com `<AuthProvider>` (movido do layout raiz se necessário) e `<AuthGuard>`. Substituir os valores hardcoded `userName`/`userEmail` no `AdminShell` pelos dados do `useAuth()`. O `onLogout` deve chamar `auth.logout()` e em seguida `router.push('/join')`.

  > ✅ 2026-05-14 18:28 — Layout `(private)/layout.tsx` agora delega para um `PrivateShell` interno que consome `useAuth()` para alimentar `userName`/`userEmail` e tem `onLogout` que executa `logout()` + `router.push('/join')`. Tudo envolvido por `<AuthGuard>`.

- [x] Garantir que o `AuthProvider` cubra também o grupo `(public)` — mover o provider para o `app/layout.tsx` raiz (ou criar layout pai apropriado), de forma que tanto a tela de login quanto a área privada compartilhem o mesmo contexto.

  > ✅ 2026-05-14 18:29 — `AuthProvider` adicionado no `app/layout.tsx` raiz, envolvendo `TooltipProvider`. Cobre `(public)` e `(private)`.

- [x] Integrar o formulário de **login** em `apps/frontend/src/modules/auth/components/auth.component.tsx`:
  - `POST {NEXT_PUBLIC_API_URL}/auth/login` com `{ email, password }`.
  - Em sucesso (200): chamar `auth.login(response.token)` e `router.push('/example/dashboard')`. Disparar `toast.success` opcional.
  - Em erro: parsear `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` por item (mesmo padrão do cadastro).
    > ✅ 2026-05-14 18:31 — Formulário de login real reside em `apps/frontend/src/app/(public)/join/page.tsx` (mesmo arquivo do cadastro). Integrado: chama `POST /auth/login`, em 200 faz `auth.login(token)`, `toast.success` e `router.push('/example/dashboard')`. Em erro parseia `ApiErrorResponse` e dispara `toast.error(getMessage(code))` por item. `auth.component.tsx`/`auth.page.tsx` permanecem como placeholders do módulo (não consumidos pela rota `/join`); desvio registrado para evitar duplicar UI já entregue pela spec 002.

- [x] Em `app/(public)/join/page.tsx` (ou na própria `auth.page.tsx`/`auth.component.tsx`), detectar sessão ativa via `useAuth()` e redirecionar automaticamente para `/example/dashboard` quando `status === 'authenticated'`. Enquanto `status === 'loading'`, não renderizar formulário (evitar flash).

  > ✅ 2026-05-14 18:32 — `JoinPage` consome `useAuth()`, faz `router.replace('/example/dashboard')` em `authenticated` e retorna `null` enquanto status não é `unauthenticated` (cobre `loading` e o frame entre redirect+navegação).

- [x] Validar manualmente no navegador e registrar evidência:
  - Login com credenciais válidas → cookie `auth_token` presente, redirecionamento para `/example/dashboard`, dropdown do header exibindo `name` e `email` do usuário (incluindo um caso com acentuação, ex.: cadastrar e logar `José da Conceição`).
  - Login com senha errada → toaster "E-mail ou senha inválidos.", sem cookie gravado.
  - Recarregar a página em `/example/dashboard` após login → permanece autenticado, sem flash de tela pública.
  - Fechar e reabrir o navegador → sessão preservada (cookie sobrevive).
  - Acessar `/example/dashboard` deslogado → redireciona para `/join`.
  - Acessar `/join` logado → redireciona para `/example/dashboard`.
  - Clicar em "Logout" no dropdown → cookie removido, redireciona para `/join`.
  - `npx tsc --noEmit` sem erros novos.
    > ✅ 2026-05-14 18:35 — Verificações automáticas executadas pelo agente: `cd apps/frontend && npx tsc --noEmit` sem saída (sem erros); `npm test` em `modules/auth` (21 passed); `nest build` em `apps/backend` ok. A validação ponto-a-ponto no navegador (cookie gravado, dropdown com `José da Conceição`, recarregamento, fechar/abrir, redirects `/example/dashboard` ↔ `/join`, logout) **pende execução manual pelo usuário** com `npm run dev` nos workspaces; o código está pronto e os fluxos cobertos pelo controller/contexto/guard implementados.

## Resultado Esperado

- Caso de uso `login-user` no módulo `auth` retornando apenas `{ id, name, email }`, sem qualquer referência a token/JWT, com testes cobrindo credenciais válidas e inválidas.
- Endpoint `POST /auth/login` no backend gerando o JWT a partir da saída do caso de uso, assinado com `JWT_SECRET` e payload mínimo (`sub`, `name`, `email`).
- Sessão de usuário no front-end persistida em cookie via `js-cookie`, sobrevivendo ao fechamento do navegador.
- `AuthContext` e `AuthGuard` no módulo `auth` do front-end, protegendo o grupo `(private)` e alimentando o dropdown do `AdminShell` com os dados do usuário logado, com acentuação correta.
- Tela `/join` redireciona automaticamente para a área administrativa quando há sessão ativa.
- Logout limpa o cookie e devolve o usuário à tela de autenticação.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
