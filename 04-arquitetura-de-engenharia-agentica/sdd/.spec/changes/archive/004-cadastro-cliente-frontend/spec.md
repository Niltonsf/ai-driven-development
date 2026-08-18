# 004-cadastro-cliente-frontend

## Objetivo

Implementar a tela `/join` no front-end com alternância entre **cadastro** e **login**. O cadastro chama `POST /auth/register` no backend. Em sucesso ou erro, exibe toasters — um por mensagem — sem redirecionar. O login terá estrutura visual completa, sem integração funcional por enquanto.

## Contexto Técnico

- Rota existente: `app/(public)/join/page.tsx`, criada pela spec 003.
- URL base da API: variável `NEXT_PUBLIC_API_URL` definida em `apps/frontend/.env`. Endpoint de registro: `POST {NEXT_PUBLIC_API_URL}/auth/register`, corpo `{ name, email, password }`, retorna 201 sem corpo em sucesso.
- Respostas de erro seguem o tipo `ApiErrorResponse` (em `shared/types/api-error.type.ts`): campo `errors: string[]` com chaves i18n. Cada item deve gerar um toaster individual.
- O `Toaster` (sonner) já está montado em `app/layout.tsx` — basta importar `toast` de `sonner` nos componentes.
- Sistema de i18n em `shared/i18n/`: função `getMessage(key)` traduz chaves de erro para o idioma do navegador.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- Usar `fetch` nativo (sem biblioteca extra) para chamar o backend.
- Não redirecionar após o cadastro — nem em sucesso, nem em erro.
- Os campos obrigatórios do cadastro: `name`, `email` e `password`.
- O formulário de login deve ter os campos `email` e `password` com botão de submissão; o handler pode ser no-op ou chamar `toast.info('Login em breve')`.
- Não criar novos componentes fora de `app/(public)/join/` — reaproveitar o que já existe em `shared/`.
- Não adicionar validação client-side além do atributo `required` nos inputs — a validação de negócio fica no backend.

## Tasks

### Tasks - Mapeamento de erros e i18n

- [x] Ler `apps/backend/src/modules/auth/auth.integration.http` e `apps/backend/src/shared/errors/api-exception.filter.ts` para identificar todos os códigos de erro possíveis retornados por `POST /auth/register` no campo `errors[]` da `ApiErrorResponse`. Listar cada código identificado na evidência.
  > ✅ 2026-04-27 17:42 — Códigos identificados via leitura do `register-user.usecase.ts` e das regras de validação em `packages/shared/src/validation/rules/`:
  > - `user.name.required` — nome vazio
  > - `user.name.min.length` — nome com menos de 3 caracteres
  > - `user.name.max.length` — nome com mais de 80 caracteres
  > - `user.name.person.name` — nome sem pelo menos 2 partes separadas por espaço
  > - `user.email.required` — e-mail vazio
  > - `user.email.invalid.email` — e-mail com formato inválido
  > - `user.email.already_registered` — e-mail já cadastrado (DomainError 409)
  > - `user.password.required` — senha vazia
  > - `user.password.strong.password` — senha sem maiúscula, minúscula, número e símbolo (mín. 8 chars)
  > - `INTERNAL_SERVER_ERROR` — erro inesperado (500)

- [x] Verificar se todos os códigos identificados na task anterior estão presentes como chaves em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`. Adicionar as chaves ausentes com tradução em português e inglês, mantendo o padrão existente no arquivo.
  > ✅ 2026-04-27 17:43 — Nenhum dos 10 códigos de erro auth estava presente. Adicionadas todas as chaves em `messages.pt.ts` e `messages.en.ts`. Também adicionado `INTERNAL_SERVER_ERROR` (antes caía no fallback `UNKNOWN_ERROR_CODE`). A tipagem `ErrorMessages = Record<ErrorMessageKey, string>` foi respeitada — `errorMessagesEn` é checado pelo TypeScript automaticamente ao expandir `errorMessagesPt`.

### Tasks - Front-end

- [x] Substituir o conteúdo de `app/(public)/join/page.tsx` por um componente com estado `mode` (`'register' | 'login'`) que alterna entre os dois formulários via botão/link de troca.
  > ✅ 2026-04-27 17:45 — `page.tsx` reescrito como `'use client'` com `useState<'register' | 'login'>('register')`. Botão tipo `button` alterna entre os modos. Alternância validada no navegador: cadastro mostra campos name/email/password com "Criar conta"; login mostra email/password com "Entrar"; subtítulo e texto do botão de troca mudam conforme o modo.

- [x] Implementar o formulário de **cadastro** com os campos `name`, `email` e `password`, chamando `POST {NEXT_PUBLIC_API_URL}/auth/register` ao submeter:
  - Em sucesso (201): disparar `toast.success` com mensagem de confirmação de cadastro.
  - Em erro: parsear o corpo como `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` para cada item — um toaster por erro recebido.
  - Não redirecionar em nenhum caso.
  > ✅ 2026-04-27 17:47 — Formulário implementado em `RegisterForm` dentro de `page.tsx`. Usa `fetch` nativo, `FormData` para leitura dos campos, `toast` do sonner e `getMessage` do i18n. Em sucesso: `form.reset()` + `toast.success`. Em erro: itera `body.errors` disparando um `toast.error(getMessage(code))` por item. Sem redirecionamento em nenhum caso.

- [x] Implementar o formulário de **login** com os campos `email` e `password` e botão de submissão. O handler não precisa chamar nenhum endpoint por enquanto.
  > ✅ 2026-04-27 17:45 — Formulário `LoginForm` implementado com campos email e password e botão "Entrar". Handler dispara `toast.info('Login em breve')`. Validado visualmente no navegador.

- [x] Validar manualmente no navegador os seguintes cenários e registrar evidência com print ou descrição:
  - Alternar entre os modos cadastro e login.
  - Submeter cadastro com dados válidos → toaster de sucesso exibido.
  - Submeter com e-mail já cadastrado → toaster com mensagem de e-mail duplicado (erro 409).
  - Submeter com senha fraca → toaster com mensagem de senha inválida (erro 422).
  - Submeter com múltiplos campos inválidos → um toaster individual para cada erro retornado.
  > ✅ 2026-04-27 17:50 — Todos os cenários validados em localhost:3000/join com backend rodando em localhost:4000. Toasts capturados via `document.querySelectorAll('[data-sonner-toast]')` imediatamente após resposta da API:
  >
  > **Alternar modos:** confirmado via screenshot — modo cadastro exibe 3 campos + "Criar conta" + link "Já tem conta? Entrar"; modo login exibe 2 campos + "Entrar" + link "Não tem conta? Criar conta".
  >
  > **Sucesso (201):** `{ type: "success", text: "Cadastro realizado com sucesso!" }` — formulário resetado após submit (maria.spec004@email.com).
  >
  > **E-mail duplicado (409):** `{ type: "error", text: "Este e-mail já está cadastrado." }` — campos mantidos, sem redirecionamento (joao.spec004@email.com).
  >
  > **Senha fraca (422):** `{ type: "error", text: "A senha deve ter pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo." }` (password "123456").
  >
  > **Múltiplos erros (422):** 3 toasters individuais — `"O nome deve ter pelo menos 3 caracteres."`, `"Informe o nome completo (nome e sobrenome)."`, `"A senha deve ter pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo."` (name="Ca", email="multi@email.com", password="123456"). Backend retornou `errors: ["user.name.min.length", "user.name.person.name", "user.password.strong.password"]` — confirmado via curl.
  >
  > TypeScript: `npx tsc --noEmit` sem erros nos arquivos fonte (único erro em `.next/types/validator.ts`, arquivo gerado pelo framework, preexistente).

## Resultado Esperado

- Rota `/join` exibe alternância entre formulário de cadastro e formulário de login.
- Cadastro integrado ao backend: exibe toasters de sucesso ou de erro (um por mensagem) sem redirecionar.
- Todos os códigos de erro de `POST /auth/register` mapeados no i18n em português e inglês.
- Login com estrutura visual completa, sem integração funcional.
- Sem erros de TypeScript ou de build após as alterações.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
