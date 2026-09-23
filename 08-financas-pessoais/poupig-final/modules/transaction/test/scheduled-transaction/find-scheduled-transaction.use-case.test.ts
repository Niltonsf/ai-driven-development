import { Id } from '@poupig/shared';
import {
  FindScheduledTransaction,
  SaveScheduledTransactionErrors,
  SeriesKind,
  TransactionStatus,
} from '../../src';
import { InMemoryScheduledTransactionRepository } from '../mock/in-memory-scheduled-transaction.repository';
import { InMemoryFindTransactionSeriesByIdQuery, seriesDTO } from '../mock/transaction-series-dto.fixture';
import { storeOccurrence } from './scheduled-transaction.fixture';

const userId = Id.createUUID();
const otherUserId = Id.createUUID();

function setup() {
  const series = seriesDTO({ userId });
  const seriesQuery = new InMemoryFindTransactionSeriesByIdQuery().add(series);
  const repository = new InMemoryScheduledTransactionRepository().addSeries(series);
  const useCase = new FindScheduledTransaction(repository.findScheduledTransactionByOccurrence, seriesQuery);
  return { series, seriesQuery, repository, useCase };
}

describe('FindScheduledTransaction', () => {
  test('returns the stored occurrence', async () => {
    const { series, repository, useCase } = setup();
    const stored = await storeOccurrence(repository, series, 3, { value: 300 });

    const result = await useCase.execute({ seriesId: series.id, occurrenceIndex: 3, userId });

    expect(result.isOk).toBe(true);
    expect(result.instance.id).toBe(stored.id);
    expect(result.instance.materialized).toBe(true);
    expect(result.instance.value).toBe(300);
  });

  test('returns the occurrence generated in memory when it is not stored, saving nothing', async () => {
    const { series, repository, useCase } = setup();

    const result = await useCase.execute({ seriesId: series.id, occurrenceIndex: 3, userId });

    expect(result.isOk).toBe(true);
    const dto = result.instance;
    expect(Id.tryCreate(dto.id).isOk).toBe(true);
    expect(dto.materialized).toBe(false);
    expect(dto.value).toBe(250);
    expect(dto.status).toBe(TransactionStatus.PENDING);
    expect(dto.occurrenceIndex).toBe(3);
    expect(dto.occurrenceOn).toBe('2027-01-10');
    expect(dto.expectedOn).toBe('2027-01-10');
    expect(dto.seriesName).toBe('Notebook');
    expect(dto.seriesKind).toBe(SeriesKind.CLOSED);
    expect(dto.installments).toBe(12);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND for an index outside the series', async () => {
    const { series, useCase } = setup();

    const result = await useCase.execute({ seriesId: series.id, occurrenceIndex: 12, userId });

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND]);
  });

  test('fails with SCHEDULED_TRANSACTION_SERIES_NOT_FOUND for a series of another user', async () => {
    const { seriesQuery, useCase } = setup();
    const foreignSeries = seriesDTO({ userId: otherUserId });
    seriesQuery.add(foreignSeries);

    const result = await useCase.execute({ seriesId: foreignSeries.id, occurrenceIndex: 0, userId });

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND]);
  });

  test('fails with SCHEDULED_TRANSACTION_SERIES_NOT_FOUND for a soft deleted series with a stored occurrence', async () => {
    const { series, seriesQuery, repository, useCase } = setup();
    await storeOccurrence(repository, series, 3);
    seriesQuery.softDelete(series.id);
    repository.softDeleteSeries(series.id);

    const result = await useCase.execute({ seriesId: series.id, occurrenceIndex: 3, userId });

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND]);
  });
});
