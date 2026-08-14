#!/usr/bin/env node
// MCP server: lê arquivos de vídeo, extrai um áudio comprimido (ffmpeg embutido)
// e transcreve com a API da OpenAI. Para cada vídeo, grava ao lado dele um .txt
// contendo APENAS a transcrição (sem cabeçalho nem metadados).
//
// Configuração: variável OPENAI_API_KEY lida de um arquivo .env DENTRO desta
// mesma pasta (use o .env.example como modelo).
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { extractAudio, splitIfNeeded } from "./src/audio.js";
import { transcribeAudioFile } from "./src/transcribe.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega o .env da própria pasta do MCP.
// dotenv não sobrescreve variáveis já presentes no ambiente.
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Sufixo do arquivo de saída: <nome do vídeo><sufixo>.txt
const SUFFIX = process.env.TRANSCRIPTION_SUFFIX ?? ".transcricao";
const DEFAULT_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";

const VIDEO_EXTS = new Set([
  ".mp4", ".mkv", ".mov", ".avi", ".wmv", ".flv",
  ".webm", ".m4v", ".mpg", ".mpeg",
]);

function isVideo(file) {
  return VIDEO_EXTS.has(path.extname(file).toLowerCase());
}

function outputPathFor(videoPath) {
  const dir = path.dirname(videoPath);
  const base = path.basename(videoPath, path.extname(videoPath));
  return path.join(dir, `${base}${SUFFIX}.txt`);
}

async function transcribeVideo(videoPath, { overwrite, model, language, onLog }) {
  const txtPath = outputPathFor(videoPath);

  if (!overwrite) {
    try {
      await fs.access(txtPath);
      onLog?.(`pulado (já existe): ${path.basename(txtPath)}`);
      return { status: "skipped", videoPath, txtPath };
    } catch {
      // não existe -> segue
    }
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "vtx-"));
  try {
    onLog?.(`extraindo áudio: ${path.basename(videoPath)}`);
    const { audioPath, ext, durationSec } = await extractAudio(videoPath, workDir);

    const parts = await splitIfNeeded(audioPath, ext, durationSec, workDir);
    if (parts.length > 1) onLog?.(`áudio grande: dividido em ${parts.length} partes`);

    const pieces = [];
    for (let i = 0; i < parts.length; i++) {
      onLog?.(`transcrevendo parte ${i + 1}/${parts.length}...`);
      const text = await transcribeAudioFile(parts[i], { model, language });
      if (text) pieces.push(text);
    }

    const transcription = pieces.join("\n").trim();
    await fs.writeFile(txtPath, transcription + "\n", "utf8");
    onLog?.(`ok: ${path.basename(txtPath)} (${transcription.length} caracteres)`);
    return { status: "done", videoPath, txtPath, chars: transcription.length };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function listVideosIn(folder, recursive) {
  const out = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (recursive) await walk(full);
      } else if (e.isFile() && isVideo(e.name)) {
        out.push(full);
      }
    }
  }
  await walk(folder);
  out.sort();
  return out;
}

function apiKeyHint() {
  return (
    "A variável OPENAI_API_KEY não está definida. Crie um arquivo .env DENTRO " +
    "da pasta deste MCP (use o .env.example como modelo) com:\n" +
    "  OPENAI_API_KEY=sk-...\n" +
    "e reinicie o MCP."
  );
}

const server = new McpServer({
  name: "video-transcricao",
  version: "1.0.0",
});

const sharedOpts = {
  overwrite: z
    .boolean()
    .optional()
    .describe("Refazer a transcrição mesmo se o .txt já existir (padrão: false)."),
  model: z
    .string()
    .optional()
    .describe(
      "Modelo de transcrição da OpenAI (padrão: env OPENAI_TRANSCRIBE_MODEL ou 'whisper-1'). " +
        "Outras opções: 'gpt-4o-transcribe', 'gpt-4o-mini-transcribe'."
    ),
  language: z
    .string()
    .optional()
    .describe("Código ISO do idioma para melhorar a precisão (ex.: 'pt'). Padrão: detecção automática."),
};

server.registerTool(
  "transcribe_file",
  {
    title: "Transcrever um arquivo de vídeo",
    description:
      "Extrai o áudio (comprimido, via ffmpeg embutido) de UM arquivo de vídeo e " +
      "o transcreve com a API da OpenAI. Grava um .txt ao lado do vídeo contendo " +
      "apenas a transcrição. Requer OPENAI_API_KEY no .env da pasta deste MCP.",
    inputSchema: {
      path: z.string().min(1).describe("Caminho do arquivo de vídeo a transcrever."),
      ...sharedOpts,
    },
  },
  async ({ path: videoPath, overwrite, model, language }) => {
    const abs = path.resolve(videoPath);
    let st;
    try {
      st = await fs.stat(abs);
    } catch {
      return {
        isError: true,
        content: [{ type: "text", text: `Arquivo não encontrado: ${abs}` }],
      };
    }
    if (!st.isFile() || !isVideo(abs)) {
      return {
        isError: true,
        content: [{ type: "text", text: `Não é um arquivo de vídeo suportado: ${abs}` }],
      };
    }

    const logs = [];
    try {
      const r = await transcribeVideo(abs, {
        overwrite: overwrite ?? false,
        model: model ?? DEFAULT_MODEL,
        language,
        onLog: (m) => logs.push(m),
      });
      return {
        content: [
          {
            type: "text",
            text:
              (r.status === "skipped"
                ? `Já existia a transcrição: ${r.txtPath}`
                : `Transcrição salva em: ${r.txtPath}`) +
              "\n\n" +
              logs.join("\n"),
          },
        ],
      };
    } catch (err) {
      if (err.code === "OPENAI_API_KEY_AUSENTE") {
        return { isError: true, content: [{ type: "text", text: apiKeyHint() }] };
      }
      return {
        isError: true,
        content: [{ type: "text", text: `Falha ao transcrever ${abs}: ${err.message}` }],
      };
    }
  }
);

server.registerTool(
  "transcribe_folder",
  {
    title: "Transcrever todos os vídeos de uma pasta",
    description:
      "Percorre uma pasta, extrai o áudio comprimido de cada vídeo (ffmpeg embutido) " +
      "e transcreve com a API da OpenAI. Para cada vídeo grava um .txt ao lado, " +
      "contendo apenas a transcrição. Reexecutável: pula vídeos já transcritos " +
      "(use overwrite para refazer). Requer OPENAI_API_KEY no .env da pasta deste MCP.",
    inputSchema: {
      folder: z.string().min(1).describe("Caminho da pasta com os vídeos."),
      recursive: z
        .boolean()
        .optional()
        .describe("Incluir subpastas (padrão: false)."),
      ...sharedOpts,
    },
  },
  async ({ folder, recursive, overwrite, model, language }) => {
    const abs = path.resolve(folder);
    let st;
    try {
      st = await fs.stat(abs);
    } catch {
      return {
        isError: true,
        content: [{ type: "text", text: `Pasta não encontrada: ${abs}` }],
      };
    }
    if (!st.isDirectory()) {
      return {
        isError: true,
        content: [{ type: "text", text: `Não é uma pasta: ${abs}` }],
      };
    }

    const videos = await listVideosIn(abs, recursive ?? false);
    if (videos.length === 0) {
      return {
        content: [{ type: "text", text: `Nenhum vídeo encontrado em ${abs}.` }],
      };
    }

    let done = 0;
    let skipped = 0;
    let errors = 0;
    const logs = [];
    for (const v of videos) {
      const rel = path.relative(abs, v);
      try {
        const r = await transcribeVideo(v, {
          overwrite: overwrite ?? false,
          model: model ?? DEFAULT_MODEL,
          language,
          onLog: (m) => logs.push(`[${rel}] ${m}`),
        });
        if (r.status === "skipped") skipped++;
        else done++;
      } catch (err) {
        if (err.code === "OPENAI_API_KEY_AUSENTE") {
          return { isError: true, content: [{ type: "text", text: apiKeyHint() }] };
        }
        errors++;
        logs.push(`[${rel}] ERRO: ${err.message}`);
      }
    }

    return {
      content: [
        {
          type: "text",
          text:
            `Pasta ${abs}: ${done} transcritos, ${skipped} já existiam, ` +
            `${errors} com erro (de ${videos.length} vídeos).\n\n` +
            logs.join("\n"),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("video-transcricao MCP rodando em stdio.");
