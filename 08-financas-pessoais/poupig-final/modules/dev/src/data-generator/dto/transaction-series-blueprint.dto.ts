import { DirectionLiteral } from './transaction-blueprint.dto';

/** String literals of `SeriesKind` (`@poupig/transaction`), repeated on purpose: this module imports no other domain module. */
export type SeriesKindLiteral = 'OPEN' | 'CLOSED';

/** String literals of `FrequencyUnit` (`@poupig/transaction`), repeated on purpose: this module imports no other domain module. */
export type FrequencyUnitLiteral = 'WEEK' | 'MONTH' | 'YEAR';

/**
 * Recurrence rule of a planned series, compatible with `RecurrenceRuleInput`.
 * A plan carries `interval: 1` and **only** the anchors of its unit: `WEEK` has
 * `weekDay` (1..7); `MONTH` has `dayOfMonth`; `YEAR` has `month` and `dayOfMonth`.
 */
export type RecurrenceRuleBlueprint = {
  unit: FrequencyUnitLiteral;
  interval: number;
  weekDay?: number;
  dayOfMonth?: number;
  month?: number;
};

/**
 * Description of a transaction series to be created.
 *
 * Intentionally shaped like the `SaveTransactionSeries` input **without** `id`,
 * `userId` and `endDate`: the backend fills the owner, the id is generated on
 * creation and the end date of a `CLOSED` series is computed by the entity.
 * Enums come as string literals; if they ever diverge from the owning module,
 * the use case rejects the record and the code shows up in the summary.
 *
 * Positions replace ids, with the same names as in `TransactionBlueprint`, so
 * the backend resolves both kinds of blueprint the same way:
 * - `accountIndex` points into the user's existing accounts;
 * - `creditCardIndex` points into the user's credit cards, or is `null`;
 * - `categoryHint` is the exact name of a default subcategory, or `null`.
 *
 * `startDate` is `YYYY-MM-DD`; `value` is in reais with at most two decimals
 * (the installment, for a `CLOSED` series); `installments` is `null` for `OPEN`.
 */
export type TransactionSeriesBlueprint = {
  name: string;
  value: number;
  direction: DirectionLiteral;
  kind: SeriesKindLiteral;
  recurrence: RecurrenceRuleBlueprint;
  startDate: string;
  installments: number | null;
  note: string | null;
  categoryHint: string | null;
  accountIndex: number;
  creditCardIndex: number | null;
};
