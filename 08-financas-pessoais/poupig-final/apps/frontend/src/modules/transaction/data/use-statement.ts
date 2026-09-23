'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { PaginatedResultDTO } from '@poupig/shared';
import { StatementEntryKind, TransactionStatus, type StatementEntryDTO } from '@poupig/transaction';
import { getErrorMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/data/auth.context';
import { ScheduledTransactionApiError, saveScheduledTransaction } from './scheduled-transaction-api.client';
import { StatementApiError, listStatement, type ListStatementParams } from './statement-api.client';
import { TransactionApiError, updateTransaction, type SaveTransactionInput } from './transaction-api.client';

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

/** Local on purpose: the data barrel re-exports everything, and this name already exists there. */
function toErrorMessage(err: unknown, fallback: string): string {
  if (
    err instanceof StatementApiError ||
    err instanceof TransactionApiError ||
    err instanceof ScheduledTransactionApiError
  ) {
    return err.messages.map((message) => getErrorMessage(message)).join(' ');
  }
  if (err instanceof Error && err.message) return getErrorMessage(err);
  return fallback;
}

/**
 * The whole period in one request, with no page. A change of period or filter
 * makes the previous response obsolete, and `refresh` asks the same statement again.
 */
export function useStatement(params: ListStatementParams) {
  const { token } = useAuth();
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<RequestState<PaginatedResultDTO<StatementEntryDTO>>>(INITIAL_REQUEST_STATE);

  const requestKey = JSON.stringify([
    token,
    params.from,
    params.to,
    params.search?.trim() ?? '',
    params.direction ?? '',
    params.status ?? '',
    params.accountId ?? '',
    params.creditCardId?.trim() ?? '',
    params.onlyCreditCard === true,
    reloadCount,
  ]);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;

    listStatement(token, params)
      .then((data) => {
        if (isCurrent) setState({ key: requestKey, data, error: null });
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setState({ key: requestKey, data: null, error: toErrorMessage(err, 'Erro ao carregar o extrato.') });
        }
      });

    // A newer request (or unmount) makes this response obsolete.
    return () => {
      isCurrent = false;
    };
  }, [token, params, reloadCount, requestKey]);

  const isCurrentResponse = state.key === requestKey;
  const result = isCurrentResponse ? state.data : null;

  const refresh = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  return {
    entries: result?.data ?? [],
    total: result?.meta.total ?? 0,
    isLoading: Boolean(token) && !isCurrentResponse,
    error: isCurrentResponse ? state.error : null,
    refresh,
  };
}

/**
 * Full payload built from the entry: every field is preserved and only the
 * situation changes. Settling uses the expected date as the settlement date;
 * undoing goes back to `PENDING` without a settlement date.
 */
export function toSettledToggleInput(entry: StatementEntryDTO): SaveTransactionInput {
  const shouldSettle = entry.status !== TransactionStatus.SETTLED;

  return {
    name: entry.name,
    note: entry.note,
    value: entry.value,
    direction: entry.direction,
    accountId: entry.accountId,
    creditCardId: entry.creditCardId,
    subcategoryId: entry.subcategoryId,
    expectedOn: entry.expectedOn,
    status: shouldSettle ? TransactionStatus.SETTLED : TransactionStatus.PENDING,
    settledOn: shouldSettle ? entry.expectedOn : null,
  };
}

/**
 * One-click settle/unsettle. A standalone transaction goes through the existing
 * `updateTransaction`; an occurrence of a series is saved by series and index
 * with the `id` of the entry, which stores the occurrence when it was not stored
 * yet. Resolves with the updated entry on success and with `null` on failure
 * (the error toast is shown here, and nothing should change on screen).
 */
export function useToggleStatementEntrySettled() {
  const { token } = useAuth();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Guards against a second request for the same entry while the first is in flight.
  const inFlightIdsRef = useRef(new Set<string>());

  const toggleSettled = useCallback(
    async (entry: StatementEntryDTO): Promise<StatementEntryDTO | null> => {
      if (entry.status === TransactionStatus.CANCELED) return null;
      if (!token) {
        toast.error('Não autenticado.');
        return null;
      }

      const inFlightIds = inFlightIdsRef.current;
      if (inFlightIds.has(entry.id)) return null;

      const input = toSettledToggleInput(entry);
      inFlightIds.add(entry.id);
      setTogglingId(entry.id);
      try {
        if (entry.kind === StatementEntryKind.SCHEDULED) {
          // A scheduled entry always carries its address; the check only narrows the types.
          if (entry.seriesId === null || entry.occurrenceIndex === null) return null;
          await saveScheduledTransaction(token, entry.seriesId, entry.occurrenceIndex, { id: entry.id, ...input });
        } else {
          await updateTransaction(token, entry.id, input);
        }
        return { ...entry, status: input.status, settledOn: input.settledOn };
      } catch (err: unknown) {
        toast.error(toErrorMessage(err, 'Erro ao atualizar a situação da transação.'));
        return null;
      } finally {
        inFlightIds.delete(entry.id);
        setTogglingId((current) => (current === entry.id ? null : current));
      }
    },
    [token],
  );

  return { toggleSettled, togglingId };
}
