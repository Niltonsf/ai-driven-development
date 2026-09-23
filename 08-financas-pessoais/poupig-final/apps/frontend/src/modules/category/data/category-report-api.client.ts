import type { CategorySpendingSliceDTO } from '@poupig/category';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** First and last day of the period (`YYYY-MM-DD`, both included). Both are required by the backend. */
export type FetchCategorySpendingParams = {
  from: string;
  to: string;
};

export class CategoryReportApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'DEFAULT_API_ERROR');
    this.name = 'CategoryReportApiError';
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
  throw new CategoryReportApiError({ statusCode: response.status, messages: extractMessages(body) });
}

/**
 * Outflows of the period summed by subcategory, with the appearance of the
 * subcategory and of its category. The backend already orders the rows and puts
 * the outflows without subcategory in a single row with the identity `null`, so
 * one request serves both the category and the subcategory views.
 */
export async function fetchCategorySpending(
  token: string,
  params: FetchCategorySpendingParams,
): Promise<CategorySpendingSliceDTO[]> {
  const url = new URL(`${API_BASE_URL}/reports/categories`);
  url.searchParams.set('from', params.from);
  url.searchParams.set('to', params.to);

  const response = await fetch(url.toString(), { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}
