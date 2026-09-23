const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT' | 'OTHER';

export type AccountDTO = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: AccountType;
  accountNumber?: string;
  agency?: string;
  financialInstitution?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SaveAccountInput = {
  name: string;
  type: AccountType;
  description?: string;
  accountNumber?: string;
  agency?: string;
  financialInstitution?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export class AccountApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'Falha ao processar a requisição.');
    this.name = 'AccountApiError';
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
  throw new AccountApiError({ statusCode: response.status, messages });
}

export async function listAccounts(token: string, page: number, pageSize: number): Promise<PaginatedResult<AccountDTO>> {
  const response = await fetch(`${API_BASE_URL}/accounts?page=${page}&pageSize=${pageSize}`, { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}

export async function createAccount(token: string, input: SaveAccountInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
}

export async function updateAccount(token: string, id: string, input: SaveAccountInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
}

export async function deleteAccount(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!response.ok) return handleError(response);
}
