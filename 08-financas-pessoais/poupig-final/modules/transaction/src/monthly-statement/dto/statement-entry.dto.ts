import { Direction, TransactionStatus } from '../../movement';
import { SeriesKind } from '../../transaction-series';
import { StatementEntryKind } from '../model/statement-entry-kind.enum';

/**
 * One entry of the monthly statement, in a single shape for standalone
 * transactions and occurrences of series.
 *
 * - `id` is always a `string` and is the key of the entry inside the response.
 *   For an occurrence not stored yet it is **ephemeral** (another request
 *   generates another one): the address of an occurrence is always the pair
 *   `(seriesId, occurrenceIndex)`, never the `id`.
 * - The series block (`seriesId`, `seriesName`, `seriesKind`,
 *   `occurrenceIndex`, `occurrenceOn`, `installments`) is entirely `null` in a
 *   `TRANSACTION` entry. In a `SCHEDULED` entry every field of it is filled,
 *   except `installments`, which only an installment plan has.
 * - Dates use the `YYYY-MM-DD` format and every absent optional is `null`.
 */
export type StatementEntryDTO = {
  id: string;
  kind: StatementEntryKind;
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
  seriesId: string | null;
  seriesName: string | null;
  seriesKind: SeriesKind | null;
  occurrenceIndex: number | null;
  occurrenceOn: string | null;
  installments: number | null;
};
