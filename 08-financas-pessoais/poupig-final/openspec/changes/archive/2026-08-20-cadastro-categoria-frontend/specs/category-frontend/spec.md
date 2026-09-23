## Purpose

Interface web do cadastro de categoria: permite ao usuário autenticado listar, criar, editar e desativar suas categorias com as respectivas subcategorias ordenadas, além de aplicar de uma só vez o catálogo de categorias padrão do sistema.

## ADDED Requirements

### Requirement: Página de categorias lista as categorias do usuário autenticado
O sistema SHALL implementar `categories.page.tsx` em `apps/frontend/src/modules/category/pages`, exposta na rota `/categories` por `apps/frontend/src/app/(private)/categories/page.tsx`. A página MUST exibir, para cada categoria: nome, cor (indicador visual), ícone, situação (ativa/inativa) e a quantidade de subcategorias. A listagem MUST carregar a lista completa retornada por `GET /categories`, sem paginação. A rota `/category`, com o dashboard do módulo, MUST permanecer existindo e inalterada.

#### Scenario: Listagem carrega e exibe as categorias
- **WHEN** o usuário autenticado acessa `/categories`
- **THEN** as categorias são buscadas na API e exibidas com nome, cor, ícone, situação e quantidade de subcategorias

#### Scenario: Usuário sem categorias cadastradas
- **WHEN** o usuário autenticado acessa `/categories` e não possui nenhuma categoria
- **THEN** a página exibe um estado vazio informando que não há categorias cadastradas

#### Scenario: Falha ao carregar a listagem
- **WHEN** a requisição de listagem retorna erro
- **THEN** a página exibe a mensagem de erro traduzida em vez da lista

#### Scenario: Dashboard do módulo permanece acessível
- **WHEN** o usuário autenticado acessa `/category`
- **THEN** o dashboard do módulo de categorias continua sendo exibido normalmente

---

### Requirement: Componente de lista renderiza categorias recebidas como prop com ações por item
O sistema SHALL implementar `category-list.component.tsx` em `apps/frontend/src/modules/category/components`, que recebe a lista de categorias como prop e a renderiza. Cada item MUST oferecer as ações de editar e excluir. Quando a lista recebida estiver vazia, o componente MUST renderizar o estado vazio compartilhado (`EmptyListState`).

#### Scenario: Renderização de múltiplas categorias
- **WHEN** o componente recebe um array com várias categorias
- **THEN** cada categoria é exibida com seus dados visuais e com as ações de editar e excluir

#### Scenario: Acionamento da edição a partir da lista
- **WHEN** o usuário aciona a ação de editar de uma categoria
- **THEN** o formulário é aberto no modo de edição já preenchido com os dados daquela categoria e de suas subcategorias

#### Scenario: Lista vazia
- **WHEN** o componente recebe um array vazio
- **THEN** o estado vazio compartilhado é renderizado no lugar da lista

---

### Requirement: Cada categoria da lista permite expandir e recolher suas subcategorias
O sistema SHALL permitir expandir e recolher cada categoria da listagem para exibir suas subcategorias. As subcategorias exibidas MUST respeitar a ordem definida pelo campo `order` e MUST apresentar nome, ícone, cor e situação (ativa/inativa) de cada subcategoria.

#### Scenario: Expandir categoria com subcategorias
- **WHEN** o usuário expande uma categoria que possui subcategorias
- **THEN** as subcategorias são exibidas na ordem crescente de `order`, com nome, ícone, cor e situação

#### Scenario: Recolher categoria
- **WHEN** o usuário recolhe uma categoria expandida
- **THEN** as subcategorias deixam de ser exibidas e a categoria permanece na listagem

#### Scenario: Expandir categoria sem subcategorias
- **WHEN** o usuário expande uma categoria que não possui subcategorias
- **THEN** é exibida a indicação de que não há subcategorias, sem erro

---

### Requirement: Formulário de categoria suporta criação e edição sem modal
O sistema SHALL implementar `category-form.component.tsx` em `apps/frontend/src/modules/category/components`, com suporte aos fluxos de criação e edição. O formulário MUST NÃO ser implementado como modal e MUST usar `form-section-layout` como estrutura, com uma seção para os dados da categoria e outra para as subcategorias. Os campos da categoria são `name` (obrigatório), `icon`, `color` e `isActive`. O campo `isActive` MUST ser exibido apenas no fluxo de edição. A validação MUST usar schema, no mesmo padrão dos demais formulários do projeto. A página MUST alternar entre listagem e formulário no mesmo layout.

#### Scenario: Formulário de criação não exibe isActive
- **WHEN** o formulário é aberto para criação de uma nova categoria
- **THEN** os campos da categoria são exibidos vazios e o campo `isActive` NÃO é exibido

#### Scenario: Formulário de edição exibe isActive preenchido
- **WHEN** o formulário é aberto para edição de uma categoria existente
- **THEN** os campos são preenchidos com os dados atuais e o campo `isActive` é exibido com o valor atual da categoria

#### Scenario: Submissão com nome de categoria vazio
- **WHEN** o formulário é submetido com `name` da categoria vazio
- **THEN** um erro de validação é exibido no campo e o envio à API é bloqueado

#### Scenario: Cancelamento do formulário
- **WHEN** o usuário cancela o formulário
- **THEN** a página retorna ao modo de listagem sem enviar nenhuma requisição à API

---

### Requirement: Formulário mantém lista dinâmica e ordenável de subcategorias
O sistema SHALL permitir, dentro do formulário de categoria, adicionar, editar, reordenar e remover subcategorias antes de salvar. Cada subcategoria possui os campos `name` (obrigatório), `icon`, `color` e `isActive`. O campo `order` MUST ser derivado da posição do item na lista, começando em 1, e MUST NÃO ser digitado pelo usuário. Após qualquer inclusão, remoção ou reordenação, os valores de `order` MUST permanecer sequenciais, sem furos e sem duplicidade.

#### Scenario: Adicionar subcategorias
- **WHEN** o usuário adiciona duas subcategorias à lista
- **THEN** elas recebem `order` 1 e 2, respectivamente, conforme a posição na lista

#### Scenario: Reordenar subcategorias
- **WHEN** o usuário move uma subcategoria para outra posição na lista
- **THEN** os valores de `order` de todos os itens são recalculados conforme a nova ordem de exibição

#### Scenario: Remover subcategoria do meio da lista
- **WHEN** o usuário remove a segunda de três subcategorias
- **THEN** os itens restantes passam a ter `order` 1 e 2, sem furos e sem duplicidade

#### Scenario: Submissão com nome de subcategoria vazio
- **WHEN** o formulário é submetido com uma subcategoria cujo `name` está vazio
- **THEN** um erro de validação é exibido para aquele item e o envio à API é bloqueado

#### Scenario: Categoria salva sem subcategorias
- **WHEN** o formulário é submetido com a lista de subcategorias vazia
- **THEN** a categoria é enviada à API com uma lista de subcategorias vazia, sem erro de validação

---

### Requirement: Edição preserva o id das subcategorias persistidas para reconciliação
O sistema SHALL manter, no estado do formulário, o `id` das subcategorias já persistidas. Ao salvar uma categoria existente, o payload enviado a `PUT /categories/:id` MUST conter as subcategorias mantidas com seus `id` originais, as novas subcategorias sem `id`, e MUST omitir as subcategorias removidas pelo usuário, de modo que o backend as remova na reconciliação.

#### Scenario: Alteração de subcategoria existente
- **WHEN** o usuário altera o nome de uma subcategoria já persistida e salva
- **THEN** o payload enviado inclui aquela subcategoria com o `id` original e o nome atualizado

#### Scenario: Inclusão de subcategoria nova em categoria existente
- **WHEN** o usuário adiciona uma subcategoria a uma categoria já persistida e salva
- **THEN** o payload enviado inclui aquela subcategoria sem `id`

#### Scenario: Remoção de subcategoria existente
- **WHEN** o usuário remove uma subcategoria já persistida e salva
- **THEN** o payload enviado não contém aquela subcategoria e ela deixa de aparecer na listagem após a atualização

---

### Requirement: Camada de dados de categoria isolada em client de API, schema e hooks
O sistema SHALL implementar em `apps/frontend/src/modules/category/data`:
- `category-api.client.ts` com os tipos de categoria/subcategoria, o tipo de entrada de gravação e as funções de listar, criar, atualizar, deletar e aplicar categorias padrão, com classe de erro própria expondo o status HTTP e os códigos retornados pela API
- `category.schema.ts` com o schema de validação do formulário, incluindo a validação dos itens da lista de subcategorias
- `use-categories.ts` com os hooks de leitura e ação (`useCategories`, `useSaveCategory`, `useDeleteCategory`, `useApplyDefaultCategories`), que obtêm o token do usuário autenticado a partir do contexto de autenticação

Os arquivos MUST ser exportados por `apps/frontend/src/modules/category/data/index.ts` — substituindo o placeholder `export {}` atual — e a página e os componentes MUST ser exportados pelo barrel `apps/frontend/src/modules/category/index.ts`. Os componentes de UI MUST NÃO chamar `fetch` diretamente.

#### Scenario: Hook de listagem popula o estado
- **WHEN** o hook de listagem é montado em um componente autenticado
- **THEN** a requisição `GET /categories` é enviada com o token do usuário e o resultado é exposto junto com os estados de carregamento e erro

#### Scenario: Requisições enviadas sem token
- **WHEN** um hook de ação é chamado sem token de autenticação disponível
- **THEN** nenhuma requisição é enviada à API e a ação retorna falha

#### Scenario: Gravação escolhe criação ou atualização
- **WHEN** o hook de gravação é chamado sem um id de categoria
- **THEN** a requisição `POST /categories` é enviada; quando chamado com um id, a requisição `PUT /categories/:id` é enviada

---

### Requirement: Usuário pode aplicar as categorias padrão a partir da listagem
O sistema SHALL exibir na página de listagem um botão "Aplicar categorias padrão" que dispara `POST /categories/default`. Antes de disparar a requisição, o sistema MUST solicitar confirmação explícita do usuário, informando que serão criadas apenas as categorias padrão ainda inexistentes e que as já existentes serão ignoradas. A requisição MUST ser enviada somente após a confirmação.

#### Scenario: Usuário confirma a aplicação das categorias padrão
- **WHEN** o usuário aciona "Aplicar categorias padrão" e confirma
- **THEN** a requisição `POST /categories/default` é enviada, um toaster de sucesso é exibido e a listagem é recarregada com as novas categorias

#### Scenario: Usuário cancela a aplicação das categorias padrão
- **WHEN** o usuário aciona "Aplicar categorias padrão" e cancela a confirmação
- **THEN** nenhuma requisição é enviada e a listagem permanece inalterada

#### Scenario: Reaplicação com categorias já existentes
- **WHEN** o usuário aplica as categorias padrão uma segunda vez
- **THEN** a operação é concluída com sucesso, sem erro, e nenhuma categoria é duplicada na listagem

---

### Requirement: Exclusão de categoria exige confirmação e informa o efeito nas subcategorias
O sistema SHALL utilizar o componente compartilhado `delete-confirmation-dialog` para confirmar a exclusão de uma categoria. O dialog MUST identificar a categoria alvo e MUST deixar explícito que a categoria será desativada junto com suas subcategorias. A requisição `DELETE /categories/:id` MUST ser enviada somente após a confirmação do usuário.

#### Scenario: Usuário confirma a exclusão
- **WHEN** o usuário aciona a exclusão de uma categoria e confirma no dialog
- **THEN** a requisição `DELETE /categories/:id` é enviada à API

#### Scenario: Usuário cancela a exclusão
- **WHEN** o usuário aciona a exclusão de uma categoria e cancela no dialog
- **THEN** nenhuma requisição é enviada e a listagem permanece inalterada

#### Scenario: Dialog identifica a categoria e o efeito da ação
- **WHEN** o dialog de exclusão é aberto para uma categoria
- **THEN** o nome da categoria é exibido e o texto informa que a categoria e suas subcategorias serão desativadas

---

### Requirement: Operações bem-sucedidas exibem toaster e atualizam a listagem
O sistema SHALL exibir um toaster de sucesso após criar, editar ou excluir uma categoria e após aplicar as categorias padrão com êxito, e a listagem de categorias MUST ser recarregada em seguida. Após uma gravação bem-sucedida, a página MUST retornar ao modo de listagem.

#### Scenario: Criação bem-sucedida
- **WHEN** o formulário de criação é submetido com sucesso
- **THEN** um toaster de sucesso é exibido, a página retorna à listagem e a nova categoria aparece na lista

#### Scenario: Edição bem-sucedida
- **WHEN** o formulário de edição é submetido com sucesso
- **THEN** um toaster de sucesso é exibido, a página retorna à listagem e a categoria aparece atualizada com suas subcategorias

#### Scenario: Exclusão bem-sucedida
- **WHEN** o usuário confirma a exclusão de uma categoria
- **THEN** um toaster de sucesso é exibido e a listagem é recarregada sem a categoria excluída

---

### Requirement: Erros da API são exibidos traduzidos, nunca como código bruto
O sistema SHALL traduzir os códigos de erro retornados pela API de categorias usando o mecanismo de i18n existente em `apps/frontend/src/shared/i18n`. Nenhum código de erro MUST aparecer em tela na forma bruta. As chaves já existentes MUST ser reutilizadas e qualquer código retornado pela API sem tradução correspondente MUST receber uma nova chave em `messages.pt.ts` e em `messages.en.ts`.

#### Scenario: Nome de categoria duplicado
- **WHEN** a API rejeita a gravação com `CATEGORY_NAME_ALREADY_EXISTS`
- **THEN** um toaster de erro é exibido com a mensagem traduzida correspondente, e não com o código bruto

#### Scenario: Categoria inexistente na exclusão
- **WHEN** a API rejeita a exclusão com `CATEGORY_NOT_FOUND`
- **THEN** um toaster de erro é exibido com a mensagem traduzida correspondente e a listagem é mantida

#### Scenario: Erro sem tradução cadastrada
- **WHEN** a API retorna um código de erro que ainda não possui chave de tradução
- **THEN** uma chave correspondente é adicionada em `messages.pt.ts` e `messages.en.ts` para que a mensagem exibida seja legível ao usuário
