import { Id } from '@poupig/shared';
import {
  Direction,
  MovementErrors,
  Transaction,
  TransactionErrors,
  TransactionProps,
  TransactionStatus,
} from '../../src';

const userId = Id.createUUID();
const accountId = Id.createUUID();

function props(overrides: Record<string, unknown> = {}): TransactionProps {
  return {
    userId,
    name: 'Mercado do mês',
    value: 250.5,
    direction: Direction.OUT,
    accountId,
    expectedOn: '2026-09-15',
    ...overrides,
  } as TransactionProps;
}

function errorsOf(overrides: Record<string, unknown>): string[] {
  const result = Transaction.tryCreate(props(overrides));
  expect(result.isFailure).toBe(true);
  return result.errors;
}

describe('Transaction — creation', () => {
  test('creates with only the required fields, generating id and applying defaults', () => {
    const result = Transaction.tryCreate(props());

    expect(result.isOk).toBe(true);
    const transaction = result.instance;
    expect(Id.tryCreate(transaction.id).isOk).toBe(true);
    expect(transaction.userId).toBe(userId);
    expect(transaction.name).toBe('Mercado do mês');
    expect(transaction.value).toBe(250.5);
    expect(transaction.direction).toBe(Direction.OUT);
    expect(transaction.accountId).toBe(accountId);
    expect(transaction.expectedOn).toBe('2026-09-15');
    expect(transaction.status).toBe(TransactionStatus.PENDING);
    expect(transaction.note).toBeNull();
    expect(transaction.creditCardId).toBeNull();
    expect(transaction.subcategoryId).toBeNull();
    expect(transaction.settledOn).toBeNull();
    expect(transaction.deletedAt).toBeNull();
    expect(transaction.createdAt).toBeInstanceOf(Date);
    expect(transaction.updatedAt).toBeInstanceOf(Date);
  });

  test('keeps the given id and normalizes name, ids and dates', () => {
    const id = Id.createUUID();
    const creditCardId = Id.createUUID();
    const subcategoryId = Id.createUUID();

    const transaction = Transaction.create(
      props({
        id: id.toUpperCase(),
        name: '  Aluguel  ',
        note: '  parcela única  ',
        accountId: accountId.toUpperCase(),
        creditCardId,
        subcategoryId,
        status: TransactionStatus.SETTLED,
        expectedOn: new Date('2026-09-15T10:00:00.000Z'),
        settledOn: '2026-09-16',
      }),
    );

    expect(transaction.id).toBe(id);
    expect(transaction.name).toBe('Aluguel');
    expect(transaction.note).toBe('parcela única');
    expect(transaction.accountId).toBe(accountId);
    expect(transaction.creditCardId).toBe(creditCardId);
    expect(transaction.subcategoryId).toBe(subcategoryId);
    expect(transaction.expectedOn).toBe('2026-09-15');
    expect(transaction.settledOn).toBe('2026-09-16');
  });

  test('rounds the value to two decimal places', () => {
    expect(Transaction.create(props({ value: 10.126 })).value).toBe(10.13);
    expect(Transaction.create(props({ value: 10.124 })).value).toBe(10.12);
  });

  test('accepts account and credit card at the same time', () => {
    const creditCardId = Id.createUUID();
    const result = Transaction.tryCreate(props({ creditCardId }));

    expect(result.isOk).toBe(true);
    expect(result.instance.accountId).toBe(accountId);
    expect(result.instance.creditCardId).toBe(creditCardId);
  });

  test('accepts IN direction and every valid status', () => {
    expect(Transaction.create(props({ direction: Direction.IN })).direction).toBe(Direction.IN);
    expect(Transaction.create(props({ status: TransactionStatus.PENDING })).status).toBe(TransactionStatus.PENDING);
    expect(Transaction.create(props({ status: TransactionStatus.CANCELED })).status).toBe(TransactionStatus.CANCELED);
    expect(
      Transaction.create(props({ status: TransactionStatus.SETTLED, settledOn: '2026-09-15' })).status,
    ).toBe(TransactionStatus.SETTLED);
  });

  test('create throws when the props are invalid', () => {
    expect(() => Transaction.create(props({ value: 0 }))).toThrow();
  });

  test('two identical transactions of the same user are both valid', () => {
    const first = Transaction.tryCreate(props());
    const second = Transaction.tryCreate(props());

    expect(first.isOk).toBe(true);
    expect(second.isOk).toBe(true);
    expect(first.instance.notEquals(second.instance)).toBe(true);
  });
});

describe('Transaction — required fields', () => {
  test('rejects a missing or short name with the MovementName code', () => {
    expect(errorsOf({ name: undefined })).toContain('MOVEMENT_NAME_TOO_SHORT');
    expect(errorsOf({ name: '' })).toContain('MOVEMENT_NAME_TOO_SHORT');
    expect(errorsOf({ name: 'A' })).toContain('MOVEMENT_NAME_TOO_SHORT');
  });

  test.each([0, -5, undefined, 0.004])('rejects value %p with INVALID_MONEY_AMOUNT', (value) => {
    expect(errorsOf({ value })).toEqual(['INVALID_MONEY_AMOUNT']);
  });

  test.each(['INFLOW', 'OUTFLOW', 'in', undefined])('rejects direction %p with INVALID_DIRECTION', (direction) => {
    expect(errorsOf({ direction })).toEqual([MovementErrors.INVALID_DIRECTION]);
  });

  test.each(['COMPLETED', 'settled', 'INFLOW'])('rejects status %p with INVALID_TRANSACTION_STATUS', (status) => {
    expect(errorsOf({ status })).toEqual([MovementErrors.INVALID_TRANSACTION_STATUS]);
  });

  test.each(['2026-02-30', undefined, '', 'not-a-date'])(
    'rejects expectedOn %p with INVALID_TRANSACTION_EXPECTED_ON',
    (expectedOn) => {
      expect(errorsOf({ expectedOn })).toEqual([TransactionErrors.INVALID_TRANSACTION_EXPECTED_ON]);
    },
  );

  test.each([undefined, null, '', 'abc'])(
    'rejects accountId %p with INVALID_TRANSACTION_ACCOUNT_ID without generating an id',
    (invalidAccountId) => {
      expect(errorsOf({ accountId: invalidAccountId })).toEqual([TransactionErrors.INVALID_TRANSACTION_ACCOUNT_ID]);
    },
  );

  test('keeps INVALID_ID for malformed id and userId', () => {
    expect(errorsOf({ id: 'abc' })).toEqual(['INVALID_ID']);
    expect(errorsOf({ userId: 'abc' })).toEqual(['INVALID_ID']);
  });

  test('accumulates the errors of every invalid attribute', () => {
    const errors = errorsOf({
      name: 'A',
      value: 0,
      direction: 'INFLOW',
      accountId: '',
      expectedOn: '2026-02-30',
      creditCardId: 'abc',
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'MOVEMENT_NAME_TOO_SHORT',
        'INVALID_MONEY_AMOUNT',
        MovementErrors.INVALID_DIRECTION,
        TransactionErrors.INVALID_TRANSACTION_ACCOUNT_ID,
        TransactionErrors.INVALID_TRANSACTION_EXPECTED_ON,
        TransactionErrors.INVALID_TRANSACTION_CREDIT_CARD_ID,
      ]),
    );
    expect(errors).not.toContain('INVALID_ID');
    expect(errors).not.toContain('INVALID_DATE_ONLY');
  });
});

describe('Transaction — optional fields', () => {
  test('stores absent optionals as null', () => {
    const transaction = Transaction.create(
      props({ note: undefined, creditCardId: undefined, subcategoryId: undefined, settledOn: undefined }),
    );

    expect(transaction.note).toBeNull();
    expect(transaction.creditCardId).toBeNull();
    expect(transaction.subcategoryId).toBeNull();
    expect(transaction.settledOn).toBeNull();
    expect(transaction.props.note).toBeNull();
    expect(transaction.props.creditCardId).toBeNull();
    expect(transaction.props.subcategoryId).toBeNull();
    expect(transaction.props.settledOn).toBeNull();
  });

  test('stores empty string optionals as null', () => {
    const result = Transaction.tryCreate(props({ note: '', creditCardId: '', subcategoryId: '', settledOn: '' }));

    expect(result.isOk).toBe(true);
    expect(result.instance.props.note).toBeNull();
    expect(result.instance.props.creditCardId).toBeNull();
    expect(result.instance.props.subcategoryId).toBeNull();
    expect(result.instance.props.settledOn).toBeNull();
  });

  test('rejects a malformed creditCardId with its own code', () => {
    expect(errorsOf({ creditCardId: 'abc' })).toEqual([TransactionErrors.INVALID_TRANSACTION_CREDIT_CARD_ID]);
  });

  test('rejects a malformed subcategoryId with its own code', () => {
    expect(errorsOf({ subcategoryId: 'abc' })).toEqual([TransactionErrors.INVALID_TRANSACTION_SUBCATEGORY_ID]);
  });

  test('rejects an invalid settledOn with its own code', () => {
    expect(errorsOf({ status: TransactionStatus.SETTLED, settledOn: '31/12/2026' })).toEqual([
      TransactionErrors.INVALID_TRANSACTION_SETTLED_ON,
    ]);
  });

  test('rejects a note longer than 500 characters', () => {
    expect(errorsOf({ note: 'a'.repeat(501) })).toEqual(['MOVEMENT_NOTE_TOO_LONG']);
    expect(Transaction.tryCreate(props({ note: 'a'.repeat(500) })).isOk).toBe(true);
  });
});

describe('Transaction — status and settledOn', () => {
  test('requires settledOn when SETTLED', () => {
    expect(errorsOf({ status: TransactionStatus.SETTLED })).toEqual([
      TransactionErrors.TRANSACTION_SETTLED_ON_REQUIRED,
    ]);
    expect(errorsOf({ status: TransactionStatus.SETTLED, settledOn: '' })).toEqual([
      TransactionErrors.TRANSACTION_SETTLED_ON_REQUIRED,
    ]);
  });

  test.each([TransactionStatus.PENDING, TransactionStatus.CANCELED, undefined])(
    'discards settledOn when status is %p',
    (status) => {
      const result = Transaction.tryCreate(props({ status, settledOn: '2026-09-10' }));

      expect(result.isOk).toBe(true);
      expect(result.instance.settledOn).toBeNull();
      expect(result.instance.props.settledOn).toBeNull();
    },
  );

  test('accepts settledOn before expectedOn, preserving both dates', () => {
    const result = Transaction.tryCreate(
      props({ status: TransactionStatus.SETTLED, expectedOn: '2026-09-20', settledOn: '2026-09-10' }),
    );

    expect(result.isOk).toBe(true);
    expect(result.instance.expectedOn).toBe('2026-09-20');
    expect(result.instance.settledOn).toBe('2026-09-10');
  });

  test('cloneWith re-applies the invariants', () => {
    const settled = Transaction.create(props({ status: TransactionStatus.SETTLED, settledOn: '2026-09-10' }));

    const pending = settled.cloneWith({ status: TransactionStatus.PENDING });
    expect(pending.isOk).toBe(true);
    expect(pending.instance.id).toBe(settled.id);
    expect(pending.instance.settledOn).toBeNull();

    const withoutDate = settled.cloneWith({ settledOn: null });
    expect(withoutDate.isFailure).toBe(true);
    expect(withoutDate.errors).toEqual([TransactionErrors.TRANSACTION_SETTLED_ON_REQUIRED]);
  });
});

describe('Transaction — soft delete and errors', () => {
  test('softDelete fills deletedAt and keeps the other attributes', () => {
    const transaction = Transaction.create(
      props({ note: 'obs', creditCardId: Id.createUUID(), status: TransactionStatus.SETTLED, settledOn: '2026-09-14' }),
    );

    const result = transaction.softDelete();

    expect(result.isOk).toBe(true);
    const deleted = result.instance;
    expect(deleted.deletedAt).toBeInstanceOf(Date);
    expect(transaction.deletedAt).toBeNull();
    expect(deleted.equals(transaction)).toBe(true);
    const { deletedAt: _deleted, ...deletedProps } = deleted.props;
    const { deletedAt: _original, ...originalProps } = transaction.props;
    expect(deletedProps).toEqual(originalProps);
  });

  test('TransactionErrors has exactly the seven aggregate codes, each equal to its key', () => {
    expect(Object.keys(TransactionErrors).sort()).toEqual(
      [
        'TRANSACTION_NOT_FOUND',
        'TRANSACTION_SETTLED_ON_REQUIRED',
        'INVALID_TRANSACTION_ACCOUNT_ID',
        'INVALID_TRANSACTION_CREDIT_CARD_ID',
        'INVALID_TRANSACTION_SUBCATEGORY_ID',
        'INVALID_TRANSACTION_EXPECTED_ON',
        'INVALID_TRANSACTION_SETTLED_ON',
      ].sort(),
    );
    for (const [key, value] of Object.entries(TransactionErrors)) {
      expect(value).toBe(key);
    }
  });
});
