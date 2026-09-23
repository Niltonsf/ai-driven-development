## Why

O sistema possui cadastro de usuários, mas ainda não permite autenticação. É necessário implementar o fluxo completo de login — desde a validação de credenciais no domínio até a proteção de rotas no frontend — para que o produto seja utilizável de forma segura.

## What Changes

- Novo caso de uso `authenticate-user.usecase` no módulo de auth que valida email/senha e retorna dados do usuário autenticado
- Endpoint público `POST /auth/login` no `auth.controller` que emite um token JWT como resposta
- Testes de integração (Rest Client) para o endpoint de autenticação
- Fluxo de login no componente `auth-form.component` integrado ao endpoint, com armazenamento do token e redirecionamento para `/dashboard`
- `auth.context` (Context API React) com hook `useAuth` para compartilhar estado do usuário autenticado em toda a aplicação
- Componente `auth-guard.component` que protege rotas privadas e redireciona para `/join` quando não autenticado
- Menu de usuário no cabeçalho da área privada exibindo nome e avatar via `useAuth`

## Capabilities

### New Capabilities

- `authenticate-user-usecase`: Caso de uso de domínio que orquestra busca de usuário por email, busca de senha pelo id do usuário, comparação de senha criptografada e retorno dos dados autenticados
- `auth-login-endpoint`: Endpoint REST público de autenticação com emissão de JWT
- `auth-login-frontend`: Fluxo de login no frontend com integração ao endpoint, gerenciamento de estado e redirecionamento
- `auth-context`: Contexto React com estado global do usuário autenticado e hook `useAuth`
- `auth-guard`: Proteção de rotas privadas com redirecionamento condicional
- `auth-user-menu`: Exibição das informações do usuário logado no cabeçalho da área privada

### Modified Capabilities

- `auth-backend`: Adição de endpoint público de login e geração de JWT no controller existente
- `auth-frontend`: Integração do formulário de auth com API e adição do guard nas rotas privadas

## Impact

- `modules/auth/src/app/usecase/authenticate-user.usecase.ts` — novo arquivo
- `apps/backend/src/modules/auth/auth.controller.ts` — novo método de login
- `apps/backend/src/http/` — novos arquivos de teste Rest Client
- `apps/frontend/src/modules/auth/data/` — nova integração de API, `auth.context.tsx`
- `apps/frontend/src/modules/auth/components/auth-guard.component.tsx` — novo arquivo
- Layout do grupo de rotas privadas — referência ao guard
- Cabeçalho da área privada — integração com `useAuth`
- Dependência: biblioteca JWT no backend (já deve estar presente via `@nestjs/jwt`)
