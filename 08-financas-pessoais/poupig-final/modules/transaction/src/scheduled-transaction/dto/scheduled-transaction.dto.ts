import { Direction, TransactionStatus } from '../../movement';
import { SeriesKind } from '../../transaction-series';

/**
 * Read projection of an occurrence of a transaction series, stored or
 * generated in memory. Reference names and the read-only context of the series
 * (`seriesName`, `seriesKind`, `installments`) exist only here.
 *
 * - `id` is always a `string`: for an occurrence not stored yet it is
 *   ephemeral, and the stable address of the occurrence is the pair
 *   `(seriesId, occurrenceIndex)`.
 * - `materialized` is `true` only when the occurrence is stored.
 * - `installments` comes from the series and is filled only in an installment plan.
 * - Dates use the `YYYY-MM-DD` format and every absent optional is `null`.
 *   `deletedAt` is never exposed.
 */
export type ScheduledTransactionDTO = {
  id: string;
  userId: string;
  seriesId: string;
  occurrenceIndex: number;
  occurrenceOn: string;
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
  materialized: boolean;
  seriesName: string;
  seriesKind: SeriesKind;
  installments: number | null;
};
