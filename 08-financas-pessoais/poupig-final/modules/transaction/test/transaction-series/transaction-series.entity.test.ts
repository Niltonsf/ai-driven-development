import { Id } from '@poupig/shared';
import {
  DayOfWeek,
  Direction,
  FrequencyUnit,
  MAX_INSTALLMENTS,
  MovementErrors,
  RecurrenceRuleErrors,
  SeriesKind,
  TransactionSeries,
  TransactionSeriesErrors,
  TransactionSeriesProps,
} from '../../src';

const userId = Id.createUUID();
const accountId = Id.createUUID();

const monthlyOnTenth = { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 10 };
const weeklyOnMonday = { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.MONDAY };

function props(overrides: Record<string, unknown> = {}): TransactionSeriesProps {
  return {
    userId,
    name: 'Assinatura de streaming',
    value: 39.9,
    direction: Direction.OUT,
    accountId,
    kind: SeriesKind.CLOSED,
    recurrence: monthlyOnTenth,
    startDate: '2026-09-15',
    installments: 12,
    ...overrides,
  } as TransactionSeriesProps;
}

function errorsOf(overrides: Record<string, unknown>): string[] {
  const result = TransactionSeries.tryCreate(props(overrides));
  expect(result.isFailure).toBe(true);
  return result.errors;
}

describe('TransactionSeries — creation', () => {
  test('creates an installment plan with only the required fields', () => {
    const result = TransactionSeries.tryCreate(props());

    expect(result.isOk).toBe(true);
    const series = result.instance;
    expect(Id.tryCreate(series.id).isOk).toBe(true);
    expect(series.userId).toBe(userId);
    expect(series.name).toBe('Assinatura de streaming');
    expect(series.value).toBe(39.9);
    expect(series.direction).toBe(Direction.OUT);
    expect(series.accountId).toBe(accountId);
    expect(series.kind).toBe(SeriesKind.CLOSED);
    expect(series.recurrence).toEqual(monthlyOnTenth);
    expect(series.startDate).toBe('2026-09-15');
    expect(series.installments).toBe(12);
    expect(series.endDate).toBe('2027-09-10');
    expect(series.note).toBeNull();
    expect(series.creditCardId).toBeNull();
    expect(series.subcategoryId).toBeNull();
    expect(series.deletedAt).toBeNull();
    expect(series.createdAt).toBeInstanceOf(Date);
    expect(series.updatedAt).toBeInstanceOf(Date);
  });

  test('creates an endless recurrence with null end date and installments', () => {
    const result = TransactionSeries.tryCreate(
      props({ kind: SeriesKind.OPEN, recurrence: weeklyOnMonday, installments: undefined, endDate: undefined }),
    );

    expect(result.isOk).toBe(true);
    expect(result.instance.endDate).toBeNull();
    expect(result.instance.installments).toBeNull();
    expect(result.instance.recurrence).toEqual(weeklyOnMonday);
  });

  test('normalizes the rule, discarding the anchors of another unit', () => {
    const series = TransactionSeries.create(
      props({ recurrence: { unit: 'MONTH', interval: '1', dayOfMonth: '10', weekDay: 3, month: 7 } }),
    );

    expect(series.recurrence).toEqual({ unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 10 });
  });

  test('has no business uniqueness: two identical series of the same user coexist', () => {
    const first = TransactionSeries.tryCreate(props());
    const second = TransactionSeries.tryCreate(props());

    expect(first.isOk).toBe(true);
    expect(second.isOk).toBe(true);
    expect(first.instance.notEquals(second.instance)).toBe(true);
  });

  test('create throws when the props are invalid', () => {
    expect(() => TransactionSeries.create(props({ value: 0 }))).toThrow();
  });
});

describe('TransactionSeries — required fields', () => {
  test.each([0, -5, undefined])('rejects value %p with INVALID_MONEY_AMOUNT', (value) => {
    expect(errorsOf({ value })).toEqual(['INVALID_MONEY_AMOUNT']);
  });

  test.each(['INFLOW', 'in', undefined])('rejects direction %p with INVALID_DIRECTION', (direction) => {
    expect(errorsOf({ direction })).toEqual([MovementErrors.INVALID_DIRECTION]);
  });

  test.each(['INSTALLMENT', 'open', undefined])('rejects kind %p with INVALID_SERIES_KIND', (kind) => {
    expect(errorsOf({ kind })).toEqual([TransactionSeriesErrors.INVALID_SERIES_KIND]);
  });

  test('rejects an invalid recurrence with the codes of the rule', () => {
    expect(errorsOf({ recurrence: { unit: 'MONTH', interval: 0, dayOfMonth: 10 } })).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL,
    ]);
    expect(errorsOf({ recurrence: undefined })).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_FREQUENCY_UNIT,
      RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL,
    ]);
  });

  test.each(['2026-02-30', undefined, '', 'not-a-date'])(
    'rejects startDate %p with INVALID_TRANSACTION_SERIES_START_DATE',
    (startDate) => {
      expect(errorsOf({ startDate })).toEqual([TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_START_DATE]);
    },
  );

  test.each([undefined, null, '', 'abc'])(
    'rejects accountId %p with INVALID_TRANSACTION_SERIES_ACCOUNT_ID without generating an id',
    (invalidAccountId) => {
      expect(errorsOf({ accountId: invalidAccountId })).toEqual([
        TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_ACCOUNT_ID,
      ]);
    },
  );

  test('rejects a missing or short name with the MovementName code', () => {
    expect(errorsOf({ name: undefined })).toContain('MOVEMENT_NAME_TOO_SHORT');
    expect(errorsOf({ name: '' })).toContain('MOVEMENT_NAME_TOO_SHORT');
  });

  test('keeps INVALID_ID for malformed id and userId', () => {
    expect(errorsOf({ id: 'abc' })).toEqual(['INVALID_ID']);
    expect(errorsOf({ userId: 'abc' })).toEqual(['INVALID_ID']);
  });

  test('accumulates the errors of every invalid attribute without leaking generic codes', () => {
    const errors = errorsOf({
      name: 'A',
      value: 0,
      direction: 'INFLOW',
      accountId: '',
      startDate: '2026-02-30',
      kind: 'INSTALLMENT',
      creditCardId: 'abc',
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'MOVEMENT_NAME_TOO_SHORT',
        'INVALID_MONEY_AMOUNT',
        MovementErrors.INVALID_DIRECTION,
        TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_ACCOUNT_ID,
        TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_START_DATE,
        TransactionSeriesErrors.INVALID_SERIES_KIND,
        TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID,
      ]),
    );
    expect(errors).not.toContain('INVALID_ID');
    expect(errors).not.toContain('INVALID_DATE_ONLY');
  });
});

describe('TransactionSeries — optional fields', () => {
  test('stores absent optionals as null', () => {
    const series = TransactionSeries.create(
      props({ note: undefined, creditCardId: undefined, subcategoryId: undefined }),
    );

    expect(series.note).toBeNull();
    expect(series.creditCardId).toBeNull();
    expect(series.subcategoryId).toBeNull();
  });

  test('stores empty string optionals as null', () => {
    const result = TransactionSeries.tryCreate(props({ note: '', creditCardId: '', subcategoryId: '' }));

    expect(result.isOk).toBe(true);
    expect(result.instance.props.note).toBeNull();
    expect(result.instance.props.creditCardId).toBeNull();
    expect(result.instance.props.subcategoryId).toBeNull();
  });

  test('validates the filled optionals with their own codes', () => {
    expect(errorsOf({ creditCardId: 'abc' })).toEqual([
      TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID,
    ]);
    expect(errorsOf({ subcategoryId: 'abc' })).toEqual([
      TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID,
    ]);
    expect(errorsOf({ note: 'a'.repeat(501) })).toEqual(['MOVEMENT_NOTE_TOO_LONG']);
    expect(TransactionSeries.tryCreate(props({ note: 'a'.repeat(500) })).isOk).toBe(true);
  });
});

describe('TransactionSeries — CLOSED installment plan', () => {
  test('requires installments', () => {
    expect(errorsOf({ installments: undefined })).toEqual([
      TransactionSeriesErrors.TRANSACTION_SERIES_INSTALLMENTS_REQUIRED,
    ]);
    expect(errorsOf({ installments: null })).toEqual([
      TransactionSeriesErrors.TRANSACTION_SERIES_INSTALLMENTS_REQUIRED,
    ]);
  });

  test.each([0, 1.5, 481, -1])('rejects installments %p with its own code', (installments) => {
    expect(errorsOf({ installments })).toEqual([TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_INSTALLMENTS]);
  });

  test('accepts installments at the ceiling', () => {
    const result = TransactionSeries.tryCreate(props({ installments: MAX_INSTALLMENTS }));

    expect(result.isOk).toBe(true);
    expect(result.instance.installments).toBe(480);
    expect(MAX_INSTALLMENTS).toBe(480);
  });

  test('ignores the end date of the payload, calculating it from the rule', () => {
    const result = TransactionSeries.tryCreate(props({ endDate: '2030-01-01' }));

    expect(result.isOk).toBe(true);
    expect(result.instance.endDate).toBe('2027-09-10');
  });

  test('ignores a malformed end date without validating it', () => {
    const result = TransactionSeries.tryCreate(props({ endDate: '31/12/2026' }));

    expect(result.isOk).toBe(true);
    expect(result.instance.endDate).toBe('2027-09-10');
  });

  test('does not calculate the end date when the rule or the date are invalid', () => {
    expect(errorsOf({ startDate: '2026-02-30' })).toEqual([
      TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_START_DATE,
    ]);
  });
});

describe('TransactionSeries — OPEN recurrence', () => {
  function openProps(overrides: Record<string, unknown> = {}) {
    return props({ kind: SeriesKind.OPEN, installments: undefined, ...overrides });
  }

  test('discards the installments without validating them', () => {
    const result = TransactionSeries.tryCreate(openProps({ installments: 12 }));

    expect(result.isOk).toBe(true);
    expect(result.instance.installments).toBeNull();
  });

  test('discards installments that would be invalid in an installment plan', () => {
    const result = TransactionSeries.tryCreate(openProps({ installments: 999 }));

    expect(result.isOk).toBe(true);
    expect(result.instance.installments).toBeNull();
  });

  test('turns an absent or empty end date into null', () => {
    expect(TransactionSeries.create(openProps({ endDate: undefined })).endDate).toBeNull();
    expect(TransactionSeries.create(openProps({ endDate: '' })).endDate).toBeNull();
    expect(TransactionSeries.create(openProps({ endDate: null })).endDate).toBeNull();
  });

  test('rejects an end date before the first occurrence', () => {
    const result = TransactionSeries.tryCreate(
      openProps({ startDate: '2026-01-20', recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 15 }, endDate: '2026-02-01' }),
    );

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_END_DATE_BEFORE_START]);
  });

  test('accepts an end date equal to the first occurrence', () => {
    const result = TransactionSeries.tryCreate(
      openProps({ startDate: '2026-01-20', recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 15 }, endDate: '2026-02-15' }),
    );

    expect(result.isOk).toBe(true);
    expect(result.instance.endDate).toBe('2026-02-15');
  });

  test('rejects an invalid end date with its own code', () => {
    expect(errorsOf({ kind: SeriesKind.OPEN, installments: undefined, endDate: '2026-13-01' })).toEqual([
      TransactionSeriesErrors.INVALID_TRANSACTION_SERIES_END_DATE,
    ]);
  });

  test('does not compare the end date when the rule is invalid', () => {
    const errors = errorsOf({
      kind: SeriesKind.OPEN,
      installments: undefined,
      recurrence: { unit: 'MONTH', interval: 0, dayOfMonth: 15 },
      endDate: '2020-01-01',
    });

    expect(errors).toEqual([RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL]);
    expect(errors).not.toContain(TransactionSeriesErrors.TRANSACTION_SERIES_END_DATE_BEFORE_START);
  });
});

describe('TransactionSeries — derived instances', () => {
  test('reducing the installments recalculates the end date', () => {
    const series = TransactionSeries.create(props());
    expect(series.endDate).toBe('2027-09-10');

    const derived = series.cloneWith({ installments: 6 });

    expect(derived.isOk).toBe(true);
    expect(derived.instance.endDate).toBe('2027-03-10');
    expect(derived.instance.id).toBe(series.id);
  });

  test('an installment plan turning into a recurrence drops installments and end date', () => {
    const series = TransactionSeries.create(props());

    const derived = series.cloneWith({ kind: SeriesKind.OPEN, endDate: null });

    expect(derived.isOk).toBe(true);
    expect(derived.instance.installments).toBeNull();
    expect(derived.instance.endDate).toBeNull();
  });

  test('a derived instance re-applies the validation', () => {
    const series = TransactionSeries.create(props());

    const derived = series.cloneWith({ installments: null });

    expect(derived.isFailure).toBe(true);
    expect(derived.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_INSTALLMENTS_REQUIRED]);
  });

  test('changing the unit of the rule discards the anchor that stopped being valid', () => {
    const series = TransactionSeries.create(props());

    const derived = series.cloneWith({
      recurrence: { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.MONDAY },
    });

    expect(derived.isOk).toBe(true);
    expect(derived.instance.recurrence).toEqual({ unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.MONDAY });
    expect(derived.instance.recurrence).not.toHaveProperty('dayOfMonth');
  });
});

describe('TransactionSeries — soft delete and errors', () => {
  test('softDelete fills deletedAt and keeps the other attributes', () => {
    const series = TransactionSeries.create(props({ note: 'obs', creditCardId: Id.createUUID() }));

    const result = series.softDelete();

    expect(result.isOk).toBe(true);
    const deleted = result.instance;
    expect(deleted.deletedAt).toBeInstanceOf(Date);
    expect(series.deletedAt).toBeNull();
    expect(deleted.equals(series)).toBe(true);
    const { deletedAt: _deleted, ...deletedProps } = deleted.props;
    const { deletedAt: _original, ...originalProps } = series.props;
    expect(deletedProps).toEqual(originalProps);
  });

  test('TransactionSeriesErrors has exactly the ten aggregate codes, each equal to its key', () => {
    expect(Object.keys(TransactionSeriesErrors).sort()).toEqual(
      [
        'TRANSACTION_SERIES_NOT_FOUND',
        'INVALID_SERIES_KIND',
        'INVALID_TRANSACTION_SERIES_INSTALLMENTS',
        'INVALID_TRANSACTION_SERIES_ACCOUNT_ID',
        'INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID',
        'INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID',
        'INVALID_TRANSACTION_SERIES_START_DATE',
        'INVALID_TRANSACTION_SERIES_END_DATE',
        'TRANSACTION_SERIES_INSTALLMENTS_REQUIRED',
        'TRANSACTION_SERIES_END_DATE_BEFORE_START',
      ].sort(),
    );
    for (const [key, value] of Object.entries(TransactionSeriesErrors)) {
      expect(value).toBe(key);
    }
  });

  test('does not reuse the TRANSACTION_* codes of Transaction nor an already-exists code', () => {
    const keys = Object.keys(TransactionSeriesErrors);

    expect(keys).not.toContain('TRANSACTION_SERIES_ALREADY_EXISTS');
    expect(keys).not.toContain('TRANSACTION_NOT_FOUND');
    expect(keys).not.toContain('INVALID_TRANSACTION_ACCOUNT_ID');
  });
});
