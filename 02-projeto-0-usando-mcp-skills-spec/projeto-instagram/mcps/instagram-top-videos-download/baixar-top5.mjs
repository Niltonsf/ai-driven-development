#!/usr/bin/env node
// Runner local (sem MCP): baixa os N vídeos mais curtidos de um lista.csv.
// Uso: node baixar-top5.mjs <caminho/lista.csv> [quantidade]
import path from "node:path";
import { readAndSortByLikes } from "./src/csv.js";
import { resolveVideoUrl } from "./src/instagram.js";
import { ensureDir, downloadToFile, sleep } from "./src/download.js";

const csv = path.resolve(process.argv[2] ?? "../../videos/michamenezes/lista.csv");
const count = Number.parseInt(process.argv[3] ?? "5", 10);
const dir = path.dirname(csv);

await ensureDir(dir);
const sorted = await readAndSortByLikes(csv);
console.log(`registros válidos: ${sorted.length} — baixando top ${count} por curtidas`);

for (let i = 0; i < Math.min(count, sorted.length); i++) {
  const { shortcode, likes } = sorted[i];
  const dest = path.join(dir, `${i + 1}_${shortcode}.mp4`);
  try {
    const url = await resolveVideoUrl(shortcode);
    const bytes = await downloadToFile(url, dest, shortcode);
    console.log(`ok   ${i + 1}. ${shortcode} — ${likes} curtidas (${bytes} bytes)`);
  } catch (err) {
    console.log(`erro ${i + 1}. ${shortcode}: ${err?.message || err}`);
  }
  if (i < count - 1) await sleep(800);
}
