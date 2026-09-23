/**
 * Generation period, every date in UTC as `YYYY-MM-DD`.
 * `from` is the first day of the oldest month and `to` the last day of the
 * current month (the current month is always included in full).
 */
export type DevDataPeriodDTO = {
  from: string;
  to: string;
  today: string;
};
