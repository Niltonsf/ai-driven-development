/**
 * The only windows, in months, accepted by the cash flow report. The set is
 * closed so the cost of a request stays bounded (every active series is
 * generated in memory over the whole window) and so the consumers offer the
 * same choices the API accepts: nobody repeats this list.
 */
export const CASH_FLOW_WINDOWS = [6, 12, 18, 24] as const;

export type CashFlowWindow = (typeof CASH_FLOW_WINDOWS)[number];

/** Accepts only the numbers of `CASH_FLOW_WINDOWS`: numeric text is rejected, the input is not coerced. */
export function isCashFlowWindow(value: unknown): value is CashFlowWindow {
  return (CASH_FLOW_WINDOWS as readonly unknown[]).includes(value);
}
