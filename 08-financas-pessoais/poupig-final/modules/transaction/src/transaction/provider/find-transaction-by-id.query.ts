import { Result } from '@poupig/shared';
import { TransactionDTO } from '../dto';

/**
 * Reads one transaction of the user. Resolves `Result.ok(null)` when the
 * transaction does not exist, is soft deleted or belongs to another user.
 */
export interface FindTransactionByIdQuery {
  execute(id: string, userId: string): Promise<Result<TransactionDTO | null>>;
}
