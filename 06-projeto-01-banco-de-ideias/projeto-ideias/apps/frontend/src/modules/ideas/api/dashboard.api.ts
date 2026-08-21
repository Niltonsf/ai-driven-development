'use client';

import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type { DashboardSummary } from '../types/dashboard.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export class DashboardApiError extends Error {
  readonly codes: string[];
  readonly status: number;

  constructor(codes: string[], status: number) {
    super(codes[0] ?? 'DEFAULT_API_ERROR');
    this.codes = codes.length > 0 ? codes : ['DEFAULT_API_ERROR'];
    this.status = status;
  }
}

async function handle<T>(response: Response): Promise<T> {
  if (response.ok) {
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
  throw new DashboardApiError(codes, response.status);
}

export async function getDashboardSummary(
  token: string,
  options?: { latestLimit?: number },
): Promise<DashboardSummary> {
  const query =
    options?.latestLimit !== undefined
      ? `?latestLimit=${encodeURIComponent(String(options.latestLimit))}`
      : '';
  const response = await fetch(`${API_URL}/dashboard/summary${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<DashboardSummary>(response);
}
