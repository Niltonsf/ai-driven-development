import type {
  SeriesDataRequestDTO,
  SeriesDataSummaryDTO,
  TransactionDataRequestDTO,
  TransactionDataSummaryDTO,
} from '@poupig/dev';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type DataGeneratorStatusDTO = {
  enabled: boolean;
};

export class DataGeneratorApiError extends Error {
  readonly status: number;
  readonly codes: string[];

  constructor(params: { status: number; codes: string[] }) {
    super(params.codes[0] ?? 'DEFAULT_API_ERROR');
    this.name = 'DataGeneratorApiError';
    this.status = params.status;
    this.codes = params.codes;
  }
}

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function extractCodes(body: unknown): string[] {
  if (typeof body !== 'object' || body === null || !('message' in body)) return ['DEFAULT_API_ERROR'];

  const { message } = body as { message: unknown };
  if (typeof message === 'string' && message) return [message];
  if (Array.isArray(message)) {
    const codes = message.filter((item): item is string => typeof item === 'string');
    if (codes.length > 0) return codes;
  }

  return ['DEFAULT_API_ERROR'];
}

async function handleError(response: Response): Promise<never> {
  const body: unknown = await response.json().catch(() => null);
  throw new DataGeneratorApiError({ status: response.status, codes: extractCodes(body) });
}

/** `404` means the backend switch is off (`DEV_DATA_DISABLED`). */
export async function fetchDataGeneratorStatus(token: string): Promise<DataGeneratorStatusDTO> {
  const response = await fetch(`${API_BASE_URL}/dev/data-generator/status`, { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}

/** Synchronous run: resolves when every record was written, with the summary and the seed used. */
export async function generateTransactionData(
  token: string,
  payload: TransactionDataRequestDTO,
): Promise<TransactionDataSummaryDTO> {
  const response = await fetch(`${API_BASE_URL}/dev/data-generator/transactions`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) return handleError(response);
  return response.json();
}

/**
 * Synchronous run: resolves when every series and every occurrence up to the end
 * of the current month was written, with the summary and the seed used.
 */
export async function generateSeriesData(token: string, payload: SeriesDataRequestDTO): Promise<SeriesDataSummaryDTO> {
  const response = await fetch(`${API_BASE_URL}/dev/data-generator/series`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) return handleError(response);
  return response.json();
}
