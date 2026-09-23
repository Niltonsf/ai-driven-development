/** Unit of the recurrence frequency: every rule repeats every N of these. */
export enum FrequencyUnit {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export function isFrequencyUnit(value: unknown): value is FrequencyUnit {
  return (Object.values(FrequencyUnit) as unknown[]).includes(value);
}
