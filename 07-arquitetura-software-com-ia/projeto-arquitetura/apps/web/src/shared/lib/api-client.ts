// Cliente HTTP compartilhado da aplicação web.
//
// Centraliza o transporte (base URL, headers JSON, tratamento de erro) para que
// as camadas `data/` de cada módulo apenas descrevam *qual* recurso consultar,
// sem repetir detalhes de `fetch`. Reaproveite `apiRequest` em novos módulos.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/** Erro de transporte: status HTTP fora da faixa 2xx. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const details = await response.json().catch(() => undefined);
    throw new ApiError(`Falha na requisição (HTTP ${response.status}).`, response.status, details);
  }

  // Comandos costumam responder sem corpo (ex.: 204 No Content de um DELETE,
  // ou 200 de um POST que retorna `void`). Tentar `response.json()` num corpo
  // vazio lança "Unexpected end of JSON input"; por isso só desserializamos
  // quando há conteúdo de fato.
  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  return (raw ? JSON.parse(raw) : undefined) as T;
}
