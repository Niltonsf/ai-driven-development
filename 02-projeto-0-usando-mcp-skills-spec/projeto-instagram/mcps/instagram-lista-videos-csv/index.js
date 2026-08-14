#!/usr/bin/env node
// MCP server: coleta os vídeos de uma conta pública do Instagram e salva o
// CSV resultante (mais novos primeiro). O destino é definido por:
//  1) parâmetro `outputDir` da chamada (pasta indicada pelo prompt/receita), OU
//  2) env OUTPUT_DIR, OU
//  3) padrão: <raiz-do-projeto>/recursos/videos/<conta>
// Quando `outputDir` é informado, o CSV é gravado em
// `<outputDir>/dados/lista.csv` — a subpasta `dados` é criada automaticamente
// para isolar os artefatos do MCP do markdown que está orquestrando.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { fetchAccountVideos } from "./src/instagram.js";
import { readExisting, mergeVideos, writeCsv } from "./src/csv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_OUTPUT_BASE =
  process.env.OUTPUT_DIR || path.resolve(__dirname, "..", "..", "videos");

function csvPathFor(username, outputDir) {
  if (outputDir && String(outputDir).trim()) {
    return path.join(path.resolve(String(outputDir)), "dados", "lista.csv");
  }
  return path.join(DEFAULT_OUTPUT_BASE, username, "lista.csv");
}

async function runForAccount(username, maxPages, outputDir) {
  const logs = [];
  const onLog = (m) => logs.push(m);

  const result = await fetchAccountVideos(username, { maxPages, onLog });
  const csvPath = csvPathFor(username, outputDir);
  const existing = await readExisting(csvPath);
  const { merged, added, updated } = mergeVideos(existing, result.videos);
  await writeCsv(csvPath, merged);

  return {
    username,
    userId: result.userId,
    totalMediaNaConta: result.totalMedia,
    videosColetadosNestaExecucao: result.videos.length,
    novosAdicionados: added,
    atualizados: updated,
    totalNoArquivo: merged.length,
    paginasPercorridas: result.pagesFetched,
    erros: result.errors,
    arquivo: csvPath,
    logs,
  };
}

const server = new McpServer({
  name: "instagram-lista-videos-csv",
  version: "1.0.0",
});

server.registerTool(
  "fetch_account_videos",
  {
    title: "Coletar vídeos de uma conta do Instagram",
    description:
      "Acessa a API pública (web) do Instagram, sem autenticação, e coleta " +
      "todos os vídeos de uma conta com informações básicas + visualizações " +
      "e curtidas. Percorre o máximo de páginas possível e ignora erros de " +
      "acesso, guardando o que conseguir. Por padrão salva em " +
      "recursos/videos/<conta>/lista.csv (mais novos primeiro). Se " +
      "`outputDir` for informado (ex.: pasta da receita/markdown que está " +
      "executando este MCP), o CSV é gravado em " +
      "`<outputDir>/dados/lista.csv` — a subpasta `dados` é criada " +
      "automaticamente para isolar os artefatos do MCP do markdown.",
    inputSchema: {
      username: z
        .string()
        .min(1)
        .describe("Nome de usuário (@) da conta pública do Instagram."),
      maxPages: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Limite opcional de páginas a percorrer (padrão: todas)."),
      outputDir: z
        .string()
        .optional()
        .describe(
          "Pasta-base de destino. Use a pasta do markdown/receita que está " +
            "executando este MCP — assim a lista (e os vídeos baixados " +
            "depois) ficam junto do prompt. Quando informado, o CSV é gravado " +
            "em `<outputDir>/dados/lista.csv`; a subpasta `dados` é criada " +
            "automaticamente para isolar os artefatos do markdown."
        ),
    },
  },
  async ({ username, maxPages, outputDir }) => {
    const clean = String(username).trim().replace(/^@/, "");
    try {
      const summary = await runForAccount(clean, maxPages ?? Infinity, outputDir);
      return {
        content: [
          {
            type: "text",
            text:
              `Conta @${summary.username}: ${summary.videosColetadosNestaExecucao} vídeos coletados ` +
              `(${summary.novosAdicionados} novos, ${summary.atualizados} atualizados). ` +
              `Total no arquivo: ${summary.totalNoArquivo}. ` +
              `Páginas percorridas: ${summary.paginasPercorridas}. ` +
              `Erros ignorados: ${summary.erros.length}.\n` +
              `Arquivo: ${summary.arquivo}\n\n` +
              JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Falha ao coletar vídeos de @${clean}: ${err.message}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr para não poluir o protocolo (stdout) do MCP.
console.error("instagram-lista-videos-csv MCP rodando em stdio.");
