const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type SubcategoryDTO = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryDTO = {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  subcategories: SubcategoryDTO[];
  createdAt: string;
  updatedAt: string;
};

export type SaveSubcategoryInput = {
  id?: string;
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  order: number;
};

export type SaveCategoryInput = {
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  subcategories: SaveSubcategoryInput[];
};

export class CategoryApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(params: { statusCode: number; messages: string[] }) {
    super(params.messages[0] ?? 'DEFAULT_API_ERROR');
    this.name = 'CategoryApiError';
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
    : [body?.message ?? 'DEFAULT_API_ERROR'];
  throw new CategoryApiError({ statusCode: response.status, messages });
}

export async function listCategories(token: string): Promise<CategoryDTO[]> {
  const response = await fetch(`${API_BASE_URL}/categories`, { headers: headers(token) });
  if (!response.ok) return handleError(response);
  return response.json();
}

export async function createCategory(token: string, input: SaveCategoryInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
}

export async function updateCategory(token: string, id: string, input: SaveCategoryInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) return handleError(response);
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!response.ok) return handleError(response);
}

export async function applyDefaultCategories(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/default`, {
    method: 'POST',
    headers: headers(token),
  });
  if (!response.ok) return handleError(response);
}
