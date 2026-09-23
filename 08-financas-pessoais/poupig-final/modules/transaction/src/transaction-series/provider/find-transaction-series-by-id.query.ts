import { Result } from '@poupig/shared';
import { TransactionSeriesDTO } from '../dto';

/**
 * Reads one transaction series of the user. Resolves `Result.ok(null)` when the
 * series does not exist, is soft deleted or belongs to another user.
 */
export interface FindTransactionSeriesByIdQuery {
  execute(id: string, userId: string): Promise<Result<TransactionSeriesDTO | null>>;
}
