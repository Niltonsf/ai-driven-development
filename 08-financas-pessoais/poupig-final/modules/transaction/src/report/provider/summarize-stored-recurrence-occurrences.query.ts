import { Result } from '@poupig/shared';

/** The stored total of one recurrence in one month, before the generated occurrences are added. */
export interface StoredRecurrenceOccurrenceTotal {
  /** Id of the transaction series. */
  seriesId: string;
  /** Month key in the `YYYY-MM` format. */
  month: string;
  /** Positive sum of the stored occurrences, in reais, with two decimals. */
  total: number;
}

/** Inclusive period, with both dates in the `YYYY-MM-DD` format. */
export interface SummarizeStoredRecurrenceOccurrencesInput {
  userId: string;
  from: string;
  to: string;
}

/**
 * Sums, per series and per month of `expectedOn`, the stored occurrences of the
 * user whose `expectedOn` falls inside the period:
 *
 * - only occurrences of series of kind `OPEN` that are not soft deleted;
 * - without `CANCELED`, so only `PENDING` and `SETTLED`.
 *
 * Only the pairs `(seriesId, month)` with at least one occurrence appear, in no
 * guaranteed order. The occurrences generated in memory are never included —
 * storage does not know them, and the report adds them on top of this sum — and
 * neither are the standalone transactions.
 */
export interface SummarizeStoredRecurrenceOccurrencesQuery {
  execute(input: SummarizeStoredRecurrenceOccurrencesInput): Promise<Result<StoredRecurrenceOccurrenceTotal[]>>;
}
