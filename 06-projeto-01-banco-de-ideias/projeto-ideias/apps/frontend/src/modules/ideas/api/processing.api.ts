'use client';

import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type {
  IdeaSearchResult,
  Page,
  ProcessingDetail,
  ProcessingIterationView,
  ProcessingSummary,
  RefineProcessingInput,
  StartProcessingInput,
} from '../types/processing.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ProcessingApiError extends Error {
  readonly codes: string[];
  readonly status: number;

  constructor(codes: string[], status: number) {
    super(codes[0] ?? 'DEFAULT_API_ERROR');
    this.codes = codes.length > 0 ? codes : ['DEFAULT_API_ERROR'];
    this.status = status;
  }
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
  throw new ProcessingApiError(codes, response.status);
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function startProcessing(
  token: string,
  input: StartProcessingInput,
): Promise<ProcessingDetail> {
  const response = await fetch(`${API_URL}/processings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  return handle<ProcessingDetail>(response);
}

export async function refineProcessing(
  token: string,
  id: string,
  input: RefineProcessingInput,
): Promise<ProcessingIterationView> {
  const response = await fetch(`${API_URL}/processings/${id}/iterations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  return handle<ProcessingIterationView>(response);
}

export async function deleteProcessing(
  token: string,
  id: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/processings/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders(token) },
  });
  await handle<void>(response, false);
}

export async function getProcessing(
  token: string,
  id: string,
): Promise<ProcessingDetail> {
  const response = await fetch(`${API_URL}/processings/${id}`, {
    headers: { ...authHeaders(token) },
  });
  return handle<ProcessingDetail>(response);
}

export async function listProcessings(
  token: string,
  params: { page: number; pageSize: number },
): Promise<Page<ProcessingSummary>> {
  const url = `${API_URL}/processings?page=${params.page}&pageSize=${params.pageSize}`;
  const response = await fetch(url, { headers: { ...authHeaders(token) } });
  return handle<Page<ProcessingSummary>>(response);
}

export async function searchIdeasForProcessing(
  token: string,
  term: string,
): Promise<IdeaSearchResult[]> {
  const url = `${API_URL}/processings/idea-search?term=${encodeURIComponent(term)}`;
  const response = await fetch(url, { headers: { ...authHeaders(token) } });
  return handle<IdeaSearchResult[]>(response);
}
