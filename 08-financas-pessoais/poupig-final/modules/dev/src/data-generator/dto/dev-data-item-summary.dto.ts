/**
 * Outcome of one generated item (accounts, credit cards, transactions...).
 * `errors` holds the distinct error codes of the skipped records.
 * Shared by the summaries of both generator parts.
 */
export type DevDataItemSummaryDTO = {
  requested: number;
  created: number;
  skipped: number;
  errors: string[];
};
