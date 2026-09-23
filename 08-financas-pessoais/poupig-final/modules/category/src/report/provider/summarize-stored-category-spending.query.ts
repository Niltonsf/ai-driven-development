import { Result } from '@poupig/shared';

/** The stored total of one subcategory, before the generated occurrences are added. */
export interface StoredSubcategorySpending {
  /** Id of the subcategory, or `null` for the stored rows without subcategory. */
  subcategoryId: string | null;
  /** Positive sum of the outflows, in reais, with two decimals. */
  total: number;
}

/** Inclusive period, with both dates in the `YYYY-MM-DD` format, already validated by the report. */
export interface SummarizeStoredCategorySpendingInput {
  userId: string;
  from: string;
  to: string;
}

/**
 * Sums, per `subcategoryId`, the stored rows of the user whose `expectedOn`
 * falls inside the period:
 *
 * - only outflows (`OUT`), and never `CANCELED` (`PENDING` and `SETTLED` enter);
 * - the standalone transactions that are not soft deleted;
 * - the stored occurrences of series that are not soft deleted.
 *
 * The rows without subcategory are summed in a single row with `subcategoryId`
 * `null`. Only the subcategories with at least one row appear, in no guaranteed
 * order, and without any appearance: the report looks it up separately. The
 * occurrences generated in memory are never included: storage does not know
 * them, and the report adds them on top of this sum.
 */
export interface SummarizeStoredCategorySpendingQuery {
  execute(input: SummarizeStoredCategorySpendingInput): Promise<Result<StoredSubcategorySpending[]>>;
}
