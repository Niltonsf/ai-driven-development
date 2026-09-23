const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'DINERS' | 'OTHER';

export type CreditCardDTO = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  brand: CardBrand;
  lastFourDigits?: string;
  closingDay: number;
  dueDay: number;
  limit?: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type SaveCreditCardInput = {
  name: string;
  brand: CardBrand;
  closingDay: number;
  dueDay: number;
  description?: string;
  lastFourDigits?: string;
  limit?: number;
  color?: string;
  icon?: string;
  isActive?: boolean;
};

export class CreditCardApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'Falha ao processar a requisição.');
    this.name = 'CreditCardApiError';
    this.statusCode = params.statusCode;
    this.messages = params.messages;
  }
}

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function handleError(response: Response): Promise<never> {
  const body = await response.json().catch(() => null);
  const messages: string[] = Array.isArray(body?.message)
    ? body.message
    : [body?.message ?? 'Erro inesperado.'];
  throw new CreditCardApiError({ statusCode: response.status, messages });
}

export async function listCreditCards(
  token: string,
  params: { page: number; pageSize: number },
): Promise<PaginatedResult<CreditCardDTO>> {
  const url = new URL(`${API_BASE_URL}/cards`);
  url.searchParams.set('page', String(params.page));
  url.searchParams.set('pageSize', String(params.pageSize));
  const response = await fetch(url.toString(), { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}

export async function createCreditCard(token: string, input: SaveCreditCardInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/cards`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
}

export async function updateCreditCard(token: string, id: string, input: SaveCreditCardInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
}

export async function deleteCreditCard(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!response.ok) return handleError(response);
}
