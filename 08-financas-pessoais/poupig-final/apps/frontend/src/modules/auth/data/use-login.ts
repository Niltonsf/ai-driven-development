'use client';

import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/shared/i18n';
import { AuthApiError, loginUser } from './auth-api.client';
import { useAuth } from './auth.context';
import type { LoginFormData } from './auth.schema';

type LoginResult = { ok: true } | { ok: false; error: string };

export function useLogin() {
  const { setAuth } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (data: LoginFormData): Promise<LoginResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await loginUser({ email: data.email, password: data.password });
      setAuth({ token: result.token, user: result.user });
      return { ok: true };
    } catch (err) {
      const message = err instanceof AuthApiError ? getErrorMessage(err) : 'Erro inesperado ao realizar login. Tente novamente.';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  }, [setAuth]);

  return { login, isSubmitting, error };
}
