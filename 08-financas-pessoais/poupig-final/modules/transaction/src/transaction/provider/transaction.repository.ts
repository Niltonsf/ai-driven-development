import { CrudRepository } from '@poupig/shared';
import { Transaction } from '../model';

/**
 * Persistence contract of the `Transaction` aggregate. There is no business
 * uniqueness check.
 *
 * - `findById` resolves `Result.fail(TransactionErrors.TRANSACTION_NOT_FOUND)`
 *   when the record does not exist **or** has `deletedAt` filled.
 * - `create` and `update` persist every attribute of the entity, including
 *   `deletedAt` (soft delete is applied with `softDelete()` + `update`).
 * - `delete` is logical: it fills `deletedAt` and never removes the row.
 */
export interface TransactionRepository extends CrudRepository<Transaction> {}
