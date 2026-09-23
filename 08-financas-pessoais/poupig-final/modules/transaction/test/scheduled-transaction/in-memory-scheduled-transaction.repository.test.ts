import { Id } from '@poupig/shared';
import { ScheduledTransactionErrors, SeriesKind, TransactionStatus } from '../../src';
import { InMemoryScheduledTransactionRepository } from '../mock/in-memory-scheduled-transaction.repository';
import { seriesDTO } from '../mock/transaction-series-dto.fixture';
import { storeOccurrence } from './scheduled-transaction.fixture';

const userId = Id.createUUID();

function setup() {
  const series = seriesDTO({ userId, name: 'Notebook' });
  const repository = new InMemoryScheduledTransactionRepository().addSeries(series);
  return { series, repository };
}

describe('ScheduledTransactionRepository contract (in-memory)', () => {
  test('findById fails with SCHEDULED_TRANSACTION_NOT_FOUND for an id that does not exist', async () => {
    const { repository } = setup();

    const result = await repository.findById(Id.createUUID());

    expect(result.errors).toEqual([ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND]);
  });

  test('delete removes the record physically and frees the pair', async () => {
    const { series, repository } = setup();
    const stored = await storeOccurrence(repository, series, 2);

    await repository.delete(stored.id);

    expect((await repository.findById(stored.id)).errors).toEqual([
      ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND,
    ]);
    expect(repository.all()).toHaveLength(0);
    await expect(storeOccurrence(repository, series, 2)).resolves.toBeDefined();
  });

  test('rejects a second record for the same pair', async () => {
    const { series, repository } = setup();
    await storeOccurrence(repository, series, 2);

    await expect(storeOccurrence(repository, series, 2)).rejects.toThrow();
  });
});

describe('Scheduled transaction queries (in-memory)', () => {
  test('projects a stored installment with the context of the series', async () => {
    const { series, repository } = setup();
    await storeOccurrence(repository, series, 2);

    const result = await repository.findScheduledTransactionByOccurrence.execute(series.id, 2, userId);

    expect(result.instance).toMatchObject({
      materialized: true,
      occurrenceIndex: 2,
      seriesName: 'Notebook',
      seriesKind: SeriesKind.CLOSED,
      installments: 12,
    });
  });

  test('lists an occurrence moved to the next month in both months', async () => {
    const { repository } = setup();
    const series = seriesDTO({ userId, startDate: '2026-09-01' });
    repository.addSeries(series);
    const stored = await storeOccurrence(repository, series, 0, { expectedOn: '2026-10-02' });
    expect(stored.occurrenceOn).toBe('2026-09-10');

    const september = await repository.listScheduledTransactionsInPeriod.execute({
      userId,
      from: '2026-09-01',
      to: '2026-09-30',
    });
    const october = await repository.listScheduledTransactionsInPeriod.execute({
      userId,
      from: '2026-10-01',
      to: '2026-10-31',
    });

    expect(september.instance).toHaveLength(1);
    expect(october.instance).toHaveLength(1);
  });

  test('ignores another user and a soft deleted series', async () => {
    const { series, repository } = setup();
    await storeOccurrence(repository, series, 2);

    const otherUser = await repository.findScheduledTransactionByOccurrence.execute(series.id, 2, Id.createUUID());
    repository.softDeleteSeries(series.id);
    const deletedSeries = await repository.findScheduledTransactionByOccurrence.execute(series.id, 2, userId);

    expect(otherUser.instance).toBeNull();
    expect(deletedSeries.instance).toBeNull();
  });
});

describe('ListMaterializedOccurrenceKeysQuery (in-memory)', () => {
  const september2026 = { from: '2026-09-01', to: '2026-09-30' };
  const october2026 = { from: '2026-10-01', to: '2026-10-31' };

  /** A plan starting on 2026-09-01: index 0 occurs on 2026-09-10 and index 1 on 2026-10-10. */
  function setupMoved() {
    const repository = new InMemoryScheduledTransactionRepository();
    const series = seriesDTO({ userId, startDate: '2026-09-01' });
    repository.addSeries(series);
    return { repository, series };
  }

  test('filters by occurrenceOn and returns only the pair', async () => {
    const { repository, series } = setupMoved();
    const moved = await storeOccurrence(repository, series, 0, { expectedOn: '2026-10-02' });
    expect(moved.occurrenceOn).toBe('2026-09-10');

    const result = await repository.listMaterializedOccurrenceKeys.execute({ userId, ...september2026 });

    expect(result.instance).toEqual([{ seriesId: series.id, occurrenceIndex: 0 }]);
  });

  test('an expectedOn moved into the period does not count', async () => {
    const { repository, series } = setupMoved();
    await storeOccurrence(repository, series, 0, { expectedOn: '2026-10-02' });

    const result = await repository.listMaterializedOccurrenceKeys.execute({ userId, ...october2026 });

    expect(result.instance).toEqual([]);
  });

  test('includes a CANCELED occurrence', async () => {
    const { repository, series } = setupMoved();
    await storeOccurrence(repository, series, 1, { status: TransactionStatus.CANCELED });

    const result = await repository.listMaterializedOccurrenceKeys.execute({ userId, ...october2026 });

    expect(result.instance).toEqual([{ seriesId: series.id, occurrenceIndex: 1 }]);
  });

  test('ignores a soft deleted series', async () => {
    const { repository, series } = setupMoved();
    await storeOccurrence(repository, series, 0);
    repository.softDeleteSeries(series.id);

    const result = await repository.listMaterializedOccurrenceKeys.execute({ userId, ...september2026 });

    expect(result.instance).toEqual([]);
  });

  test('ignores the occurrences of another user', async () => {
    const { repository, series } = setupMoved();
    await storeOccurrence(repository, series, 0);

    const result = await repository.listMaterializedOccurrenceKeys.execute({
      userId: Id.createUUID(),
      ...september2026,
    });

    expect(result.instance).toEqual([]);
  });
});
