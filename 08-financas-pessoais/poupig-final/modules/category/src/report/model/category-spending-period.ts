import { DateOnly } from '@poupig/shared';

/**
 * The longest period, in days counting both ends, accepted by the category
 * spending report.
 *
 * The ceiling exists so the cost of a request stays bounded: the stored rows
 * are scanned by date in SQL and every active series is generated in memory
 * over the whole period, as the closed set of windows of the cash flow report
 * does. `366` is one whole year, leap years included, which is more than the
 * screen ever asks (one month). Consumers read this constant instead of
 * repeating the number.
 */
export const CATEGORY_SPENDING_MAX_DAYS = 366;

const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Tells whether the raw `from`/`to` pair, as the API receives it, is a period
 * the report accepts:
 *
 * - both are texts in the exact `YYYY-MM-DD` format of an existing date:
 *   `DateOnly` rejects impossible dates, and comparing its normalized value
 *   with the input rejects any other format it would leniently accept;
 * - `from <= to`, compared as text, which is valid in the fixed format — an
 *   inverted period would answer an empty list, read as "nothing was spent";
 * - at most `CATEGORY_SPENDING_MAX_DAYS` days counting both ends, counted with
 *   `Date.UTC` over the parts of the texts, so it never depends on the time zone.
 */
export function isValidCategorySpendingPeriod(from: unknown, to: unknown): boolean {
  if (!isExactDateOnly(from) || !isExactDateOnly(to)) return false;
  if (from > to) return false;

  const days = (utcTimeOf(to) - utcTimeOf(from)) / MILLISECONDS_PER_DAY + 1;
  return days <= CATEGORY_SPENDING_MAX_DAYS;
}

function isExactDateOnly(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const parsed = DateOnly.tryCreate(value);
  return parsed.isOk && parsed.instance.value === value;
}

/** Midnight UTC of a date already approved as `YYYY-MM-DD`. */
function utcTimeOf(date: string): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(year, month - 1, day);
}
