'use client';

import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/shared/i18n';
import { AuthApiError, registerUser, type RegisterUserInput } from './auth-api.client';
import type { RegisterFormData } from './auth.schema';

type AuthResult = { ok: true } | { ok: false; error: string };

export function useRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (data: RegisterFormData): Promise<AuthResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const input: RegisterUserInput = {
        name: data.name,
        email: data.email,
        password: data.password,
      };
      await registerUser(input);
      return { ok: true };
    } catch (err) {
      const message = err instanceof AuthApiError ? getErrorMessage(err) : 'Erro inesperado ao registrar. Tente novamente.';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { register, isSubmitting, error };
}
