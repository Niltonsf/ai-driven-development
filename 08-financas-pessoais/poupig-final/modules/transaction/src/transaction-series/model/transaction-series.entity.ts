import { DateOnly, Entity, EntityProps, Id, Money, PositiveInteger, Result } from '@poupig/shared';
import { Direction, isDirection, MovementErrors, MovementName, MovementNote } from '../../movement';
import { RecurrenceScheduleCalculator } from './recurrence-schedule-calculator.service';
import { RecurrenceRule, RecurrenceRuleInput, tryCreateRecurrenceRule } from './recurrence-rule';
import { isSeriesKind, SeriesKind } from './series-kind.enum';

/** Highest accepted number of installments, to bound the future generation. */
export const MAX_INSTALLMENTS = 480;

export interface TransactionSeriesProps extends EntityProps {
  userId: string;
  name: string;
  note?: string | null;
  value: number;
  direction: Direction;
  accountId: string;
  creditCardId?: string | null;
  subcategoryId?: string | null;
  kind: SeriesKind;
  recurrence: RecurrenceRuleInput;
  startDate: string;
  endDate?: string | null;
  installments?: number | null;
}

export const TransactionSeriesErrors = {
  TRANSACTION_SERIES_NOT_FOUND: 'TRANSACTION_SERIES_NOT_FOUND',
  INVALID_SERIES_KIND: 'INVALID_SERIES_KIND',
  INVALID_TRANSACTION_SERIES_INSTALLMENTS: 'INVALID_TRANSACTION_SERIES_INSTALLMENTS',
  INVALID_TRANSACTION_SERIES_ACCOUNT_ID: 'INVALID_TRANSACTION_SERIES_ACCOUNT_ID',
  INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID: 'INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID',
  INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID: 'INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID',
  INVALID_TRANSACTION_SERIES_START_DATE: 'INVALID_TRANSACTION_SERIES_START_DATE',
  INVALID_TRANSACTION_SERIES_END_DATE: 'INVALID_TRANSACTION_SERIES_END_DATE',
  TRANSACTION_SERIES_INSTALLMENTS_REQUIRED: 'TRANSACTION_SERIES_INSTALLMENTS_REQUIRED',
  TRANSACTION_SERIES_END_DATE_BEFORE_START: 'TRANSACTION_SERIES_END_DATE_BEFORE_START',
} as const;

/**
 * The template of an installment plan or of a recurrence of the user. The value
 * is always positive and the sense comes from `direction`; there is no status
 * and no settlement date, which belong to each generated occurrence.
 */
export class TransactionSeries extends Entity<TransactionSeries, TransactionSeriesProps> {
  private constructor(props: TransactionSeriesProps) {
    super(props);
  }

  static create(props: TransactionSeriesProps): TransactionSeries {
    const result = TransactionSeries.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: TransactionSeriesProps): Result<TransactionSeries> {
    const id = Id.tryCreate(props.id);
    const userId = Id.tryCreate(props.userId, { attribute: 'userId' });
    const name = MovementName.tryCreate(props.name);
    const value = Money.tryCreate(props.value);
    // `Id` generates a new uuid for an empty value, so a missing account must be rejected before it.
    const accountId = props.accountId ? Id.tryCreate(props.accountId, { attribute: 'accountId' }) : undefined;
    const startDate = DateOnly.tryCreate(props.startDate);
    const recurrence = tryCreateRecurrenceRule(props.recurrence ?? {});

    const results: Result<unknown>[] = [id, userId, name, value];

    if (!isDirection(props.direction)) {
      results.push(Result.fail(MovementErrors.INVALID_DIRECTION));
    }

    if (!accountId || accountId.isFailure) {
      results.push(Result.fail(TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_ACCOUNT_ID));
    }

    if (startDate.isFailure) {
      results.push(Result.fail(TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_START_DATE));
    }

    if (!isSeriesKind(props.kind)) {
      results.push(Result.fail(TransactionSeriesErrors.INVALID_SERIES_KIND));
    }

    if (recurrence.isFailure) {
      // The codes of the rule travel as they came.
      results.push(Result.fail(recurrence.errors!));
    }

    const note = props.note ? MovementNote.tryCreate(props.note) : undefined;
    if (note) {
      results.push(note);
    }

    const creditCardId = props.creditCardId
      ? Id.tryCreate(props.creditCardId, { attribute: 'creditCardId' })
      : undefined;
    if (creditCardId?.isFailure) {
      results.push(Result.fail(TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID));
    }

    const subcategoryId = props.subcategoryId
      ? Id.tryCreate(props.subcategoryId, { attribute: 'subcategoryId' })
      : undefined;
    if (subcategoryId?.isFailure) {
      results.push(Result.fail(TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID));
    }

    // An invalid `kind` skips the rules of the kind: there is no way to know which one applies.
    let installments: number | null = null;
    if (props.kind === SeriesKind.CLOSED) {
      if (props.installments === undefined || props.installments === null) {
        results.push(Result.fail(TransactionSeriesErrors.TRANSACTION_SERIES_INSTALLMENTS_REQUIRED));
      } else {
        const parsed = PositiveInteger.tryCreate(props.installments);
        if (parsed.isFailure || parsed.instance.value > MAX_INSTALLMENTS) {
          results.push(Result.fail(TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_INSTALLMENTS));
        } else {
          installments = parsed.instance.value;
        }
      }
    }

    // In `OPEN`, `installments` is discarded without validation: the normalization
    // exists exactly for the form that switches kind, and rejecting a value that
    // will be thrown away protects nothing.
    let endDate: DateOnly | undefined;
    if (props.kind === SeriesKind.OPEN && props.endDate) {
      const parsed = DateOnly.tryCreate(props.endDate);
      if (parsed.isFailure) {
        results.push(Result.fail(TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_END_DATE));
      } else {
        endDate = parsed.instance;
      }
    }

    const combined = Result.combine(results);
    if (combined.isFailure) return Result.fail(combined.errors!);

    // Only now the invariants that depend on more than one attribute: running them
    // after the combine guarantees the calculation never receives invalid input.
    const rule = recurrence.instance;
    const start = startDate.instance.value;
    let resolvedEndDate: string | null = null;

    if (props.kind === SeriesKind.CLOSED) {
      // The end date is always the date of the last installment; any received one is ignored.
      resolvedEndDate = RecurrenceScheduleCalculator.lastOccurrence(start, rule, installments!);
    } else if (endDate) {
      const firstOccurrence = RecurrenceScheduleCalculator.firstOccurrence(start, rule);
      if (endDate.value < firstOccurrence) {
        return Result.fail(TransactionSeriesErrors.TRANSACTION_SERIES_END_DATE_BEFORE_START);
      }
      resolvedEndDate = endDate.value;
    }

    return Result.ok(
      new TransactionSeries({
        ...props,
        id: id.instance.value,
        userId: userId.instance.value,
        name: name.instance.value,
        note: note ? note.instance.value : null,
        value: value.instance.value,
        direction: props.direction,
        accountId: accountId!.instance.value,
        creditCardId: creditCardId ? creditCardId.instance.value : null,
        subcategoryId: subcategoryId ? subcategoryId.instance.value : null,
        kind: props.kind,
        recurrence: rule,
        startDate: start,
        endDate: resolvedEndDate,
        installments,
      }),
    );
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get note(): string | null {
    return this.props.note ?? null;
  }

  get value(): number {
    return this.props.value;
  }

  get direction(): Direction {
    return this.props.direction;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get creditCardId(): string | null {
    return this.props.creditCardId ?? null;
  }

  get subcategoryId(): string | null {
    return this.props.subcategoryId ?? null;
  }

  get kind(): SeriesKind {
    return this.props.kind;
  }

  /** `tryCreate` only stores the normalized rule, so the raw input never leaks. */
  get recurrence(): RecurrenceRule {
    return this.props.recurrence as RecurrenceRule;
  }

  get startDate(): string {
    return this.props.startDate;
  }

  get endDate(): string | null {
    return this.props.endDate ?? null;
  }

  get installments(): number | null {
    return this.props.installments ?? null;
  }

  softDelete(): Result<TransactionSeries> {
    return this.cloneWith({ deletedAt: new Date() });
  }
}
