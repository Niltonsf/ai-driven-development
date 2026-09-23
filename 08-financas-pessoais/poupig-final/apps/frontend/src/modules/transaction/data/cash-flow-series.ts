import type { MonthlyCashFlowDTO } from '@poupig/transaction';
import { formatShortMonthLabel, parseMonthKey } from '@/shared/util/month.util';

/** One month of the report charts. */
export type CashFlowPoint = {
  /** Month key, `YYYY-MM`. */
  month: string;
  /** Short month label for the axis and the tooltip, e.g. `set/2026`. */
  label: string;
  inflow: number;
  outflow: number;
  balance: number;
  /**
   * Running sum of the balances from the first month of the window up to this
   * month, with two decimals. It starts from zero at the window and is NOT the
   * balance of any account.
   */
  cumulative: number;
};

/** Totals of the whole window. */
export type CashFlowTotals = {
  inflow: number;
  outflow: number;
  /** `inflow - outflow` of the window. */
  balance: number;
  /** Window balance divided by every month of the window (not only the months with movement). */
  monthlyAverage: number;
};

/** Money math in integer cents, so repeated sums do not drift (`0.1 + 0.2`). */
function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

/** Chart points in the order of the rows, with the short label and the window cumulative. */
export function toCashFlowSeries(rows: readonly MonthlyCashFlowDTO[]): CashFlowPoint[] {
  let cumulativeCents = 0;

  return rows.map((row) => {
    cumulativeCents += toCents(row.balance);

    return {
      month: row.month,
      label: formatShortMonthLabel(parseMonthKey(row.month)),
      inflow: row.inflow,
      outflow: row.outflow,
      balance: row.balance,
      cumulative: fromCents(cumulativeCents),
    };
  });
}

/** Window totals; the monthly average is `0` when there is no row. */
export function summarizeCashFlow(rows: readonly MonthlyCashFlowDTO[]): CashFlowTotals {
  let inflowCents = 0;
  let outflowCents = 0;

  for (const row of rows) {
    inflowCents += toCents(row.inflow);
    outflowCents += toCents(row.outflow);
  }

  const balanceCents = inflowCents - outflowCents;

  return {
    inflow: fromCents(inflowCents),
    outflow: fromCents(outflowCents),
    balance: fromCents(balanceCents),
    monthlyAverage: rows.length === 0 ? 0 : fromCents(Math.round(balanceCents / rows.length)),
  };
}

/**
 * The API never returns an empty list (every month of the window is present), so
 * the empty state needs an explicit rule: no month with any inflow or outflow.
 */
export function hasCashFlowMovement(rows: readonly MonthlyCashFlowDTO[]): boolean {
  return rows.some((row) => row.inflow !== 0 || row.outflow !== 0);
}
