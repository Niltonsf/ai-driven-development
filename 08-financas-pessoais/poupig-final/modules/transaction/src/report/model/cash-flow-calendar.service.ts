import { DateOnly } from '@poupig/shared';

/** The whole months of a report window. */
export interface CashFlowPeriod {
  /** First day of the oldest month, `YYYY-MM-DD`. */
  from: string;
  /** Last day of the reference month, `YYYY-MM-DD`. */
  to: string;
  /** The `YYYY-MM` keys of every month of the window, ascending, ending at the reference. */
  monthKeys: string[];
}

const REFERENCE_PATTERN = /^\d{4}-\d{2}$/;

/**
 * Month arithmetic of the cash flow report. Everything works on text and
 * integers — the only `Date` is built with `Date.UTC` and read in UTC — so the
 * result never depends on the time zone of the process.
 */
export class CashFlowCalendar {
  /**
   * A `YYYY-MM` text of an existing month. The pattern rejects a month without
   * the leading zero or a full date, and `DateOnly` rejects a month outside
   * `01`–`12`; comparing the normalized value guards against any leniency.
   */
  static isValidReference(value: unknown): value is string {
    if (typeof value !== 'string' || !REFERENCE_PATTERN.test(value)) return false;

    const firstDay = `${value}-01`;
    const parsed = DateOnly.tryCreate(firstDay);
    return parsed.isOk && parsed.instance.value === firstDay;
  }

  /**
   * The period of `months` whole months ending at the reference month,
   * inclusive. Expects a reference already approved by `isValidReference` and
   * a positive integer window.
   *
   * Months are walked by their absolute index (`year * 12 + month - 1`), which
   * turns the year boundary into plain integer arithmetic. Day `0` of the next
   * month in `Date.UTC` is the last day of the reference month, leap years included.
   */
  static periodOf(reference: string, months: number): CashFlowPeriod {
    const year = Number(reference.slice(0, 4));
    const month = Number(reference.slice(5, 7));
    const firstIndex = year * 12 + (month - 1) - (months - 1);

    const monthKeys = Array.from({ length: months }, (_, offset) => CashFlowCalendar.keyOfIndex(firstIndex + offset));

    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

    return {
      from: `${CashFlowCalendar.keyOfIndex(firstIndex)}-01`,
      to: `${reference}-${String(lastDay).padStart(2, '0')}`,
      monthKeys,
    };
  }

  /** The `YYYY-MM` key of a `YYYY-MM-DD` date: its first seven characters. */
  static monthKeyOf(date: string): string {
    return date.slice(0, 7);
  }

  private static keyOfIndex(index: number): string {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
  }
}
