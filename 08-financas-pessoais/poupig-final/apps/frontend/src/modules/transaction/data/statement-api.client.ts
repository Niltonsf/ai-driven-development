import type { PaginatedResultDTO } from '@poupig/shared';
import type { StatementEntryDTO } from '@poupig/transaction';
import type { StatementFilters } from './statement-view';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * The whole period (`from`/`to`, `YYYY-MM-DD`) plus the filters of the screen.
 * There is no page: the statement of a month always comes in a single response.
 */
export type ListStatementParams = StatementFilters & {
  from: string;
  to: string;
  search?: string;
};

export class StatementApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'DEFAULT_API_ERROR');
    this.name = 'StatementApiError';
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
  throw new StatementApiError({ statusCode: response.status, messages: extractMessages(body) });
}

/**
 * Standalone transactions and series occurrences of the period, already filtered,
 * ordered and capped by the backend. Only the informed filters go to the query string.
 */
export async function listStatement(
  token: string,
  params: ListStatementParams,
): Promise<PaginatedResultDTO<StatementEntryDTO>> {
  const url = new URL(`${API_BASE_URL}/statement`);
  url.searchParams.set('from', params.from);
  url.searchParams.set('to', params.to);

  const creditCardId = params.creditCardId?.trim();
  const filters: Array<[string, string | undefined]> = [
    ['search', params.search?.trim()],
    ['direction', params.direction],
    ['status', params.status],
    ['accountId', params.accountId],
    ['creditCardId', creditCardId],
    // A specific card already narrows to card entries: the flag never goes along with it.
    ['onlyCreditCard', params.onlyCreditCard === true && !creditCardId ? 'true' : undefined],
  ];
  for (const [name, value] of filters) {
    if (value) url.searchParams.set(name, value);
  }

  const response = await fetch(url.toString(), { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}
