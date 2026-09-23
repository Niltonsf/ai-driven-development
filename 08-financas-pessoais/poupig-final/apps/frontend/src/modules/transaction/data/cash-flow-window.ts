import { CASH_FLOW_WINDOWS, type CashFlowWindow } from '@poupig/transaction';

export type CashFlowWindowOption = {
  value: CashFlowWindow;
  label: string;
};

/** The pills of the window selector, in the order of the domain set: nobody repeats the list. */
export const CASH_FLOW_WINDOW_OPTIONS: readonly CashFlowWindowOption[] = CASH_FLOW_WINDOWS.map((value) => ({
  value,
  label: `${value} meses`,
}));

/** Window used when nothing valid is stored in the browser. */
export const DEFAULT_CASH_FLOW_WINDOW: CashFlowWindow = 12;

/** Only the window is kept in the browser; the reference month always comes from the header. */
export type CashFlowPreferences = {
  version: 1;
  months: CashFlowWindow;
};

export const CASH_FLOW_PREFERENCES_STORAGE_KEY = 'poupig:cash-flow-report';

/**
 * Colors of the report series, on the same hues of the month dashboard: inflow
 * emerald, outflow rose, balance blue. The window cumulative uses amber so the
 * line stays apart from the balance bars on the dark surface.
 */
export const CASH_FLOW_COLORS = {
  inflow: '#10b981',
  outflow: '#f43f5e',
  balance: '#3b82f6',
  cumulative: '#fbbf24',
} as const;
