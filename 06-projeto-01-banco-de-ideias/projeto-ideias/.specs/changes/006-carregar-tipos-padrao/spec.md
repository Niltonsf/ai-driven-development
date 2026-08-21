# 006-carregar-tipos-padrao

## Objetivo

Adicionar ao agregado `idea-type` (entregue na spec 005) um **carregador de Tipos de Ideia pré-definidos**: uma lista fixa em código (constantes do agregado) que o usuário pode importar em massa para sua biblioteca pessoal com um clique, evitando começar do zero e servindo como referência de como escrever bons prompts. O carregamento é **idempotente** (não duplica) e o botão da UI fica disponível **apenas enquanto o usuário não tem nenhum Tipo de Ideia cadastrado**.

## Contexto Técnico

- Esta spec **depende** da 005-cadastro-tipo-de-ideia: o agregado `idea-type`, o `IdeaTypeRepository`, o `IdeaTypeController` e a tela de listagem precisam estar prontos.
- Backend ganha **um caso de uso novo** (`load-default-idea-types`), **uma constante nova** (`DEFAULT_IDEA_TYPES`) e **um endpoint novo** (`POST /idea-types/load-defaults`).
- Front-end ganha **um botão a mais** no estado vazio da listagem de Tipos de Ideia ("Carregar Tipos de Ideia padrão"), exibido somente quando `total === 0`.
- Sem nenhuma alteração no contrato dos endpoints CRUD existentes.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- **Tipos de Ideia pré-definidos** ficam em `modules/ideas/src/idea-type/constant/default-idea-types.constant.ts`, exportando o array `DEFAULT_IDEA_TYPES: ReadonlyArray<{ name: string; description: string; prompt: string }>` (sem `id` e sem `userId` — o caso de uso atribui no carregamento). Cada `prompt` usa os quatro marcadores `{{name}}`, `{{description}}`, `{{objective}}` e `{{resources}}`, em formato multilinha (template literal) para permanecer legível e editável depois. Reexportar pelo `index.ts` do agregado.
- **Conteúdo de referência (pronto para cópia)**: o conteúdo definitivo dos quatro tipos iniciais — roteiro de vídeo para rede social, roteiro de vídeo viral, vídeo VSL e resumo de conteúdo — já está escrito e versionado neste change em [`default-idea-types.constant.ts`](./default-idea-types.constant.ts). A implementação deve **copiar esse arquivo (conteúdo e nome) para `modules/ideas/src/idea-type/constant/`**, sem reescrever os prompts do zero. O arquivo já respeita os limites da entidade `IdeaType` (`name` 3..120, `description` 10..500, `prompt` 20..8000) e mantém os prompts em múltiplas linhas via template literal. Acrescentar mais tipos além dos quatro é permitido (`pelo menos 4` continua sendo o piso), mas os quatro existentes não devem ser removidos nem ter o texto degradado para uma única linha.
- **Idempotência do carregamento**: o caso de uso `load-default-idea-types` consulta o repositório por **qualquer** Tipo de Ideia do `userId`. Se o usuário já tiver pelo menos um cadastrado, **não faz nada e retorna `{ loaded: 0 }`** — não lança erro nem regrava. Se a lista estiver vazia, persiste todos os itens do `DEFAULT_IDEA_TYPES` em sequência, atribuindo um novo `id` (uuid) e o `userId` do usuário autenticado a cada um. Essa decisão (gate por "usuário tem zero registros") é regra explícita do produto: usuários que já personalizaram a biblioteca não recebem o seed automático nunca mais, mesmo que apaguem registros depois.
- **Endpoint dedicado**: `POST /idea-types/load-defaults` (autenticado). Retorno 200 com `{ loaded: number }` — `loaded` é a quantidade efetivamente persistida (zero quando o gate de idempotência bloqueia, ou `DEFAULT_IDEA_TYPES.length` quando carrega).
- **Visibilidade do botão na UI**: o botão **"Carregar Tipos de Ideia padrão"** aparece **apenas** quando a listagem do usuário está vazia (`total === 0` na primeira página de `GET /idea-types`). Após o clique e o sucesso da chamada, recarregar a listagem; o botão desaparece naturalmente porque o `total` deixa de ser zero.

## Tasks

### Tasks - Negócio (módulo `ideas`)

- [ ] Criar `modules/ideas/src/idea-type/constant/default-idea-types.constant.ts` **copiando o arquivo de referência** [`default-idea-types.constant.ts`](./default-idea-types.constant.ts) deste change (conteúdo e nome idênticos — não reescrever os prompts do zero). Reexportar via `idea-type/index.ts` (adicionar `export * from "./constant";` + um `constant/index.ts`) e validar que `modules/ideas/src/index.ts` propaga o símbolo. Manter os prompts multilinha (template literal) exatamente como no arquivo de referência.

- [ ] Implementar o caso de uso `load-default-idea-types` ([module-use-case](../../../.claude/skills/module-use-case)). Recebe `IdeaTypeRepository` no construtor; entrada `{ userId: string }`; saída `{ loaded: number }`. Fluxo: `findPage({ userId, page: 1, perPage: 1 })` → se `total > 0`, retorna `{ loaded: 0 }`; senão itera `DEFAULT_IDEA_TYPES`, instancia `new IdeaType({ userId, ...item })` (a base `Entity` gera o uuid), valida e chama `repository.create`; retorna `{ loaded: DEFAULT_IDEA_TYPES.length }`. **Não lançar erro** quando o gate de idempotência bloqueia.

- [ ] Cobrir o caso de uso com testes unitários usando o `FakeIdeaTypeRepository`:
  - usuário sem registros → persiste todos os itens (verificar quantidade e `userId`), retorna `{ loaded: DEFAULT_IDEA_TYPES.length }`.
  - usuário com pelo menos um registro existente → não persiste, retorna `{ loaded: 0 }`.
  - chamada repetida em sequência → segunda chamada não duplica registros.
  - não interfere em registros de outros usuários.
    Coverage 100% no arquivo do caso de uso.

### Tasks - Back-end

- [ ] Adicionar `POST /idea-types/load-defaults` em `IdeaTypeController` instanciando `LoadDefaultIdeaTypes` no corpo do método e injetando o `userId` do usuário autenticado. Retorno HTTP 200 explícito com `{ loaded: number }`. Endpoint autenticado (sem `@Public()`).

- [ ] Estender `idea-type.integration.http` com dois cenários de `POST /idea-types/load-defaults` para o mesmo usuário em sequência: primeiro retorna `{ loaded: DEFAULT_IDEA_TYPES.length }`; segundo retorna `{ loaded: 0 }`. Confirmar com `GET /idea-types` que `total` continua igual após a segunda chamada (sem duplicação).

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. Verificação visual é manual.

- [ ] Estender o estado vazio da listagem de Tipos de Ideia (entregue na spec 005) adicionando o segundo botão lado a lado: **"Carregar Tipos de Ideia padrão"** → chama `POST /idea-types/load-defaults`. Em sucesso (`{ loaded: n }` com `n > 0`), `toast.success` com a quantidade carregada e recarrega a listagem. Quando `n === 0`, `toast.info`. O botão fica desabilitado durante a chamada para evitar duplo clique. Quando `total > 0`, o botão **não** é renderizado em lugar nenhum.

- [ ] Adicionar wrapper `loadDefaultIdeaTypes(token)` no `idea-type.api.ts` (mesmo padrão dos demais wrappers do agregado).

- [ ] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar UI pronta para conferência manual com checklist:
  - Usuário sem nenhum Tipo de Ideia cadastrado → estado vazio mostra os dois botões; clicar em "Carregar Tipos de Ideia padrão" → toast com quantidade carregada e tabela passa a exibir os itens.
  - Recarregar a página com Tipos de Ideia já cadastrados → botão "Carregar Tipos de Ideia padrão" não aparece em lugar nenhum.
  - Apagar todos os Tipos de Ideia → estado vazio volta com os dois botões, mas clicar em "Carregar Tipos de Ideia padrão" **não faz nada** (`toast.info`), pois o gate de idempotência continua bloqueando após o primeiro carregamento ter sido feito? Não — neste fluxo o gate considera `findPage`, então uma listagem realmente vazia volta a permitir o carregamento. Confirmar comportamento esperado com o time de produto durante o treinamento.

## Resultado Esperado

- Constante `DEFAULT_IDEA_TYPES` com pelo menos 4 itens publicada e reexportada pelo módulo `ideas`.
- Caso de uso `load-default-idea-types` implementado, idempotente e testado.
- Endpoint `POST /idea-types/load-defaults` exposto, autenticado, com cenários (carregamento + idempotência) cobertos no `idea-type.integration.http`.
- Estado vazio da listagem de Tipos de Ideia mostra os dois botões (cadastrar + carregar padrão); botão de carregar some quando a lista deixa de ser vazia.
- Sem erros de TypeScript ou de build.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
