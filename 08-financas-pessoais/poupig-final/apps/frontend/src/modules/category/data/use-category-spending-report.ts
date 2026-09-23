'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CategorySpendingSliceDTO } from '@poupig/category';
import { getErrorMessage } from '@/shared/i18n';
import { useLocalStorage } from '@/shared/hooks/use-local-storage.hook';
import { useSelectedMonth } from '@/shared/hooks/selected-month.hook';
import { monthKey } from '@/shared/util/month.util';
import { useAuth } from '@/modules/auth/data/auth.context';
import { CategoryReportApiError, fetchCategorySpending } from './category-report-api.client';
import {
  CATEGORY_SPENDING_PREFERENCES_STORAGE_KEY,
  DEFAULT_CATEGORY_SPENDING_GRAIN,
  formatMonthSentence,
  isCategorySpendingGrain,
  summarizeSpending,
  toSpendingSlices,
  type CategorySpendingGrain,
  type CategorySpendingPreferences,
  type SpendingSliceItem,
} from './category-spending-slices';

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

/**
 * Hidden slices together with the `month|grain` key they were chosen for. A slice
 * id only means something inside one month and one grain, so a set saved under
 * another key is treated as empty.
 */
type HiddenSlicesState = {
  key: string;
  ids: ReadonlySet<string>;
};

const INITIAL_REQUEST_STATE = { key: '', data: null, error: null };

const DEFAULT_PREFERENCES: CategorySpendingPreferences = { version: 1, grain: DEFAULT_CATEGORY_SPENDING_GRAIN };

const EMPTY_ROWS: CategorySpendingSliceDTO[] = [];

const EMPTY_IDS: ReadonlySet<string> = new Set<string>();

const INITIAL_HIDDEN_STATE: HiddenSlicesState = { key: '', ids: EMPTY_IDS };

/** Throws on anything unexpected (other version, unknown grain); `useLocalStorage` then uses the default. */
function deserializeCategorySpendingPreferences(rawValue: string): CategorySpendingPreferences {
  const parsed: unknown = JSON.parse(rawValue);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid category spending preferences: not an object');
  }

  const { version, grain } = parsed as Record<string, unknown>;
  if (version !== 1) throw new Error('Invalid category spending preferences: version');
  if (!isCategorySpendingGrain(grain)) throw new Error('Invalid category spending preferences: grain');

  return { version: 1, grain };
}

/** Local on purpose: the data barrel re-exports everything, so a shared name would collide. */
function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof CategoryReportApiError) {
    return err.messages.map((message) => getErrorMessage(message)).join(' ');
  }
  if (err instanceof Error && err.message) return getErrorMessage(err);
  return fallback;
}

/**
 * Category spending report of the month selected in the header. One request per
 * month serves both grains: switching the grain, hiding and showing slices only
 * recompute the slices from the rows already in memory. The grain is remembered
 * in the browser; hidden slices are not.
 */
export function useCategorySpendingReport() {
  const { token } = useAuth();
  const { selectedMonth, monthStart, monthEnd } = useSelectedMonth();
  const [preferences, setPreferences] = useLocalStorage<CategorySpendingPreferences>(
    CATEGORY_SPENDING_PREFERENCES_STORAGE_KEY,
    DEFAULT_PREFERENCES,
    { deserialize: deserializeCategorySpendingPreferences },
  );
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<RequestState<CategorySpendingSliceDTO[]>>(INITIAL_REQUEST_STATE);
  const [hiddenState, setHiddenState] = useState<HiddenSlicesState>(INITIAL_HIDDEN_STATE);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // The grain is not part of the key: it does not change the request.
  const requestKey = JSON.stringify([token, monthStart, monthEnd, reloadCount]);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;

    fetchCategorySpending(token, { from: monthStart, to: monthEnd })
      .then((data) => {
        if (isCurrent) setState({ key: requestKey, data, error: null });
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setState({
            key: requestKey,
            data: null,
            error: toErrorMessage(err, 'Erro ao carregar o relatório de gastos por categoria.'),
          });
        }
      });

    // A newer request (or unmount) makes this response obsolete.
    return () => {
      isCurrent = false;
    };
  }, [token, monthStart, monthEnd, reloadCount, requestKey]);

  const { grain } = preferences;

  /*
   * Hidden slices are kept with the key of the month and grain they belong to,
   * and a set saved under another key is read as empty. Changing the month or the
   * grain therefore turns every slice back on in the same render, without an
   * effect clearing the set: an effect would first render the new month with the
   * old hidden ids and would write state synchronously inside it.
   */
  const hiddenKey = `${monthKey(selectedMonth)}|${grain}`;
  const hiddenIds = hiddenState.key === hiddenKey ? hiddenState.ids : EMPTY_IDS;

  const setGrain = useCallback(
    (next: CategorySpendingGrain) => setPreferences({ version: 1, grain: next }),
    [setPreferences],
  );

  const toggleSlice = useCallback(
    (id: string) => {
      setHiddenState((current) => {
        const ids = new Set(current.key === hiddenKey ? current.ids : EMPTY_IDS);
        if (ids.has(id)) ids.delete(id);
        else ids.add(id);
        return { key: hiddenKey, ids };
      });
    },
    [hiddenKey],
  );

  const showAllSlices = useCallback(() => {
    setHiddenState({ key: hiddenKey, ids: EMPTY_IDS });
  }, [hiddenKey]);

  const refresh = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  const isCurrentResponse = state.key === requestKey;
  const rows = (isCurrentResponse ? state.data : null) ?? EMPTY_ROWS;

  const grainSlices = useMemo(() => toSpendingSlices(rows, grain), [rows, grain]);

  const { slices, visibleSlices, totals } = useMemo(() => {
    const items: SpendingSliceItem[] = grainSlices.map((slice) => ({ ...slice, isHidden: hiddenIds.has(slice.id) }));

    return {
      slices: items,
      visibleSlices: items.filter((slice) => !slice.isHidden),
      totals: summarizeSpending(grainSlices, hiddenIds),
    };
  }, [grainSlices, hiddenIds]);

  return {
    grain,
    setGrain,
    slices,
    visibleSlices,
    totals,
    toggleSlice,
    showAllSlices,
    highlightedId,
    setHighlightedId,
    monthSentence: formatMonthSentence(selectedMonth),
    isLoading: Boolean(token) && !isCurrentResponse,
    error: isCurrentResponse ? state.error : null,
    refresh,
  };
}
