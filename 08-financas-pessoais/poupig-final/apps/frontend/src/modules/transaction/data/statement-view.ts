import type { Direction, TransactionStatus } from '@poupig/transaction';

export type StatementView = 'table' | 'cards';

export type StatementGrouping = 'date' | 'account' | 'category' | 'subcategory';

/** Typed by the union: a new view without a label breaks the build instead of rendering the raw code. */
export const STATEMENT_VIEW_LABELS: Record<StatementView, string> = {
  table: 'Tabela',
  cards: 'Cards',
};

/** Typed by the union: a new grouping without a label breaks the build instead of rendering the raw code. */
export const STATEMENT_GROUPING_LABELS: Record<StatementGrouping, string> = {
  date: 'Data',
  account: 'Conta',
  category: 'Categoria',
  subcategory: 'Subcategoria',
};

export const STATEMENT_VIEWS = Object.keys(STATEMENT_VIEW_LABELS) as StatementView[];

export const STATEMENT_GROUPINGS = Object.keys(STATEMENT_GROUPING_LABELS) as StatementGrouping[];

export function isStatementView(value: unknown): value is StatementView {
  return typeof value === 'string' && (STATEMENT_VIEWS as readonly string[]).includes(value);
}

export function isStatementGrouping(value: unknown): value is StatementGrouping {
  return typeof value === 'string' && (STATEMENT_GROUPINGS as readonly string[]).includes(value);
}

/**
 * Filters the user can keep between visits. The period (`expectedFrom`/`expectedTo`)
 * always comes from the selected month and the search is local page state, so
 * neither belongs here.
 */
export type StatementFilters = {
  direction?: Direction;
  status?: TransactionStatus;
  accountId?: string;
  /** Specific credit card. Never stored together with `onlyCreditCard`. */
  creditCardId?: string;
  /** Any credit card. Only `true` is stored; never together with `creditCardId`. */
  onlyCreditCard?: boolean;
};

export type StatementPreferences = {
  version: 1;
  view: StatementView;
  grouping: StatementGrouping;
  filtersOpen: boolean;
  filters: StatementFilters;
};
