'use client';

import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { getErrorMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/data/auth.context';
import {
  ScheduledTransactionApiError,
  fetchScheduledTransaction,
  resetScheduledTransaction,
  saveScheduledTransaction,
  type SaveScheduledTransactionInput,
  type ScheduledTransactionDTO,
} from './scheduled-transaction-api.client';
import type { MutationResult } from './use-transactions';

const NOT_FOUND_STATUS = 404;

/**
 * Response of the request identified by `key`. Loading is derived by comparing
 * this key with the key of the current render, so no state is written
 * synchronously inside effects.
 */
type LoadState = {
  key: string;
  data: ScheduledTransactionDTO | null;
  error: string | null;
  isNotFound: boolean;
};

const INITIAL_LOAD_STATE: LoadState = { key: '', data: null, error: null, isNotFound: false };

export type UseScheduledTransactionOptions = {
  /** Called inside the settlement of the request, with the translated message, when the API answers 404. */
  onNotFound?: (message: string) => void;
};

/** Local on purpose: the data barrel re-exports everything, and this name already exists there. */
function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ScheduledTransactionApiError) {
    return err.messages.map((message) => getErrorMessage(message)).join(' ');
  }
  if (err instanceof Error && err.message) return getErrorMessage(err);
  return fallback;
}

/**
 * Loads the occurrence by its address. The API answers the stored occurrence or
 * the one generated from the series, so there is never an empty form. "Not
 * found" is reported through `onNotFound` inside the promise settlement, never
 * by an effect reacting to state.
 */
export function useScheduledTransaction(
  seriesId: string,
  occurrenceIndex: number,
  { onNotFound }: UseScheduledTransactionOptions = {},
) {
  const { token } = useAuth();
  const [state, setState] = useState<LoadState>(INITIAL_LOAD_STATE);
  const requestKey = JSON.stringify([token, seriesId, occurrenceIndex]);

  const notifyNotFound = useEffectEvent((message: string) => {
    onNotFound?.(message);
  });

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;

    fetchScheduledTransaction(token, seriesId, occurrenceIndex).then(
      (data) => {
        if (isCurrent) setState({ key: requestKey, data, error: null, isNotFound: false });
      },
      (err: unknown) => {
        if (!isCurrent) return;

        const message = toErrorMessage(err, 'Erro ao carregar a transação da série.');
        const isNotFound = err instanceof ScheduledTransactionApiError && err.statusCode === NOT_FOUND_STATUS;
        setState({ key: requestKey, data: null, error: message, isNotFound });
        if (isNotFound) notifyNotFound(message);
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [token, seriesId, occurrenceIndex, requestKey]);

  const isCurrentResponse = state.key === requestKey;
  const scheduledTransaction = isCurrentResponse ? state.data : null;

  return {
    scheduledTransaction,
    isLoading: Boolean(token) && !isCurrentResponse,
    isMaterialized: scheduledTransaction?.materialized === true,
    isNotFound: isCurrentResponse && state.isNotFound,
    error: isCurrentResponse ? state.error : null,
  };
}

export function useSaveScheduledTransaction() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = useCallback(
    async (
      seriesId: string,
      occurrenceIndex: number,
      input: SaveScheduledTransactionInput,
    ): Promise<MutationResult> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsSubmitting(true);
      try {
        await saveScheduledTransaction(token, seriesId, occurrenceIndex, input);
        return { ok: true };
      } catch (err: unknown) {
        return { ok: false, error: toErrorMessage(err, 'Erro ao salvar a transação da série.') };
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { save, isSubmitting };
}

export function useResetScheduledTransaction() {
  const { token } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  const reset = useCallback(
    async (seriesId: string, occurrenceIndex: number): Promise<MutationResult> => {
      if (!token) return { ok: false, error: 'Não autenticado.' };
      setIsResetting(true);
      try {
        await resetScheduledTransaction(token, seriesId, occurrenceIndex);
        return { ok: true };
      } catch (err: unknown) {
        return { ok: false, error: toErrorMessage(err, 'Erro ao reverter a transação da série.') };
      } finally {
        setIsResetting(false);
      }
    },
    [token],
  );

  return { reset, isResetting };
}
