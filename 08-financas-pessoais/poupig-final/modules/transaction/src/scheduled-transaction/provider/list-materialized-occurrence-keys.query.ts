import { Result } from '@poupig/shared';

/** The business key of a stored occurrence, and nothing else. */
export interface MaterializedOccurrenceKey {
  seriesId: string;
  occurrenceIndex: number;
}

/** Inclusive period, with both dates in the `YYYY-MM-DD` format. */
export interface ListMaterializedOccurrenceKeysInput {
  userId: string;
  from: string;
  to: string;
}

/**
 * Lists the pair `(seriesId, occurrenceIndex)` of every stored occurrence of
 * the user whose `occurrenceOn` falls inside the period. It exists only to
 * suppress the generation of occurrences that are already stored, without
 * loading the full DTO over a window of many months.
 *
 * - Filters by `occurrenceOn`, never by `expectedOn`: the `occurrenceOn` of an
 *   index is fixed, so an occurrence moved to another period still suppresses
 *   the generation of its original date.
 * - Any status, `CANCELED` included: a canceled occurrence must not be
 *   generated again as `PENDING`.
 * - Occurrences of soft deleted series are ignored.
 * - No other field and no guaranteed order.
 */
export interface ListMaterializedOccurrenceKeysQuery {
  execute(input: ListMaterializedOccurrenceKeysInput): Promise<Result<MaterializedOccurrenceKey[]>>;
}
