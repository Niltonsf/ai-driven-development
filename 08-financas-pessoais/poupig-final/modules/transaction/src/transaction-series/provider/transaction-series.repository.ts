import { CrudRepository } from '@poupig/shared';
import { TransactionSeries } from '../model';

/**
 * Persistence contract of the `TransactionSeries` aggregate. There is no
 * business uniqueness check and no extra operation.
 *
 * - `findById` resolves
 *   `Result.fail(TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND)` when the
 *   record does not exist **or** has `deletedAt` filled.
 * - `create` and `update` persist every attribute of the entity, including
 *   `deletedAt` (soft delete is applied with `softDelete()` + `update`).
 * - `delete` is logical: it fills `deletedAt` and never removes the row.
 */
export interface TransactionSeriesRepository extends CrudRepository<TransactionSeries> {}
