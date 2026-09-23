import { Id, Result } from '@poupig/shared';
import {
  DeleteTransaction,
  Direction,
  Transaction,
  TransactionErrors,
  TransactionRepository,
} from '../../src';
import { InMemoryTransactionRepository } from '../mock/in-memory-transaction.repository';

const userId = Id.createUUID();
const otherUserId = Id.createUUID();

async function setup(ownerId = userId) {
  const repository = new InMemoryTransactionRepository();
  const transaction = Transaction.create({
    userId: ownerId,
    name: 'Aluguel',
    value: 1500,
    direction: Direction.OUT,
    accountId: Id.createUUID(),
    expectedOn: '2026-09-05',
  });
  await repository.create(transaction);
  return { repository, transaction, useCase: new DeleteTransaction(repository) };
}

describe('DeleteTransaction', () => {
  test('soft deletes the transaction, which then behaves as not found', async () => {
    const { repository, transaction, useCase } = await setup();

    const result = await useCase.execute({ id: transaction.id, userId });

    expect(result.isOk).toBe(true);
    const found = await repository.findById(transaction.id);
    expect(found.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
    const stored = repository.stored(transaction.id)!;
    expect(stored.deletedAt).toBeInstanceOf(Date);
    expect(stored.name).toBe('Aluguel');
  });

  test('fails with TRANSACTION_NOT_FOUND for a transaction of another user, keeping it active', async () => {
    const { repository, transaction, useCase } = await setup(otherUserId);

    const result = await useCase.execute({ id: transaction.id, userId });

    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
    const found = await repository.findById(transaction.id);
    expect(found.isOk).toBe(true);
    expect(found.instance.deletedAt).toBeNull();
  });

  test('fails with TRANSACTION_NOT_FOUND when deleting again', async () => {
    const { transaction, useCase } = await setup();
    await useCase.execute({ id: transaction.id, userId });

    const result = await useCase.execute({ id: transaction.id, userId });

    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
  });

  test('fails with TRANSACTION_NOT_FOUND for an id that does not exist', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ id: Id.createUUID(), userId });

    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
  });

  test('propagates a technical failure of the repository update', async () => {
    const { transaction } = await setup();
    const repository: TransactionRepository = {
      create: async () => Result.ok(),
      update: async () => Result.fail('DATABASE_ERROR'),
      findById: async () => Result.ok(transaction),
      delete: async () => Result.ok(),
    };

    const result = await new DeleteTransaction(repository).execute({ id: transaction.id, userId });

    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });
});
