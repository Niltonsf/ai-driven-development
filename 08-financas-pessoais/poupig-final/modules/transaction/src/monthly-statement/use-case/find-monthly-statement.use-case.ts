import { DateOnly, PaginatedResultDTO, Result, UseCase } from '@poupig/shared';
import { ScheduledTransactionDTO, ScheduledTransactionGenerator } from '../../scheduled-transaction';
import { ListScheduledTransactionsInPeriodQuery } from '../../scheduled-transaction/provider';
import { ListTransactionsQuery } from '../../transaction/provider';
import { ListActiveTransactionSeriesQuery } from '../../transaction-series/provider';
import { StatementEntryDTO } from '../dto';
import { StatementEntryMapper, StatementFilterPolicy, StatementFilters } from '../model';

/**
 * Highest number of entries returned by one statement. The statement is not
 * paginated — it merges stored rows with occurrences that do not exist in
 * storage — so this ceiling keeps a month request from turning into a dump. It
 * is a wide margin for a real month; the excess is dropped after sorting,
 * without any extra signal in the response.
 */
export const STATEMENT_MAX_ENTRIES = 500;

export const FindMonthlyStatementErrors = {
  INVALID_STATEMENT_PERIOD: 'INVALID_STATEMENT_PERIOD',
} as const;

/** Inclusive period, with both dates in the `YYYY-MM-DD` format, plus the optional filters. */
export interface FindMonthlyStatementInput extends StatementFilters {
  userId: string;
  from: string;
  to: string;
}

/**
 * The statement of a period: standalone transactions, stored occurrences and
 * occurrences generated from the active series, in a single list.
 *
 * - The standalone transactions are filtered in storage; the occurrences, in
 *   memory, by `StatementFilterPolicy`.
 * - A stored occurrence whose `occurrenceOn` is inside the period suppresses
 *   its generation, even when its `expectedOn` was moved out of the period and
 *   even when it does not match the filters.
 * - Sorted by `expectedOn` desc with a stable sort over
 *   `[standalone, stored, generated]`, and cut at `STATEMENT_MAX_ENTRIES`.
 */
export class FindMonthlyStatement implements UseCase<FindMonthlyStatementInput, PaginatedResultDTO<StatementEntryDTO>> {
  constructor(
    private readonly listTransactions: ListTransactionsQuery,
    private readonly listScheduledTransactionsInPeriod: ListScheduledTransactionsInPeriodQuery,
    private readonly listActiveTransactionSeries: ListActiveTransactionSeriesQuery,
  ) {}

  async execute(input: FindMonthlyStatementInput): Promise<Result<PaginatedResultDTO<StatementEntryDTO>>> {
    const { userId, from, to } = input;
    if (!FindMonthlyStatement.isValidPeriod(from, to)) {
      return Result.fail(FindMonthlyStatementErrors.INVALID_STATEMENT_PERIOD);
    }

    const filters: StatementFilters = {
      search: input.search,
      direction: input.direction,
      status: input.status,
      accountId: input.accountId,
      creditCardId: input.creditCardId,
      onlyCreditCard: input.onlyCreditCard,
    };

    const [transactionsResult, storedResult, seriesResult] = await Promise.all([
      this.listTransactions.execute({
        userId,
        page: 1,
        pageSize: STATEMENT_MAX_ENTRIES,
        expectedFrom: from,
        expectedTo: to,
        ...filters,
      }),
      this.listScheduledTransactionsInPeriod.execute({ userId, from, to }),
      this.listActiveTransactionSeries.execute({ userId, from, to }),
    ]);

    const queries = Result.combine([transactionsResult, storedResult, seriesResult]);
    if (queries.isFailure) return Result.fail(queries.errors!);

    const inPeriod = (date: string) => from <= date && date <= to;
    const stored = storedResult.instance;

    const shownStored = stored.filter((occurrence) => inPeriod(occurrence.expectedOn));
    const suppressed = new Set(
      stored
        .filter((occurrence) => inPeriod(occurrence.occurrenceOn))
        .map((occurrence) => FindMonthlyStatement.occurrenceKey(occurrence.seriesId, occurrence.occurrenceIndex)),
    );

    const generated: ScheduledTransactionDTO[] = seriesResult.instance.flatMap((series) =>
      ScheduledTransactionGenerator.generateForPeriod(series, { from, to }, (seriesId, occurrenceIndex) =>
        suppressed.has(FindMonthlyStatement.occurrenceKey(seriesId, occurrenceIndex)),
      ).map((occurrence) => ScheduledTransactionGenerator.toGeneratedDTO(occurrence, series)),
    );

    const matches = (entry: StatementEntryDTO) => StatementFilterPolicy.matches(entry, filters);

    // `Array.prototype.sort` is stable (ES2019): ties keep the concatenation order.
    const entries = [
      ...transactionsResult.instance.data.map(StatementEntryMapper.fromTransaction),
      ...shownStored.map(StatementEntryMapper.fromScheduled).filter(matches),
      ...generated.map(StatementEntryMapper.fromScheduled).filter(matches),
    ]
      .sort((left, right) => FindMonthlyStatement.compareExpectedOnDesc(left, right))
      .slice(0, STATEMENT_MAX_ENTRIES);

    return Result.ok({
      data: entries,
      meta: { page: 1, pageSize: STATEMENT_MAX_ENTRIES, total: entries.length, totalPages: 1 },
    });
  }

  /** Both dates valid, already in the `YYYY-MM-DD` format, and `from <= to`. */
  private static isValidPeriod(from: string, to: string): boolean {
    if (!from || !to) return false;

    const parsedFrom = DateOnly.tryCreate(from);
    const parsedTo = DateOnly.tryCreate(to);
    if (parsedFrom.isFailure || parsedTo.isFailure) return false;
    if (parsedFrom.instance.value !== from || parsedTo.instance.value !== to) return false;

    return from <= to;
  }

  private static occurrenceKey(seriesId: string, occurrenceIndex: number): string {
    return `${seriesId}:${occurrenceIndex}`;
  }

  /** `YYYY-MM-DD` sorts lexicographically, so the strings compare the dates. */
  private static compareExpectedOnDesc(left: StatementEntryDTO, right: StatementEntryDTO): number {
    if (left.expectedOn === right.expectedOn) return 0;
    return left.expectedOn > right.expectedOn ? -1 : 1;
  }
}
