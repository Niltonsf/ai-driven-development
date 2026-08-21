'use client';

import type { ApiErrorResponse } from '@/shared/types/api-error.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface GenerateAiTextInput {
  prompt: string;
  context?: string;
  instruction?: string;
}

export class AiApiError extends Error {
  readonly codes: string[];
  readonly status: number;

  constructor(codes: string[], status: number) {
    super(codes[0] ?? 'DEFAULT_API_ERROR');
    this.codes = codes.length > 0 ? codes : ['DEFAULT_API_ERROR'];
    this.status = status;
  }
}

export async function generateAiText(
  token: string,
  input: GenerateAiTextInput,
): Promise<string> {
  const response = await fetch(`${API_URL}/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (response.ok) {
    const body = (await response.json()) as { text?: string };
    return body.text ?? '';
  }

  throw await buildAiApiError(response);
}

export async function transcribeAiAudio(
  token: string,
  audioBlob: Blob,
  fileName = 'audio.webm',
): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, fileName);

  const response = await fetch(`${API_URL}/ai/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.ok) {
    const body = (await response.json()) as { text?: string };
    return body.text ?? '';
  }

  throw await buildAiApiError(response);
}

async function buildAiApiError(response: Response): Promise<AiApiError> {
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
  return new AiApiError(codes, response.status);
}
