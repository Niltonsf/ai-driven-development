'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { isCashFlowWindow, type CashFlowWindow, type RecurrenceReportLineDTO } from '@poupig/transaction';
import { getErrorMessage } from '@/shared/i18n';
import { useLocalStorage } from '@/shared/hooks/use-local-storage.hook';
import { useSelectedMonth } from '@/shared/hooks/selected-month.hook';
import { monthKey } from '@/shared/util/month.util';
import { useAuth } from '@/modules/auth/data/auth.context';
import {
  RECURRENCE_TOTAL_LINE_IDS,
  buildRecurrenceChart,
  isRecurrenceTotalLineId,
  type RecurrenceChartSectionId,
} from './recurrence-chart';
import { RecurrenceReportApiError, fetchRecurrenceReport } from './recurrence-report-api.client';
import {
  DEFAULT_RECURRENCE_WINDOW,
  RECURRENCE_PREFERENCES_STORAGE_KEY,
  buildRecurrenceReport,
  type RecurrenceGroupId,
  type RecurrencePreferences,
} from './recurrence-report';

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

const DEFAULT_PREFERENCES: RecurrencePreferences = { version: 1, months: DEFAULT_RECURRENCE_WINDOW };

const EMPTY_LINES: RecurrenceReportLineDTO[] = [];

const NO_UNCHECKED_IDS: ReadonlySet<string> = new Set<string>();

const NO_HIDDEN_TOTAL_IDS: ReadonlySet<string> = new Set<string>();

/** Throws on anything unexpected (other version, window out of the set); `useLocalStorage` then uses the default. */
function deserializeRecurrencePreferences(rawValue: string): RecurrencePreferences {
  const parsed: unknown = JSON.parse(rawValue);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid recurrence report preferences: not an object');
  }

  const { version, months } = parsed as Record<string, unknown>;
  if (version !== 1) throw new Error('Invalid recurrence report preferences: version');
  if (!isCashFlowWindow(months)) throw new Error('Invalid recurrence report preferences: months');

  return { version: 1, months };
}

/** Local on purpose: the data barrel re-exports everything, and this name already exists there. */
function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof RecurrenceReportApiError) {
    return err.messages.map((message) => getErrorMessage(message)).join(' ');
  }
  if (err instanceof Error && err.message) return getErrorMessage(err);
  return fallback;
}

/**
 * Recurrence report of the window that ends at the month selected in the header.
 * The window is remembered in the browser; the reference month and the checked
 * recurrences are not. A change of month or window makes the previous response
 * obsolete, and `refresh` asks the same report again. Checking and unchecking
 * never fetch: the report is rebuilt from the response already in memory.
 */
export function useRecurrenceReport() {
  const { token } = useAuth();
  const { selectedMonth } = useSelectedMonth();
  const [preferences, setPreferences] = useLocalStorage<RecurrencePreferences>(
    RECURRENCE_PREFERENCES_STORAGE_KEY,
    DEFAULT_PREFERENCES,
    { deserialize: deserializeRecurrencePreferences },
  );
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<RequestState<RecurrenceReportLineDTO[]>>(INITIAL_REQUEST_STATE);

  /**
   * The unchecked ids, deliberately NOT keyed by month or window: a series is the
   * same recurrence in every month, so the simulation survives those changes.
   * Ids missing from the current response are ignored by `buildRecurrenceReport`
   * instead of being cleared by an effect, and a recurrence that only appears
   * later starts checked because only the unchecked ones are kept.
   */
  const [uncheckedIds, setUncheckedIds] = useState<ReadonlySet<string>>(NO_UNCHECKED_IDS);

  /**
   * Summary lines hidden in the chart. Hiding one never changes a sum, so it is a
   * separate set from `uncheckedIds`, kept in the session like it.
   */
  const [hiddenTotalIds, setHiddenTotalIds] = useState<ReadonlySet<string>>(NO_HIDDEN_TOTAL_IDS);
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);

  /**
   * The single switch of the report: off (default), hiding a recurrence only
   * cleans the chart and every sum keeps it; on, the hidden recurrences also
   * leave the cards, the table totals and the summary lines. Session only, like
   * the hidden sets: a stored switch would open the report with money out of the
   * totals without the user noticing.
   */
  const [excludeHiddenFromTotals, setExcludeHiddenFromTotals] = useState(false);

  const reference = monthKey(selectedMonth);
  const { months } = preferences;
  const requestKey = JSON.stringify([token, reference, months, reloadCount]);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;

    fetchRecurrenceReport(token, { reference, months })
      .then((data) => {
        if (isCurrent) setState({ key: requestKey, data, error: null });
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setState({
            key: requestKey,
            data: null,
            error: toErrorMessage(err, 'Erro ao carregar o relatório de recorrências.'),
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
  const lines = (isCurrentResponse ? state.data : null) ?? EMPTY_LINES;

  const report = useMemo(
    () => buildRecurrenceReport(lines, uncheckedIds, excludeHiddenFromTotals),
    [lines, uncheckedIds, excludeHiddenFromTotals],
  );
  const chart = useMemo(() => buildRecurrenceChart(report, hiddenTotalIds), [report, hiddenTotalIds]);

  const toggleRecurrence = useCallback((seriesId: string) => {
    setUncheckedIds((current) => {
      const next = new Set(current);
      if (next.has(seriesId)) next.delete(seriesId);
      else next.add(seriesId);
      return next;
    });
  }, []);

  /** Checks or unchecks every row of the group in the current response. */
  const setGroupChecked = useCallback(
    (groupId: RecurrenceGroupId, checked: boolean) => {
      const seriesIds = report.groups.find((group) => group.id === groupId)?.rows.map((row) => row.seriesId) ?? [];

      setUncheckedIds((current) => {
        const next = new Set(current);
        for (const seriesId of seriesIds) {
          if (checked) next.delete(seriesId);
          else next.add(seriesId);
        }
        return next;
      });
    },
    [report],
  );

  const checkAll = useCallback(() => {
    setUncheckedIds(NO_UNCHECKED_IDS);
  }, []);

  /**
   * A click on a legend item: a summary line is only hidden or shown, while a
   * recurrence is unchecked or checked, leaving every sum and the table too.
   */
  const toggleChartLine = useCallback(
    (lineId: string) => {
      if (!isRecurrenceTotalLineId(lineId)) {
        toggleRecurrence(lineId);
        return;
      }

      setHiddenTotalIds((current) => {
        const next = new Set(current);
        if (next.has(lineId)) next.delete(lineId);
        else next.add(lineId);
        return next;
      });
    },
    [toggleRecurrence],
  );

  /**
   * A click on the title of a legend section turns off every line of the section,
   * or turns every line back on when the whole section is already off. For the
   * inflow and outflow sections it checks or unchecks the whole group, the same
   * as the group checkbox of the table; for the summary section it only shows or
   * hides the summary lines.
   */
  const toggleChartSection = useCallback(
    (sectionId: RecurrenceChartSectionId) => {
      const section = chart.sections.find((item) => item.id === sectionId);
      if (!section) return;

      const turnOn = section.state === 'off';

      if (sectionId === 'totals') {
        setHiddenTotalIds(turnOn ? NO_HIDDEN_TOTAL_IDS : new Set<string>(Object.values(RECURRENCE_TOTAL_LINE_IDS)));
        return;
      }

      setGroupChecked(sectionId, turnOn);
    },
    [chart, setGroupChecked],
  );

  /** Turns every line back on: every recurrence checked and every summary line shown. */
  const showAllChartLines = useCallback(() => {
    setUncheckedIds(NO_UNCHECKED_IDS);
    setHiddenTotalIds(NO_HIDDEN_TOTAL_IDS);
  }, []);

  return {
    months,
    setMonths,
    report,
    chart,
    hasRecurrences: lines.length > 0,
    toggleRecurrence,
    setGroupChecked,
    checkAll,
    toggleChartLine,
    toggleChartSection,
    showAllChartLines,
    highlightedLineId,
    setHighlightedLineId,
    excludeHiddenFromTotals,
    setExcludeHiddenFromTotals,
    isLoading: Boolean(token) && !isCurrentResponse,
    error: isCurrentResponse ? state.error : null,
    refresh,
  };
}
