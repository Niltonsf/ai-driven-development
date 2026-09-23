import type { Direction, TransactionStatus } from '@poupig/transaction';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type TransactionDTO = {
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
  status: TransactionStatus;
  expectedOn: string;
  settledOn: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `PUT` replaces every field: optionals must be sent as `null` to be cleared. */
export type SaveTransactionInput = {
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

export class TransactionApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'DEFAULT_API_ERROR');
    this.name = 'TransactionApiError';
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
  throw new TransactionApiError({ statusCode: response.status, messages: extractMessages(body) });
}

export async function createTransaction(token: string, input: SaveTransactionInput): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
  return response.json();
}

export async function updateTransaction(
  token: string,
  id: string,
  input: SaveTransactionInput,
): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
  return response.json();
}

export async function deleteTransaction(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!response.ok) return handleError(response);
}
