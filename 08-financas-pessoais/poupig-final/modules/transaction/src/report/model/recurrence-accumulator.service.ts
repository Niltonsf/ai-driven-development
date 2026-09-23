import { Direction } from '../../movement';
import { TransactionSeriesDTO } from '../../transaction-series/dto';
import { RecurrenceReportLineDTO } from '../dto';

interface RecurrenceLine {
  series: TransactionSeriesDTO;
  cents: Map<string, number>;
}

/**
 * Accumulates the occurrences of a report window into one line per series, with
 * one bucket per month — the design of the `CashFlowAccumulator`, with the
 * series as the first level key.
 *
 * - Every line starts with every month of the window at zero, so the result
 *   always has every month, whatever the sources bring.
 * - Values are added as integer cents: adding reais as floating point would
 *   drift (`0.1 + 0.2`).
 * - A month outside the window is ignored without failing: the sources are
 *   filtered by period, and a stray row must not break the whole report.
 */
export class RecurrenceAccumulator {
  private readonly lines = new Map<string, RecurrenceLine>();

  constructor(private readonly monthKeys: readonly string[]) {}

  /**
   * Guarantees the line of the series, even without any value: this is what
   * makes a recurrence without occurrence in the window appear. Calling it again
   * keeps the existing line.
   */
  register(series: TransactionSeriesDTO): void {
    this.lineOf(series);
  }

  /** Adds a positive value in reais to the month key `YYYY-MM` of the series, registering it when needed. */
  add(series: TransactionSeriesDTO, month: string, value: number): void {
    const { cents } = this.lineOf(series);
    const current = cents.get(month);
    if (current === undefined) return;

    cents.set(month, current + Math.round(value * 100));
  }

  /**
   * One DTO per series, with the months in the order of the keys, `total`
   * summed in cents, the values back in reais and the order of the response:
   * `IN` before `OUT`, then the name in Portuguese ignoring accents and case,
   * then the `seriesId`.
   */
  toDTOs(): RecurrenceReportLineDTO[] {
    return [...this.lines.values()]
      .sort((a, b) => RecurrenceAccumulator.compare(a.series, b.series))
      .map(({ series, cents }) => {
        const months = this.monthKeys.map((month) => ({ month, total: cents.get(month)! / 100 }));
        const totalCents = [...cents.values()].reduce((total, value) => total + value, 0);

        return {
          seriesId: series.id,
          name: series.name,
          direction: series.direction,
          value: series.value,
          recurrence: series.recurrence,
          accountName: series.accountName,
          creditCardName: series.creditCardName,
          categoryName: series.categoryName,
          subcategoryName: series.subcategoryName,
          startDate: series.startDate,
          endDate: series.endDate,
          total: totalCents / 100,
          months,
        };
      });
  }

  private lineOf(series: TransactionSeriesDTO): RecurrenceLine {
    const existing = this.lines.get(series.id);
    if (existing) return existing;

    const line = { series, cents: new Map(this.monthKeys.map((month) => [month, 0])) };
    this.lines.set(series.id, line);
    return line;
  }

  private static compare(a: TransactionSeriesDTO, b: TransactionSeriesDTO): number {
    if (a.direction !== b.direction) return a.direction === Direction.IN ? -1 : 1;

    const byName = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    if (byName !== 0) return byName;

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }
}
