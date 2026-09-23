## Why

As camadas de negócio (`modules/category`) e de backend (`apps/backend/src/modules/category`) do cadastro de categoria já estão prontas e expõem a API completa (`GET`, `POST`, `PUT`, `DELETE /categories` e `POST /categories/default`), mas o usuário ainda não tem nenhuma tela para usá-las — o módulo `category` no frontend só possui um dashboard placeholder. Sem a interface, o cadastro de categorias e subcategorias (pré-requisito para classificar transações) permanece inacessível pelo app, e a funcionalidade de categorias padrão, já implementada no backend, não pode ser disparada por quem usa o produto.

## What Changes

- Nova página de listagem de categorias do usuário autenticado na rota `/categories`, exibindo nome, cor (indicador visual), ícone, situação (ativa/inativa) e quantidade de subcategorias, com alternância entre os modos `list` e `form` no mesmo layout (sem modal) e sem paginação, já que `GET /categories` retorna a lista completa
- Novo componente de lista com ações de editar e excluir por item e expansão de cada categoria para exibir suas subcategorias na ordem definida por `order`
- Novo formulário de categoria com suporte a criação e edição, usando `form-section-layout`, com os campos da raiz (`name`, `icon`, `color` e `isActive` apenas na edição) e uma lista dinâmica de subcategorias que permite adicionar, editar, reordenar e remover itens antes de salvar, com o `order` derivado da posição na lista (nunca digitado pelo usuário)
- Preservação do `id` das subcategorias já persistidas no estado do formulário, para que o `PUT /categories/:id` faça corretamente a reconciliação (atualizar existentes, criar novas, remover ausentes)
- Nova camada de dados do módulo (`category-api.client.ts`, `category.schema.ts`, `use-categories.ts`) substituindo o placeholder `export {}` de `data/index.ts`
- Novo botão "Aplicar categorias padrão" na listagem, com confirmação prévia, disparando `POST /categories/default`
- Exclusão de categoria via `delete-confirmation-dialog`, deixando explícito que a categoria será desativada junto com suas subcategorias
- Tradução de todos os códigos de erro da API via o i18n existente (`getErrorMessage`), reutilizando as chaves de categoria já presentes e adicionando em `messages.pt.ts`/`messages.en.ts` as que faltarem
- Inclusão do link `/categories` no grupo "Cadastros" do menu lateral da área privada, ao lado de Contas e Cartões
- Sem alteração de contrato de API, de backend ou da camada de negócio — esta mudança é exclusivamente de frontend

## Capabilities

### New Capabilities

- `category-frontend`: interface web do cadastro de categoria — página de listagem em `/categories`, componente de lista com subcategorias expansíveis, formulário de criação/edição com lista dinâmica e ordenável de subcategorias, camada de dados (client de API, schema de validação e hooks), aplicação de categorias padrão pela UI, confirmação de exclusão, tradução de erros via i18n e feedback por toaster

### Modified Capabilities

- `sidebar-navigation`: o grupo "Cadastros" do menu lateral passa a conter também o link `/categories` (Categorias), além dos links de `/accounts` e `/cards` já exigidos

## Impact

- **Frontend** (`apps/frontend/src/modules/category`): novos arquivos em `pages/`, `components/` e `data/`; substituição do placeholder `data/index.ts`; atualização do barrel `index.ts` do módulo
- **Rotas** (`apps/frontend/src/app/(private)`): nova rota `categories/page.tsx` delegando para a página do módulo, no mesmo padrão de `/accounts` e `/cards`; a rota `/category` (dashboard do módulo) permanece inalterada
- **Layout privado** (`apps/frontend/src/app/(private)/layout.tsx`): novo item no grupo "Cadastros" de `NAVIGATION_SECTIONS`
- **i18n** (`apps/frontend/src/shared/i18n`): possível inclusão de chaves faltantes em `messages.pt.ts` e `messages.en.ts`
- **Componentes compartilhados reutilizados** (sem alteração): `form-section-layout`, `icon-combobox`, `color-input`, `orderable-object-list`, `delete-confirmation-dialog`, `empty-list-state`, `lucide-icon-by-key`, `toaster`
- **Sem impacto** em `modules/category`, `apps/backend`, schema Prisma ou contrato REST — a API é consumida como já existe
- **Fora de escopo**: paginação/filtros na listagem de categorias, telas ou endpoints próprios para `subcategory` isolada (continua acessível apenas pela raiz `Category`) e alterações no dashboard do módulo em `/category`
