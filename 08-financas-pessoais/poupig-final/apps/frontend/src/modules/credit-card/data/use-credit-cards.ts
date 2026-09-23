'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/data/auth.context';
import {
  type CreditCardDTO,
  type PaginatedResult,
  type SaveCreditCardInput,
  listCreditCards,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
} from './credit-card-api.client';

export function useCreditCards(page: number, pageSize: number) {
  const { token } = useAuth();
  const [result, setResult] = useState<PaginatedResult<CreditCardDTO>>({
    items: [],
    total: 0,
    page: 1,
    pageSize,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCreditCards(token, { page, pageSize });
      setResult(data);
    } catch (err: any) {
      setError(err.message ? getErrorMessage(err) : 'Erro ao carregar cartões.');
    } finally {
      setIsLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...result, isLoading, error, refresh };
}

export function useSaveCreditCard() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = useCallback(
    async (input: SaveCreditCardInput, id?: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsSubmitting(true);
      try {
        if (id) {
          await updateCreditCard(token, id, input);
        } else {
          await createCreditCard(token, input);
        }
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message ? getErrorMessage(err) : 'Erro ao salvar cartão.' };
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { save, isSubmitting };
}

export function useDeleteCreditCard() {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = useCallback(
    async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsDeleting(true);
      try {
        await deleteCreditCard(token, id);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message ? getErrorMessage(err) : 'Erro ao excluir cartão.' };
      } finally {
        setIsDeleting(false);
      }
    },
    [token],
  );

  return { remove, isDeleting };
}
