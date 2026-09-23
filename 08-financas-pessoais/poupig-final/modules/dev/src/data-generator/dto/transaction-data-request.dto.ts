/**
 * Request of the one-off transaction data generator.
 * Each quantity is `0` when its item is not checked. `months` counts the
 * current month in full plus the previous `months - 1`. `seed` reproduces a
 * previous run; when absent, one is drawn and returned in the summary.
 */
export type TransactionDataRequestDTO = {
  accounts: number;
  creditCards: number;
  transactions: number;
  months: number;
  seed?: number;
};
