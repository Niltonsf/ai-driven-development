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

- [ ] Ler `apps/backend/src/modules/auth/auth.integration.http` e `apps/backend/src/shared/errors/api-exception.filter.ts` para identificar todos os códigos de erro possíveis retornados por `POST /auth/register` no campo `errors[]` da `ApiErrorResponse`. Listar cada código identificado na evidência.

- [ ] Verificar se todos os códigos identificados na task anterior estão presentes como chaves em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`. Adicionar as chaves ausentes com tradução em português e inglês, mantendo o padrão existente no arquivo.

### Tasks - Front-end

- [ ] Substituir o conteúdo de `app/(public)/join/page.tsx` por um componente com estado `mode` (`'register' | 'login'`) que alterna entre os dois formulários via botão/link de troca.

- [ ] Implementar o formulário de **cadastro** com os campos `name`, `email` e `password`, chamando `POST {NEXT_PUBLIC_API_URL}/auth/register` ao submeter:
  - Em sucesso (201): disparar `toast.success` com mensagem de confirmação de cadastro.
  - Em erro: parsear o corpo como `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` para cada item — um toaster por erro recebido.
  - Não redirecionar em nenhum caso.

- [ ] Implementar o formulário de **login** com os campos `email` e `password` e botão de submissão. O handler não precisa chamar nenhum endpoint por enquanto.

- [ ] Validar manualmente no navegador os seguintes cenários e registrar evidência com print ou descrição:
  - Alternar entre os modos cadastro e login.
  - Submeter cadastro com dados válidos → toaster de sucesso exibido.
  - Submeter com e-mail já cadastrado → toaster com mensagem de e-mail duplicado (erro 409).
  - Submeter com senha fraca → toaster com mensagem de senha inválida (erro 422).
  - Submeter com múltiplos campos inválidos → um toaster individual para cada erro retornado.

## Resultado Esperado

- Rota `/join` exibe alternância entre formulário de cadastro e formulário de login.
- Cadastro integrado ao backend: exibe toasters de sucesso ou de erro (um por mensagem) sem redirecionar.
- Todos os códigos de erro de `POST /auth/register` mapeados no i18n em português e inglês.
- Login com estrutura visual completa, sem integração funcional.
- Sem erros de TypeScript ou de build após as alterações.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
