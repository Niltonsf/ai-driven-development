/**
 * Upper bounds of one data generation run.
 *
 * Each run is a single synchronous request that writes every record through the
 * owning use cases, one by one. These ceilings keep that request within seconds
 * and keep the development database usable. Backend (validation) and frontend
 * (form schema) read the same values from here instead of repeating the numbers.
 *
 * Two generators share this object:
 * - one-off transactions (part 1): accounts, credit cards and one-off transactions;
 * - series (part 2): recurrences and installment plans. Besides each series, the
 *   run writes every occurrence up to the end of the current month, so the
 *   series ceilings also bound that materialization (worst case, 12 months with
 *   20 + 20 series, around a thousand occurrences).
 */
export const DEV_DATA_LIMITS = {
  maxAccounts: 10,
  maxCreditCards: 10,
  maxTransactions: 500,
  maxMonths: 12,
  /** Open series per run; weekly ones write about 52 occurrences per year, so the count stays small. */
  maxRecurrences: 20,
  /** Closed series per run; each one writes at most its already due installments plus the current month. */
  maxInstallmentPlans: 20,
  /** Fewest installments a planned installment plan has: one installment would not be a plan. */
  minInstallments: 2,
  /** Most installments a planned installment plan has: covers common consumer plans without inflating the materialization. */
  maxInstallmentsPlanned: 24,
} as const;
