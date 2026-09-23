import { Id } from '@poupig/shared';
import {
  Direction,
  MovementErrors,
  ScheduledTransaction,
  ScheduledTransactionErrors,
  ScheduledTransactionProps,
  TransactionStatus,
} from '../../src';

const userId = Id.createUUID();
const seriesId = Id.createUUID();
const accountId = Id.createUUID();

function props(overrides: Record<string, unknown> = {}): ScheduledTransactionProps {
  return {
    userId,
    seriesId,
    occurrenceIndex: 2,
    occurrenceOn: '2026-11-10',
    name: 'Notebook',
    value: 250,
    direction: Direction.OUT,
    accountId,
    expectedOn: '2026-11-10',
    ...overrides,
  } as ScheduledTransactionProps;
}

function errorsOf(overrides: Record<string, unknown>): string[] {
  const result = ScheduledTransaction.tryCreate(props(overrides));
  expect(result.isFailure).toBe(true);
  return result.errors;
}

describe('ScheduledTransaction — creation', () => {
  test('creates with only the required fields, generating id and applying defaults', () => {
    const result = ScheduledTransaction.tryCreate(props());

    expect(result.isOk).toBe(true);
    const occurrence = result.instance;
    expect(Id.tryCreate(occurrence.id).isOk).toBe(true);
    expect(occurrence.userId).toBe(userId);
    expect(occurrence.seriesId).toBe(seriesId);
    expect(occurrence.occurrenceIndex).toBe(2);
    expect(occurrence.occurrenceOn).toBe('2026-11-10');
    expect(occurrence.name).toBe('Notebook');
    expect(occurrence.value).toBe(250);
    expect(occurrence.direction).toBe(Direction.OUT);
    expect(occurrence.accountId).toBe(accountId);
    expect(occurrence.expectedOn).toBe('2026-11-10');
    expect(occurrence.status).toBe(TransactionStatus.PENDING);
    expect(occurrence.note).toBeNull();
    expect(occurrence.creditCardId).toBeNull();
    expect(occurrence.subcategoryId).toBeNull();
    expect(occurrence.settledOn).toBeNull();
    expect(occurrence.deletedAt).toBeNull();
    expect(occurrence.createdAt).toBeInstanceOf(Date);
    expect(occurrence.updatedAt).toBeInstanceOf(Date);
  });

  test('keeps the given id and normalizes ids and optionals', () => {
    const id = Id.createUUID();
    const creditCardId = Id.createUUID();
    const subcategoryId = Id.createUUID();

    const occurrence = ScheduledTransaction.create(
      props({
        id: id.toUpperCase(),
        seriesId: seriesId.toUpperCase(),
        accountId: accountId.toUpperCase(),
        note: '  parcela  ',
        creditCardId,
        subcategoryId,
        status: TransactionStatus.SETTLED,
        settledOn: '2026-11-11',
      }),
    );

    expect(occurrence.id).toBe(id);
    expect(occurrence.seriesId).toBe(seriesId);
    expect(occurrence.accountId).toBe(accountId);
    expect(occurrence.note).toBe('parcela');
    expect(occurrence.creditCardId).toBe(creditCardId);
    expect(occurrence.subcategoryId).toBe(subcategoryId);
    expect(occurrence.status).toBe(TransactionStatus.SETTLED);
    expect(occurrence.settledOn).toBe('2026-11-11');
  });

  test('accepts the first occurrence of the series (index 0)', () => {
    const result = ScheduledTransaction.tryCreate(props({ occurrenceIndex: 0 }));

    expect(result.isOk).toBe(true);
    expect(result.instance.occurrenceIndex).toBe(0);
  });

  test('accepts an expected date before the occurrence date', () => {
    const occurrence = ScheduledTransaction.create(props({ occurrenceOn: '2026-09-10', expectedOn: '2026-09-05' }));

    expect(occurrence.occurrenceOn).toBe('2026-09-10');
    expect(occurrence.expectedOn).toBe('2026-09-05');
  });

  test('accepts an expected date after the occurrence date', () => {
    const occurrence = ScheduledTransaction.create(props({ occurrenceOn: '2026-09-10', expectedOn: '2026-10-02' }));

    expect(occurrence.occurrenceOn).toBe('2026-09-10');
    expect(occurrence.expectedOn).toBe('2026-10-02');
  });

  test('create throws for invalid props', () => {
    expect(() => ScheduledTransaction.create(props({ value: 0 }))).toThrow();
  });
});

describe('ScheduledTransaction — required fields', () => {
  test.each([
    ['absent', undefined],
    ['empty', ''],
    ['malformed', 'abc'],
  ])('rejects a %s seriesId with its own code', (_, value) => {
    expect(errorsOf({ seriesId: value })).toEqual([ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_SERIES_ID]);
  });

  test.each([
    ['absent', undefined],
    ['empty', ''],
    ['malformed', 'abc'],
  ])('rejects a %s accountId with its own code', (_, value) => {
    expect(errorsOf({ accountId: value })).toEqual([ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_ACCOUNT_ID]);
  });

  test.each([
    ['absent', undefined],
    ['negative', -1],
    ['fractional', 1.5],
    ['numeric string', '2'],
  ])('rejects a %s occurrenceIndex', (_, value) => {
    expect(errorsOf({ occurrenceIndex: value })).toEqual([
      ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX,
    ]);
  });

  test.each([
    ['impossible', '2026-02-30'],
    ['absent', undefined],
  ])('rejects an %s occurrenceOn', (_, value) => {
    expect(errorsOf({ occurrenceOn: value })).toEqual([
      ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_ON,
    ]);
  });

  test('rejects an absent expectedOn', () => {
    expect(errorsOf({ expectedOn: undefined })).toEqual([
      ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_EXPECTED_ON,
    ]);
  });

  test('rejects a zero value with the money code', () => {
    expect(errorsOf({ value: 0 })).toEqual(['INVALID_MONEY_AMOUNT']);
  });

  test('rejects direction and status outside their sets', () => {
    expect(errorsOf({ direction: 'INFLOW', status: 'COMPLETED' })).toEqual([
      MovementErrors.INVALID_DIRECTION,
      MovementErrors.INVALID_TRANSACTION_STATUS,
    ]);
  });

  test('rejects an invalid name with the code of MovementName', () => {
    expect(errorsOf({ name: 'A' })).toEqual(['MOVEMENT_NAME_TOO_SHORT']);
  });

  test('keeps rejecting invalid id and userId with INVALID_ID', () => {
    expect(errorsOf({ id: 'abc', userId: 'abc' })).toEqual(['INVALID_ID', 'INVALID_ID']);
  });

  test('accumulates every attribute failure in a single response', () => {
    const errors = errorsOf({
      seriesId: '',
      occurrenceIndex: -1,
      occurrenceOn: undefined,
      expectedOn: undefined,
      accountId: '',
      value: 0,
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'INVALID_MONEY_AMOUNT',
        ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_SERIES_ID,
        ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX,
        ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_ON,
        ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_EXPECTED_ON,
        ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_ACCOUNT_ID,
      ]),
    );
    expect(errors).toHaveLength(6);
  });
});

describe('ScheduledTransaction — optional fields', () => {
  test('turns empty optionals into null', () => {
    const occurrence = ScheduledTransaction.create(props({ note: '', creditCardId: '', subcategoryId: '' }));

    expect(occurrence.note).toBeNull();
    expect(occurrence.creditCardId).toBeNull();
    expect(occurrence.subcategoryId).toBeNull();
  });

  test('rejects malformed credit card and subcategory with their own codes', () => {
    expect(errorsOf({ creditCardId: 'abc', subcategoryId: 'abc' })).toEqual([
      ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_CREDIT_CARD_ID,
      ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_SUBCATEGORY_ID,
    ]);
  });

  test('rejects a note that is too long', () => {
    expect(errorsOf({ note: 'a'.repeat(501) })).toEqual(['MOVEMENT_NOTE_TOO_LONG']);
  });

  test('rejects an invalid settlement date', () => {
    expect(errorsOf({ status: TransactionStatus.SETTLED, settledOn: '31/12/2026' })).toEqual([
      ScheduledTransactionErrors.INVALID_SCHEDULED_TRANSACTION_SETTLED_ON,
    ]);
  });
});

describe('ScheduledTransaction — status and settlement date', () => {
  test('requires the settlement date of a settled occurrence', () => {
    expect(errorsOf({ status: TransactionStatus.SETTLED })).toEqual([
      ScheduledTransactionErrors.SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED,
    ]);
  });

  test.each([TransactionStatus.PENDING, TransactionStatus.CANCELED])(
    'discards the settlement date of a %s occurrence',
    (status) => {
      const occurrence = ScheduledTransaction.create(props({ status, settledOn: '2026-09-10' }));

      expect(occurrence.status).toBe(status);
      expect(occurrence.settledOn).toBeNull();
    },
  );
});

describe('ScheduledTransaction — derivation', () => {
  test('settles by derivation keeping the identity of the occurrence', () => {
    const original = ScheduledTransaction.create(props());

    const result = original.cloneWith({ status: TransactionStatus.SETTLED, settledOn: '2026-09-10' });

    expect(result.isOk).toBe(true);
    const derived = result.instance;
    expect(derived.status).toBe(TransactionStatus.SETTLED);
    expect(derived.settledOn).toBe('2026-09-10');
    expect(derived.id).toBe(original.id);
    expect(derived.userId).toBe(original.userId);
    expect(derived.seriesId).toBe(original.seriesId);
    expect(derived.occurrenceIndex).toBe(original.occurrenceIndex);
    expect(derived.occurrenceOn).toBe(original.occurrenceOn);
    expect(derived.equals(original)).toBe(true);
  });

  test('revalidates the settlement invariant when deriving', () => {
    const original = ScheduledTransaction.create(props());

    const result = original.cloneWith({ status: TransactionStatus.SETTLED, settledOn: null });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([ScheduledTransactionErrors.SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED]);
  });
});

describe('ScheduledTransaction — no soft delete', () => {
  test('does not offer a soft delete operation', () => {
    const occurrence = ScheduledTransaction.create(props());

    expect('softDelete' in occurrence).toBe(false);
  });

  test('ScheduledTransactionErrors has exactly the ten codes, each equal to its name', () => {
    expect(ScheduledTransactionErrors).toEqual({
      SCHEDULED_TRANSACTION_NOT_FOUND: 'SCHEDULED_TRANSACTION_NOT_FOUND',
      SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED: 'SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED',
      INVALID_SCHEDULED_TRANSACTION_SERIES_ID: 'INVALID_SCHEDULED_TRANSACTION_SERIES_ID',
      INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX: 'INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX',
      INVALID_SCHEDULED_TRANSACTION_ACCOUNT_ID: 'INVALID_SCHEDULED_TRANSACTION_ACCOUNT_ID',
      INVALID_SCHEDULED_TRANSACTION_CREDIT_CARD_ID: 'INVALID_SCHEDULED_TRANSACTION_CREDIT_CARD_ID',
      INVALID_SCHEDULED_TRANSACTION_SUBCATEGORY_ID: 'INVALID_SCHEDULED_TRANSACTION_SUBCATEGORY_ID',
      INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_ON: 'INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_ON',
      INVALID_SCHEDULED_TRANSACTION_EXPECTED_ON: 'INVALID_SCHEDULED_TRANSACTION_EXPECTED_ON',
      INVALID_SCHEDULED_TRANSACTION_SETTLED_ON: 'INVALID_SCHEDULED_TRANSACTION_SETTLED_ON',
    });
  });
});
