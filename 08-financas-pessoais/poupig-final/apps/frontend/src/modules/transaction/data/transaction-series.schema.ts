import { DateOnly, Id, Money, PositiveInteger, Text } from '@poupig/shared';
import {
  MAX_INSTALLMENTS,
  MovementName,
  MovementNote,
  RecurrenceRuleErrors,
  RecurrenceScheduleCalculator,
  SeriesKind,
  TransactionSeriesErrors,
  tryCreateRecurrenceRule,
  type Direction,
  type FrequencyUnit,
} from '@poupig/transaction';
import { v } from '@/shared/components/form/validator';
import { getMessage } from '@/shared/i18n';

/**
 * The processed shape the refinements read. Every numeric field of the rule
 * travels as text, which is what a numeric input and a combobox produce and what
 * the domain rule already accepts.
 */
type TransactionSeriesRefinementData = {
  kind: string;
  unit: string;
  startDate: string | Date;
  endDate?: string | Date;
  interval?: string;
  weekDay?: string;
  dayOfMonth?: string;
  month?: string;
  installments?: string;
};

/** The processed value of `DateOnly` is always the `YYYY-MM-DD` text; the VO also admits a `Date`. */
function toDateOnlyText(value?: string | Date): string {
  return typeof value === 'string' ? value : '';
}

/**
 * The codes the domain rule accumulates for the current values. The rule ignores
 * the anchors of the other units, so a hidden field never produces a code.
 */
function ruleErrors(data: TransactionSeriesRefinementData): string[] {
  return tryCreateRecurrenceRule(data).errors ?? [];
}

function hasRuleError(data: TransactionSeriesRefinementData, code: string): boolean {
  return ruleErrors(data).includes(code);
}

/** A filled number of installments that the entity would accept. */
function isValidInstallments(value: string): boolean {
  const parsed = PositiveInteger.tryCreate(Number(value.trim()));
  return parsed.isOk && parsed.instance.value <= MAX_INSTALLMENTS;
}

/**
 * The end date of a recurrence cannot fall before the first occurrence. An
 * incomplete rule or start date is not judged here: each one already carries its
 * own message in its own field.
 */
function isEndDateOnOrAfterFirstOccurrence(data: TransactionSeriesRefinementData): boolean {
  if (data.kind !== SeriesKind.OPEN) return true;

  const endDate = toDateOnlyText(data.endDate);
  const startDate = toDateOnlyText(data.startDate);
  if (!endDate || !startDate) return true;

  const rule = tryCreateRecurrenceRule(data);
  if (rule.isFailure) return true;

  return endDate >= RecurrenceScheduleCalculator.firstOccurrence(startDate, rule.instance);
}

/**
 * `direction`, `kind` and `unit` are not Value Objects: they are declared as
 * `Text` only so the resolver hands them to the refinements and to the submit
 * handler (undeclared fields are dropped). The form controls only produce enum
 * values and the domain still rejects anything else.
 *
 * `interval`, `weekDay`, `dayOfMonth`, `month` and `installments` are `Text` on
 * purpose: no numeric field fails at field level, so every message comes from a
 * refinement with a domain code and a field hidden by the frequency or by the
 * kind never blocks the submit.
 *
 * `accountId` uses `Text`, not `Id`: `Id.tryCreate` turns an empty value into a
 * fresh uuid, which would let a missing account through.
 */
export const transactionSeriesSchema = v
  .defineObject({
    name: MovementName,
    note: { vo: MovementNote, optional: true },
    value: Money,
    direction: Text,
    accountId: Text,
    creditCardId: { vo: Id, optional: true },
    subcategoryId: { vo: Id, optional: true },
    kind: Text,
    startDate: DateOnly,
    unit: Text,
    interval: { vo: Text, optional: true },
    weekDay: { vo: Text, optional: true },
    dayOfMonth: { vo: Text, optional: true },
    month: { vo: Text, optional: true },
    installments: { vo: Text, optional: true },
    endDate: { vo: DateOnly, optional: true },
  })
  // The validator shows refinement messages as they are, so the text is translated here.
  .refine((data) => !hasRuleError(data, RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL), {
    field: 'interval',
    message: getMessage(RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL),
  })
  .refine((data) => !hasRuleError(data, RecurrenceRuleErrors.INVALID_RECURRENCE_WEEK_DAY), {
    field: 'weekDay',
    message: getMessage(RecurrenceRuleErrors.INVALID_RECURRENCE_WEEK_DAY),
  })
  .refine((data) => !hasRuleError(data, RecurrenceRuleErrors.INVALID_RECURRENCE_DAY_OF_MONTH), {
    field: 'dayOfMonth',
    message: getMessage(RecurrenceRuleErrors.INVALID_RECURRENCE_DAY_OF_MONTH),
  })
  .refine((data) => !hasRuleError(data, RecurrenceRuleErrors.INVALID_RECURRENCE_MONTH), {
    field: 'month',
    message: getMessage(RecurrenceRuleErrors.INVALID_RECURRENCE_MONTH),
  })
  .refine((data) => data.kind !== SeriesKind.CLOSED || Boolean(data.installments), {
    field: 'installments',
    message: getMessage(TransactionSeriesErrors.TRANSACTION_SERIES_INSTALLMENTS_REQUIRED),
  })
  .refine((data) => data.kind !== SeriesKind.CLOSED || !data.installments || isValidInstallments(data.installments), {
    field: 'installments',
    message: getMessage(TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_INSTALLMENTS),
  })
  .refine(isEndDateOnOrAfterFirstOccurrence, {
    field: 'endDate',
    message: getMessage(TransactionSeriesErrors.TRANSACTION_SERIES_END_DATE_BEFORE_START),
  });

/**
 * Narrows the transport fields to the domain enums. The dates are narrowed to
 * `string` as well: `DateOnly` also accepts `Date`, but the form only handles
 * `YYYY-MM-DD` strings.
 */
export type TransactionSeriesFormData = Omit<
  v.infer<typeof transactionSeriesSchema>,
  'direction' | 'kind' | 'unit' | 'startDate' | 'endDate'
> & {
  direction: Direction;
  kind: SeriesKind;
  unit: FrequencyUnit;
  startDate: string;
  endDate?: string;
};
