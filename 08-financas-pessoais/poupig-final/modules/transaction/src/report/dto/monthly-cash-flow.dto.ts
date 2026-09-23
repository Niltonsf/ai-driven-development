/**
 * Read projection of one month of the cash flow report: only the totals, never
 * the transactions behind them.
 *
 * The report always returns one DTO for every month of the window, in
 * ascending order, so a month without any movement is present with the three
 * values equal to `0` and the consumer never fills gaps.
 */
export type MonthlyCashFlowDTO = {
  /** Month key in the `YYYY-MM` format. */
  month: string;
  /** Sum of the inflows of the month, in reais, with at most two decimals. */
  inflow: number;
  /** Sum of the outflows of the month, in reais, always positive, with at most two decimals. */
  outflow: number;
  /** `inflow - outflow`, which is negative when more went out than came in. */
  balance: number;
};
