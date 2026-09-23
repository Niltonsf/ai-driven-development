import { Id } from '@poupig/shared';
import { Direction, Transaction, TransactionErrors } from '../../src';
import { InMemoryTransactionRepository } from '../mock/in-memory-transaction.repository';

function buildTransaction() {
  return Transaction.create({
    userId: Id.createUUID(),
    name: 'Salário',
    value: 5000,
    direction: Direction.IN,
    accountId: Id.createUUID(),
    expectedOn: '2026-09-05',
  });
}

describe('TransactionRepository contract (in-memory)', () => {
  test('findById returns the active transaction', async () => {
    const repository = new InMemoryTransactionRepository();
    const transaction = buildTransaction();
    await repository.create(transaction);

    const result = await repository.findById(transaction.id);

    expect(result.isOk).toBe(true);
    expect(result.instance).toBe(transaction);
  });

  test('findById fails with TRANSACTION_NOT_FOUND for an id that does not exist', async () => {
    const repository = new InMemoryTransactionRepository();

    const result = await repository.findById(Id.createUUID());

    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
  });

  test('findById fails with TRANSACTION_NOT_FOUND for a soft deleted transaction', async () => {
    const repository = new InMemoryTransactionRepository();
    const transaction = buildTransaction();
    await repository.create(transaction.softDelete().instance);

    const result = await repository.findById(transaction.id);

    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
  });

  test('delete is logical', async () => {
    const repository = new InMemoryTransactionRepository();
    const transaction = buildTransaction();
    await repository.create(transaction);

    const result = await repository.delete(transaction.id);

    expect(result.isOk).toBe(true);
    expect(repository.stored(transaction.id)?.deletedAt).toBeInstanceOf(Date);
    expect((await repository.findById(transaction.id)).errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
  });
});
