# 008-modulo-de-ia-texto

## Objetivo

Integrar a aplicação ao provedor de IA da OpenAI (ChatGPT) por meio de um módulo de **infraestrutura** no backend que expõe uma API simples e genérica de geração de texto, e entregar no frontend um **componente de input compartilhado com IA** (`AiTextField`, linha única ou múltiplas linhas, com botão de geração embutido) capaz de gerar conteúdo a partir de um prompt orientativo do campo, opcionalmente usando outros campos do formulário como contexto, ou refinando o próprio valor atual ("melhorar conteúdo"). Por fim, substituir os campos textuais livres dos formulários **Tipo de Ideia** (`description`, `prompt`) e **Ideia** (`description`, `objective`) pelo novo componente.

> O **canal de transcrição por voz** (microfone dentro do `AiTextField` + endpoint `POST /ai/transcribe`) **não** entra nesta spec — fica isolado na spec 010-modulo-de-ia-voz, que estende o `AiProvider` e o `AiTextField` entregues aqui sem alterar nenhum comportamento existente.

## Contexto Técnico

- Provedor de IA inicial: **OpenAI (ChatGPT)** via SDK oficial `openai` (npm). Atualizar `.spec/memory/contexto-tecnico.md` ao final, registrando a decisão e o modelo padrão.
- A integração com IA é **detalhe de infraestrutura**. **Não** criar módulo de negócio novo. A implementação concreta vive em `apps/backend/src/modules/ai` (módulo Nest puro de infraestrutura, sem agregado em `modules/`).
- Endpoint exposto pelo módulo de IA, autenticado (sem `@Public()`):
  - `POST /ai/generate`: geração/refinamento de texto. Entrada `{ prompt: string, context?: string, instruction?: string }`; saída `{ text: string }`. Deliberadamente genérico — não conhece nada de Ideia ou Tipo de Ideia.
- Variáveis de ambiente novas no backend: `OPENAI_API_KEY` (obrigatória) e `OPENAI_MODEL` (opcional, default `gpt-4o-mini`). Devem aparecer em `apps/backend/.env.example` (com placeholder seguro) e em `apps/backend/.env` (com placeholder local — o usuário substitui pela chave real fora do repositório). **Nunca** comitar a chave real.
- Componente de frontend novo, compartilhado: `apps/frontend/src/shared/components/ui/ai-text-field.tsx`, com variantes de **linha única** (`Input`) e **múltiplas linhas** (`Textarea`). Botão de IA embutido no canto do campo (ícone `Sparkles` do lucide-react), com loader durante a chamada. Aceita props para o **prompt orientativo do campo** e para uma **lista de campos de contexto** (`{ label, value }[]`).
- A linguagem do código segue [Contexto Técnico Global](../../memory/contexto-tecnico.md): identificadores em inglês (`AiProvider`, `AiTextField`); textos visíveis em português ("Gerar com IA").
- Sem mudança no domínio (`modules/auth`, `modules/ideas`). Os formulários existentes apenas trocam os componentes de input.
- Sem verificação automatizada de UI nesta spec.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- **Escopo intencional do endpoint**: `POST /ai/generate` é genérico de propósito. Não recebe ids de Ideia ou Tipo de Ideia, não consulta repositórios e não faz composição de prompt com marcadores `{{name}}` etc. — essa composição acontece **no frontend**, no momento em que o componente `AiTextField` monta a chamada (concatenando o prompt orientativo do campo + os valores dos campos de contexto + a instrução do usuário). O caso de uso `process-idea` da spec futura terá seu próprio endpoint e usará o **mesmo `AiProvider`** internamente, sem passar por `/ai/generate`.
- **Modelo padrão**: `gpt-4o-mini` por custo/latência baixos. A variável `OPENAI_MODEL` permite trocar sem rebuild.
- **Tratamento de erro do provedor**: erros do SDK (rede, quota, 4xx, 5xx, timeout) viram `DomainError("ai.generate.failed", 502)` com a mensagem do provedor descartada do payload (apenas em log). O frontend dispara `toast.error(getMessage('ai.generate.failed'))`.
- **Validação de entrada do endpoint**: `prompt` é obrigatório (string não vazia, máx. 8000 caracteres). `context` opcional (máx. 16000) e `instruction` opcional (máx. 2000). Estouro de qualquer um → `DomainError("ai.input.too_long", 422)`. Validação direta no controller (sem entidade para evitar acoplamento a `modules/ideas`).
- **Composição da chamada à OpenAI**: `chat.completions.create` (não streaming):
  - `system`: o `prompt` (instrução orientativa do campo).
  - `user`: bloco de contexto + instrução do usuário, quando houver. Sem nenhum dos dois → `"Gere o conteúdo solicitado."`.
- **Componente `AiTextField` — modos de operação**:
  - **gerar do zero** (sem valor atual): clica no botão, monta `context` a partir dos campos declarados pelo formulário e envia. Se algum `contextFields` com `required: true` estiver vazio, botão desabilitado com tooltip listando os labels pendentes.
  - **melhorar o próprio conteúdo** (com valor atual não vazio): inclui o valor atual como **contexto principal** (rótulo forte, bloco delimitado por `"""…"""`), à frente dos demais `contextFields`, e instrução automática reforçando que o modelo deve **refinar** preservando a intenção do autor — nunca descartar nem começar do zero. O componente também rotula o botão como "Refinar" (em vez de "Gerar") quando há valor atual.
  - **instrução opcional do usuário**: clicar no botão de IA abre `Popover` com campo curto opcional ("Instrução adicional (opcional)") e botão "Gerar"/"Refinar". Submissão chama `POST /ai/generate`. Em sucesso, **substitui** o valor inteiro do input. Em erro, mantém popover aberto e dispara `toast.error(getMessage(code))`.
- **Loading state**: durante a chamada o componente desabilita input e botão, troca `Sparkles` por `Loader2` girando, e exibe "Gerando..." abaixo do campo.
- **Sem cache nem histórico de gerações**.
- **Sem rate limit no backend** nesta spec (depende dos limites próprios da chave OpenAI).
- **Wrapper de API no frontend**: em `apps/frontend/src/shared/api/ai.api.ts` com `AiApiError` (mesmo padrão de `IdeaApiError`).
- **Substituição nos formulários**: trocar **somente** os campos puramente textuais e abertos. Mantém-se sem IA: `name` (Tipo de Ideia e Ideia), `ideaTypeId` (select).

### Prompts orientativos por campo

Definição fixa nesta spec (string literal **dentro do componente do formulário** — não criar arquivo de configuração separado):

| Formulário    | Campo         | Prompt orientativo                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Campos de contexto                    |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Tipo de Ideia | `description` | "Você ajuda a descrever um Tipo de Ideia em uma frase curta (até 2 linhas) e em português, de forma clara, objetiva e direta. Gere ou refine a descrição com base no nome do Tipo de Ideia."                                                                                                                                                                                                                                                                                                  | `name`                                |
| Tipo de Ideia | `prompt`      | "Você ajuda a escrever um prompt especializado para um Tipo de Ideia que será usado depois pela IA para gerar o Resultado de uma Ideia. O prompt resultante deve estar em português, ser detalhado, instruir o modelo sobre tom, estrutura e formato esperado, e usar os marcadores `{{name}}`, `{{description}}`, `{{objective}}` e `{{resources}}` exatamente assim para inserir os dados da Ideia ao processar. Gere ou refine o prompt com base no nome e na descrição do Tipo de Ideia." | `name`, `description`                 |
| Ideia         | `description` | "Você ajuda a escrever a descrição de uma Ideia em português, de forma clara e objetiva, em um parágrafo curto. Gere ou refine a descrição com base no nome da Ideia e no Tipo de Ideia escolhido."                                                                                                                                                                                                                                                                                           | `name`, `ideaTypeName`                |
| Ideia         | `objective`   | "Você ajuda a escrever o objetivo de uma Ideia em português, em uma frase curta começando com um verbo no infinitivo, deixando claro o resultado esperado. Gere ou refine o objetivo com base no nome, na descrição e no Tipo de Ideia."                                                                                                                                                                                                                                                      | `name`, `description`, `ideaTypeName` |

> Campos de contexto **obrigatórios** (que precisam estar preenchidos para o botão habilitar): `name` em todos os casos; `description` para o `prompt` do Tipo de Ideia e para o `objective` da Ideia; `ideaTypeName` para `description` e `objective` da Ideia.

## Tasks

### Tasks - Infraestrutura de IA (backend)

- [x] Criar o módulo Nest `AiModule` em `apps/backend/src/modules/ai/ai.module.ts` e registrá-lo em `app.module.ts`. Estrutura: `ai.module.ts`, `ai.provider.ts`, `ai.controller.ts`, `ai.integration.http`. **Não** usar a skill `config-new-module` (essa skill é para módulos de negócio em `modules/`).

  > ✅ 2026-05-18 13:09 — Criados `apps/backend/src/modules/ai/{ai.module.ts,ai.provider.ts,ai.controller.ts,ai.integration.http}` (módulo Nest puro de infraestrutura, sem agregado em `modules/`). `AiModule` registrado em `app.module.ts` (import + entrada no array `imports`, corrigindo também a indentação de `IdeasModule`). Skill `config-new-module` **não** utilizada, conforme instruído.

- [x] Adicionar a dependência `openai` ao `package.json` de `apps/backend` (versão estável compatível com Node 22). Rodar `npm install` na raiz.

  > ✅ 2026-05-18 13:09 — Adicionado `"openai": "^6.38.0"` em `apps/backend/package.json` (versão estável atual, Node 22.14.0). `npm install` executado na raiz do monorepo (`added 1 package`).

- [x] Definir `AiProvider` em `ai.provider.ts` (classe abstrata) com `generate(input: { systemPrompt: string; userMessage: string }): Promise<string>`. Implementar `OpenAiProvider` (`@Injectable`):
  - Lê `OPENAI_API_KEY` e `OPENAI_MODEL` (default `gpt-4o-mini`) via `ConfigService`.
  - Instancia o cliente `OpenAI` no construtor.
  - Chama `chat.completions.create` com `messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }]`, sem streaming.
  - Retorna `choices[0].message.content` ou lança `DomainError("ai.generate.empty", 502)`.
  - Em qualquer exceção do SDK: `Logger` com a mensagem original e relança `DomainError("ai.generate.failed", 502)` (mensagem do provedor **não** vai para o cliente).
    Registrar em `AiModule` com `{ provide: AiProvider, useClass: OpenAiProvider }` e exportar.
    > ✅ 2026-05-18 13:09 — `ai.provider.ts`: classe abstrata `AiProvider` com `generate({ systemPrompt, userMessage }): Promise<string>` e `OpenAiProvider` `@Injectable`. Lê `OPENAI_API_KEY`/`OPENAI_MODEL` (default `gpt-4o-mini`) via `ConfigService`; instancia o cliente `OpenAI` no construtor; chama `chat.completions.create` (sem streaming) com mensagens `system`/`user`; retorna `choices[0].message.content` (trim) ou lança `DomainError('ai.generate.empty', 502)`; qualquer exceção do SDK é logada com `Logger` (mensagem original) e relançada como `DomainError('ai.generate.failed', 502)` — mensagem do provedor não chega ao cliente. `AiModule` registra `{ provide: AiProvider, useClass: OpenAiProvider }` e exporta `AiProvider`.

- [x] Implementar `AiController` expondo `POST /ai/generate` autenticado:
  1. Validar `prompt` (1..8000) → senão `ai.prompt.invalid` (422).
  2. Validar `context` (≤ 16000) e `instruction` (≤ 2000) → senão `ai.input.too_long` (422).
  3. Montar `userMessage` concatenando `Contexto:\n${context}` (se existir), linha em branco, `Instrução adicional do usuário: ${instruction}` (se existir). Sem nenhum: `"Gere o conteúdo solicitado."`.
  4. `aiProvider.generate({ systemPrompt: prompt, userMessage })` → `{ text }`.
     > ✅ 2026-05-18 13:09 — `ai.controller.ts`: `@Controller('ai')` com `@Post('generate')` `@HttpCode(200)`, **autenticado** (sem `@Public()`, coberto pelo `JwtAuthGuard` global). `prompt` trimado e validado 1..8000 → `DomainError('ai.prompt.invalid', 422)`; `context` ≤16000 e `instruction` ≤2000 → `DomainError('ai.input.too_long', 422)`. `userMessage` monta `Contexto:\n${context}` e `Instrução adicional do usuário: ${instruction}` separados por linha em branco; sem nenhum → `"Gere o conteúdo solicitado."`. Chama `aiProvider.generate({ systemPrompt: prompt, userMessage })` e retorna `{ text }`. Validação direta no controller (sem entidade), conforme Observações Locais.

- [x] Adicionar `OPENAI_API_KEY=""` e `OPENAI_MODEL="gpt-4o-mini"` em `apps/backend/.env.example` e `.env`. Confirmar `.env` no `.gitignore`.

  > ✅ 2026-05-18 13:09 — `OPENAI_API_KEY=""` e `OPENAI_MODEL="gpt-4o-mini"` adicionados em `apps/backend/.env.example` e `apps/backend/.env` (placeholder vazio — chave real não comitada). `.gitignore` raiz já ignora `.env` (linha `.env` no bloco "Local env files") — confirmado.

- [x] Criar `ai.integration.http` (Rest Client) com cenários:
  - login para token (padrão dos `*.integration.http` anteriores).
  - `POST /ai/generate` com `prompt` curto → 200 `{ text }` não vazio.
  - `POST /ai/generate` com `prompt` + `context` + `instruction` → 200 (registrar trecho da resposta).
  - `POST /ai/generate` sem `prompt` → 422 `["ai.prompt.invalid"]`.
  - `POST /ai/generate` com `prompt` de 8001 caracteres → 422.
  - `POST /ai/generate` com `context` de 16001 caracteres → 422 `["ai.input.too_long"]`.
  - `POST /ai/generate` sem token → 401.
    Validar manualmente com a `OPENAI_API_KEY` real configurada.
    > ✅ 2026-05-18 13:09 — `ai.integration.http` (Rest Client) criado com todos os cenários: register/login p/ token, prompt curto → 200 `{text}`, prompt+context+instruction → 200, sem prompt → 422 `["ai.prompt.invalid"]` (+ cenário extra de prompt em branco), prompt 8001 chars → 422, context 16001 chars → 422 `["ai.input.too_long"]` (+ instruction 2001 chars), e sem token → 401. **Desvio (rule 5):** os cenários que exigem strings de 8001/16001/2001 caracteres ficam com placeholder e comentário instruindo a colagem (o formato Rest Client não gera strings longas inline). **Validação manual com a `OPENAI_API_KEY` real não executada nesta sessão**: nenhuma chave real está disponível (placeholder vazio em `.env`, conforme política de não comitar a chave) — passo manual a cargo do usuário com a chave configurada localmente.

- [x] Adicionar i18n: `ai.prompt.invalid`, `ai.input.too_long`, `ai.generate.failed`, `ai.generate.empty` em PT e EN.
  > ✅ 2026-05-18 13:09 — As 4 chaves adicionadas em `apps/frontend/src/shared/i18n/messages.pt.ts` (atualiza o tipo `ErrorMessageKey` via `as const`) e em `messages.en.ts` (mantém o `Record<ErrorMessageKey,string>` completo). `getMessage(code)` resolve as mensagens dos toasts de erro do `AiTextField`.

### Tasks - Componente de input com IA (frontend)

- [x] Criar `apps/frontend/src/shared/api/ai.api.ts`:
  - `AiApiError extends Error` com `codes: string[]`.
  - `generateAiText(token, { prompt, context?, instruction? }): Promise<string>` que faz `POST /ai/generate` com `Authorization: Bearer ${token}`.
    > ✅ 2026-05-18 13:09 — Criado `apps/frontend/src/shared/api/ai.api.ts` (novo diretório `shared/api/`). `AiApiError extends Error` com `codes: string[]` e `status` (mesmo padrão de `IdeaApiError`). `generateAiText(token, { prompt, context?, instruction? })` faz `POST ${NEXT_PUBLIC_API_URL}/ai/generate` com `Authorization: Bearer ${token}`, retorna `body.text` em sucesso e lança `AiApiError(codes, status)` lendo `ApiErrorResponse.errors[]` em erro.

- [x] Criar o componente compartilhado `apps/frontend/src/shared/components/ui/ai-text-field.tsx` (`'use client'`) exportando `AiTextField` (default) e `AiTextFieldProps`. Props: `value`, `onChange`, `prompt`, `contextFields?`, `multiline?`, `rows?`, `placeholder?`, `id?`, `name?`, `disabled?`, `className?`, `onAfterGenerate?`. Comportamento conforme **Observações Locais** (botão `Sparkles`, popover de instrução, modo gerar/refinar, loading, tooltip de campos pendentes, conteúdo atual como contexto principal, vocabulário "Refinar" quando há valor atual).

  > ✅ 2026-05-18 13:09 — Criado `ai-text-field.tsx` (`'use client'`), `export default AiTextField` + `export { AiTextField }` + `AiTextFieldProps`/`AiContextField`. Props conforme spec; `onChange` recebe a string diretamente. Variante `Input` (single) / `Textarea` (multiline, `rows`) com `pr-12` para não sobrepor o botão. Botão de IA embutido no canto (ícone `Sparkles`). `isRefine` quando `value` não vazio → rótulo do botão do popover vira "Refinar"; conteúdo atual entra como **contexto principal** em bloco `"""…"""` com rótulo forte, à frente dos `contextFields`, mais instrução automática de refino (preservar intenção, não recomeçar). `contextFields` com `required` vazios → botão desabilitado e `Tooltip` listando os labels pendentes (envolto em `<span tabIndex>` para o tooltip funcionar no botão desabilitado). Clique abre `Popover` com `Textarea` "Instrução adicional (opcional)" + botão "Gerar"/"Refinar"; sucesso substitui o valor inteiro (`onChange`) + `onAfterGenerate?` e fecha o popover; erro mantém o popover aberto e dispara `toast.error(getMessage(code))` por código (`AiApiError`). Loading: desabilita input/botão, troca `Sparkles`→`Loader2` girando e exibe "Gerando…" abaixo do campo. Token lido via `Cookies.get(AUTH_COOKIE_NAME)` (mesmo padrão dos demais wrappers).

- [x] Rodar `npx tsc --noEmit` em `apps/frontend` após criar componente e wrapper.
  > ✅ 2026-05-18 13:09 — `npx tsc --noEmit` em `apps/frontend` executado **sem erros** após a criação de `ai.api.ts` e `ai-text-field.tsx`.

### Tasks - Substituição nos formulários existentes

- [x] Atualizar `apps/frontend/src/modules/ideas/components/idea-type-form.component.tsx`:
  - `name` continua `Input`.
  - `description` → `<AiTextField multiline rows={3} prompt={...} contextFields={[{ label: 'Nome', value: state.name, required: true }]} />`.
  - `prompt` → `<AiTextField multiline rows={12} prompt={...} contextFields={[{ label: 'Nome', value: state.name, required: true }, { label: 'Descrição', value: state.description, required: true }]} />`.
  - Manter o hint dos marcadores abaixo do campo `prompt` (entregue na spec 005).
    > ✅ 2026-05-18 13:09 — `name` segue como `Input`. `description` agora `<AiTextField multiline rows={3}>` com `prompt={DESCRIPTION_AI_PROMPT}` e `contextFields=[{label:'Nome',value:name,required:true}]`. `prompt` agora `<AiTextField multiline rows={12}>` com `prompt={PROMPT_AI_PROMPT}` e `contextFields=[Nome*, Descrição*]`. Prompts orientativos definidos como **string literal no próprio componente** (consts `DESCRIPTION_AI_PROMPT`/`PROMPT_AI_PROMPT`) — sem arquivo de config separado; marcadores `{{name}}/{{description}}/{{objective}}/{{resources}}` mantidos literais no texto. Hint `IDEA_TYPE_PROMPT_HINT` preservado abaixo do campo `prompt`. Import de `Textarea` removido (substituído por `AiTextField`).

- [x] Atualizar `apps/frontend/src/modules/ideas/components/idea-form.component.tsx`:
  - `name` continua `Input`; `ideaTypeId` continua `<select>`.
  - `description` → `<AiTextField multiline rows={6} ... contextFields=[Nome, Tipo de Ideia (required)] />`.
  - `objective` → `<AiTextField multiline rows={4} ... contextFields=[Nome, Descrição, Tipo de Ideia (todos required)] />`.
  - `ideaTypeName` resolvido a partir do `state.ideaTypeId` consultando a lista local de Tipos de Ideia já carregada pelo formulário.
    > ✅ 2026-05-18 13:09 — `name` segue `Input`; `ideaTypeId` segue o `Combobox` já existente (não há `<select>` nativo no kit; `Combobox` é o equivalente do projeto, decisão herdada da spec 007 — mantido intacto). `description` → `<AiTextField multiline rows={6}>` (`DESCRIPTION_AI_PROMPT`, contextFields `Nome*`, `Tipo de Ideia*`). `objective` → `<AiTextField multiline rows={4}>` (`OBJECTIVE_AI_PROMPT`, contextFields `Nome*`, `Descrição*`, `Tipo de Ideia*`). `ideaTypeName` derivado em render: `ideaTypes.find(t => t.id === ideaTypeId)?.name ?? ''` a partir da lista local já carregada. Prompts como string literal no componente. Import de `Textarea` removido.

- [x] Rodar `npx tsc --noEmit` e `npm run build` em `apps/frontend`. Sinalizar UI pronta para conferência manual com checklist:
  - Em "Novo Tipo de Ideia": preencher só `name`, clicar no botão de IA do `description`, abrir popover, "Gerar" → recebe descrição plausível.
  - Em "Novo Tipo de Ideia": preencher `name` + `description`, clicar no botão de IA do `prompt`, "Gerar" → recebe prompt referenciando os marcadores.
  - Com `description` já preenchida, clicar no botão de IA do `description` (modo refinar) → recebe variação refinada.
  - Em "Nova Ideia": botões de IA de `description` e `objective` desabilitados até `name` e `Tipo de Ideia` preenchidos; tooltip indica os campos pendentes.
    > ✅ 2026-05-18 13:09 — `npx tsc --noEmit` **sem erros** e `npm run build` em `apps/frontend` **concluído com sucesso** (`Compiled successfully`, TypeScript ok, 11 rotas geradas). `npm --workspace apps/backend run build` (`nest build`) também **sem erros**. **Sem verificação automatizada de UI nesta spec** (conforme Objetivo/Observações Locais): a interface está pronta para a conferência manual pelo usuário com o checklist acima — note que os itens que disparam geração real dependem da `OPENAI_API_KEY` real configurada localmente (placeholder vazio no repositório).

### Tasks - Memória do projeto

- [x] Atualizar `.spec/memory/contexto-tecnico.md`:
  - Decisão: provedor de IA inicial = OpenAI (ChatGPT), SDK `openai`.
  - Modelo padrão: `gpt-4o-mini` (configurável por `OPENAI_MODEL`).
  - Variáveis novas: `OPENAI_API_KEY`, `OPENAI_MODEL`.
  - Remover/ajustar o ponto aberto "definir qual provedor de IA será usado primeiro".
    > ✅ 2026-05-18 13:09 — **Desvio (rule 5):** o diretório/arquivos de memória **não existiam** no repositório (nem `.spec/memory/` nem `.specs/memory/`; nenhum dos `Referências de Projeto` da spec existe). Criado `.specs/memory/contexto-tecnico.md` (caminho real para o qual `../../memory/` resolve a partir de `.specs/changes/008.../spec.md`; a spec usa `.spec/` por engano de digitação). Registrados: provedor inicial OpenAI (ChatGPT) com SDK `openai`; modelo padrão `gpt-4o-mini` configurável por `OPENAI_MODEL`; variáveis novas `OPENAI_API_KEY`/`OPENAI_MODEL`; ponto aberto "definir qual provedor de IA" marcado como **resolvido**.

- [x] Atualizar `.spec/memory/processamento-ia.md` adicionando uma nota curta de que existe o endpoint genérico `POST /ai/generate` (entregue por esta spec) usado para auxílio de preenchimento de formulários no frontend, e que o caso de uso `process-idea` (futuro) usará o **mesmo `AiProvider`** internamente, sem passar por esse endpoint. Registrar também que **a composição do prompt acontece no frontend** para `/ai/generate` (decisão arquitetural — nas specs futuras de processamento o prompt é montado no backend, e essa diferença é deliberada).
  > ✅ 2026-05-18 13:09 — **Desvio (rule 5):** arquivo inexistente; criado `.specs/memory/processamento-ia.md` (mesmo motivo de caminho do item anterior). Nota registrada: endpoint genérico `POST /ai/generate` (spec 008) para auxílio de preenchimento de formulários no frontend; `process-idea` (futuro) usará o **mesmo `AiProvider`** internamente, **sem** passar por `/ai/generate`; composição do prompt do `/ai/generate` acontece **no frontend** (`AiTextField`), enquanto nas specs futuras de processamento o prompt é montado no backend — diferença **deliberada**.

## Resultado Esperado

- Módulo Nest `AiModule` registrado, com `OpenAiProvider` implementando `AiProvider` e o endpoint autenticado `POST /ai/generate`, com validação de entrada e tratamento padronizado de erros do provedor.
- Variáveis `OPENAI_API_KEY` e `OPENAI_MODEL` documentadas em `.env.example` e presentes em `.env` (sem chave real comitada).
- Componente compartilhado `AiTextField` no frontend com botão de IA (gerar/refinar), popover de instrução opcional, suporte a campos de contexto obrigatórios e tratamento consistente de loading/erro.
- Wrapper `apps/frontend/src/shared/api/ai.api.ts` com `generateAiText` e `AiApiError`.
- Formulários **Tipo de Ideia** (`description`, `prompt`) e **Ideia** (`description`, `objective`) usando `AiTextField` com prompt orientativo e campos de contexto definidos nesta spec.
- Memória do projeto atualizada (decisão de provedor + modelo padrão; nota cruzada em `processamento-ia.md` registrando inclusive a divergência consciente sobre onde o prompt é composto).
- `npx tsc --noEmit` e `npm run build` em `apps/frontend` sem erros; `npm --workspace apps/backend run build` sem erros; cenários de `ai.integration.http` validados manualmente com a chave real.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
