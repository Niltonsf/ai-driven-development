import { Result, TransactionContext } from '@poupig/shared';
import { TransactionSeries, TransactionSeriesErrors, TransactionSeriesRepository } from '../../src';

export class InMemoryTransactionSeriesRepository implements TransactionSeriesRepository {
  private readonly items = new Map<string, TransactionSeries>();

  async create(entity: TransactionSeries, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async update(entity: TransactionSeries, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<TransactionSeries>> {
    const entity = this.items.get(id);

    if (!entity || entity.deletedAt) {
      return Result.fail(TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND);
    }

    return Result.ok(entity);
  }

  async delete(id: string, _tx?: TransactionContext): Promise<Result<void>> {
    const found = await this.findById(id);
    if (found.isFailure) return Result.fail(found.errors!);

    const deleted = found.instance.softDelete();
    if (deleted.isFailure) return Result.fail(deleted.errors!);

    this.items.set(id, deleted.instance);
    return Result.ok();
  }

  /** Test helper: every stored record, including soft deleted ones. */
  all(): TransactionSeries[] {
    return [...this.items.values()];
  }

  /** Test helper: the stored record, including soft deleted ones. */
  stored(id: string): TransactionSeries | undefined {
    return this.items.get(id);
  }
}
