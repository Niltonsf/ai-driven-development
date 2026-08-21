'use client';

import Cookies from 'js-cookie';
import { AUTH_COOKIE_NAME } from '@/modules/auth';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface IdeaView {
  id: string;
  name: string;
  description: string;
  objective: string;
  ideaTypeId: string;
  updatedAt: string;
}

export interface ResourceView {
  id: string;
  type: 'text';
  content: string;
  position: number;
}

export interface IdeaDetailView extends IdeaView {
  resources: ResourceView[];
}

export interface IdeaPage {
  items: IdeaView[];
  page: number;
  perPage: number;
  total: number;
}

export interface SaveResourceInput {
  id?: string;
  type: 'text';
  content: string;
  position: number;
}

export interface SaveIdeaPayload {
  name: string;
  description: string;
  objective: string;
  ideaTypeId: string;
  resources: SaveResourceInput[];
}

export class IdeaApiError extends Error {
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
  throw new IdeaApiError(codes, response.status);
}

export async function listIdeas(params: {
  page: number;
  pageSize: number;
}): Promise<IdeaPage> {
  const url = `${API_URL}/ideas?page=${params.page}&pageSize=${params.pageSize}`;
  const response = await fetch(url, { headers: { ...authHeaders() } });
  return handle<IdeaPage>(response);
}

export async function getIdea(id: string): Promise<IdeaDetailView> {
  const response = await fetch(`${API_URL}/ideas/${id}`, {
    headers: { ...authHeaders() },
  });
  const idea = await handle<IdeaDetailView>(response);
  return { ...idea, resources: idea.resources ?? [] };
}

export async function createIdea(payload: SaveIdeaPayload): Promise<void> {
  const response = await fetch(`${API_URL}/ideas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ...payload, resources: payload.resources ?? [] }),
  });
  await handle<void>(response, false);
}

export async function updateIdea(
  id: string,
  payload: SaveIdeaPayload,
): Promise<void> {
  const response = await fetch(`${API_URL}/ideas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ...payload, resources: payload.resources ?? [] }),
  });
  await handle<void>(response, false);
}

export async function deleteIdea(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/ideas/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  await handle<void>(response, false);
}
