import type { CashFlowWindow, MonthlyCashFlowDTO } from '@poupig/transaction';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Last month of the window (`YYYY-MM`, included) and the size of the window in months. */
export type FetchMonthlyCashFlowParams = {
  reference: string;
  months: CashFlowWindow;
};

export class CashFlowReportApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'DEFAULT_API_ERROR');
    this.name = 'CashFlowReportApiError';
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
  throw new CashFlowReportApiError({ statusCode: response.status, messages: extractMessages(body) });
}

/**
 * Inflow, outflow and balance of every month of the window that ends at `reference`.
 * The backend always returns exactly `months` items in ascending order, with zeros
 * in the months without movement, so the consumer never fills gaps.
 */
export async function fetchMonthlyCashFlow(
  token: string,
  params: FetchMonthlyCashFlowParams,
): Promise<MonthlyCashFlowDTO[]> {
  const url = new URL(`${API_BASE_URL}/reports/cash-flow`);
  url.searchParams.set('reference', params.reference);
  url.searchParams.set('months', String(params.months));

  const response = await fetch(url.toString(), { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}
