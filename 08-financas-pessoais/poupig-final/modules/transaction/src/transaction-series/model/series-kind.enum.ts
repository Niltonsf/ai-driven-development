/**
 * Kind of a transaction series:
 *
 * - `CLOSED`: an installment plan, with a known number of installments and an
 *   end date derived from them.
 * - `OPEN`: a recurrence without a known number of occurrences and with an
 *   optional end date.
 */
export enum SeriesKind {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export function isSeriesKind(value: unknown): value is SeriesKind {
  return (Object.values(SeriesKind) as unknown[]).includes(value);
}
