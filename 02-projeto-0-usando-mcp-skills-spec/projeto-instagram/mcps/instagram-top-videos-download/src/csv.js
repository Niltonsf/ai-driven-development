// Parser de CSV próprio (UTF-8), compatível com campos entre aspas,
// vírgulas e quebras de linha dentro dos valores.
import fs from "node:fs/promises";

/**
 * Faz o parse de um texto CSV em uma matriz de linhas (arrays de strings).
 * Regras suportadas:
 *  - campos delimitados por aspas duplas
 *  - aspas escapadas como "" dentro de um campo entre aspas
 *  - vírgulas e quebras de linha (\n ou \r\n) dentro de campos entre aspas
 */
export function parseCsv(text) {
  // Remove BOM se presente
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let fieldStarted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && !fieldStarted) {
      inQuotes = true;
      fieldStarted = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      fieldStarted = false;
      continue;
    }

    if (ch === "\r") {
      // trata \r\n e \r isolado como fim de linha
      if (text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      fieldStarted = false;
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      fieldStarted = false;
      continue;
    }

    field += ch;
    fieldStarted = true;
  }

  // último campo/linha (se houver conteúdo pendente)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** Converte a matriz do CSV em uma lista de objetos usando a primeira linha como cabeçalho. */
export function rowsToRecords(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h).trim());
  const records = [];

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    // ignora linhas totalmente vazias
    if (cells.every((c) => String(c).trim() === "")) continue;

    const obj = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = cells[c] !== undefined ? cells[c] : "";
    }
    records.push(obj);
  }

  return records;
}

/** Converte um valor de curtidas para número; valores inválidos viram 0. */
export function toLikes(value) {
  if (value === undefined || value === null) return 0;
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Lê o CSV, ignora registros sem `shortcode` válido e devolve os registros
 * ordenados exclusivamente pela coluna `likes` (decrescente).
 * A coluna `views` é totalmente ignorada na ordenação.
 */
export async function readAndSortByLikes(csvPath) {
  const text = await fs.readFile(csvPath, "utf8");
  const records = rowsToRecords(parseCsv(text));

  const valid = records
    .map((r) => ({
      shortcode: String(r.shortcode ?? "").trim(),
      likes: toLikes(r.likes),
      url: String(r.url ?? "").trim(),
    }))
    .filter((r) => r.shortcode.length > 0);

  valid.sort((a, b) => b.likes - a.likes);
  return valid;
}
