'use client';

import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { getErrorMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/data/auth.context';
import {
  TransactionSeriesApiError,
  createTransactionSeries,
  deleteTransactionSeries,
  fetchTransactionSeries,
  updateTransactionSeries,
  type SaveTransactionSeriesInput,
  type TransactionSeriesDTO,
} from './transaction-series-api.client';
import type { MutationResult } from './use-transactions';

const NOT_FOUND_STATUS = 404;

/**
 * Response of the request identified by `key`. Loading is derived by comparing
 * this key with the key of the current render, so no state is written
 * synchronously inside effects.
 */
type SeriesLoadState = {
  key: string;
  data: TransactionSeriesDTO | null;
  error: string | null;
  isNotFound: boolean;
};

const INITIAL_SERIES_LOAD_STATE: SeriesLoadState = { key: '', data: null, error: null, isNotFound: false };

export type UseTransactionSeriesOptions = {
  /** Called inside the settlement of the request, with the translated message, when the API answers 404. */
  onNotFound?: (message: string) => void;
};

/** Local on purpose: the data barrel re-exports everything, and this name already exists there. */
function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof TransactionSeriesApiError) {
    return err.messages.map((message) => getErrorMessage(message)).join(' ');
  }
  if (err instanceof Error && err.message) return getErrorMessage(err);
  return fallback;
}

/**
 * Loads a series to be edited. A missing, deleted or foreign series answers 404,
 * reported through `onNotFound` inside the promise settlement, never by an
 * effect reacting to state.
 */
export function useTransactionSeries(seriesId: string, { onNotFound }: UseTransactionSeriesOptions = {}) {
  const { token } = useAuth();
  const [state, setState] = useState<SeriesLoadState>(INITIAL_SERIES_LOAD_STATE);
  const requestKey = JSON.stringify([token, seriesId]);

  const notifyNotFound = useEffectEvent((message: string) => {
    onNotFound?.(message);
  });

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;

    fetchTransactionSeries(token, seriesId).then(
      (data) => {
        if (isCurrent) setState({ key: requestKey, data, error: null, isNotFound: false });
      },
      (err: unknown) => {
        if (!isCurrent) return;

        const message = toErrorMessage(err, 'Erro ao carregar a série.');
        const isNotFound = err instanceof TransactionSeriesApiError && err.statusCode === NOT_FOUND_STATUS;
        setState({ key: requestKey, data: null, error: message, isNotFound });
        if (isNotFound) notifyNotFound(message);
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [token, seriesId, requestKey]);

  const isCurrentResponse = state.key === requestKey;

  return {
    series: isCurrentResponse ? state.data : null,
    isLoading: Boolean(token) && !isCurrentResponse,
    isNotFound: isCurrentResponse && state.isNotFound,
    error: isCurrentResponse ? state.error : null,
  };
}

export function useCreateTransactionSeries() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const create = useCallback(
    async (input: SaveTransactionSeriesInput): Promise<MutationResult> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsSubmitting(true);
      try {
        await createTransactionSeries(token, input);
        return { ok: true };
      } catch (err: unknown) {
        return { ok: false, error: toErrorMessage(err, 'Erro ao salvar a série.') };
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { create, isSubmitting };
}

export function useUpdateTransactionSeries() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = useCallback(
    async (id: string, input: SaveTransactionSeriesInput): Promise<MutationResult> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsSubmitting(true);
      try {
        await updateTransactionSeries(token, id, input);
        return { ok: true };
      } catch (err: unknown) {
        return { ok: false, error: toErrorMessage(err, 'Erro ao salvar a série.') };
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { update, isSubmitting };
}

export function useDeleteTransactionSeries() {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = useCallback(
    async (id: string): Promise<MutationResult> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsDeleting(true);
      try {
        await deleteTransactionSeries(token, id);
        return { ok: true };
      } catch (err: unknown) {
        return { ok: false, error: toErrorMessage(err, 'Erro ao excluir a série.') };
      } finally {
        setIsDeleting(false);
      }
    },
    [token],
  );

  return { remove, isDeleting };
}
