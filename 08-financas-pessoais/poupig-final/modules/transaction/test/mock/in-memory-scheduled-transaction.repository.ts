import { Result, TransactionContext } from '@poupig/shared';
import {
  FindScheduledTransactionByOccurrenceQuery,
  ListMaterializedOccurrenceKeysQuery,
  ListScheduledTransactionsInPeriodQuery,
  ScheduledTransaction,
  ScheduledTransactionDTO,
  ScheduledTransactionErrors,
  ScheduledTransactionRepository,
  SeriesKind,
  TransactionSeriesDTO,
} from '../../src';

/**
 * Repository (physical delete) and the three read queries of the aggregate over
 * the same storage. The series context of the DTOs comes from the series
 * registered with `addSeries`; `softDeleteSeries` is the simple double of a
 * soft deleted series, whose occurrences the queries ignore.
 */
export class InMemoryScheduledTransactionRepository implements ScheduledTransactionRepository {
  /** When set, `create` and `update` fail with this technical error. */
  failure?: string;

  private readonly items = new Map<string, ScheduledTransaction>();
  private readonly series = new Map<string, TransactionSeriesDTO>();
  private readonly deletedSeries = new Set<string>();

  addSeries(series: TransactionSeriesDTO): this {
    this.series.set(series.id, series);
    return this;
  }

  softDeleteSeries(seriesId: string): this {
    this.deletedSeries.add(seriesId);
    return this;
  }

  readonly findScheduledTransactionByOccurrence: FindScheduledTransactionByOccurrenceQuery = {
    execute: async (seriesId, occurrenceIndex, userId) => {
      const found = this.visible(userId).find(
        (item) => item.seriesId === seriesId && item.occurrenceIndex === occurrenceIndex,
      );
      return Result.ok(found ? this.toDTO(found) : null);
    },
  };

  readonly listScheduledTransactionsInPeriod: ListScheduledTransactionsInPeriodQuery = {
    execute: async ({ userId, from, to }) => {
      const inPeriod = (date: string) => from <= date && date <= to;
      const rows = this.visible(userId)
        .filter((item) => inPeriod(item.expectedOn) || inPeriod(item.occurrenceOn))
        .sort(
          (left, right) =>
            right.expectedOn.localeCompare(left.expectedOn) || right.createdAt.getTime() - left.createdAt.getTime(),
        );
      return Result.ok(rows.map((item) => this.toDTO(item)));
    },
  };

  /** By `occurrenceOn` only and with any status, as the suppression of the generation needs. */
  readonly listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery = {
    execute: async ({ userId, from, to }) =>
      Result.ok(
        this.visible(userId)
          .filter((item) => from <= item.occurrenceOn && item.occurrenceOn <= to)
          .map((item) => ({ seriesId: item.seriesId, occurrenceIndex: item.occurrenceIndex })),
      ),
  };

  async create(entity: ScheduledTransaction, _tx?: TransactionContext): Promise<Result<void>> {
    if (this.failure) return Result.fail(this.failure);

    const duplicated = this.all().some(
      (item) => item.seriesId === entity.seriesId && item.occurrenceIndex === entity.occurrenceIndex,
    );
    // The unique key `(seriesId, occurrenceIndex)` of the storage.
    if (duplicated) return Result.fail('UNIQUE_CONSTRAINT_VIOLATION');

    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async update(entity: ScheduledTransaction, _tx?: TransactionContext): Promise<Result<void>> {
    if (this.failure) return Result.fail(this.failure);
    if (!this.items.has(entity.id)) return Result.fail(ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND);

    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<ScheduledTransaction>> {
    const entity = this.items.get(id);
    if (!entity) return Result.fail(ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND);
    return Result.ok(entity);
  }

  async delete(id: string, _tx?: TransactionContext): Promise<Result<void>> {
    if (!this.items.delete(id)) return Result.fail(ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND);
    return Result.ok();
  }

  /** Test helper: every stored record, including the ones of soft deleted series. */
  all(): ScheduledTransaction[] {
    return [...this.items.values()];
  }

  private visible(userId: string): ScheduledTransaction[] {
    return this.all().filter((item) => item.userId === userId && !this.deletedSeries.has(item.seriesId));
  }

  private toDTO(entity: ScheduledTransaction): ScheduledTransactionDTO {
    const series = this.series.get(entity.seriesId);
    const sameReference = (id: string | null, seriesReferenceId: string | null | undefined) =>
      id !== null && id === seriesReferenceId;

    return {
      id: entity.id,
      userId: entity.userId,
      seriesId: entity.seriesId,
      occurrenceIndex: entity.occurrenceIndex,
      occurrenceOn: entity.occurrenceOn,
      name: entity.name,
      note: entity.note,
      value: entity.value,
      direction: entity.direction,
      accountId: entity.accountId,
      accountName: sameReference(entity.accountId, series?.accountId) ? series!.accountName : 'Conta',
      creditCardId: entity.creditCardId,
      creditCardName: sameReference(entity.creditCardId, series?.creditCardId) ? series!.creditCardName : null,
      subcategoryId: entity.subcategoryId,
      subcategoryName: sameReference(entity.subcategoryId, series?.subcategoryId) ? series!.subcategoryName : null,
      categoryName: sameReference(entity.subcategoryId, series?.subcategoryId) ? series!.categoryName : null,
      status: entity.status,
      expectedOn: entity.expectedOn,
      settledOn: entity.settledOn,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      materialized: true,
      seriesName: series?.name ?? 'Série',
      seriesKind: series?.kind ?? SeriesKind.OPEN,
      installments: series?.installments ?? null,
    };
  }
}
