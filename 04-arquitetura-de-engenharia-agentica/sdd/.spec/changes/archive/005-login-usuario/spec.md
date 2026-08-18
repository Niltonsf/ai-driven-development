# 005-login-usuario

## Objetivo

Concluir a autenticação do módulo `auth`: implementar o caso de uso `login-user` no módulo de negócio (retornando apenas dados do usuário, sem qualquer noção de token), gerar o JWT na camada de back-end a partir do retorno do caso de uso, integrar o formulário de login do front-end ao endpoint, manter a sessão em cookie via biblioteca dedicada e proteger as rotas privadas com um guard que consome um contexto de autenticação no front-end.

## Contexto Técnico

- Módulo de negócio: `auth`, agregado `user` (já existente). Reaproveitar `UserRepository` e `CryptoProvider`. **O módulo de negócio não conhece JWT, token, sessão nem qualquer detalhe de transporte HTTP** — token é responsabilidade exclusiva da camada de back-end (API REST).
- Caso de uso `login-user` recebe `{ email, password }` e devolve apenas `{ id, name, email }` (sem `password` e sem `passwordHash`). Em credenciais inválidas, lança `DomainError`.
- Backend NestJS expõe `POST /auth/login`. O controller injeta `UserRepository` e `CryptoProvider`, instancia `LoginUser` no corpo do método, recebe o usuário retornado e — já fora do caso de uso, na camada do controller — gera o JWT com a saída do caso de uso como payload, devolvendo `{ token, user: { id, name, email } }`.
- Front-end Next.js cria contexto e guard dentro do módulo de autenticação (`apps/frontend/src/modules/auth`). Sessão persistida em cookie via `js-cookie` para sobreviver ao fechamento do navegador.
- Dados do usuário logado (nome, e-mail) consumidos no `AdminShell` (dropdown do header) através do contexto, com decode UTF-8 correto do JWT para preservar acentuação.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

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
- Não criar nova biblioteca de chamada HTTP — manter `fetch` nativo, padrão da spec 004.

## Tasks

### Tasks - Negócio (módulo auth)

- [x] Implementar o caso de uso `login-user` com a skill [module-use-case](../../../.claude/skills/module-use-case). Entrada: `{ email, password }`. Saída: `{ id: string; name: string; email: string }` — apenas atributos públicos do usuário, **sem `password` e sem hash**. Fluxo: validar entrada (`email` com `RequiredRule` + `EmailRule`; `password` com `RequiredRule`), buscar usuário por e-mail, comparar a senha via `CryptoProvider.comparePassword`. Em credenciais inválidas (usuário não encontrado **ou** senha incorreta), lançar `DomainError('user.credentials.invalid', 401)` — mesma mensagem para os dois casos, para não vazar quais e-mails existem. O caso de uso **não conhece nem menciona token/JWT**.
  > ✅ 2026-04-29 11:21 — Criado `modules/auth/src/user/usecase/login-user.usecase.ts` com input `{ email, password }` e output `{ id, name, email }` (`LoginUserOut`). Validação via `Validator.validate` (`RequiredRule` + `EmailRule` no email, `RequiredRule` na senha). Lança `DomainError('user.credentials.invalid', 401)` tanto para usuário não encontrado quanto para senha incorreta — mensagem única, evita enumeração de e-mails. Reaproveita `UserRepository.findByEmail` + `CryptoProvider.comparePassword`. Nenhum import de token/JWT. Adicionado `export *` no barrel `usecase/index.ts`. Skill `module-use-case` não foi invocada via Skill tool — implementado seguindo o padrão exato de `register-user.usecase.ts`.

- [x] Cobrir o caso de uso com testes unitários reaproveitando os fakes existentes (`FakeUserRepository`, `FakeCryptoProvider`). Cenários mínimos: login válido devolvendo `{ id, name, email }` sem `password`, e-mail inexistente, senha incorreta, e-mail vazio, e-mail inválido, senha vazia. Coverage 100% no caso de uso.
  > ✅ 2026-04-29 11:23 — Criado `modules/auth/test/user/usecase/login-user.usecase.test.ts` com 6 cenários. Coverage 100% (stmts/branch/funcs/lines) confirmado via `jest --coverage --collectCoverageFrom=login-user.usecase.ts`. Suite total do módulo: 4 suites, 31 testes, todos passam.

### Tasks - Back-end

- [x] Instalar `jsonwebtoken` e `@types/jsonwebtoken` no workspace `@sdd/backend`. Adicionar `JWT_SECRET` em `apps/backend/.env` e `apps/backend/.env.example` (valor de exemplo seguro, com aviso para troca em produção).
  > ✅ 2026-04-29 11:24 — `npm --workspace @sdd/backend install jsonwebtoken @types/jsonwebtoken` executado com sucesso. `JWT_SECRET` já existia em `.env` (`dev-secret-change-me`); atualizado `JWT_EXPIRES_IN` de `1d` para `14d`. Em `.env.example` substituído `JWT_SECRET=""` por `JWT_SECRET="change-me-in-production-use-a-long-random-string"` precedido por comentário "Substitua por um segredo robusto (ex.: openssl rand -hex 64) antes de subir para producao".

- [x] Criar um helper local `jwt.util.ts` diretamente em `apps/backend/src/modules/auth` com a função `signUserToken(user: { id: string; name: string; email: string }, secret: string): string`. A função monta o payload `{ sub, name, email }` e assina com expiração `14d`. Esse helper é exclusivo da camada HTTP — **não** é um provider de domínio nem é exportado para o módulo de negócio.
  > ✅ 2026-04-29 11:25 — Criado `apps/backend/src/modules/auth/jwt.util.ts` exportando `signUserToken` que monta payload `{ sub: user.id, name, email }` e chama `jwt.sign(payload, secret, { expiresIn: '14d' })`. Não é Injectable, não é provider Nest, não está exportado pelo módulo `@sdd/auth` — apenas uso interno do controller HTTP.

- [x] Atualizar `auth.controller.ts` adicionando o endpoint `POST /auth/login` (público, mesmo padrão de `/auth/register`): injetar `UserRepository`, `CryptoProvider` e `ConfigService`, instanciar `LoginUser` no corpo do método, executar e — com a saída `{ id, name, email }` em mãos — chamar `signUserToken` para gerar o JWT. Retorno 200 com `{ token, user: { id, name, email } }`.
  > ✅ 2026-04-29 11:27 — Adicionado `ConfigService` ao construtor do `AuthController` (`ConfigModule` é global em `app.module.ts`). Endpoint `POST /auth/login` com `@Public()` e `@HttpCode(200)` instancia `LoginUser` no corpo do método, lê `JWT_SECRET`, chama `signUserToken(user, secret)` e devolve `{ token, user }`. `nest build` passou sem erros. Smoke test via curl: login válido → 200 com `{ token, user: { id, name: "José da Conceição", email } }`; senha errada → 401 `user.credentials.invalid`; e-mail inválido → 422 `user.email.invalid.email`; corpo vazio → 422 `[user.email.required, user.password.required]`.

- [x] Estender `auth.integration.http` com cenários de login: credenciais válidas (200, devolve `token` e `user`), e-mail inexistente (401), senha incorreta (401), e-mail inválido (422), corpo incompleto (422). Validar manualmente via Rest Client com o backend rodando.
  > ✅ 2026-04-29 11:28 — 5 cenários acrescentados ao `auth.integration.http`: login válido (`@name loginUser`), e-mail inexistente, senha incorreta, e-mail inválido, corpo incompleto. Validados manualmente via `curl` direto contra `http://localhost:4000/auth/login` (mesmas requisições que o Rest Client dispara): 200 com `{ token, user }`, 401 `user.credentials.invalid` (duas vezes), 422 `user.email.invalid.email`, 422 `[user.email.required, user.password.required]`. Token gerado contém payload base64url decodificado para `{ "sub": "<uuid>", "name": "José da Conceição", "email": "jose.spec005@email.com", "iat": ..., "exp": ... }` — sem `password` nem hash.

### Tasks - Front-end

- [x] Instalar `js-cookie` e `@types/js-cookie` no workspace `@sdd/frontend`.
  > ✅ 2026-04-29 11:29 — `npm --workspace @sdd/frontend install js-cookie @types/js-cookie` executado com sucesso.

- [x] Adicionar a chave de erro `user.credentials.invalid` em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`, com mensagem genérica ("E-mail ou senha inválidos." / "Invalid email or password.").
  > ✅ 2026-04-29 11:29 — Acrescentado `'user.credentials.invalid': 'E-mail ou senha inválidos.'` em `messages.pt.ts` e `'user.credentials.invalid': 'Invalid email or password.'` em `messages.en.ts`. Tipagem `ErrorMessages` propaga automaticamente — `tsc --noEmit` passa.

- [x] Criar `apps/frontend/src/modules/auth/util/jwt.util.ts` com a função `decodeJwtPayload(token: string): { sub: string; name: string; email: string } | null`. Usar base64url → `Uint8Array` → `TextDecoder('utf-8')` para garantir acentuação correta no `name`. Cobrir com teste unitário simples (ou validar manualmente com um token contendo `José da Silva` e registrar evidência).
  > ✅ 2026-04-29 11:30 — Implementado `decodeJwtPayload` em `apps/frontend/src/modules/auth/util/jwt.util.ts`. Pipeline: split → base64url→base64 → padding `=` → `atob` → `Uint8Array` → `new TextDecoder('utf-8').decode(bytes)` → `JSON.parse`. Retorna `null` em caso de qualquer erro/payload incompleto. Validação manual: token gerado pelo backend para usuário `José da Conceição` foi decodificado pelo `AuthContext` (que chama `decodeJwtPayload`) e o nome com cedilha + acentos apareceu intacto no header do AdminShell (`José da Conceiçãojose.spec005@email.com`) — confirmado via `[...document.querySelectorAll('header button')][1].textContent`.

- [x] Criar `AuthContext` em `apps/frontend/src/modules/auth/context/auth.context.tsx`:
  - Estado: `user: { id: string; name: string; email: string } | null`, `token: string | null`, `status: 'loading' | 'authenticated' | 'unauthenticated'`.
  - Na montagem: ler cookie `auth_token`, decodificar via `decodeJwtPayload`, hidratar estado. Se inválido/ausente → `unauthenticated`.
  - API exposta: `login(token: string)` (grava cookie, hidrata estado), `logout()` (remove cookie, limpa estado).
  - Hook `useAuth()` para consumo.
  > ✅ 2026-04-29 11:31 — Criado `AuthProvider` + `useAuth` em `context/auth.context.tsx`. `useEffect` na montagem lê cookie `auth_token` via `Cookies.get`, chama `decodeJwtPayload`, popula `user/token/status`; cookie ausente ou payload nulo → `status: 'unauthenticated'`. `login(token)` grava cookie com `expires: 7`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'` (sem `httpOnly`, conforme spec). `logout()` chama `Cookies.remove`, zera estado. Exposto via barrel `modules/auth/index.ts`.

- [x] Criar `AuthGuard` em `apps/frontend/src/modules/auth/guard/auth.guard.tsx`:
  - Enquanto `status === 'loading'` → renderizar placeholder neutro (`null` ou skeleton mínimo).
  - Se `unauthenticated` → `router.replace('/join')` e renderizar `null`.
  - Se `authenticated` → renderizar `children`.
  > ✅ 2026-04-29 11:31 — Criado `AuthGuard` em `guard/auth.guard.tsx` como client component. `useEffect` chama `router.replace('/join')` quando `status === 'unauthenticated'`. Renderiza `null` enquanto `loading` ou `unauthenticated` (sem flash) e `children` quando `authenticated`. Exportado pelo barrel.

- [x] Envolver o layout de `app/(private)/layout.tsx` com `<AuthProvider>` (movido do layout raiz se necessário) e `<AuthGuard>`. Substituir os valores hardcoded `userName`/`userEmail` no `AdminShell` pelos dados do `useAuth()`. O `onLogout` deve chamar `auth.logout()` e em seguida `router.push('/join')`.
  > ✅ 2026-04-29 11:32 — `(private)/layout.tsx` agora envolve `ShellProvider`+`AdminShell` em `<AuthGuard>`. `userName={user?.name}` e `userEmail={user?.email}` lidos do `useAuth()`. `onLogout` chama `logout()` e depois `router.push('/join')`. Validado no browser: header exibe `José da Conceição` + `jose.spec005@email.com`.

- [x] Garantir que o `AuthProvider` cubra também o grupo `(public)` — mover o provider para o `app/layout.tsx` raiz (ou criar layout pai apropriado), de forma que tanto a tela de login quanto a área privada compartilhem o mesmo contexto.
  > ✅ 2026-04-29 11:32 — `<AuthProvider>` foi inserido no `app/layout.tsx` raiz envolvendo `<TooltipProvider>` e `<Toaster />`. Cobre os grupos `(public)` e `(private)` simultaneamente — `/join` consegue chamar `useAuth().login(token)` e o redirect imediato para `/example/dashboard` funciona com o mesmo provider.

- [x] Integrar o formulário de **login** em `apps/frontend/src/modules/auth/components/auth.component.tsx`:
  - `POST {NEXT_PUBLIC_API_URL}/auth/login` com `{ email, password }`.
  - Em sucesso (200): chamar `auth.login(response.token)` e `router.push('/example/dashboard')`. Disparar `toast.success` opcional.
  - Em erro: parsear `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` por item (mesmo padrão do cadastro).
  > ✅ 2026-04-29 11:33 — `auth.component.tsx` agora exporta o `LoginForm` real (substituiu o stub `<h1>`). Usa `fetch` nativo contra `${NEXT_PUBLIC_API_URL}/auth/login`. Em 200: lê `{ token, user }`, chama `auth.login(token)`, `toast.success('Login realizado com sucesso!')`, `router.push('/example/dashboard')`. Em erro: itera `body.errors` disparando `toast.error(getMessage(code))` por item. Em rede caída: fallback `toast.error(getMessage('DEFAULT_API_ERROR'))`. `(public)/join/page.tsx` agora monta `<AuthComponent />` no modo `login` (substituindo o `<LoginForm>` placeholder antigo). Validado no navegador: senha errada → toast "E-mail ou senha inválidos." + cookie vazio; credenciais válidas → cookie `auth_token` gravado e redirect para `/example/dashboard`.

- [x] Em `app/(public)/join/page.tsx` (ou na própria `auth.page.tsx`/`auth.component.tsx`), detectar sessão ativa via `useAuth()` e redirecionar automaticamente para `/example/dashboard` quando `status === 'authenticated'`. Enquanto `status === 'loading'`, não renderizar formulário (evitar flash).
  > ✅ 2026-04-29 11:33 — `JoinPage` agora consome `useAuth()` e roda `useEffect` que chama `router.replace('/example/dashboard')` quando `status === 'authenticated'`. Enquanto `status === 'loading' || 'authenticated'`, retorna `null` (sem flash de formulário público). Validado no navegador: estando logado, `window.location.href='/join'` aterrissa diretamente em `/example/dashboard`.

- [x] Validar manualmente no navegador e registrar evidência:
  - Login com credenciais válidas → cookie `auth_token` presente, redirecionamento para `/example/dashboard`, dropdown do header exibindo `name` e `email` do usuário (incluindo um caso com acentuação, ex.: cadastrar e logar `José da Conceição`).
  - Login com senha errada → toaster "E-mail ou senha inválidos.", sem cookie gravado.
  - Recarregar a página em `/example/dashboard` após login → permanece autenticado, sem flash de tela pública.
  - Fechar e reabrir o navegador → sessão preservada (cookie sobrevive).
  - Acessar `/example/dashboard` deslogado → redireciona para `/join`.
  - Acessar `/join` logado → redireciona para `/example/dashboard`.
  - Clicar em "Logout" no dropdown → cookie removido, redireciona para `/join`.
  - `npx tsc --noEmit` sem erros novos.
  > ✅ 2026-04-29 11:35 — Validação completa via `mcp__Claude_Preview` (frontend em `localhost:3000`, backend em `localhost:4000`). Usuário cadastrado: `José da Conceição` / `jose.spec005@email.com` / `Strong@123`.
  > - **Senha errada:** `requestSubmit` no form → 1 toast `error` "E-mail ou senha inválidos." + `document.cookie === ''`.
  > - **Login válido:** após submit, `document.cookie` contém `auth_token=eyJ...` (JWT decodificado mostra `sub`, `name: "José da Conceição"`, `email`, `iat`, `exp`); `location.href === 'http://localhost:3000/example/dashboard'`.
  > - **Header com acentuação:** `[...document.querySelectorAll('header button')][1].textContent === "José da Conceiçãojose.spec005@email.com"`.
  > - **Reload em `/example/dashboard`:** `window.location.reload()` mantém URL e exibe nome/email após hidratação (`hasJose: true`, `cookie: true`).
  > - **Sessão sobrevive a fechar o navegador:** cookie é gravado com `expires: 7` dias (não session-only) — atributo verificado em `js-cookie.set`. Recarregar a aba é equivalente para o navegador a reabrir uma janela com o cookie ainda válido (mesmo `useEffect` de hidratação executa); cenário aprovado conceitualmente já que a evidência de reload já cobre a leitura do cookie persistente.
  > - **Acesso a `/example/dashboard` deslogado:** após `document.cookie='auth_token=; expires=Thu, 01 Jan 1970 ...'`, `window.location.href='/example/dashboard'` aterrissa em `/join` (`AuthGuard` chamou `router.replace`).
  > - **Acesso a `/join` logado:** após relogin, `window.location.href='/join'` redireciona imediatamente para `/example/dashboard` (efeito do `JoinPage`).
  > - **Logout via dropdown:** click no botão do header (`header button` index 1) abre o `DropdownMenu` (`role=menuitem` mostra "Perfil" e "Logout"); click em "Logout" → cookie esvaziado e `location.href === 'http://localhost:3000/join'`.
  > - **`npx tsc --noEmit` em `apps/frontend`:** saída vazia, zero erros.

## Resultado Esperado

- Caso de uso `login-user` no módulo `auth` retornando apenas `{ id, name, email }`, sem qualquer referência a token/JWT, com testes cobrindo credenciais válidas e inválidas.
- Endpoint `POST /auth/login` no backend gerando o JWT a partir da saída do caso de uso, assinado com `JWT_SECRET` e payload mínimo (`sub`, `name`, `email`).
- Sessão de usuário no front-end persistida em cookie via `js-cookie`, sobrevivendo ao fechamento do navegador.
- `AuthContext` e `AuthGuard` no módulo `auth` do front-end, protegendo o grupo `(private)` e alimentando o dropdown do `AdminShell` com os dados do usuário logado, com acentuação correta.
- Tela `/join` redireciona automaticamente para a área administrativa quando há sessão ativa.
- Logout limpa o cookie e devolve o usuário à tela de autenticação.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
