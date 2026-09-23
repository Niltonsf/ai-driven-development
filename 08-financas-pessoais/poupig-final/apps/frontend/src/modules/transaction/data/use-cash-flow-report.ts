'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { isCashFlowWindow, type CashFlowWindow, type MonthlyCashFlowDTO } from '@poupig/transaction';
import { getErrorMessage } from '@/shared/i18n';
import { useLocalStorage } from '@/shared/hooks/use-local-storage.hook';
import { useSelectedMonth } from '@/shared/hooks/selected-month.hook';
import { monthKey } from '@/shared/util/month.util';
import { useAuth } from '@/modules/auth/data/auth.context';
import { CashFlowReportApiError, fetchMonthlyCashFlow } from './cash-flow-report-api.client';
import { hasCashFlowMovement, summarizeCashFlow, toCashFlowSeries } from './cash-flow-series';
import {
  CASH_FLOW_PREFERENCES_STORAGE_KEY,
  DEFAULT_CASH_FLOW_WINDOW,
  type CashFlowPreferences,
} from './cash-flow-window';

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

const DEFAULT_PREFERENCES: CashFlowPreferences = { version: 1, months: DEFAULT_CASH_FLOW_WINDOW };

const EMPTY_ROWS: MonthlyCashFlowDTO[] = [];

/** Throws on anything unexpected (other version, window out of the set); `useLocalStorage` then uses the default. */
function deserializeCashFlowPreferences(rawValue: string): CashFlowPreferences {
  const parsed: unknown = JSON.parse(rawValue);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid cash flow preferences: not an object');
  }

  const { version, months } = parsed as Record<string, unknown>;
  if (version !== 1) throw new Error('Invalid cash flow preferences: version');
  if (!isCashFlowWindow(months)) throw new Error('Invalid cash flow preferences: months');

  return { version: 1, months };
}

/** Local on purpose: the data barrel re-exports everything, and this name already exists there. */
function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof CashFlowReportApiError) {
    return err.messages.map((message) => getErrorMessage(message)).join(' ');
  }
  if (err instanceof Error && err.message) return getErrorMessage(err);
  return fallback;
}

/**
 * Cash flow report of the window that ends at the month selected in the header.
 * The window is remembered in the browser; the reference month is not. A change
 * of month or window makes the previous response obsolete, and `refresh` asks the
 * same report again.
 */
export function useCashFlowReport() {
  const { token } = useAuth();
  const { selectedMonth } = useSelectedMonth();
  const [preferences, setPreferences] = useLocalStorage<CashFlowPreferences>(
    CASH_FLOW_PREFERENCES_STORAGE_KEY,
    DEFAULT_PREFERENCES,
    { deserialize: deserializeCashFlowPreferences },
  );
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<RequestState<MonthlyCashFlowDTO[]>>(INITIAL_REQUEST_STATE);

  const reference = monthKey(selectedMonth);
  const { months } = preferences;
  const requestKey = JSON.stringify([token, reference, months, reloadCount]);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;

    fetchMonthlyCashFlow(token, { reference, months })
      .then((data) => {
        if (isCurrent) setState({ key: requestKey, data, error: null });
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setState({
            key: requestKey,
            data: null,
            error: toErrorMessage(err, 'Erro ao carregar o relatório de entradas e saídas.'),
          });
        }
      });

    // A newer request (or unmount) makes this response obsolete.
    return () => {
      isCurrent = false;
    };
  }, [token, reference, months, reloadCount, requestKey]);

  const setMonths = useCallback(
    (next: CashFlowWindow) => setPreferences({ version: 1, months: next }),
    [setPreferences],
  );

  const refresh = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  const isCurrentResponse = state.key === requestKey;
  const rows = (isCurrentResponse ? state.data : null) ?? EMPTY_ROWS;

  const { points, totals, hasMovement } = useMemo(
    () => ({
      points: toCashFlowSeries(rows),
      totals: summarizeCashFlow(rows),
      hasMovement: hasCashFlowMovement(rows),
    }),
    [rows],
  );

  return {
    months,
    setMonths,
    points,
    totals,
    hasMovement,
    isLoading: Boolean(token) && !isCurrentResponse,
    error: isCurrentResponse ? state.error : null,
    refresh,
  };
}
