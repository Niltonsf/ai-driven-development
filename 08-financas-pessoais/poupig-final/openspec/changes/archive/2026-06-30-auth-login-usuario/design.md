## Context

O módulo `auth` já possui o caso de uso `create-user.use-case.ts`, repositórios Prisma (`user.prisma`, `password.prisma`), provider bcrypt (`password-crypto.bcrypt`), e o `auth.controller` com o endpoint de registro. O frontend já possui `auth-api.client.ts` com `registerUser`, e `use-auth.ts` com um `login` stub que não chama nenhum endpoint. O objetivo desta mudança é completar o fluxo de autenticação end-to-end.

Padrão estabelecido pelo caso de uso `create-user`:
- Use cases vivem em `modules/auth/src/app/use-case/`
- Recebem repositórios e providers via construtor (sem DI do NestJS — instanciados diretamente no controller)
- Retornam `Result<T>` do `@poupig/shared`
- Controller mapeia falhas para exceções HTTP

## Goals / Non-Goals

**Goals:**
- Implementar `authenticate-user.use-case.ts` no módulo de domínio seguindo o padrão `create-user`
- Adicionar endpoint `POST /auth/login` no `auth.controller` com emissão de JWT
- Substituir o stub de `login` no `use-auth.ts` pela chamada real ao endpoint
- Criar `auth.context.tsx` com `AuthProvider` e `useAuth` para estado global do usuário
- Criar `auth-guard.component.tsx` para proteger rotas privadas
- Integrar menu de usuário no cabeçalho da área privada

**Non-Goals:**
- Tela de perfil de usuário
- Refresh token / expiração de sessão
- Logout endpoint no backend (basta limpar o estado no cliente)
- Alteração do modelo de dados Prisma

## Decisions

### 1. Use case sem TransactionManager
O `authenticate-user` apenas lê dados (não escreve) e não usa `runInTransaction`. Diferente do `create-user`, recebe apenas `UserRepository`, `PasswordRepository` e `PasswordCryptoProvider`.

### 2. Erros do use case
Definir `AuthenticateUserErrors` com `USER_NOT_FOUND` e `INVALID_CREDENTIALS`. O controller mapeia ambos para `401 Unauthorized` (não revelar qual credencial está incorreta).

### 3. Emissão de JWT no controller
O `JwtService` do `@nestjs/jwt` já está configurado no `auth.module`. O controller recebe `JwtService` via injeção e chama `jwtService.sign({ sub: user.id, email: user.email })` após autenticação bem-sucedida.

### 4. Refatoração de `use-auth.ts` → separação de responsabilidades
O `use-auth.ts` atual mistura estado local de formulário com a lógica de autenticação. Com a introdução do `auth.context`, `useAuth` passa a ser o hook do contexto (token + user data). A lógica de submissão do formulário fica em hooks separados (`use-register.ts`, `use-login.ts`) ou permanece em `use-auth.ts` renomeado — a decisão de nomenclatura fica para a implementação, mas o contrato público de `useAuth` deve expor `{ token, user, setAuth, clearAuth }`.

**Alternativa considerada**: manter `use-auth.ts` como está e adicionar o contexto separado. Rejeitada porque criaria dois `useAuth` ambíguos no mesmo módulo.

### 5. Persistência do token
Cookie via `js-cookie` (ou API nativa `document.cookie`) no `AuthProvider`. O cookie armazena o token com as flags `path=/` e `SameSite=Lax`. Não usar `HttpOnly` neste escopo porque o guard client-side precisa ler o valor via JavaScript; cookies HttpOnly exigiriam validação no servidor (middleware Next.js ou API route), o que está fora de escopo.

**Alternativa rejeitada**: `localStorage` — descartada por ser vetorizada por XSS sem nenhuma proteção adicional; cookies com `SameSite=Lax` oferecem proteção CSRF sem custo de implementação.

### 6. Auth guard como componente React (não middleware Next.js)
O guard é um componente que usa `useAuth` e redireciona via `useRouter`. Compatível com o padrão de layout de grupos de rotas já existente (`(private)` layout). Lê o token do cookie via JavaScript (cookie não-HttpOnly), o que é compatível com a escolha da decisão 5.

## Risks / Trade-offs

- **Cookie não-HttpOnly ainda é lido por JavaScript** → Mais seguro que localStorage (proteção CSRF via `SameSite=Lax`), mas ainda vulnerável a XSS. Mitigação futura: migrar para cookie HttpOnly com validação no servidor.
- **401 genérico para credenciais inválidas** → Intencional (não revelar se o email existe). Cobre ambos `USER_NOT_FOUND` e `INVALID_CREDENTIALS`.
- **Renomear contrato de `useAuth`** → Pode quebrar usos existentes do hook no frontend. Mitigação: verificar todos os consumers antes de alterar a assinatura.
- **JWT sem expiração configurada** → Usar o padrão do `JwtModule` já configurado (verificar `auth.module.ts`). Não introduzir refresh token neste escopo.

## Migration Plan

1. Criar `authenticate-user.use-case.ts` e exportar pelo `index.ts` do módulo
2. Atualizar `auth.controller.ts` com o endpoint de login e emissão de JWT
3. Criar testes Rest Client para o endpoint de login
4. Criar `auth.context.tsx` com `AuthProvider` e `useAuth`
5. Refatorar `use-auth.ts` (ou criar hooks separados) para usar o contexto
6. Adicionar `loginUser` em `auth-api.client.ts`
7. Integrar o fluxo de login no `auth-form.component`
8. Criar `auth-guard.component.tsx` e referenciar no layout privado
9. Integrar menu de usuário no cabeçalho da área privada

Rollback: cada passo é aditivo ou localizado — reverter é remover os arquivos adicionados e restaurar os stubs.

## Open Questions

- O `auth.module.ts` já registra o `JwtModule` com `secret` e `signOptions`? Verificar antes de implementar o endpoint de login.
- Qual é o nome exato do arquivo de layout do grupo de rotas privadas para referenciar o guard?
