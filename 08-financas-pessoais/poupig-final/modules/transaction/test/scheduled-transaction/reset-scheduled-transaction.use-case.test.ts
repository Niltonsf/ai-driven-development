import { Id } from '@poupig/shared';
import { FindScheduledTransaction, ResetScheduledTransaction, ScheduledTransactionErrors } from '../../src';
import { InMemoryScheduledTransactionRepository } from '../mock/in-memory-scheduled-transaction.repository';
import { InMemoryFindTransactionSeriesByIdQuery, seriesDTO } from '../mock/transaction-series-dto.fixture';
import { storeOccurrence } from './scheduled-transaction.fixture';

const userId = Id.createUUID();
const otherUserId = Id.createUUID();

function setup() {
  const series = seriesDTO({ userId });
  const seriesQuery = new InMemoryFindTransactionSeriesByIdQuery().add(series);
  const repository = new InMemoryScheduledTransactionRepository().addSeries(series);
  const useCase = new ResetScheduledTransaction(repository, repository.findScheduledTransactionByOccurrence);
  const find = new FindScheduledTransaction(repository.findScheduledTransactionByOccurrence, seriesQuery);
  return { series, repository, useCase, find };
}

describe('ResetScheduledTransaction', () => {
  test('removes the stored occurrence, which is generated from the series again', async () => {
    const { series, repository, useCase, find } = setup();
    const stored = await storeOccurrence(repository, series, 3, { value: 300 });

    const result = await useCase.execute({ seriesId: series.id, occurrenceIndex: 3, userId });

    expect(result.isOk).toBe(true);
    expect((await repository.findById(stored.id)).errors).toEqual([
      ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND,
    ]);
    expect(repository.all()).toHaveLength(0);
    const reopened = await find.execute({ seriesId: series.id, occurrenceIndex: 3, userId });
    expect(reopened.instance.materialized).toBe(false);
    expect(reopened.instance.value).toBe(250);
  });

  test('frees the pair for a new write', async () => {
    const { series, repository, useCase } = setup();
    await storeOccurrence(repository, series, 3);

    await useCase.execute({ seriesId: series.id, occurrenceIndex: 3, userId });

    await expect(storeOccurrence(repository, series, 3)).resolves.toBeDefined();
  });

  test('fails with SCHEDULED_TRANSACTION_NOT_FOUND for an occurrence never stored', async () => {
    const { series, useCase } = setup();

    const result = await useCase.execute({ seriesId: series.id, occurrenceIndex: 3, userId });

    expect(result.errors).toEqual([ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND]);
  });

  test('fails with SCHEDULED_TRANSACTION_NOT_FOUND for another user and keeps the record', async () => {
    const { series, repository, useCase } = setup();
    const stored = await storeOccurrence(repository, series, 3);

    const result = await useCase.execute({ seriesId: series.id, occurrenceIndex: 3, userId: otherUserId });

    expect(result.errors).toEqual([ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND]);
    expect((await repository.findById(stored.id)).isOk).toBe(true);
  });

  test('fails with SCHEDULED_TRANSACTION_NOT_FOUND for an occurrence of a soft deleted series', async () => {
    const { series, repository, useCase } = setup();
    const stored = await storeOccurrence(repository, series, 3);
    repository.softDeleteSeries(series.id);

    const result = await useCase.execute({ seriesId: series.id, occurrenceIndex: 3, userId });

    expect(result.errors).toEqual([ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND]);
    expect((await repository.findById(stored.id)).isOk).toBe(true);
  });
});
