import { PaginatedInputDTO, PaginatedResultDTO, Result } from '@poupig/shared';
import { TransactionDTO } from '../dto';

/**
 * Listing input. Filters are raw values received by the API: an absent filter
 * means "no filter"; the implementation validates `direction`/`status` with
 * `isDirection`/`isTransactionStatus` and the period with `DateOnly`.
 */
export interface ListTransactionsInput extends PaginatedInputDTO {
  userId: string;
  search?: string;
  direction?: string;
  status?: string;
  accountId?: string;
  expectedFrom?: string;
  expectedTo?: string;
  /**
   * Restricts the listing to the transactions of this credit card. A card of
   * another user simply matches nothing (empty listing, existence not leaked).
   * Takes precedence over `onlyCreditCard` when both are informed.
   */
  creditCardId?: string;
  /**
   * When `true`, restricts the listing to the transactions linked to any credit
   * card. Any other value means "no filter". Ignored when `creditCardId` is informed.
   */
  onlyCreditCard?: boolean;
}

/**
 * Lists the non-deleted transactions of the user ordered by `expectedOn` desc
 * and `createdAt` desc.
 */
export interface ListTransactionsQuery {
  execute(input: ListTransactionsInput): Promise<Result<PaginatedResultDTO<TransactionDTO>>>;
}
