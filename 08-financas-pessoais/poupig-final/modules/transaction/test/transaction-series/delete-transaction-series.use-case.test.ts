import { Id, Result } from '@poupig/shared';
import {
  DeleteTransactionSeries,
  Direction,
  FrequencyUnit,
  SeriesKind,
  TransactionSeries,
  TransactionSeriesErrors,
  TransactionSeriesRepository,
} from '../../src';
import { InMemoryTransactionSeriesRepository } from '../mock/in-memory-transaction-series.repository';

const userId = Id.createUUID();
const otherUserId = Id.createUUID();

async function setup(ownerId = userId) {
  const repository = new InMemoryTransactionSeriesRepository();
  const series = TransactionSeries.create({
    userId: ownerId,
    name: 'Assinatura de streaming',
    value: 39.9,
    direction: Direction.OUT,
    accountId: Id.createUUID(),
    kind: SeriesKind.CLOSED,
    recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 10 },
    startDate: '2026-09-15',
    installments: 12,
  });
  await repository.create(series);
  return { repository, series, useCase: new DeleteTransactionSeries(repository) };
}

describe('DeleteTransactionSeries', () => {
  test('soft deletes the series, which then behaves as not found', async () => {
    const { repository, series, useCase } = await setup();

    const result = await useCase.execute({ id: series.id, userId });

    expect(result.isOk).toBe(true);
    const found = await repository.findById(series.id);
    expect(found.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND]);
    const stored = repository.stored(series.id)!;
    expect(stored.deletedAt).toBeInstanceOf(Date);
    expect(stored.name).toBe('Assinatura de streaming');
    expect(stored.installments).toBe(12);
  });

  test('fails with TRANSACTION_SERIES_NOT_FOUND for a series of another user, keeping it active', async () => {
    const { repository, series, useCase } = await setup(otherUserId);

    const result = await useCase.execute({ id: series.id, userId });

    expect(result.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND]);
    const found = await repository.findById(series.id);
    expect(found.isOk).toBe(true);
    expect(found.instance.deletedAt).toBeNull();
  });

  test('fails with TRANSACTION_SERIES_NOT_FOUND when deleting again', async () => {
    const { series, useCase } = await setup();
    await useCase.execute({ id: series.id, userId });

    const result = await useCase.execute({ id: series.id, userId });

    expect(result.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND]);
  });

  test('fails with TRANSACTION_SERIES_NOT_FOUND for an id that does not exist', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ id: Id.createUUID(), userId });

    expect(result.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND]);
  });

  test('propagates a technical failure of the repository update', async () => {
    const { series } = await setup();
    const repository: TransactionSeriesRepository = {
      create: async () => Result.ok(),
      update: async () => Result.fail('DATABASE_ERROR'),
      findById: async () => Result.ok(series),
      delete: async () => Result.ok(),
    };

    const result = await new DeleteTransactionSeries(repository).execute({ id: series.id, userId });

    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });
});
