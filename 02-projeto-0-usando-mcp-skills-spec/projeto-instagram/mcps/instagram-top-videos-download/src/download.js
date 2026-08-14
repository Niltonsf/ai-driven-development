// Download de arquivos via stream (não carrega o vídeo inteiro em memória).
import fs from "node:fs";
import fsp from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { browserHeaders } from "./instagram.js";

export async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Baixa `url` para `destPath` usando stream. Em caso de falha, remove o
 * arquivo parcial e propaga o erro para o chamador decidir.
 */
export async function downloadToFile(url, destPath, shortcode) {
  const res = await fetch(url, { headers: browserHeaders(shortcode) });

  if (!res.ok || !res.body) {
    throw new Error(`Download retornou HTTP ${res.status} para ${shortcode}`);
  }

  const out = fs.createWriteStream(destPath);
  try {
    await pipeline(Readable.fromWeb(res.body), out);
  } catch (err) {
    await fsp.rm(destPath, { force: true }).catch(() => {});
    throw err;
  }

  const stat = await fsp.stat(destPath);
  if (stat.size === 0) {
    await fsp.rm(destPath, { force: true }).catch(() => {});
    throw new Error(`Arquivo vazio recebido para ${shortcode}`);
  }

  return stat.size;
}
