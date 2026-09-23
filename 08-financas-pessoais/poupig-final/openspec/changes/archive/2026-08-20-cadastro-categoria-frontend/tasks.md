## 1. Camada de dados — client de API

- [x] 1.1 Criar `apps/frontend/src/modules/category/data/category-api.client.ts` com os tipos `SubcategoryDTO`, `CategoryDTO` (com `subcategories: SubcategoryDTO[]`), `SaveSubcategoryInput` (com `id?`) e `SaveCategoryInput` (com `subcategories: SaveSubcategoryInput[]`), espelhando o contrato da API já existente
- [x] 1.2 Implementar a classe `CategoryApiError` (com `statusCode` e `messages`) e os helpers `headers(token)`/`handleError(response)`, no mesmo padrão de `credit-card-api.client.ts`
- [x] 1.3 Implementar `listCategories(token)` chamando `GET /categories` e retornando `CategoryDTO[]` (sem parâmetros de paginação)
- [x] 1.4 Implementar `createCategory(token, input)` (`POST /categories`) e `updateCategory(token, id, input)` (`PUT /categories/:id`), enviando a lista completa de subcategorias no corpo
- [x] 1.5 Implementar `deleteCategory(token, id)` (`DELETE /categories/:id`) e `applyDefaultCategories(token)` (`POST /categories/default`, sem corpo)

## 2. Camada de dados — schema de validação

- [x] 2.1 Criar `apps/frontend/src/modules/category/data/category.schema.ts` usando `v.defineObject` com `name` (obrigatório, `Text`), `icon` (opcional) e `color` (opcional, `HexColor`), seguindo o padrão de `credit-card.schema.ts` (skill: `frontend-form-schema`)
- [x] 2.2 Adicionar ao schema o campo `subcategories` com `v.defineArray({ name: Text, icon: opcional, color: opcional (HexColor) }, { optional: true })`, garantindo que o nome vazio de qualquer subcategoria bloqueie o submit
- [x] 2.3 Exportar o tipo `CategoryFormData` a partir de `v.infer`, acrescendo por interseção os campos de controle não validados por VO (`isActive` da categoria e `id`/`isActive`/`order` de cada subcategoria)

## 3. Camada de dados — hooks e barrels

- [x] 3.1 Criar `apps/frontend/src/modules/category/data/use-categories.ts` com o hook `useCategories`, obtendo o token via `useAuth`, expondo `items`, `isLoading`, `error` e `refresh`, e traduzindo falhas com `getErrorMessage`
- [x] 3.2 Implementar `useSaveCategory` retornando `{ save, isSubmitting }`, onde `save(input, id?)` chama `updateCategory` quando há `id` e `createCategory` quando não há, devolvendo `{ ok: true } | { ok: false; error: string }` com a mensagem já traduzida
- [x] 3.3 Implementar `useDeleteCategory` (`{ remove, isDeleting }`) e `useApplyDefaultCategories` (`{ applyDefaults, isApplying }`) no mesmo formato de retorno
- [x] 3.4 Garantir que todos os hooks retornem falha sem enviar requisição quando não houver token disponível
- [x] 3.5 Substituir o placeholder `export {}` de `apps/frontend/src/modules/category/data/index.ts` pelos exports de `category-api.client`, `category.schema` e `use-categories`

## 4. Componente de lista

- [x] 4.1 Criar `apps/frontend/src/modules/category/components/category-list.component.tsx` recebendo `categories`, `onEdit` e `onDelete` como props e renderizando cada categoria com nome, indicador visual de cor, ícone (`LucideIconByKey`), situação (ativa/inativa) e quantidade de subcategorias
- [x] 4.2 Renderizar `EmptyListState` quando a lista recebida estiver vazia, com título e subtítulo específicos de categorias
- [x] 4.3 Implementar a expansão/recolhimento por categoria com estado local (conjunto de ids expandidos), exibindo as subcategorias na ordem de `order` com nome, ícone, cor e situação, e uma indicação própria quando a categoria não tiver subcategorias
- [x] 4.4 Adicionar as ações de editar e excluir por item, delegando aos callbacks recebidos por prop

## 5. Componente de formulário

- [x] 5.1 Criar `apps/frontend/src/modules/category/components/category-form.component.tsx` com `useForm` + `v.resolver(categorySchema)`, props `category?`, `isSubmitting`, `onSubmit` e `onCancel`, e `FormSectionLayout` com uma seção para os dados da categoria e outra para as subcategorias (sem modal)
- [x] 5.2 Implementar os campos da categoria: `name` (obrigatório), `icon` com `IconCombobox`, `color` com `ColorInput` e `isActive` exibido apenas no fluxo de edição; incluir `useEffect` de `reset` ao receber uma categoria para edição, no padrão de `credit-card-form.component.tsx`
- [x] 5.3 Ligar o campo `subcategories` a um `Controller` que renderiza `OrderableObjectList` com `items`/`onChange` do campo, `setItemOrder={(item, order) => ({ ...item, order })}`, `orderStartsAt={1}` e `getItemKey` baseado em `item.id ?? índice`
- [x] 5.4 Renderizar, para cada subcategoria, os campos `name` (obrigatório), `icon` (`IconCombobox`), `color` (`ColorInput`) e `isActive`, exibindo os erros de validação por item com `FormErrorMessage`
- [x] 5.5 Implementar o botão de adicionar subcategoria, anexando um item novo (sem `id`, `isActive: true`) ao final da lista com `order = quantidade atual + 1`
- [x] 5.6 Preencher a lista com as subcategorias persistidas (mantendo o `id` de cada uma) quando o formulário abrir em modo de edição
- [x] 5.7 No handler de submit, montar o payload reatribuindo `order = index + 1` a cada subcategoria, preservando o `id` das existentes, omitindo `id` nas novas e enviando apenas os itens presentes na lista

## 6. Página e rota

- [x] 6.1 Criar `apps/frontend/src/modules/category/pages/categories.page.tsx` com alternância entre os modos `list` e `form` no mesmo layout, consumindo `useCategories`, `useSaveCategory`, `useDeleteCategory` e `useApplyDefaultCategories`, sem paginação
- [x] 6.2 Renderizar cabeçalho com botão "Nova categoria", estado de carregamento, estado de erro (mensagem traduzida) e o `CategoryListComponent`
- [x] 6.3 Implementar os fluxos de criar e editar: abrir o formulário no modo correspondente, submeter via `save`, e em caso de sucesso exibir toaster, recarregar a listagem e voltar ao modo `list`
- [x] 6.4 Implementar a exclusão com `DeleteConfirmationDialog`, exibindo o nome da categoria e informando que ela será desativada junto com suas subcategorias; disparar `DELETE` apenas após a confirmação
- [x] 6.5 Adicionar o botão "Aplicar categorias padrão" com confirmação prévia explicando que apenas as categorias ainda inexistentes serão criadas e que as já existentes serão ignoradas; disparar a chamada apenas após a confirmação
- [x] 6.6 Exibir toaster de sucesso e recarregar a listagem após criar, editar, excluir e aplicar categorias padrão; exibir toaster de erro com a mensagem traduzida em caso de falha
- [x] 6.7 Criar a rota `apps/frontend/src/app/(private)/categories/page.tsx` delegando para `CategoriesPage`, no mesmo padrão de `/accounts` e `/cards`, mantendo a rota `/category` (dashboard do módulo) inalterada
- [x] 6.8 Atualizar o barrel `apps/frontend/src/modules/category/index.ts` exportando a nova página e os novos componentes, junto com os exports já existentes

## 7. Navegação e i18n

- [x] 7.1 Incluir em `NAVIGATION_SECTIONS` de `apps/frontend/src/app/(private)/layout.tsx` o item "Categorias" apontando para `/categories`, dentro do grupo "Cadastros", ao lado de Contas e Cartões
- [x] 7.2 Levantar os códigos de erro que a API de categorias pode retornar nos fluxos implementados (gravação, exclusão e categorias padrão) e conferir se cada um possui chave em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`
- [x] 7.3 Adicionar as chaves faltantes nos dois arquivos de mensagens, seguindo a convenção já usada, garantindo que nenhum código de erro apareça cru na tela

## 8. Verificação

- [x] 8.1 Rodar lint/build do frontend e corrigir eventuais erros de tipagem introduzidos
- [x] 8.2 Verificar no app em execução o fluxo de criação: nova categoria com múltiplas subcategorias, toaster de sucesso e categoria presente na listagem com as subcategorias na ordem definida
- [x] 8.3 Verificar o fluxo de edição com reconciliação: alterar uma subcategoria existente, adicionar uma nova, remover outra e reordenar; confirmar após salvar que a listagem reflete exatamente a lista final, sem duplicidade de `order`
- [x] 8.4 Verificar os fluxos de exclusão (com confirmação e com cancelamento) e de aplicação das categorias padrão (aplicação inicial e reaplicação idempotente, sem duplicar categorias)
- [x] 8.5 Verificar o tratamento de erro exibindo mensagem traduzida ao tentar criar uma categoria com nome já existente
