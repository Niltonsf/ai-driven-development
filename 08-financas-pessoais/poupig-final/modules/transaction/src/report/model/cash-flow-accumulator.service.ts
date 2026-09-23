import { Direction } from '../../movement';
import { MonthlyCashFlowDTO } from '../dto';

interface CashFlowBucket {
  inflowCents: number;
  outflowCents: number;
}

/**
 * Accumulates the movements of a report window into one bucket per month.
 *
 * - Every month of the window starts at zero, so the result always has every
 *   month, whatever the sources bring.
 * - Values are added as integer cents: adding reais as floating point would
 *   drift (`0.1 + 0.2`), and the report sums thousands of values.
 * - A month outside the window is ignored without failing: the sources are
 *   filtered by period, and a stray row must not break the whole report.
 */
export class CashFlowAccumulator {
  private readonly buckets = new Map<string, CashFlowBucket>();

  constructor(monthKeys: readonly string[]) {
    for (const month of monthKeys) {
      this.buckets.set(month, { inflowCents: 0, outflowCents: 0 });
    }
  }

  /** Adds a positive value in reais to the month key `YYYY-MM`, on the side of its direction. */
  add(month: string, direction: Direction, value: number): void {
    const bucket = this.buckets.get(month);
    if (!bucket) return;

    const cents = Math.round(value * 100);
    if (direction === Direction.IN) {
      bucket.inflowCents += cents;
    } else {
      bucket.outflowCents += cents;
    }
  }

  /** One DTO per month, in the order of the keys, with `balance` and the values back in reais. */
  toDTOs(): MonthlyCashFlowDTO[] {
    return [...this.buckets.entries()].map(([month, { inflowCents, outflowCents }]) => ({
      month,
      inflow: inflowCents / 100,
      outflow: outflowCents / 100,
      balance: (inflowCents - outflowCents) / 100,
    }));
  }
}
