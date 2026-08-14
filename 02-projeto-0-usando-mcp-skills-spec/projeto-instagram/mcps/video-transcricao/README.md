# video-transcricao (MCP)

Servidor MCP em Node.js que **lê arquivos de vídeo, extrai um áudio comprimido e
os transcreve** usando a **API da OpenAI**. Para cada vídeo é gravado, **ao lado
dele**, um arquivo `.txt` contendo **apenas a transcrição** — sem cabeçalho, sem
metadados, só o texto.

A conversão de vídeo para áudio usa um **ffmpeg estático embutido**
([`ffmpeg-static`](https://www.npmjs.com/package/ffmpeg-static)): nada precisa
ser instalado no sistema e funciona igual em **Windows, Linux e macOS**.

## Como funciona

1. Extrai o áudio do vídeo no **menor tamanho possível** mantendo a fala
   inteligível: **mono, 16 kHz**, codec de baixíssimo bitrate (**Opus ~16 kbps**
   quando o build do ffmpeg suporta; senão **MP3 32 kbps**).
2. Se o áudio passar do limite da API (25 MB), ele é **fatiado por tempo** em
   partes que cabem no limite; cada parte é transcrita e o texto é concatenado.
3. Envia o áudio para a API de transcrição da OpenAI e grava o resultado em
   `<nome-do-video><sufixo>.txt` na **mesma pasta do vídeo** (sufixo padrão:
   `.transcricao`, ou seja `video.mp4` → `video.transcricao.txt`).

Os arquivos de áudio são temporários e removidos ao final — apenas o `.txt`
permanece.

## Configuração (obrigatória)

O MCP precisa da chave da OpenAI em uma variável `OPENAI_API_KEY`, lida de um
arquivo **`.env` DENTRO desta mesma pasta** (não na raiz do repositório).

```bash
# dentro desta pasta (recursos/mcps/video-transcricao)
cp .env.example .env
# edite o .env e preencha:
#   OPENAI_API_KEY=sk-...
```

Variáveis opcionais (também no `.env`):

| Variável                  | Padrão          | Descrição                                                        |
|---------------------------|-----------------|------------------------------------------------------------------|
| `OPENAI_API_KEY`          | —               | **Obrigatória.** Sua chave da API da OpenAI.                     |
| `OPENAI_TRANSCRIBE_MODEL` | `whisper-1`     | Modelo. Ex.: `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`.      |
| `TRANSCRIPTION_SUFFIX`    | `.transcricao`  | Sufixo do `.txt` de saída.                                       |

## Ferramentas expostas

### `transcribe_file`
Transcreve **um** arquivo de vídeo.

| Parâmetro   | Tipo    | Obrigatório | Descrição                                                       |
|-------------|---------|-------------|-----------------------------------------------------------------|
| `path`      | string  | sim         | Caminho do arquivo de vídeo.                                    |
| `overwrite` | boolean | não         | Refazer mesmo se o `.txt` já existir (padrão: `false`).         |
| `model`     | string  | não         | Modelo da OpenAI (padrão: env / `whisper-1`).                   |
| `language`  | string  | não         | Idioma ISO p/ melhorar a precisão (ex.: `pt`). Auto se omitido. |

### `transcribe_folder`
Transcreve **todos os vídeos de uma pasta**. Reexecutável: pula vídeos já
transcritos (use `overwrite` para refazer).

| Parâmetro   | Tipo    | Obrigatório | Descrição                                          |
|-------------|---------|-------------|----------------------------------------------------|
| `folder`    | string  | sim         | Caminho da pasta com os vídeos.                    |
| `recursive` | boolean | não         | Incluir subpastas (padrão: `false`).               |
| `overwrite` | boolean | não         | Refazer transcrições existentes (padrão: `false`). |
| `model`     | string  | não         | Modelo da OpenAI (padrão: env / `whisper-1`).      |
| `language`  | string  | não         | Idioma ISO p/ melhorar a precisão (ex.: `pt`).     |

Formatos de vídeo suportados: `.mp4 .mkv .mov .avi .wmv .flv .webm .m4v .mpg .mpeg`.

## Saída

`<pasta-do-video>/<nome-do-video>.transcricao.txt` — somente o texto transcrito.

## Instalação

```bash
cd recursos/mcps/video-transcricao
npm install
```

## Registro no Claude Code

```bash
claude mcp add video-transcricao -- node /caminho/abs/recursos/mcps/video-transcricao/index.js
```

## Teste rápido (sem registrar)

```bash
printf '%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"transcribe_file","arguments":{"path":"/caminho/para/video.mp4"}}}' \
  | node index.js
```
