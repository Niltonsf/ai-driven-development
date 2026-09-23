'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/data/auth.context';
import { type AccountDTO, listAccounts, createAccount, updateAccount, deleteAccount, type SaveAccountInput } from './account-api.client';

export function useAccounts(page: number, pageSize: number) {
  const { token } = useAuth();
  const [items, setItems] = useState<AccountDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAccounts(token, page, pageSize);
      setItems(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message ? getErrorMessage(err) : 'Erro ao carregar contas.');
    } finally {
      setIsLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, total, isLoading, error, refresh };
}

export function useSaveAccount() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = useCallback(async (input: SaveAccountInput, id?: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!token) return { ok: false, error: 'Não autenticado.' };
    setIsSubmitting(true);
    try {
      if (id) {
        await updateAccount(token, id, input);
      } else {
        await createAccount(token, input);
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message ? getErrorMessage(err) : 'Erro ao salvar conta.' };
    } finally {
      setIsSubmitting(false);
    }
  }, [token]);

  return { save, isSubmitting };
}

export function useDeleteAccount() {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = useCallback(async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!token) return { ok: false, error: 'Não autenticado.' };
    setIsDeleting(true);
    try {
      await deleteAccount(token, id);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message ? getErrorMessage(err) : 'Erro ao excluir conta.' };
    } finally {
      setIsDeleting(false);
    }
  }, [token]);

  return { remove, isDeleting };
}
