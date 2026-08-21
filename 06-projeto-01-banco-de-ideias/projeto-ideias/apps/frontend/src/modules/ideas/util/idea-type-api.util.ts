'use client';

import Cookies from 'js-cookie';
import { AUTH_COOKIE_NAME } from '@/modules/auth';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface IdeaTypeView {
  id: string;
  name: string;
  description: string;
  prompt: string;
  updatedAt: string;
}

export interface IdeaTypePage {
  items: IdeaTypeView[];
  page: number;
  perPage: number;
  total: number;
}

export interface SaveIdeaTypePayload {
  name: string;
  description: string;
  prompt: string;
}

export class IdeaTypeApiError extends Error {
  readonly codes: string[];
  readonly status: number;

  constructor(codes: string[], status: number) {
    super(codes[0] ?? 'DEFAULT_API_ERROR');
    this.codes = codes.length > 0 ? codes : ['DEFAULT_API_ERROR'];
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  const token = Cookies.get(AUTH_COOKIE_NAME);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(response: Response, parseJson = true): Promise<T> {
  if (response.ok) {
    if (!parseJson || response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
  let codes: string[] = ['DEFAULT_API_ERROR'];
  try {
    const body = (await response.json()) as ApiErrorResponse | null;
    if (body?.errors?.length) {
      codes = body.errors;
    } else if (body?.message) {
      codes = [body.message];
    }
  } catch {
    /* fallback to default */
  }
  throw new IdeaTypeApiError(codes, response.status);
}

export async function listIdeaTypes(params: {
  page: number;
  pageSize: number;
}): Promise<IdeaTypePage> {
  const url = `${API_URL}/idea-types?page=${params.page}&pageSize=${params.pageSize}`;
  const response = await fetch(url, { headers: { ...authHeaders() } });
  return handle<IdeaTypePage>(response);
}

export async function getIdeaType(id: string): Promise<IdeaTypeView> {
  const response = await fetch(`${API_URL}/idea-types/${id}`, {
    headers: { ...authHeaders() },
  });
  return handle<IdeaTypeView>(response);
}

export async function createIdeaType(
  payload: SaveIdeaTypePayload,
): Promise<void> {
  const response = await fetch(`${API_URL}/idea-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  await handle<void>(response, false);
}

export async function updateIdeaType(
  id: string,
  payload: SaveIdeaTypePayload,
): Promise<void> {
  const response = await fetch(`${API_URL}/idea-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  await handle<void>(response, false);
}

export async function loadDefaultIdeaTypes(): Promise<{ loaded: number }> {
  const response = await fetch(`${API_URL}/idea-types/load-defaults`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  return handle<{ loaded: number }>(response);
}

export async function deleteIdeaType(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/idea-types/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  await handle<void>(response, false);
}

export const IDEA_TYPE_PROMPT_PLACEHOLDERS = [
  '{{name}}',
  '{{description}}',
  '{{objective}}',
  '{{resources}}',
] as const;

export const IDEA_TYPE_PROMPT_HINT =
  'Use {{name}}, {{description}}, {{objective}} e {{resources}} para inserir os dados da Ideia ao processar.';
