import { Result, UseCase } from '@poupig/shared';
import { Direction } from '../../movement';
import { ScheduledTransactionGenerator } from '../../scheduled-transaction/model';
import { ListMaterializedOccurrenceKeysQuery } from '../../scheduled-transaction/provider';
import { ListActiveTransactionSeriesQuery } from '../../transaction-series/provider';
import { MonthlyCashFlowDTO } from '../dto';
import { CashFlowAccumulator, CashFlowCalendar, isCashFlowWindow } from '../model';
import { SummarizeStoredCashFlowQuery } from '../provider';

export const SummarizeMonthlyCashFlowErrors = {
  INVALID_REPORT_REFERENCE: 'INVALID_REPORT_REFERENCE',
  INVALID_REPORT_WINDOW: 'INVALID_REPORT_WINDOW',
} as const;

/**
 * Raw input of the report, as received by the API: the use case validates it.
 * `reference` is the last month of the window (`YYYY-MM`) and `months` the size
 * of the window, one of `CASH_FLOW_WINDOWS`.
 */
export interface SummarizeMonthlyCashFlowInput {
  userId: string;
  reference: string;
  months: number;
}

/**
 * The inflows and outflows of each month of a window ending at the reference
 * month, one bucket per month, ascending.
 *
 * Each month sees exactly what the statement of that month sees, without its
 * ceiling of entries:
 *
 * - the stored rows (standalone transactions and stored occurrences) are
 *   summed per month by storage, without `CANCELED` and ignoring soft deleted
 *   series;
 * - a stored occurrence whose `occurrenceOn` is inside the window suppresses
 *   the generation of its pair `(seriesId, occurrenceIndex)` with **any**
 *   status — a canceled one must not come back as `PENDING` — even when its
 *   `expectedOn` was moved out of the window;
 * - the occurrences of the active series that are not stored are generated in
 *   memory with the same rule of the statement and added to the month of their
 *   `expectedOn` (always `PENDING`, so always summed).
 *
 * Since the `occurrenceOn` of an index is fixed, suppressing over the whole
 * window is equivalent to suppressing month by month as the statement does.
 * The report stores nothing.
 */
export class SummarizeMonthlyCashFlow implements UseCase<SummarizeMonthlyCashFlowInput, MonthlyCashFlowDTO[]> {
  constructor(
    private readonly summarizeStoredCashFlow: SummarizeStoredCashFlowQuery,
    private readonly listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery,
    private readonly listActiveTransactionSeries: ListActiveTransactionSeriesQuery,
  ) {}

  async execute(input: SummarizeMonthlyCashFlowInput): Promise<Result<MonthlyCashFlowDTO[]>> {
    const { userId, reference, months } = input;
    if (!CashFlowCalendar.isValidReference(reference)) {
      return Result.fail(SummarizeMonthlyCashFlowErrors.INVALID_REPORT_REFERENCE);
    }
    if (!isCashFlowWindow(months)) {
      return Result.fail(SummarizeMonthlyCashFlowErrors.INVALID_REPORT_WINDOW);
    }

    const { from, to, monthKeys } = CashFlowCalendar.periodOf(reference, months);

    const [storedResult, keysResult, seriesResult] = await Promise.all([
      this.summarizeStoredCashFlow.execute({ userId, from, to }),
      this.listMaterializedOccurrenceKeys.execute({ userId, from, to }),
      this.listActiveTransactionSeries.execute({ userId, from, to }),
    ]);

    const queries = Result.combine([storedResult, keysResult, seriesResult]);
    if (queries.isFailure) return Result.fail(queries.errors!);

    const suppressed = new Set(
      keysResult.instance.map((key) => SummarizeMonthlyCashFlow.occurrenceKey(key.seriesId, key.occurrenceIndex)),
    );

    const accumulator = new CashFlowAccumulator(monthKeys);

    for (const row of storedResult.instance) {
      accumulator.add(row.month, Direction.IN, row.inflow);
      accumulator.add(row.month, Direction.OUT, row.outflow);
    }

    for (const series of seriesResult.instance) {
      const generated = ScheduledTransactionGenerator.generateForPeriod(
        series,
        { from, to },
        (seriesId, occurrenceIndex) =>
          suppressed.has(SummarizeMonthlyCashFlow.occurrenceKey(seriesId, occurrenceIndex)),
      );
      for (const occurrence of generated) {
        accumulator.add(CashFlowCalendar.monthKeyOf(occurrence.expectedOn), occurrence.direction, occurrence.value);
      }
    }

    return Result.ok(accumulator.toDTOs());
  }

  private static occurrenceKey(seriesId: string, occurrenceIndex: number): string {
    return `${seriesId}:${occurrenceIndex}`;
  }
}
