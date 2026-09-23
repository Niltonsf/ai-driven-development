import { Direction, isDirection, isTransactionStatus, MovementErrors, TransactionStatus } from '../../src';

describe('Direction', () => {
  test('has exactly IN and OUT with values equal to their keys', () => {
    expect(Object.entries(Direction)).toEqual([
      ['IN', 'IN'],
      ['OUT', 'OUT'],
    ]);
  });

  test('isDirection approves every enum value', () => {
    expect(isDirection('IN')).toBe(true);
    expect(isDirection('OUT')).toBe(true);
    expect(isDirection(Direction.IN)).toBe(true);
    expect(isDirection(Direction.OUT)).toBe(true);
  });

  test.each([['in'], ['out'], ['INFLOW'], ['OUTFLOW'], [''], [undefined], [null], [1]])(
    'isDirection rejects %p',
    (value) => {
      expect(isDirection(value)).toBe(false);
    },
  );
});

describe('TransactionStatus', () => {
  test('has exactly PENDING, SETTLED and CANCELED with values equal to their keys', () => {
    expect(Object.entries(TransactionStatus)).toEqual([
      ['PENDING', 'PENDING'],
      ['SETTLED', 'SETTLED'],
      ['CANCELED', 'CANCELED'],
    ]);
  });

  test('isTransactionStatus approves every enum value', () => {
    expect(isTransactionStatus('PENDING')).toBe(true);
    expect(isTransactionStatus('SETTLED')).toBe(true);
    expect(isTransactionStatus('CANCELED')).toBe(true);
  });

  test.each([['settled'], ['pending'], ['CANCELLED'], ['COMPLETED'], ['INFLOW'], [''], [undefined], [null], [0]])(
    'isTransactionStatus rejects %p',
    (value) => {
      expect(isTransactionStatus(value)).toBe(false);
    },
  );
});

describe('MovementErrors', () => {
  test('contains exactly the shared enum codes with values equal to their keys', () => {
    expect(MovementErrors).toEqual({
      INVALID_DIRECTION: 'INVALID_DIRECTION',
      INVALID_TRANSACTION_STATUS: 'INVALID_TRANSACTION_STATUS',
    });
  });
});
