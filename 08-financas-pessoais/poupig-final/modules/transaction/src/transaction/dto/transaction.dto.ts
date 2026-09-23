import { Direction, TransactionStatus } from '../../movement';

/**
 * Read projection of a transaction. Reference names exist only here.
 * `expectedOn`/`settledOn` use the `YYYY-MM-DD` format and every absent
 * optional is `null`. `deletedAt` is never exposed.
 */
export type TransactionDTO = {
  id: string;
  userId: string;
  name: string;
  note: string | null;
  value: number;
  direction: Direction;
  accountId: string;
  accountName: string;
  creditCardId: string | null;
  creditCardName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  categoryName: string | null;
  status: TransactionStatus;
  expectedOn: string;
  settledOn: string | null;
  createdAt: Date;
  updatedAt: Date;
};
