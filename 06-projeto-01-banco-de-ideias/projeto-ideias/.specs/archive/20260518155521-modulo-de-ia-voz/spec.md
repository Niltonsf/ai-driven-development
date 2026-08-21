# 010-modulo-de-ia-voz

## Objetivo

Adicionar ao módulo de IA (entregue em uma spec anterior) um **canal independente de transcrição de voz**: o `AiTextField` ganha um botão de microfone que grava áudio pelo navegador e converte em texto via um novo endpoint `POST /ai/transcribe`, **anexando o resultado ao final** do conteúdo já existente do campo (sem nunca substituir). Os dois canais — geração/refinamento de texto (spec anterior) e ditado por voz (esta spec) — coexistem no mesmo componente sem competir entre si.

## Contexto Técnico

- Esta spec **depende** da 008-modulo-de-ia-texto: `AiModule`, `AiProvider`, `OpenAiProvider`, `AiTextField` e `ai.api.ts` precisam estar prontos. Esta spec **estende** todos esses artefatos sem alterar nenhum comportamento entregue antes.
- Endpoint novo, autenticado: `POST /ai/transcribe`. Recebe um arquivo de áudio (upload) gravado pelo navegador e devolve `{ text: string }`. Genérico de propósito — não recebe ids de Ideia/Tipo de Ideia e não conhece o campo de destino.
- Variável de ambiente nova: `OPENAI_TRANSCRIPTION_MODEL` (opcional, default `whisper-1`). A `OPENAI_API_KEY` da spec 008 cobre os dois canais — não é necessária outra chave.
- Componente: o `AiTextField` ganha um segundo botão (microfone) ao lado do botão de IA já existente. Sem alterar nenhuma das funcionalidades do canal de geração/refinamento.
- Sem mudança no domínio. Sem verificação automatizada de UI nesta spec.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- **Canal de transcrição é fluxo separado e autônomo** do botão de gerar/refinar com IA. Ditado por voz e geração de texto **não se misturam**: o usuário pode usar um, o outro, os dois em sequência, ou nenhum, sem que um afete o resultado do outro.
- **Botão de microfone**: aparece dentro do campo, ao lado do botão de IA já existente, com ícone de microfone e tom visual neutro/azulado (não vermelho, para não parecer alerta). `aria-label` "Gravar áudio". Fica desabilitado enquanto a geração via prompt ou uma transcrição já em andamento ocupam o componente.
- **Início da gravação**: clicar no microfone solicita permissão do navegador (se ainda não tiver sido concedida) e começa a captar áudio. Sem suporte ou permissão negada → `toast.error` curto, nada mais acontece.
- **Estado "gravando"** (visual no input): faixa sobreposta ao input, do mesmo tamanho do campo, em tom suave de sky/azul (sem vermelho). Contém:
  - À esquerda, um **microfone em destaque com pulso animado** (efeito "ping").
  - No centro, uma **onda sonora animada** que reage ao volume real do microfone — barras subindo e descendo conforme o usuário fala.
  - À direita, dois botões: ✕ para **cancelar** e ✓ para **confirmar**.
- **Cancelar (✕)**: descarta o áudio capturado, encerra a gravação, libera o microfone e volta o input ao estado normal. Nenhuma chamada à API; conteúdo do campo intacto.
- **Confirmar (✓)**: encerra a gravação, libera o microfone e envia o áudio para `POST /ai/transcribe`. Durante o envio/transcrição, o microfone aparece com um spinner ("transcrevendo") e o input continua desabilitado. Em sucesso, `toast.success("Áudio transcrito.")` e aplica o resultado conforme regra de anexar abaixo. Em erro, `toast.error(getMessage(code))` para os códigos `ai.audio.required`, `ai.audio.too_large`, `ai.audio.invalid_type`, `ai.transcribe.failed`, `ai.transcribe.empty`.
- **Anexar ao final, nunca substituir**: o texto transcrito é **sempre anexado ao final** do conteúdo atual. Se o campo estava vazio, o resultado vira o conteúdo. Se já havia conteúdo, garantir exatamente um espaço entre o conteúdo existente e o trecho transcrito (removendo brancos sobrando). Comportamento **diferente** do canal de geração/refinamento (que substitui o valor inteiro) — diferença deliberada: ditar por voz é um modo de **adicionar** texto, não de reescrever.
- **Sem mensagem de status em vermelho**: a indicação visual de gravação fica **dentro** do input. Vermelho fica reservado para erros reais. Mensagens auxiliares discretas ("Transcrevendo áudio...") ficam em tom neutro.
- **Limpeza ao desmontar/cancelar**: se o componente for desmontado durante uma gravação, captura encerrada, microfone liberado, áudio descartado.
- **Validação no backend** (no controller, sem entidade — mesmo padrão do `/ai/generate`):
  1. Sem arquivo → `DomainError("ai.audio.required", 422)`.
  2. Tipo diferente de `audio/*` → `DomainError("ai.audio.invalid_type", 422)`.
  3. Tamanho > 25MB → `DomainError("ai.audio.too_large", 422)`.
  4. Áudio sem fala identificável → `DomainError("ai.transcribe.empty", 502)` (vinda do provider).
  5. Qualquer falha do SDK → `Logger` + `DomainError("ai.transcribe.failed", 502)` (mensagem original não vai para o cliente).

## Tasks

### Tasks - Backend (estender módulo de IA)

- [x] Estender o contrato `AiProvider` (classe abstrata, em `apps/backend/src/modules/ai/ai.provider.ts`) com a operação **transcribe(audio): Promise<string>**. Implementar em `OpenAiProvider`, reaproveitando o cliente OpenAI já configurado para a geração de texto. Modelo lido de `OPENAI_TRANSCRIPTION_MODEL` (default `whisper-1`). Em sucesso, devolve o texto transcrito; áudio sem fala → `DomainError("ai.transcribe.empty", 502)`. Falha do SDK → log + `DomainError("ai.transcribe.failed", 502)`.

  > ✅ 2026-05-18 14:35 — `AiProvider` ganhou `abstract transcribe(input: AiTranscribeInput)` e a interface `AiTranscribeInput { buffer, fileName, mimeType }`. `OpenAiProvider.transcribe` usa `toFile()` + `client.audio.transcriptions.create` com o mesmo cliente/chave da geração; modelo de `OPENAI_TRANSCRIPTION_MODEL` (default `whisper-1`). Texto vazio → `DomainError("ai.transcribe.empty",502)`; demais falhas → `Logger.error` + `DomainError("ai.transcribe.failed",502)`. `nest build` OK.

- [x] Expor `POST /ai/transcribe` no `AiController`, autenticado (sem `@Public()`), recebendo upload de arquivo. Aplicar as cinco validações descritas em **Observações Locais** e devolver `{ text }`.

  > ✅ 2026-05-18 14:35 — Endpoint `@Post('transcribe')` com `FileInterceptor('file')` (memory storage), sem `@Public()` (guard JWT global aplica auth). Validações: sem arquivo/vazio → `ai.audio.required` 422; mimetype fora de `audio/*` → `ai.audio.invalid_type` 422; > 25MB → `ai.audio.too_large` 422; sem fala / falha SDK vêm do provider (502). Tipo do upload definido como interface local `UploadedAudio` (projeto não tem `@types/multer`). Devolve `{ text }`.

- [x] Adicionar `OPENAI_TRANSCRIPTION_MODEL="whisper-1"` em `apps/backend/.env.example` e `apps/backend/.env`.

  > ✅ 2026-05-18 14:35 — Linha `OPENAI_TRANSCRIPTION_MODEL="whisper-1"` adicionada nos dois arquivos, logo após `OPENAI_MODEL`. `OPENAI_API_KEY` existente já cobre os dois canais.

- [x] Estender `apps/backend/src/modules/ai/ai.integration.http` com cenários para o novo endpoint:
  - `POST /ai/transcribe` com áudio válido → 200 `{ text }` não vazio.
  - `POST /ai/transcribe` sem arquivo → 422 `["ai.audio.required"]`.
  - `POST /ai/transcribe` com arquivo de tipo inválido (ex.: texto puro) → 422 `["ai.audio.invalid_type"]`.
  - `POST /ai/transcribe` sem token → 401.
    Validar manualmente com a `OPENAI_API_KEY` real configurada e um arquivo de áudio curto. Anotar tempo da chamada e trecho do texto retornado.
    > ✅ 2026-05-18 14:35 — Bloco "Transcricao de voz" adicionado ao `ai.integration.http` com os 4 cenários (multipart com `< ./fixtures/sample.webm`, sem arquivo, `text/plain` inválido, sem token). **Desvio:** a validação manual com `OPENAI_API_KEY` real + arquivo de áudio depende de execução humana (requer fornecer um áudio em `apps/backend/src/modules/ai/fixtures/`) — cenários prontos para rodar; tempo/trecho da chamada real ficam pendentes de conferência manual pelo usuário.

- [x] Adicionar i18n: `ai.audio.required`, `ai.audio.too_large`, `ai.audio.invalid_type`, `ai.transcribe.failed`, `ai.transcribe.empty` em PT e EN. PT segue o tom curto: `ai.transcribe.failed` = "Não foi possível transcrever o áudio agora. Tente novamente.".
  > ✅ 2026-05-18 14:35 — As 5 chaves adicionadas em `messages.pt.ts` e `messages.en.ts` (i18n vive no frontend; backend só emite códigos). PT de `ai.transcribe.failed` exatamente "Não foi possível transcrever o áudio agora. Tente novamente.". Tipagem `ErrorMessages` mantém PT/EN em paridade — `tsc --noEmit` OK.

### Tasks - Frontend (estender wrapper e componente)

- [x] Estender `apps/frontend/src/shared/api/ai.api.ts` com `transcribeAiAudio(token, audioBlob, fileName?)` que envia o áudio para `POST /ai/transcribe` (com `Authorization: Bearer ${token}`) e devolve o texto transcrito. Mantém o mesmo padrão de erro (`AiApiError` com `codes: string[]`).

  > ✅ 2026-05-18 14:35 — `transcribeAiAudio(token, audioBlob, fileName='audio.webm')` adicionada: monta `FormData` com campo `file`, `POST /ai/transcribe` com `Authorization: Bearer`, sem `Content-Type` manual (browser define o boundary). Parser de erro extraído para `buildAiApiError` reaproveitado por `generateAiText` e pela nova função, mantendo `AiApiError { codes, status }`. Comportamento de `generateAiText` inalterado.

- [x] Adicionar ao componente `AiTextField`, **sem quebrar nenhum dos comportamentos atuais** (gerar, refinar, contexto auxiliar, popover, loading, tooltip de campos pendentes), o **canal de transcrição por voz**:
  - Botão de microfone dentro do campo, ao lado do botão de IA.
  - Fluxo de gravação com início ao clicar, controles ✕ (cancelar) e ✓ (confirmar).
  - Faixa visual sobreposta ao input (sem vermelho), com microfone pulsante e onda sonora animada reagindo ao volume real do microfone.
  - Estado "transcrevendo" com spinner; input desabilitado durante envio.
  - Resultado **anexado ao final** do conteúdo atual; nunca substitui.
  - Tratamento de borda: navegador sem suporte ou permissão negada → `toast.error` curto, nada altera. Backend → `toast.error(getMessage(code))` para os códigos novos. Componente desmontado durante a gravação → captura encerrada e áudio descartado.
    > ✅ 2026-05-18 14:35 — Canal de voz adicionado preservando todo o fluxo da spec 008 (gerar/refinar, popover, instrução, tooltip de campos pendentes, loading). Botão de microfone (`aria-label="Gravar áudio"`, tom sky, não vermelho) ao lado do botão de IA, desabilitado quando `disabled || loading || transcribing`. `MediaRecorder` + `getUserMedia`; visualizador via `AudioContext`/`AnalyserNode` com 14 barras reagindo ao volume real. Faixa sobreposta (`absolute inset-0`, `bg-sky-50`, borda sky) com microfone `animate-ping`, onda animada e botões ✕/✓. Cancelar (`cancelledRef`) descarta áudio sem chamar API; confirmar envia. Estado "transcrevendo" com `Loader2` + "Transcrevendo áudio…" neutro e input desabilitado. Resultado **anexado ao final** via `appendTranscription` (trim do trailing + 1 espaço; se vazio vira o conteúdo) usando `valueRef`/`onChangeRef` para evitar closure stale. Sem suporte/permissão negada → `toast.error` curto. Erros de backend → `toast.error(getMessage(code))`. `useEffect` de unmount encerra recorder e libera mídia (`releaseMedia`). Sem nenhuma mensagem em vermelho abaixo do campo.

- [x] Rodar `npx tsc --noEmit` em `apps/frontend`. Sinalizar UI pronta para conferência manual com checklist:
  - Em qualquer campo com `AiTextField`, clicar no microfone, falar uma frase curta, clicar em ✓ → texto **anexado** ao final do que já estava no campo (ou vira o conteúdo, se estava vazio).
  - Repetir várias gravações em sequência sem apagar o campo → cada nova é adicionada ao fim, sem apagar as anteriores.
  - Clicar no microfone, gravar e clicar em ✕ → nada é alterado no campo.
  - Conferir que a faixa visual com microfone pulsante e onda sonora aparece **dentro** do input e que **não há** mensagem em vermelho abaixo do campo.
  - Botão de gerar/refinar com IA continua funcionando como antes (independente do canal de transcrição).
    > ✅ 2026-05-18 14:35 — `cd apps/frontend && npx tsc --noEmit` sem erros e `npm run build` (Next 16.2.6) compilado com sucesso (TypeScript OK, 11 rotas geradas). Backend: `npm --workspace apps/backend run build` (`nest build`) sem erros. **UI pronta para conferência manual** — o checklist acima (gravar→✓ anexa ao final; sequência de gravações acumula; ✕ não altera; faixa visual dentro do input sem vermelho; botão de IA inalterado) depende de navegador real com microfone e fica pendente de validação manual pelo usuário; não há verificação automatizada de UI nesta spec.

### Tasks - Memória do projeto

- [x] Atualizar `.spec/memory/contexto-tecnico.md` registrando o canal de **transcrição de voz**: existe um segundo endpoint (`POST /ai/transcribe`), variável `OPENAI_TRANSCRIPTION_MODEL` (default `whisper-1`) reaproveitando a mesma `OPENAI_API_KEY`. A capacidade é exposta no frontend pelo botão de microfone do `AiTextField`, com resultado **anexado** ao final do conteúdo do campo.

  > ✅ 2026-05-18 14:35 — `.specs/memory/contexto-tecnico.md` criado (diretório `.specs/memory/` existia vazio; **desvio:** "atualizar" virou "criar" pois o arquivo não existia). Documenta os dois canais do módulo de IA: `POST /ai/generate` (substitui) e `POST /ai/transcribe` (anexa ao final), com `OPENAI_TRANSCRIPTION_MODEL` default `whisper-1` reaproveitando a mesma `OPENAI_API_KEY` e o mesmo cliente OpenAI.

- [x] Atualizar `.spec/memory/processamento-ia.md` adicionando o canal de transcrição (`POST /ai/transcribe`): serve para ditado dentro de campos textuais, resultado sempre anexado ao final, reusa o mesmo `AiProvider`.
  > ✅ 2026-05-18 14:35 — `.specs/memory/processamento-ia.md` criado (mesmo desvio: arquivo não existia, foi criado). Descreve os dois canais independentes do `AiTextField`; o de transcrição (`POST /ai/transcribe`) serve para ditado em campos textuais, sempre anexa ao final com exatamente um espaço, e reusa o mesmo `AiProvider`/chave.

## Resultado Esperado

- `AiProvider` estendido com a operação de transcrição; `OpenAiProvider` reaproveitando o mesmo cliente OpenAI.
- Endpoint `POST /ai/transcribe` autenticado, com validação de presença/tipo/tamanho do upload e tratamento padronizado de erros.
- Variável `OPENAI_TRANSCRIPTION_MODEL` documentada em `.env.example` e presente em `.env`.
- `AiTextField` com botão de microfone, gravação visual sobreposta (sem vermelho), controles ✕/✓, estado "transcrevendo" e anexação ao final do conteúdo, sem alterar nenhum dos comportamentos da spec 008.
- Wrapper `transcribeAiAudio` em `apps/frontend/src/shared/api/ai.api.ts`.
- Memória do projeto atualizada com o segundo canal e a variável.
- `npx tsc --noEmit` e `npm run build` em `apps/frontend` sem erros; `npm --workspace apps/backend run build` sem erros; cenários de transcrição em `ai.integration.http` validados manualmente.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
