import { Result } from '@poupig/shared';
import { ScheduledTransactionDTO } from '../dto';

/** Inclusive period, with both dates in the `YYYY-MM-DD` format. */
export interface ListScheduledTransactionsInPeriodInput {
  userId: string;
  from: string;
  to: string;
}

/**
 * Lists the stored occurrences of the user whose `expectedOn` **or**
 * `occurrenceOn` falls inside the period, ignoring the occurrences of soft
 * deleted series, ordered by `expectedOn` desc and, on a tie, by `createdAt`
 * desc. Every returned DTO has `materialized: true`.
 *
 * No other filter is applied: the statement filters in memory, and an
 * occurrence moved to another month must still suppress its generation even
 * when a filter would hide it.
 */
export interface ListScheduledTransactionsInPeriodQuery {
  execute(input: ListScheduledTransactionsInPeriodInput): Promise<Result<ScheduledTransactionDTO[]>>;
}
