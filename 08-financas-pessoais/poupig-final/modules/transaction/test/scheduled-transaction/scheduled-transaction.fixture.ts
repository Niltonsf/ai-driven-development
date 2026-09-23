import { Id } from '@poupig/shared';
import {
  ScheduledTransaction,
  ScheduledTransactionGenerator,
  ScheduledTransactionProps,
  TransactionSeriesDTO,
} from '../../src';
import { InMemoryScheduledTransactionRepository } from '../mock/in-memory-scheduled-transaction.repository';

/** Stores the occurrence `occurrenceIndex` of the series, as the series would generate it, with overrides. */
export async function storeOccurrence(
  repository: InMemoryScheduledTransactionRepository,
  series: TransactionSeriesDTO,
  occurrenceIndex: number,
  overrides: Partial<ScheduledTransactionProps> = {},
): Promise<ScheduledTransaction> {
  const occurrenceOn = ScheduledTransactionGenerator.occurrenceDate(series, occurrenceIndex)!;
  const occurrence = ScheduledTransaction.create({
    id: Id.createUUID(),
    userId: series.userId,
    seriesId: series.id,
    occurrenceIndex,
    occurrenceOn,
    name: series.name,
    note: series.note,
    value: series.value,
    direction: series.direction,
    accountId: series.accountId,
    creditCardId: series.creditCardId,
    subcategoryId: series.subcategoryId,
    expectedOn: occurrenceOn,
    ...overrides,
  });

  const result = await repository.create(occurrence);
  result.validator.throwsIfFailed();
  return occurrence;
}
