/** String literals of `Direction` (`@poupig/transaction`), repeated on purpose: this module imports no other domain module. */
export type DirectionLiteral = 'IN' | 'OUT';

/**
 * String literals of the `TransactionStatus` values a plan produces. `CANCELED`
 * is never generated.
 */
export type PlannedTransactionStatusLiteral = 'PENDING' | 'SETTLED';

/**
 * Description of a one-off transaction to be created.
 *
 * Intentionally shaped like the `SaveTransaction` input **without** `id` and
 * `userId`, with positions in place of ids:
 * - `accountIndex` points into the accounts available to the run (existing + planned);
 * - `creditCardIndex` points into the available credit cards, or is `null`;
 * - `categoryHint` is the exact name of a default subcategory, or `null`.
 *
 * The backend is the only layer that knows both sides: it fills `userId` and
 * resolves positions and hints into ids against the lists it loaded.
 * Dates are `YYYY-MM-DD`; `value` is in reais with at most two decimals.
 */
export type TransactionBlueprint = {
  name: string;
  value: number;
  direction: DirectionLiteral;
  expectedOn: string;
  status: PlannedTransactionStatusLiteral;
  settledOn: string | null;
  note: string | null;
  categoryHint: string | null;
  accountIndex: number;
  creditCardIndex: number | null;
};
