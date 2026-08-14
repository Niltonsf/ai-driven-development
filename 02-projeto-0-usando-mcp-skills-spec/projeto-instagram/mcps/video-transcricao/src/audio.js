// Extração e compressão de áudio a partir de vídeos, usando um ffmpeg estático
// embutido (ffmpeg-static) — não exige nenhuma instalação externa e funciona
// igual em Windows, Linux e macOS.
//
// O objetivo é gerar o MENOR arquivo de áudio possível mantendo a fala
// inteligível para a transcrição: mono, 16 kHz e codec de baixíssimo bitrate
// (Opus quando disponível; senão MP3). Se ainda assim o áudio passar do limite
// de tamanho da API da OpenAI (25 MB), ele é fatiado por tempo em partes.
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

// Limite da API de transcrição da OpenAI é 25 MB. Ficamos com folga abaixo.
const MAX_BYTES = 24 * 1024 * 1024;

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg-static não encontrou o binário do ffmpeg."));
      return;
    }
    const proc = spawn(ffmpegPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`ffmpeg saiu com código ${code}:\n${stderr.slice(-2000)}`));
    });
  });
}

// Opus (~16 kbps mono) comprime muito melhor que MP3 para voz; MP3 é o fallback
// universal caso o build do ffmpeg não tenha libopus.
let codecChoice = null;
async function pickAudioCodec() {
  if (codecChoice) return codecChoice;
  let listing = "";
  try {
    const { stdout, stderr } = await runFfmpeg(["-hide_banner", "-encoders"]);
    listing = stdout + stderr;
  } catch {
    listing = "";
  }
  if (/\blibopus\b/.test(listing)) {
    codecChoice = {
      ext: "ogg",
      args: ["-c:a", "libopus", "-b:a", "16k", "-application", "voip"],
    };
  } else {
    codecChoice = {
      ext: "mp3",
      args: ["-c:a", "libmp3lame", "-b:a", "32k"],
    };
  }
  return codecChoice;
}

function parseDuration(stderr) {
  const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export async function extractAudio(videoPath, workDir) {
  const codec = await pickAudioCodec();
  const base = path.basename(videoPath, path.extname(videoPath));
  const out = path.join(workDir, `${base}.${codec.ext}`);
  const { stderr } = await runFfmpeg([
    "-hide_banner",
    "-y",
    "-i",
    videoPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    ...codec.args,
    out,
  ]);
  return { audioPath: out, ext: codec.ext, durationSec: parseDuration(stderr) };
}

export async function splitIfNeeded(audioPath, ext, durationSec, workDir) {
  const { size } = await fs.stat(audioPath);
  if (size <= MAX_BYTES) return [audioPath];
  // Sem duração não dá para calcular o corte; devolve como está e deixa a API
  // sinalizar o erro de tamanho de forma explícita.
  if (!durationSec) return [audioPath];

  const numSegments = Math.ceil(size / (MAX_BYTES * 0.9));
  const segTime = Math.max(1, Math.ceil(durationSec / numSegments));
  const base = path.basename(audioPath, path.extname(audioPath));
  const pattern = path.join(workDir, `${base}.part_%03d.${ext}`);

  await runFfmpeg([
    "-hide_banner",
    "-y",
    "-i",
    audioPath,
    "-f",
    "segment",
    "-segment_time",
    String(segTime),
    "-c",
    "copy",
    pattern,
  ]);

  const parts = (await fs.readdir(workDir))
    .filter((f) => f.startsWith(`${base}.part_`) && f.endsWith(`.${ext}`))
    .sort()
    .map((f) => path.join(workDir, f));

  return parts.length > 0 ? parts : [audioPath];
}
