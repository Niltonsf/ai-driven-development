## Context

Ver `proposal.md` — Why. Restrições do estado atual que moldam a abordagem:

- A API já está implementada e não será alterada. `GET /categories` devolve `CategoryDTO[]` completo (sem paginação), com `subcategories` já ordenadas por `order`; `POST`/`PUT` recebem a raiz e a **lista completa** de subcategorias desejada; o backend faz a reconciliação por `id` (existentes atualizadas, sem `id` criadas, ausentes removidas). `DELETE` é exclusão lógica propagada. `POST /categories/default` é idempotente.
- O módulo `apps/frontend/src/modules/category` hoje só tem `components/category-dashboard.component.tsx`, `pages/dashboard.page.tsx` e um `data/index.ts` com `export {}`.
- Já existem dois cadastros equivalentes e recentes no projeto (`account` e `credit-card`) cuja estrutura de `pages/`, `components/` e `data/` é o padrão de fato a seguir. `credit-cards.page.tsx` é a referência mais próxima (alternância `list`/`form`, `delete-confirmation-dialog`, toasters, `getErrorMessage`).
- O componente compartilhado `apps/frontend/src/shared/components/ui/orderable-object-list.tsx` já existe, é controlado (`items` + `onChange`) e já normaliza `order` via `setItemOrder`/`orderStartsAt` a cada mover/remover — porém ainda não é usado por nenhum módulo.
- O validador compartilhado (`@/shared/components/form/validator`) já suporta arrays de objetos via `v.defineArray(objectSchema, options)`.
- As chaves de i18n de categoria (`CATEGORY_NAME_ALREADY_EXISTS`, `CATEGORY_NOT_FOUND`, `DUPLICATE_SUBCATEGORY_ORDER`, entre outras) já existem em `messages.pt.ts`/`messages.en.ts`.

## Goals / Non-Goals

**Goals:**

- Reaproveitar integralmente o padrão de `credit-card` no frontend, para que o módulo `category` não introduza uma terceira forma de fazer cadastro.
- Concentrar toda a complexidade nova — a lista aninhada de subcategorias e a manutenção do `order` — em um único ponto do formulário, sem vazar para a página ou para o client de API.
- Garantir que o payload enviado ao `PUT` seja exatamente o que a reconciliação do backend espera, sem chamadas extras por subcategoria.

**Non-Goals:**

- Não introduzir biblioteca de estado de servidor (React Query/SWR) nem drag-and-drop; o projeto usa hooks próprios e o `orderable-object-list` já resolve reordenação por botões.
- Não criar componentes compartilhados novos em `shared/` — tudo que é necessário já existe.
- Não alterar o dashboard do módulo (`/category`), nem a API, nem a camada de negócio.

## Decisions

### 1. Página com modos `list`/`form` no mesmo layout, em vez de rotas separadas

Segue `credit-cards.page.tsx`: um `useState<'list' | 'form'>` na página, com o formulário renderizado no lugar da lista. Alternativa considerada: rotas `/categories/new` e `/categories/:id/edit`. Rejeitada por divergir dos cadastros existentes sem ganho — o formulário não precisa ser linkável nem recarregável isoladamente, e o spec exige explicitamente ausência de modal, não navegação por rota.

### 2. Subcategorias como um array gerenciado por `useFieldArray`, renderizado pelo `OrderableObjectList`

O estado do formulário guarda `subcategories: SubcategoryFormItem[]`, onde `SubcategoryFormItem = { id?: string; name: string; icon?: string; color?: string; isActive: boolean; order: number }`. O `OrderableObjectList` recebe `items={useWatch({ control, name: 'subcategories' })}` e `onChange={(next) => replace(next)}`, onde `replace` vem de `useFieldArray`, com `setItemOrder={(item, order) => ({ ...item, order })}` e `orderStartsAt={1}`.

Consequência: mover e remover já recalculam `order` sequencialmente dentro do componente compartilhado, sem código de ordenação novo. A adição de item (`replace([...subcategories, novoItem])`) atribui `order = subcategories.length + 1`.

**Corrigido após teste em runtime:** a primeira versão ligava o array a um `Controller` no campo pai (`items={field.value}` / `onChange={field.onChange}`), com `useFieldArray` descartado como "mais código para o mesmo resultado". Isso não funciona: os inputs dos itens são registrados por índice (`subcategories.N.name`) e o `field.value` do `Controller` pai não enxerga o que foi digitado neles. Ao reordenar, o componente emitia o array antigo e **descartava as edições** — reordenar após renomear uma subcategoria zerava o campo e revertia o nome ao valor persistido. `useFieldArray.replace` é a API do RHF que re-registra os campos filhos com os novos valores, e `useWatch` garante que o array enviado já contenha as digitações. Ambos são necessários: `replace` sem `useWatch` reordena valores desatualizados.

Alternativas consideradas:
- `Controller` no campo pai (implementada primeiro): descartada pelo bug acima.
- `form.watch()` em vez de `useWatch`: funciona, mas o React Compiler pula a memoização do componente inteiro ao encontrá-lo (`react-hooks/incompatible-library`).
- Guardar as subcategorias em `useState` fora do formulário: perderia a validação por schema e o `handleSubmit` unificado exigidos pelos specs.

### 3. `order` derivado da posição, nunca digitado, e recalculado no submit como rede de segurança

O usuário não vê nem edita `order`. Além da normalização feita pelo `OrderableObjectList`, o handler de submit reatribui `order = index + 1` ao mapear a lista para o payload. Isso torna impossível enviar `order` duplicado ou com furo e, por consequência, evita o erro `DUPLICATE_SUBCATEGORY_ORDER` do backend por falha de UI. Alternativa (confiar apenas na normalização do componente) foi descartada por ser um invariante barato de garantir no ponto de saída.

### 4. `id` da subcategoria é estado do formulário, não do componente visual

Ao abrir a edição, cada subcategoria persistida entra na lista com seu `id`; itens novos entram sem `id`. O submit envia a lista como está, e é essa presença/ausência de `id` — mais a omissão dos itens removidos — que dirige a reconciliação no backend. Como `id` pode ser `undefined`, o `getItemKey` do `OrderableObjectList` usa `item.id ?? índice` para manter chaves estáveis o suficiente na renderização.

### 5. Schema único de categoria com array de objetos aninhado, usando os VOs de domínio

`category.schema.ts` usa `v.defineObject({ name: CategoryName, icon: { vo: Text, optional: true }, color: { vo: HexColor, optional: true }, subcategories: v.defineArray({ name: SubcategoryName, ... }, { optional: true }) })`, no mesmo estilo de `credit-card.schema.ts`. Os nomes usam os VOs de domínio `CategoryName`/`SubcategoryName` (exportados por `@poupig/category`, do qual o frontend já depende) em vez do `Text` genérico: assim o limite de 100 caracteres e os códigos de erro (`CATEGORY_NAME_TOO_LONG`, `SUBCATEGORY_NAME_TOO_SHORT`, já traduzidos no i18n) são exatamente os mesmos do backend, sem regra duplicada.

**Descoberto na implementação:** o resolver do validador compartilhado devolve em `values` **apenas os campos declarados no schema** (`createValidationResult` retorna `context.processedValues`). Campos de controle não validados por VO — `isActive` da categoria e `id`/`isActive`/`order` de cada subcategoria — seriam descartados antes de chegar ao `onSubmit`, o que quebraria a reconciliação. Por isso o payload é montado a partir de `form.getValues()` (estado bruto do formulário), e não do argumento entregue por `handleSubmit`; o resolver continua responsável apenas por **barrar** o submit inválido. Consequência de tipagem: `CategoryFormData` é `Omit<v.infer<typeof categorySchema>, 'subcategories'> & { isActive; subcategories: SubcategoryFormItem[] }` e o resolver é convertido para `Resolver<CategoryFormData>` no `useForm`.

Alternativa considerada: declarar `id` (`Id`) e `order` (`PositiveInteger`) no schema para que sobrevivessem ao resolver. Rejeitada porque `isActive` é booleano e não tem VO correspondente — `isEmptyValue(false)` é `false`, então o campo entraria em validação e falharia —, o que exigiria uma solução mista para o mesmo problema.

### 6. Camada de dados espelhando `credit-card`, com hook extra para categorias padrão

`category-api.client.ts` replica a estrutura de `credit-card-api.client.ts` (base URL por `NEXT_PUBLIC_API_URL`, `headers(token)`, `handleError` lançando uma `CategoryApiError` com `statusCode` e `messages`), acrescido de `applyDefaultCategories(token)`. `use-categories.ts` expõe `useCategories` (sem parâmetros de paginação, com `items`, `isLoading`, `error`, `refresh`), `useSaveCategory`, `useDeleteCategory` e `useApplyDefaultCategories`, todos retornando `{ ok: true } | { ok: false; error: string }` nas ações, com a mensagem já traduzida por `getErrorMessage`. Alternativa considerada: um único hook "de tudo" — rejeitada por divergir do padrão e dificultar o controle de `isSubmitting`/`isDeleting` por ação.

### 7. Confirmação das categorias padrão usa `Dialog` + `StandardDialogContent` diretamente

O botão "Aplicar categorias padrão" abre uma confirmação antes de chamar a API, montada com os componentes compartilhados `Dialog` + `StandardDialogContent`, com título e descrição próprios explicando que apenas as categorias inexistentes serão criadas.

**Descoberto na implementação:** a intenção inicial era reaproveitar o `delete-confirmation-dialog`, mas ele é especificamente destrutivo — exige digitar a palavra "excluir" para habilitar o botão, pinta o botão de vermelho e exibe "Excluindo..." (texto fixo) enquanto confirma. Aplicar categorias padrão é uma ação aditiva e idempotente; herdar esse atrito e esse vocabulário seria enganoso. `StandardDialogContent` é o mesmo componente que o dialog de exclusão usa por baixo, então não há padrão visual novo. Alternativa: criar um dialog de confirmação genérico em `shared/` — fora de escopo para um único uso; se um segundo caso aparecer, a extração vira uma mudança própria.

### 8. Listagem sem paginação, com expansão de subcategorias por estado local

Como `GET /categories` devolve tudo, a página não usa `PaginationControls`. O estado de expandido/recolhido é local ao componente de lista (`Set<string>` de ids expandidos), sem persistência entre navegações — comportamento simples e suficiente para o requisito.

## Risks / Trade-offs

- **Lista completa sem paginação pode crescer** (aplicar categorias padrão cria dezenas de categorias com subcategorias) → o payload continua pequeno (texto), e a expansão de subcategorias é sob demanda; se a listagem ficar pesada, paginar é uma mudança isolada na página + no client, já que o backend suporta acrescentar `query params` sem quebrar o contrato atual.
- **Reconciliação destrutiva por omissão**: remover uma subcategoria no formulário e salvar apaga o registro no backend; um bug na montagem do payload pode remover dados silenciosamente → o payload é montado em um único ponto (handler de submit) a partir do estado do formulário, e o cenário de remoção é coberto por spec como comportamento observável.
- **Duplicidade de `order` gerando erro do backend** → mitigada em duas camadas (normalização no `OrderableObjectList` e recálculo no submit — decisão 3).
- **Primeiro uso real do `orderable-object-list`**: o componente nunca foi exercitado em produção e pode ter arestas (ex.: chaves instáveis em itens sem `id`) → uso de `getItemKey` explícito e verificação manual do fluxo de reordenar/remover/salvar antes de encerrar a implementação. *Este risco se materializou* — não no componente em si, mas na forma de ligá-lo ao formulário (ver decisão 2); só apareceu no teste manual, nunca no typecheck ou no build.
- **Códigos de erro sem tradução** aparecerem crus na tela → a verificação das chaves usadas pelos fluxos de categoria contra `messages.pt.ts`/`messages.en.ts` é uma tarefa explícita, não um efeito colateral.

## Migration Plan

Não se aplica: mudança puramente aditiva no frontend, sem migração de dados, sem alteração de contrato e sem feature flag. A rota `/categories` passa a existir e o item de menu aparece junto; reverter é remover os arquivos novos e o item de `NAVIGATION_SECTIONS`. A rota `/category` (dashboard) permanece intacta durante e após a mudança.
