import { DevDataItemSummaryDTO } from './dev-data-item-summary.dto';

/**
 * Outcome of the occurrences written for the created series: `settled` (dated
 * before today), `pending` (from today to the end of the current month),
 * `skipped` (rejected) and the distinct error codes of the skipped ones.
 */
export type SeriesOccurrenceSummaryDTO = {
  settled: number;
  pending: number;
  skipped: number;
  errors: string[];
};

/** Response of a series generation run, with the seed that was used. */
export type SeriesDataSummaryDTO = {
  recurrences: DevDataItemSummaryDTO;
  installmentPlans: DevDataItemSummaryDTO;
  occurrences: SeriesOccurrenceSummaryDTO;
  seed: number;
};
