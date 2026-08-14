// Chamada à API de transcrição da OpenAI (Whisper / gpt-4o-transcribe).
// Recebe um arquivo de áudio e devolve apenas o texto transcrito.
import { createReadStream } from "node:fs";
import OpenAI from "openai";

let client = null;
function getClient() {
  if (client) return client;
  const key = process.env.OPENAI_API_KEY;
  if (!key || !key.trim()) {
    const err = new Error("OPENAI_API_KEY_AUSENTE");
    err.code = "OPENAI_API_KEY_AUSENTE";
    throw err;
  }
  client = new OpenAI({ apiKey: key.trim() });
  return client;
}

// `language` é opcional (ex.: "pt"); se omitido, o modelo detecta o idioma.
export async function transcribeAudioFile(audioPath, { model, language }) {
  const openai = getClient();
  const resp = await openai.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model,
    response_format: "text",
    ...(language ? { language } : {}),
  });
  // Com response_format "text" a SDK devolve a string crua; por segurança
  // tratamos também o caso de vir um objeto { text }.
  if (typeof resp === "string") return resp.trim();
  return String(resp?.text ?? "").trim();
}
