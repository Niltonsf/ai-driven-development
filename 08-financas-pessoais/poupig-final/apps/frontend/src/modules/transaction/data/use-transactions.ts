'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/data/auth.context';
import { listAccounts, type AccountDTO } from '@/modules/account/data/account-api.client';
import { listCreditCards, type CreditCardDTO } from '@/modules/credit-card/data/credit-card-api.client';
import { listCategories, type CategoryDTO } from '@/modules/category/data/category-api.client';
import {
  type SaveTransactionInput,
  TransactionApiError,
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from './transaction-api.client';

const OPTIONS_PAGE_SIZE = 50;

export type TransactionSelectOption = {
  label: string;
  value: string;
};

export type TransactionOptions = {
  accounts: TransactionSelectOption[];
  creditCards: TransactionSelectOption[];
  subcategories: TransactionSelectOption[];
};

export type MutationResult = { ok: true } | { ok: false; error: string };

/**
 * Response of the request identified by `key`. Loading is derived by comparing
 * this key with the key of the current render, so no state is written
 * synchronously inside effects.
 */
type RequestState<T> = {
  key: string;
  data: T | null;
  error: string | null;
};

const INITIAL_REQUEST_STATE = { key: '', data: null, error: null };

const EMPTY_OPTIONS: TransactionOptions = { accounts: [], creditCards: [], subcategories: [] };

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof TransactionApiError) {
    return err.messages.map((message) => getErrorMessage(message)).join(' ');
  }
  if (err instanceof Error && err.message) return getErrorMessage(err);
  return fallback;
}

export function useSaveTransaction() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = useCallback(
    async (input: SaveTransactionInput, id?: string): Promise<MutationResult> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsSubmitting(true);
      try {
        if (id) {
          await updateTransaction(token, id, input);
        } else {
          await createTransaction(token, input);
        }
        return { ok: true };
      } catch (err: unknown) {
        return { ok: false, error: toErrorMessage(err, 'Erro ao salvar transação.') };
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { save, isSubmitting };
}

export function useDeleteTransaction() {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = useCallback(
    async (id: string): Promise<MutationResult> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsDeleting(true);
      try {
        await deleteTransaction(token, id);
        return { ok: true };
      } catch (err: unknown) {
        return { ok: false, error: toErrorMessage(err, 'Erro ao excluir transação.') };
      } finally {
        setIsDeleting(false);
      }
    },
    [token],
  );

  return { remove, isDeleting };
}

function toTransactionOptions(
  accounts: AccountDTO[],
  creditCards: CreditCardDTO[],
  categories: CategoryDTO[],
): TransactionOptions {
  return {
    accounts: accounts
      .filter((account) => account.isActive)
      .map((account) => ({ label: account.name, value: account.id })),
    creditCards: creditCards
      .filter((creditCard) => creditCard.isActive)
      .map((creditCard) => ({ label: creditCard.name, value: creditCard.id })),
    subcategories: categories
      .filter((category) => category.isActive)
      .flatMap((category) =>
        [...category.subcategories]
          .filter((subcategory) => subcategory.isActive)
          .sort((left, right) => left.order - right.order)
          .map((subcategory) => ({ label: `${category.name} › ${subcategory.name}`, value: subcategory.id })),
      ),
  };
}

export function useTransactionOptions() {
  const { token } = useAuth();
  const [state, setState] = useState<RequestState<TransactionOptions>>(INITIAL_REQUEST_STATE);
  const requestKey = token ?? '';

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;

    Promise.all([
      listAccounts(token, 1, OPTIONS_PAGE_SIZE),
      listCreditCards(token, { page: 1, pageSize: OPTIONS_PAGE_SIZE }),
      listCategories(token),
    ])
      .then(([accounts, creditCards, categories]) => {
        if (isCurrent) {
          setState({
            key: token,
            data: toTransactionOptions(accounts.items, creditCards.items, categories),
            error: null,
          });
        }
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setState({ key: token, data: null, error: toErrorMessage(err, 'Erro ao carregar as opções.') });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const isCurrentResponse = state.key === requestKey;

  return {
    ...(isCurrentResponse && state.data ? state.data : EMPTY_OPTIONS),
    isLoading: Boolean(token) && !isCurrentResponse,
    error: isCurrentResponse ? state.error : null,
  };
}
