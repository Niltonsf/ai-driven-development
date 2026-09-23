import { Result } from '@poupig/shared';
import { Account } from '../../src/account/model';
import { AccountRepository } from '../../src/account/provider';

export class InMemoryAccountRepository implements AccountRepository {
  private readonly items = new Map<string, Account>();

  async save(account: Account): Promise<Result<void>> {
    this.items.set(account.id, account);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<Account | null>> {
    return Result.ok(this.items.get(id) ?? null);
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Result<Account | null>> {
    const found = [...this.items.values()].find(
      (account) => account.userId === userId && account.name === name && !account.deletedAt,
    );
    return Result.ok(found ?? null);
  }

  async delete(id: string): Promise<Result<void>> {
    this.items.delete(id);
    return Result.ok();
  }
}
