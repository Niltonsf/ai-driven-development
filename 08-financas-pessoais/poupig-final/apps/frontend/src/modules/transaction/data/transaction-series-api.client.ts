import type { Direction, FrequencyUnit, RecurrenceRule, SeriesKind } from '@poupig/transaction';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type TransactionSeriesDTO = {
  id: string;
  userId: string;
  name: string;
  note: string | null;
  value: number;
  direction: Direction;
  accountId: string;
  accountName: string;
  creditCardId: string | null;
  creditCardName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  categoryName: string | null;
  kind: SeriesKind;
  recurrence: RecurrenceRule;
  startDate: string;
  endDate: string | null;
  installments: number | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * The recurrence rule travels flattened, as the form produces it: only the
 * anchors of the chosen frequency carry a value and the others go as `null`.
 * `userId` is never sent — the owner comes from the token.
 */
export type SaveTransactionSeriesInput = {
  name: string;
  note: string | null;
  value: number;
  direction: Direction;
  accountId: string;
  creditCardId: string | null;
  subcategoryId: string | null;
  kind: SeriesKind;
  unit: FrequencyUnit;
  interval: number;
  weekDay: number | null;
  dayOfMonth: number | null;
  month: number | null;
  startDate: string;
  endDate: string | null;
  installments: number | null;
};

export class TransactionSeriesApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'DEFAULT_API_ERROR');
    this.name = 'TransactionSeriesApiError';
    this.statusCode = params.statusCode;
    this.messages = params.messages;
  }
}

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function extractMessages(body: unknown): string[] {
  if (typeof body !== 'object' || body === null || !('message' in body)) return ['DEFAULT_API_ERROR'];

  const { message } = body as { message: unknown };
  if (typeof message === 'string' && message) return [message];
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === 'string');
    if (messages.length > 0) return messages;
  }

  return ['DEFAULT_API_ERROR'];
}

async function handleError(response: Response): Promise<never> {
  const body: unknown = await response.json().catch(() => null);
  throw new TransactionSeriesApiError({ statusCode: response.status, messages: extractMessages(body) });
}

export async function createTransactionSeries(
  token: string,
  input: SaveTransactionSeriesInput,
): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/transaction-series`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
  return response.json();
}

export async function fetchTransactionSeries(token: string, id: string): Promise<TransactionSeriesDTO> {
  const response = await fetch(`${API_BASE_URL}/transaction-series/${id}`, { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}

/** `PUT` replaces the whole series: the rule goes flattened and empty optionals as `null`. */
export async function updateTransactionSeries(
  token: string,
  id: string,
  input: SaveTransactionSeriesInput,
): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/transaction-series/${id}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
  return response.json();
}

export async function deleteTransactionSeries(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/transaction-series/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!response.ok) return handleError(response);
}
