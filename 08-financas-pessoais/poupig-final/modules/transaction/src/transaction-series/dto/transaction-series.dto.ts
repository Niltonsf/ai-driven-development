import { Direction } from '../../movement';
import { RecurrenceRule, SeriesKind } from '../model';

/**
 * Read projection of a transaction series. Reference names exist only here.
 * `startDate`/`endDate` use the `YYYY-MM-DD` format, `recurrence` is the rule
 * itself — with the `unit` discriminant and only the anchors of that unit — and
 * every absent optional is `null`. `deletedAt` is never exposed.
 */
export type TransactionSeriesDTO = {
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
  kind: SeriesKind;
  recurrence: RecurrenceRule;
  startDate: string;
  endDate: string | null;
  installments: number | null;
  createdAt: Date;
  updatedAt: Date;
};
