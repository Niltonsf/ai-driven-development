import { Result, UseCase } from '@poupig/shared';
import { ScheduledTransactionGenerator } from '../../scheduled-transaction/model';
import { ListMaterializedOccurrenceKeysQuery } from '../../scheduled-transaction/provider';
import { TransactionSeriesDTO } from '../../transaction-series/dto';
import { SeriesKind } from '../../transaction-series/model';
import { FindTransactionSeriesByIdQuery, ListActiveTransactionSeriesQuery } from '../../transaction-series/provider';
import { RecurrenceReportLineDTO } from '../dto';
import { CashFlowCalendar, isCashFlowWindow, RecurrenceAccumulator } from '../model';
import { SummarizeStoredRecurrenceOccurrencesQuery } from '../provider';
import { SummarizeMonthlyCashFlowErrors } from './summarize-monthly-cash-flow.use-case';

/**
 * Raw input of the report, as received by the API: the use case validates it.
 * `reference` is the last month of the window (`YYYY-MM`) and `months` the size
 * of the window, one of `CASH_FLOW_WINDOWS`.
 */
export interface SummarizeRecurrencesInput {
  userId: string;
  reference: string;
  months: number;
}

/**
 * How much each recurrence (a series of kind `OPEN`) moved in each month of a
 * window ending at the reference month: one line per recurrence, each one with
 * exactly one bucket per month, ascending.
 *
 * Each month of a recurrence sees exactly the occurrences of that series the
 * statement of that month sees:
 *
 * - the stored occurrences are summed per series and per month of `expectedOn`
 *   by storage, without `CANCELED`, only for `OPEN` series that are not soft
 *   deleted, with the value stored in them;
 * - a stored occurrence whose `occurrenceOn` is inside the window suppresses
 *   the generation of its pair `(seriesId, occurrenceIndex)` with **any**
 *   status — a canceled one must not come back as `PENDING` — even when its
 *   `expectedOn` was moved out of the window;
 * - the occurrences of the active `OPEN` series that are not stored are
 *   generated in memory with the same rule of the statement and added to the
 *   month of their `expectedOn` (always `PENDING`, so always summed, with the
 *   current value of the series).
 *
 * Every active `OPEN` series becomes a line, even when every month is zero. A
 * stored occurrence may have its `expectedOn` moved past the `endDate` of its
 * series, so a series that ended before the window can still have values inside
 * it: those series are read by id — usually none — and become lines too, or the
 * month would diverge from the statement. Installment plans (`CLOSED`) are
 * discarded before anything is generated or summed.
 *
 * The window (`CASH_FLOW_WINDOWS`), the month arithmetic (`CashFlowCalendar`)
 * and the error codes (`SummarizeMonthlyCashFlowErrors`) are the ones of the
 * cash flow report: both reports live in the same folder and accept the same
 * input, and a second definition of the same rule would drift. The `CashFlow`
 * names stay as they are. The report stores nothing.
 */
export class SummarizeRecurrences implements UseCase<SummarizeRecurrencesInput, RecurrenceReportLineDTO[]> {
  constructor(
    private readonly summarizeStoredRecurrenceOccurrences: SummarizeStoredRecurrenceOccurrencesQuery,
    private readonly listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery,
    private readonly listActiveTransactionSeries: ListActiveTransactionSeriesQuery,
    private readonly findTransactionSeriesById: FindTransactionSeriesByIdQuery,
  ) {}

  async execute(input: SummarizeRecurrencesInput): Promise<Result<RecurrenceReportLineDTO[]>> {
    const { userId, reference, months } = input;
    if (!CashFlowCalendar.isValidReference(reference)) {
      return Result.fail(SummarizeMonthlyCashFlowErrors.INVALID_REPORT_REFERENCE);
    }
    if (!isCashFlowWindow(months)) {
      return Result.fail(SummarizeMonthlyCashFlowErrors.INVALID_REPORT_WINDOW);
    }

    const { from, to, monthKeys } = CashFlowCalendar.periodOf(reference, months);

    const [storedResult, keysResult, seriesResult] = await Promise.all([
      this.summarizeStoredRecurrenceOccurrences.execute({ userId, from, to }),
      this.listMaterializedOccurrenceKeys.execute({ userId, from, to }),
      this.listActiveTransactionSeries.execute({ userId, from, to }),
    ]);

    const queries = Result.combine([storedResult, keysResult, seriesResult]);
    if (queries.isFailure) return Result.fail(queries.errors!);

    const accumulator = new RecurrenceAccumulator(monthKeys);

    // Every series of the list is known, so a stored total of a listed
    // `CLOSED` series is discarded without reading it again.
    const listed = new Map(seriesResult.instance.map((series) => [series.id, series]));
    const recurrences = seriesResult.instance.filter((series) => series.kind === SeriesKind.OPEN);
    for (const series of recurrences) {
      accumulator.register(series);
    }

    const missingIds = [
      ...new Set(storedResult.instance.map((row) => row.seriesId).filter((seriesId) => !listed.has(seriesId))),
    ];
    const missingResults = await Promise.all(
      missingIds.map((seriesId) => this.findTransactionSeriesById.execute(seriesId, userId)),
    );

    const missing = Result.combine(missingResults);
    if (missing.isFailure) return Result.fail(missing.errors!);

    const byId = new Map<string, TransactionSeriesDTO>();
    for (const series of [...listed.values(), ...missingResults.map((result) => result.instance)]) {
      if (series?.kind === SeriesKind.OPEN) byId.set(series.id, series);
    }

    for (const row of storedResult.instance) {
      const series = byId.get(row.seriesId);
      if (series) accumulator.add(series, row.month, row.total);
    }

    const suppressed = new Set(
      keysResult.instance.map((key) => SummarizeRecurrences.occurrenceKey(key.seriesId, key.occurrenceIndex)),
    );

    for (const series of recurrences) {
      const generated = ScheduledTransactionGenerator.generateForPeriod(
        series,
        { from, to },
        (seriesId, occurrenceIndex) => suppressed.has(SummarizeRecurrences.occurrenceKey(seriesId, occurrenceIndex)),
      );
      for (const occurrence of generated) {
        accumulator.add(series, CashFlowCalendar.monthKeyOf(occurrence.expectedOn), occurrence.value);
      }
    }

    return Result.ok(accumulator.toDTOs());
  }

  private static occurrenceKey(seriesId: string, occurrenceIndex: number): string {
    return `${seriesId}:${occurrenceIndex}`;
  }
}
