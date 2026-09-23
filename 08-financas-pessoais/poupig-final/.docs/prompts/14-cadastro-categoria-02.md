# Contexto

As camadas de **Negócio** e **Backend** do cadastro de categoria já foram implementadas nos prompts `11-cadastro-categoria-01.md` e `13-categorias-padrao.md`. Falta apenas o **Frontend**.

Contrato já disponível na API (todos os endpoints protegidos por JWT, `userId` extraído do token):

- `GET /categories` — lista todas as categorias do usuário autenticado (sem paginação), retornando `CategoryDTO[]` com as `subcategories` já ordenadas pelo campo `order`
- `POST /categories` — cria categoria com sua lista de subcategorias
- `PUT /categories/:id` — atualiza a categoria e **reconcilia** a lista de subcategorias (subcategorias existentes vão com `id`, novas vão sem `id`, e as ausentes da lista são removidas)
- `DELETE /categories/:id` — desativa a categoria (exclusão lógica, propagada às subcategorias)
- `POST /categories/default` — aplica as categorias padrão do sistema para o usuário autenticado (categorias já existentes são ignoradas, sem erro)

Formato do payload de `POST`/`PUT`:

```json
{
  "name": "Moradia",
  "icon": "house",
  "color": "#FF5733",
  "isActive": true,
  "subcategories": [
    { "id": "uuid-existente", "name": "Aluguel", "icon": "key", "color": "#FF5733", "isActive": true, "order": 1 },
    { "name": "Condomínio", "icon": "building", "color": "#FF5733", "isActive": true, "order": 2 }
  ]
}
```

# Frontend

- Criar a página `categories.page.tsx` em `apps/frontend/src/modules/category/pages` que lista as categorias do usuário autenticado. A lista deve exibir: nome, cor (indicador visual), ícone, situação (ativa/inativa) e a quantidade de subcategorias. Rota: `/categories` (criar `apps/frontend/src/app/(private)/categories/page.tsx` apenas delegando para a página do módulo, no mesmo padrão de `/accounts` e `/cards`). A rota `/category` continua existindo com o dashboard do módulo — não removê-la.

  A página alterna entre os modos `list` e `form` no mesmo layout (sem modal), seguindo o padrão de `credit-cards.page.tsx`. Não implementar paginação, pois `GET /categories` retorna a lista completa.

- Criar o componente `category-list.component.tsx` em `apps/frontend/src/modules/category/components` responsável por renderizar a lista de categorias recebida como prop, com ações de editar e excluir por item. Cada categoria deve permitir expandir/recolher para exibir suas subcategorias na ordem definida pelo campo `order`, mostrando nome, ícone, cor e situação de cada subcategoria. Usar `EmptyListState` quando não houver categorias.

- Criar o componente `category-form.component.tsx` em `apps/frontend/src/modules/category/components` com suporte aos fluxos de criação e edição. O formulário **não deve ser implementado via modal** — deve utilizar o componente `form-section-layout` como estrutura de layout, com uma seção para os dados da categoria e outra para as subcategorias.

  - Campos da categoria: `name` (obrigatório), `icon` (usar `icon-combobox`), `color` (usar `color-input`) e `isActive` (apenas no fluxo de edição).
  - Subcategorias: lista dinâmica que permite adicionar, editar, reordenar e remover itens antes de salvar. Usar o componente compartilhado `orderable-object-list` (`apps/frontend/src/shared/components/ui/orderable-object-list.tsx`) para a ordenação, derivando o campo `order` da posição do item na lista (começando em 1) — o usuário não digita o `order` manualmente. Cada subcategoria tem os campos `name` (obrigatório), `icon`, `color` e `isActive`, e as subcategorias já persistidas devem manter o `id` no estado do formulário para que o backend faça a reconciliação corretamente. Ao remover um item da lista, os `order` dos demais devem ser recalculados sequencialmente, sem furos e sem duplicidade.

  Usar validação com schema (mesmo padrão dos formulários existentes no projeto) (skill: frontend-form-schema).

- Separar as chamadas de API e o gerenciamento de estado em `apps/frontend/src/modules/category/data` (o arquivo `index.ts` hoje é apenas um placeholder com `export {}` — substituir pelos exports reais):
  - `category-api.client.ts` — tipos `CategoryDTO`/`SubcategoryDTO`, `SaveCategoryInput` e as funções de chamada à API (listar, criar, atualizar, deletar e aplicar categorias padrão), com uma classe de erro própria no mesmo padrão de `credit-card-api.client.ts`
  - `category.schema.ts` — schema de validação do formulário, incluindo a validação dos itens da lista de subcategorias
  - `use-categories.ts` — hooks do React necessários para consumir os dados e disparar as ações (`useCategories`, `useSaveCategory`, `useDeleteCategory`, `useApplyDefaultCategories`), obtendo o token via `useAuth`

  Exportar os novos arquivos em `apps/frontend/src/modules/category/data/index.ts` e os componentes/página em `apps/frontend/src/modules/category/index.ts`.

- Adicionar na página de listagem um botão **"Aplicar categorias padrão"**, que dispara `POST /categories/default`. Antes de executar, pedir confirmação ao usuário explicando que serão criadas as categorias padrão que ainda não existem e que as já existentes serão ignoradas. Ao final, exibir toaster e atualizar a lista.

- A exclusão deve usar o componente compartilhado `delete-confirmation-dialog`, deixando claro que a categoria será desativada junto com suas subcategorias.

- Traduzir os códigos de erro retornados pela API usando o i18n já existente em `apps/frontend/src/shared/i18n` (`getErrorMessage`). Nenhum código de erro deve aparecer cru na tela. As chaves de categoria já existentes (ex.: `CATEGORY_NAME_ALREADY_EXISTS`, `CATEGORY_NOT_FOUND`, `DUPLICATE_SUBCATEGORY_ORDER`) devem ser reutilizadas; caso falte alguma chave para um código retornado pela API, adicioná-la em `messages.pt.ts` e `messages.en.ts`.

- Alterar o menu lateral da área privada da aplicação (`apps/frontend/src/app/(private)/layout.tsx`) para incluir o link para `/categories` dentro do grupo de cadastros, ao lado dos links de contas e cartões já existentes.

- Em caso de sucesso em qualquer operação (criar, editar, excluir, aplicar categorias padrão), exibir toaster de sucesso e atualizar a lista de categorias. Em caso de falha, exibir toaster de erro com a mensagem traduzida.

> Obs: IMPORTANTE!!! Executar em um subagente com contexto limpo.
