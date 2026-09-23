import { CrudRepository } from '@poupig/shared';
import { ScheduledTransaction } from '../model';

/**
 * Persistence contract of the `ScheduledTransaction` aggregate. The business
 * key `(seriesId, occurrenceIndex)` is unique; locating an occurrence by that
 * pair is a job of the read queries, not of the repository.
 *
 * - `findById` resolves
 *   `Result.fail(ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND)`
 *   when the record does not exist.
 * - `create` and `update` persist every attribute of the entity except
 *   `deletedAt`, which does not exist for this aggregate.
 * - `delete` is **physical**: it removes the record, freeing the pair
 *   `(seriesId, occurrenceIndex)` so the occurrence is generated from the series again.
 */
export interface ScheduledTransactionRepository extends CrudRepository<ScheduledTransaction> {}
