import type { Direction, SeriesKind, TransactionStatus } from '@poupig/transaction';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * An occurrence of a transaction series as the API returns it: the stored one
 * (`materialized: true`) or the one generated from the series
 * (`materialized: false`, with an ephemeral `id`). The address of an occurrence
 * is always the pair `(seriesId, occurrenceIndex)`.
 */
export type ScheduledTransactionDTO = {
  id: string;
  userId: string;
  seriesId: string;
  occurrenceIndex: number;
  /** Date calculated by the series; immutable. */
  occurrenceOn: string;
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
  status: TransactionStatus;
  /** Date the user sees and may move to another day or month. */
  expectedOn: string;
  settledOn: string | null;
  createdAt: string;
  updatedAt: string;
  materialized: boolean;
  seriesName: string;
  seriesKind: SeriesKind;
  installments: number | null;
};

/**
 * `id` of the opened occurrence plus the editable fields. `occurrenceOn` and
 * `userId` are never sent: the first comes from the series, the second from the token.
 * `PUT` replaces every field, so optionals must be sent as `null` to be cleared.
 */
export type SaveScheduledTransactionInput = {
  id: string;
  name: string;
  note: string | null;
  value: number;
  direction: Direction;
  accountId: string;
  creditCardId: string | null;
  subcategoryId: string | null;
  status: TransactionStatus;
  expectedOn: string;
  settledOn: string | null;
};

export class ScheduledTransactionApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'DEFAULT_API_ERROR');
    this.name = 'ScheduledTransactionApiError';
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
  throw new ScheduledTransactionApiError({ statusCode: response.status, messages: extractMessages(body) });
}

function occurrenceUrl(seriesId: string, occurrenceIndex: number): string {
  return `${API_BASE_URL}/scheduled-transactions/${encodeURIComponent(seriesId)}/${occurrenceIndex}`;
}

export async function fetchScheduledTransaction(
  token: string,
  seriesId: string,
  occurrenceIndex: number,
): Promise<ScheduledTransactionDTO> {
  const response = await fetch(occurrenceUrl(seriesId, occurrenceIndex), { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}

/** Stores the occurrence the first time and changes it on the following ones. */
export async function saveScheduledTransaction(
  token: string,
  seriesId: string,
  occurrenceIndex: number,
  input: SaveScheduledTransactionInput,
): Promise<{ id: string }> {
  const response = await fetch(occurrenceUrl(seriesId, occurrenceIndex), {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
  return response.json();
}

/** Discards the stored occurrence, so it follows the series again. */
export async function resetScheduledTransaction(
  token: string,
  seriesId: string,
  occurrenceIndex: number,
): Promise<void> {
  const response = await fetch(occurrenceUrl(seriesId, occurrenceIndex), {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!response.ok) return handleError(response);
}
