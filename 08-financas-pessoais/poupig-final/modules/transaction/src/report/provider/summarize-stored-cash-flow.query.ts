import { Result } from '@poupig/shared';

/** The stored totals of one month, before the generated occurrences are added. */
export interface StoredMonthlyCashFlow {
  /** Month key in the `YYYY-MM` format. */
  month: string;
  /** Positive sum of the inflows, in reais, with two decimals. */
  inflow: number;
  /** Positive sum of the outflows, in reais, with two decimals. */
  outflow: number;
}

/** Inclusive period, with both dates in the `YYYY-MM-DD` format. */
export interface SummarizeStoredCashFlowInput {
  userId: string;
  from: string;
  to: string;
}

/**
 * Sums, per month of `expectedOn`, the stored rows of the user whose
 * `expectedOn` falls inside the period and whose status is not `CANCELED`:
 *
 * - the standalone transactions that are not soft deleted;
 * - the stored occurrences of series that are not soft deleted.
 *
 * Only the months with at least one row appear, in no guaranteed order. The
 * occurrences generated in memory are never included: storage does not know
 * them, and the report adds them on top of this sum.
 */
export interface SummarizeStoredCashFlowQuery {
  execute(input: SummarizeStoredCashFlowInput): Promise<Result<StoredMonthlyCashFlow[]>>;
}
