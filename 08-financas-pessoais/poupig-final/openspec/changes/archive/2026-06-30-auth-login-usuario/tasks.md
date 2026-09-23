## 1. Domínio — Use Case de Autenticação

- [x] 1.1 Criar `modules/auth/src/app/use-case/authenticate-user.use-case.ts` com a classe `AuthenticateUser` que recebe `UserRepository`, `PasswordRepository` e `PasswordCryptoProvider` no construtor
- [x] 1.2 Implementar `execute({ email, password })`: buscar usuário por email (falhar com `USER_NOT_FOUND` se ausente), buscar senha pelo id do usuário, comparar senha com `passwordCryptoProvider.compare` (falhar com `INVALID_CREDENTIALS` se inválida), retornar dados do usuário sem a senha
- [x] 1.3 Definir `AuthenticateUserErrors` com `USER_NOT_FOUND` e `INVALID_CREDENTIALS`
- [x] 1.4 Exportar `AuthenticateUser` e `AuthenticateUserErrors` pelo `modules/auth/src/app/use-case/index.ts` e pelo `modules/auth/src/index.ts`

## 2. Backend — Endpoint de Login e JWT

- [x] 2.1 Verificar que `auth.module.ts` registra `JwtModule` com `secret` e `signOptions`; ajustar se necessário
- [x] 2.2 Injetar `JwtService` no `AuthController` e adicionar o método `login` público (`@Public()`, `@Post('login')`, `@HttpCode(200)`)
- [x] 2.3 No método `login`, instanciar `AuthenticateUser` com os repositórios e crypto injetados, executar o use case e mapear falhas para `UnauthorizedException`
- [x] 2.4 Em caso de sucesso, assinar um JWT (15 dias) com `jwtService.sign({ sub: user.id, email: user.email })` e retornar `{ token, user: { id, name, email, avatarUrl } }`
- [x] 2.5 Criar arquivo de testes Rest Client `apps/backend/src/http/auth-login.http` cobrindo: login com sucesso, email não encontrado (401), senha incorreta (401)

## 3. Frontend — API Client e Context

- [x] 3.1 Adicionar função `loginUser(input: { email, password })` em `apps/frontend/src/modules/auth/data/auth-api.client.ts` que faz `POST /auth/login` e retorna `{ token, user }` ou lança `AuthApiError`
- [x] 3.2 Criar `apps/frontend/src/modules/auth/data/auth.context.tsx` com `AuthProvider` (estado: `token`, `user`), inicialização lendo o token do cookie (`document.cookie` ou `js-cookie`), e `useAuth` hook exportado
- [x] 3.3 `AuthProvider` deve expor funções `setAuth({ token, user })` e `clearAuth()` que gravam/removem o cookie (`path=/`, `SameSite=Lax`) além de atualizar o estado React
- [x] 3.4 Exportar `AuthProvider` e `useAuth` pelo `apps/frontend/src/modules/auth/data/index.ts`
- [x] 3.5 Criar (ou ajustar) `apps/frontend/src/modules/auth/data/use-login.ts` com hook `useLogin` que chama `loginUser`, invoca `setAuth` do contexto e expõe `{ login, isSubmitting, error }`

## 4. Frontend — Formulário de Login

- [x] 4.1 No `auth-form.component`, substituir a chamada ao stub `login` pelo hook `useLogin` (ou equivalente)
- [x] 4.2 Em caso de sucesso no login: exibir toaster de sucesso e redirecionar para `/dashboard`
- [x] 4.3 Em caso de erro no login: exibir mensagem de erro ao usuário sem redirecionar

## 5. Frontend — Auth Guard e Layout Privado

- [x] 5.1 Criar `apps/frontend/src/modules/auth/components/auth-guard.component.tsx` que verifica `useAuth` e redireciona para `/join` se não autenticado
- [x] 5.2 Referenciar `AuthGuard` no layout do grupo de rotas privadas (`(private)/layout.tsx` ou equivalente)
- [x] 5.3 Envolver a aplicação (ou layout raiz) com `AuthProvider` para que `useAuth` esteja disponível em todas as rotas

## 6. Frontend — Menu de Usuário no Cabeçalho

- [x] 6.1 Identificar o componente de cabeçalho da área privada
- [x] 6.2 Integrar `useAuth` no cabeçalho e exibir o nome e avatar do usuário logado (usar placeholder/iniciais se `avatarUrl` for nulo)
