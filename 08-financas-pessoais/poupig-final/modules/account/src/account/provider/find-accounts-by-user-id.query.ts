import { Result } from '@poupig/shared';
import { AccountDTO } from '../dto';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FindAccountsByUserIdQuery {
  execute(userId: string, page: number, pageSize: number): Promise<Result<PaginatedResult<AccountDTO>>>;
}
