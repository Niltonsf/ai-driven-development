import { Result } from '@poupig/shared';
import { ScheduledTransactionDTO } from '../dto';

/**
 * Reads the stored occurrence of the user addressed by
 * `(seriesId, occurrenceIndex)`. Resolves `Result.ok(null)` when the occurrence
 * is not stored, belongs to another user or belongs to a soft deleted series.
 * A returned DTO always has `materialized: true`.
 */
export interface FindScheduledTransactionByOccurrenceQuery {
  execute(seriesId: string, occurrenceIndex: number, userId: string): Promise<Result<ScheduledTransactionDTO | null>>;
}
