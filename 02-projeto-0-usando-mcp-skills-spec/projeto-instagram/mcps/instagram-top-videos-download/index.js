#!/usr/bin/env node
// MCP server: lê um CSV de vídeos de uma conta do Instagram, ordena pela
// coluna `likes` (decrescente, ignorando `views`) e baixa os N vídeos mais
// curtidos usando apenas o GraphQL público do Instagram (sem autenticação).
//
// O caminho do CSV é totalmente flexível: a conta é identificada pelo nome da
// pasta onde o arquivo está, e os vídeos são salvos nessa mesma pasta.
import path from "node:path";
import fsp from "node:fs/promises";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { readAndSortByLikes } from "./src/csv.js";
import { resolveVideoUrl } from "./src/instagram.js";
import { ensureDir, downloadToFile, sleep } from "./src/download.js";

const DELAY_MS = 800;

// Logs somente em stderr — stdout é exclusivo do protocolo MCP.
const log = (msg) => process.stderr.write(`[instagram-top-videos] ${msg}\n`);

/** Deriva o nome da conta a partir da pasta que contém o CSV. */
function accountFromCsvPath(csvPath) {
  const dir = path.dirname(path.resolve(csvPath));
  const name = path.basename(dir);
  // se o CSV estiver numa subpasta genérica (ex.: .../conta/dados/lista.csv),
  // sobe um nível para pegar o nome real da conta.
  if (["dados", "data", "csv", "output"].includes(name.toLowerCase())) {
    return path.basename(path.dirname(dir));
  }
  return name;
}

async function downloadTopVideos({ csvPath, count }) {
  const absCsv = path.resolve(String(csvPath));
  await fsp.access(absCsv);

  const account = accountFromCsvPath(absCsv);
  const targetDir = path.dirname(absCsv);
  await ensureDir(targetDir);

  const sorted = await readAndSortByLikes(absCsv);
  log(`conta=${account} registros_validos=${sorted.length} solicitados=${count}`);

  const selected = sorted.slice(0, Math.max(0, count));
  const downloaded = [];
  const errors = [];

  for (let i = 0; i < selected.length; i++) {
    const rank = i + 1; // ordem pela quantidade de curtidas
    const { shortcode, likes } = selected[i];
    const fileName = `${rank}_${shortcode}.mp4`;
    const destPath = path.join(targetDir, fileName);

    try {
      const videoUrl = await resolveVideoUrl(shortcode);
      const bytes = await downloadToFile(videoUrl, destPath, shortcode);
      downloaded.push({ rank, shortcode, likes, file: fileName, bytes });
      log(`ok ${rank}/${selected.length} ${fileName} (${bytes} bytes)`);
    } catch (err) {
      const message = err?.message || String(err);
      errors.push({ rank, shortcode, error: message });
      log(`falha ${rank}/${selected.length} ${shortcode}: ${message}`);
      // erro é ignorado: segue para os demais vídeos
    }

    if (i < selected.length - 1) await sleep(DELAY_MS);
  }

  return {
    account,
    csvPath: absCsv,
    outputDir: targetDir,
    requested: count,
    availableInCsv: sorted.length,
    downloadedCount: downloaded.length,
    downloaded,
    errors,
  };
}

const server = new McpServer({
  name: "instagram-top-videos-download",
  version: "1.0.0",
});

server.registerTool(
  "download_top_videos",
  {
    title: "Baixar vídeos mais curtidos",
    description:
      "Lê o CSV de vídeos de uma conta do Instagram, ordena pela coluna `likes` " +
      "(decrescente, ignorando `views`) e baixa os N vídeos mais curtidos. " +
      "Os arquivos são salvos como <ordem>_<shortcode>.mp4 na mesma pasta do CSV. " +
      "Vídeos com erro de resolução ou download são ignorados.",
    inputSchema: {
      csvPath: z
        .string()
        .describe("Caminho (absoluto ou relativo) do arquivo lista.csv"),
      count: z
        .number()
        .int()
        .positive()
        .describe("Quantidade de vídeos a baixar, a partir do mais curtido"),
    },
  },
  async ({ csvPath, count }) => {
    try {
      const summary = await downloadTopVideos({ csvPath, count });
      const lines = [
        `Conta: ${summary.account}`,
        `CSV: ${summary.csvPath}`,
        `Pasta de destino: ${summary.outputDir}`,
        `Solicitados: ${summary.requested}`,
        `Baixados: ${summary.downloadedCount}`,
        `Ignorados (erro): ${summary.errors.length}`,
      ];

      if (summary.downloaded.length) {
        lines.push("", "Arquivos:");
        for (const d of summary.downloaded) {
          lines.push(`  ${d.file} — ${d.likes} curtidas`);
        }
      }

      if (summary.errors.length) {
        lines.push("", "Erros ignorados:");
        for (const e of summary.errors) {
          lines.push(`  ${e.rank}_${e.shortcode}: ${e.error}`);
        }
      }

      return {
        content: [
          { type: "text", text: lines.join("\n") },
          { type: "text", text: JSON.stringify(summary, null, 2) },
        ],
      };
    } catch (err) {
      const message = err?.message || String(err);
      log(`erro fatal: ${message}`);
      return {
        isError: true,
        content: [{ type: "text", text: `Falha ao processar o CSV: ${message}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
log("servidor MCP iniciado (stdio)");
