'use client';

import { useCallback, useState } from 'react';
import { isDirection, isTransactionStatus } from '@poupig/transaction';
import { useLocalStorage } from '@/shared/hooks/use-local-storage.hook';
import {
  isStatementGrouping,
  isStatementView,
  type StatementFilters,
  type StatementGrouping,
  type StatementPreferences,
  type StatementView,
} from './statement-view';

export const STATEMENT_PREFERENCES_STORAGE_KEY = 'poupig:statement-preferences';

/** Same breakpoint as the `ShellProvider` (its constant is not exported). */
const CARDS_VIEW_MAX_WIDTH = 1024;

export type StatementFilterName = keyof StatementFilters;

/**
 * Defaults used when nothing valid is stored. The `(private)` group only renders
 * on the client, so reading `window` here is safe; the guard only protects a
 * future server render.
 */
function createDefaultPreferences(): StatementPreferences {
  const isNarrowScreen = typeof window !== 'undefined' && window.innerWidth < CARDS_VIEW_MAX_WIDTH;

  return {
    version: 1,
    view: isNarrowScreen ? 'cards' : 'table',
    grouping: 'date',
    filtersOpen: false,
    filters: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalidPreferences(reason: string): never {
  throw new Error(`Invalid statement preferences: ${reason}`);
}

/**
 * Reads only the known filters. Any invalid filter discards the whole object, so a
 * half-restored choice never reaches the first request. Unknown keys (such as a
 * period or a search) are ignored.
 */
function parseFilters(value: unknown): StatementFilters {
  if (!isRecord(value)) return invalidPreferences('filters');

  const filters: StatementFilters = {};
  const { direction, status, accountId, creditCardId, onlyCreditCard } = value;

  if (direction !== undefined) {
    if (!isDirection(direction)) return invalidPreferences('direction');
    filters.direction = direction;
  }
  if (status !== undefined) {
    if (!isTransactionStatus(status)) return invalidPreferences('status');
    filters.status = status;
  }
  if (accountId !== undefined) {
    if (!isNonEmptyString(accountId)) return invalidPreferences('accountId');
    filters.accountId = accountId;
  }
  if (creditCardId !== undefined) {
    if (!isNonEmptyString(creditCardId)) return invalidPreferences('creditCardId');
    filters.creditCardId = creditCardId;
  }
  if (onlyCreditCard !== undefined) {
    if (onlyCreditCard !== true) return invalidPreferences('onlyCreditCard');
    filters.onlyCreditCard = true;
  }
  if (filters.creditCardId && filters.onlyCreditCard) return invalidPreferences('credit card filters together');

  return filters;
}

/** Throws on anything unexpected; `useLocalStorage` then falls back to the defaults. */
export function deserializeStatementPreferences(rawValue: string): StatementPreferences {
  const parsed: unknown = JSON.parse(rawValue);

  if (!isRecord(parsed) || parsed.version !== 1) return invalidPreferences('version');
  if (!isStatementView(parsed.view)) return invalidPreferences('view');
  if (!isStatementGrouping(parsed.grouping)) return invalidPreferences('grouping');
  if (typeof parsed.filtersOpen !== 'boolean') return invalidPreferences('filtersOpen');

  return {
    version: 1,
    view: parsed.view,
    grouping: parsed.grouping,
    filtersOpen: parsed.filtersOpen,
    filters: parseFilters(parsed.filters),
  };
}

/** Empty values clear the filter; a specific card and "only credit card" replace each other. */
function withFilter<TName extends StatementFilterName>(
  filters: StatementFilters,
  name: TName,
  value: StatementFilters[TName],
): StatementFilters {
  const next: StatementFilters = { ...filters };
  delete next[name];

  if (value !== undefined && value !== false && value !== '') {
    next[name] = value;
  }
  if (name === 'creditCardId' && next.creditCardId) delete next.onlyCreditCard;
  if (name === 'onlyCreditCard' && next.onlyCreditCard) delete next.creditCardId;

  return next;
}

/**
 * Statement preferences kept in the browser (view, grouping, filters panel and
 * filters). Read synchronously on the first render, so the first request already
 * carries the stored filters. Never stores the search, the period or the month.
 */
export function useStatementPreferences() {
  const [defaultPreferences] = useState(createDefaultPreferences);
  const [preferences, setPreferences] = useLocalStorage<StatementPreferences>(
    STATEMENT_PREFERENCES_STORAGE_KEY,
    defaultPreferences,
    { deserialize: deserializeStatementPreferences },
  );

  const setView = useCallback(
    (view: StatementView) => setPreferences((current) => ({ ...current, view })),
    [setPreferences],
  );

  const setGrouping = useCallback(
    (grouping: StatementGrouping) => setPreferences((current) => ({ ...current, grouping })),
    [setPreferences],
  );

  const toggleFilters = useCallback(
    () => setPreferences((current) => ({ ...current, filtersOpen: !current.filtersOpen })),
    [setPreferences],
  );

  const setFilter = useCallback(
    <TName extends StatementFilterName>(name: TName, value: StatementFilters[TName]) =>
      setPreferences((current) => ({ ...current, filters: withFilter(current.filters, name, value) })),
    [setPreferences],
  );

  const clearFilters = useCallback(
    () => setPreferences((current) => ({ ...current, filters: {} })),
    [setPreferences],
  );

  return { preferences, setView, setGrouping, toggleFilters, setFilter, clearFilters };
}

export type StatementFilterSetter = ReturnType<typeof useStatementPreferences>['setFilter'];
