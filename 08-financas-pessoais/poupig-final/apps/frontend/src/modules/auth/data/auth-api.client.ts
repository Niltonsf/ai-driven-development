/**
 * Cliente HTTP do módulo de autenticação (camada `data/`).
 *
 * Encapsula o contrato do backend para registro de usuário, isolando o
 * `fetch`/parsing da camada de apresentação. A URL base vem de
 * `NEXT_PUBLIC_API_URL`, com fallback para o backend local.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

/**
 * Erro tipado de autenticação. Carrega as mensagens vindas do backend
 * (`message[]` do `ApiErrorResponse`) e sinaliza o caso especial de
 * e-mail já cadastrado (HTTP 409).
 */
export class AuthApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];
  readonly isEmailAlreadyInUse: boolean;

  constructor(params: { statusCode: number; messages: string[]; isEmailAlreadyInUse?: boolean }) {
    super(params.messages[0] ?? 'Falha ao processar a requisição.');
    this.name = 'AuthApiError';
    this.statusCode = params.statusCode;
    this.messages = params.messages;
    this.isEmailAlreadyInUse = params.isEmailAlreadyInUse ?? false;
  }
}

type ApiErrorResponse = {
  statusCode?: number;
  error?: string;
  message?: string | string[];
  details?: unknown;
  path?: string;
  timestamp?: string;
};

function extractMessages(body: ApiErrorResponse | null, fallback: string): string[] {
  if (body && body.message) {
    return Array.isArray(body.message) ? body.message : [body.message];
  }
  return [fallback];
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type LoginUserInput = {
  email: string;
  password: string;
};

export type LoginUserResult = {
  token: string;
  user: AuthUser;
};

/**
 * Autentica um usuário via `POST /auth/login`.
 *
 * Em caso de sucesso (2xx) retorna `{ token, user }`. Em qualquer
 * resposta não-2xx lança um {@link AuthApiError}.
 */
export async function loginUser(input: LoginUserInput): Promise<LoginUserResult> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new AuthApiError({
      statusCode: 0,
      messages: ['Não foi possível conectar ao servidor. Tente novamente.'],
    });
  }

  if (response.ok) {
    return response.json() as Promise<LoginUserResult>;
  }

  const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null;

  if (response.status === 401) {
    throw new AuthApiError({
      statusCode: 401,
      messages: extractMessages(errorBody, 'E-mail ou senha inválidos.'),
    });
  }

  throw new AuthApiError({
    statusCode: response.status,
    messages: extractMessages(errorBody, 'Falha ao realizar login.'),
  });
}

/**
 * Registra um usuário via `POST /auth/register`.
 *
 * Em caso de sucesso (2xx) retorna o corpo JSON do backend. Em qualquer
 * resposta não-2xx lança um {@link AuthApiError} com as mensagens do backend.
 * O status 409 é tratado de forma especial como "e-mail já em uso".
 */
export async function registerUser(input: RegisterUserInput): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new AuthApiError({
      statusCode: 0,
      messages: ['Não foi possível conectar ao servidor. Tente novamente.'],
    });
  }

  if (response.ok) {
    return response.json().catch(() => null);
  }

  const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null;

  if (response.status === 409) {
    throw new AuthApiError({
      statusCode: 409,
      messages: extractMessages(errorBody, 'Este e-mail já está em uso.'),
      isEmailAlreadyInUse: true,
    });
  }

  throw new AuthApiError({
    statusCode: response.status,
    messages: extractMessages(errorBody, 'Falha ao registrar usuário.'),
  });
}
