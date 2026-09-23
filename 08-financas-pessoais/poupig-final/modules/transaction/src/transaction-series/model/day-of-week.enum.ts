/**
 * Week day in the ISO-8601 numbering, with the week starting on Monday:
 * `MONDAY = 1` … `SUNDAY = 7`.
 */
export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}

/**
 * `Object.values` is deliberately not used: a numeric enum also carries the
 * reverse mapping, so it would also approve the names (`'MONDAY'`). A numeric
 * string (`'1'`) is rejected as well — the conversion from form input happens
 * before, in the recurrence rule.
 */
export function isDayOfWeek(value: unknown): value is DayOfWeek {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 7;
}
