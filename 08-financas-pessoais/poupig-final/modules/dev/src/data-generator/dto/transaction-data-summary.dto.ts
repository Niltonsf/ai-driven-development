import { DevDataItemSummaryDTO } from './dev-data-item-summary.dto';

/** Response of a one-off transaction generation run, with the seed that was used. */
export type TransactionDataSummaryDTO = {
  accounts: DevDataItemSummaryDTO;
  creditCards: DevDataItemSummaryDTO;
  transactions: DevDataItemSummaryDTO;
  seed: number;
};
