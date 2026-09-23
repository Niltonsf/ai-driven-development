import { Result } from '@poupig/shared';
import { Account } from '../model';

export interface AccountRepository {
  save(account: Account): Promise<Result<void>>;
  findById(id: string): Promise<Result<Account | null>>;
  findByNameAndUserId(name: string, userId: string): Promise<Result<Account | null>>;
  delete(id: string): Promise<Result<void>>;
}
