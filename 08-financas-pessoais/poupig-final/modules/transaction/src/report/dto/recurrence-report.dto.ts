import { Direction } from '../../movement';
import { RecurrenceRule } from '../../transaction-series/model';

/** One month of a recurrence of the recurrence report: only the total, never the occurrences behind it. */
export type RecurrenceMonthTotalDTO = {
  /** Month key in the `YYYY-MM` format. */
  month: string;
  /**
   * Sum, in reais, always positive and with at most two decimals, of the
   * occurrences of the series whose `expectedOn` falls in the month: the stored
   * ones that are not `CANCELED` and the generated ones that are not stored yet.
   * `0` when the series has no occurrence in the month.
   */
  total: number;
};

/**
 * Read projection of one recurrence (a series of kind `OPEN`) of the recurrence
 * report: the identity of the series, as the table shows it, plus its total per
 * month of the window.
 *
 * Which series appear:
 *
 * - every `OPEN` series of the user that is not soft deleted and may have an
 *   occurrence in the window (`startDate` up to the end of the window and
 *   `endDate` absent or from the start of the window), **even when every month
 *   is zero** — an annual recurrence whose month is outside the window is still
 *   a registered recurrence, and hiding it would make the user look for a bug;
 * - an `OPEN` series outside that range that has a stored, not canceled
 *   occurrence whose `expectedOn` was moved into the window — without it the
 *   month would diverge from the statement.
 *
 * Installment plans (`CLOSED`), standalone transactions and soft deleted series
 * never appear.
 *
 * The report returns the lines with the inflows (`IN`) before the outflows
 * (`OUT`) and, inside a direction, by name in Portuguese alphabetical order,
 * ignoring accents and case, with the `seriesId` as a stable tie breaker. The
 * order never depends on the values, so a line keeps its place when the window
 * changes.
 */
export type RecurrenceReportLineDTO = {
  /** Id of the transaction series. */
  seriesId: string;
  /** Name of the series. */
  name: string;
  /** Direction of the series: every value of the line is positive and this field carries the sign. */
  direction: Direction;
  /**
   * The **current** value of the series, in reais — the one the generated
   * occurrences use —, and not an average of the months.
   */
  value: number;
  /** The recurrence rule of the series. */
  recurrence: RecurrenceRule;
  /** Name of the account of the series. */
  accountName: string;
  /** Name of the credit card of the series, `null` when absent. */
  creditCardName: string | null;
  /** Name of the category of the subcategory of the series, `null` when absent. */
  categoryName: string | null;
  /** Name of the subcategory of the series, `null` when absent. */
  subcategoryName: string | null;
  /** First day of the series, `YYYY-MM-DD`. */
  startDate: string;
  /** Last day of the series, `YYYY-MM-DD`, `null` when the recurrence has no end. */
  endDate: string | null;
  /**
   * Sum of `months`, in reais, always positive and with at most two decimals.
   * Calculated once, in integer cents, where the sums are made.
   */
  total: number;
  /**
   * Exactly one item per month of the window, ascending, ending at the
   * reference month, with `0` in a month without occurrence: the consumer never
   * fills gaps.
   */
  months: RecurrenceMonthTotalDTO[];
};
