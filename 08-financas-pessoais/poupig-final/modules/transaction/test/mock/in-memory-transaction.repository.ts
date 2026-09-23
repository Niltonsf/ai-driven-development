import { Result, TransactionContext } from '@poupig/shared';
import { Transaction, TransactionErrors, TransactionRepository } from '../../src';

export class InMemoryTransactionRepository implements TransactionRepository {
  private readonly items = new Map<string, Transaction>();

  async create(entity: Transaction, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async update(entity: Transaction, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<Transaction>> {
    const entity = this.items.get(id);

    if (!entity || entity.deletedAt) {
      return Result.fail(TransactionErrors.TRANSACTION_NOT_FOUND);
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
  all(): Transaction[] {
    return [...this.items.values()];
  }

  /** Test helper: the stored record, including soft deleted ones. */
  stored(id: string): Transaction | undefined {
    return this.items.get(id);
  }
}
