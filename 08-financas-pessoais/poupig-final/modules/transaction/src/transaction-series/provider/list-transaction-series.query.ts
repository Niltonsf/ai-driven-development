import { PaginatedInputDTO, PaginatedResultDTO, Result } from '@poupig/shared';
import { TransactionSeriesDTO } from '../dto';

/**
 * Listing input. Filters are raw values received by the API: an absent filter
 * means "no filter"; the implementation validates `kind`/`direction` with
 * `isSeriesKind`/`isDirection`.
 */
export interface ListTransactionSeriesInput extends PaginatedInputDTO {
  userId: string;
  search?: string;
  kind?: string;
  direction?: string;
  accountId?: string;
}

/**
 * Lists the non-deleted series of the user ordered by `startDate` desc and, on a
 * tie, by `createdAt` desc.
 */
export interface ListTransactionSeriesQuery {
  execute(input: ListTransactionSeriesInput): Promise<Result<PaginatedResultDTO<TransactionSeriesDTO>>>;
}
