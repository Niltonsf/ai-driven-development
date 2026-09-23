import { Result } from '@poupig/shared';
import { TransactionSeriesDTO } from '../dto';

/** Inclusive period, with both dates in the `YYYY-MM-DD` format. */
export interface ListActiveTransactionSeriesInput {
  userId: string;
  from: string;
  to: string;
}

/**
 * Lists the series of the user that may have occurrences inside the period:
 * not soft deleted, with `startDate <= to` and with `endDate` null **or**
 * `endDate >= from`. It only selects the series — the occurrences are
 * calculated by the domain, never by the query.
 *
 * No pagination: the result is bounded by the active series of the user. The
 * order is deterministic (`startDate` asc). There is no use case for this
 * query; it feeds the monthly statement.
 */
export interface ListActiveTransactionSeriesQuery {
  execute(input: ListActiveTransactionSeriesInput): Promise<Result<TransactionSeriesDTO[]>>;
}
