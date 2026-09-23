import { Result } from '@poupig/shared';
import { CreditCardDTO } from '../dto';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FindCreditCardsByUserIdQuery {
  execute(userId: string, page: number, pageSize: number): Promise<Result<PaginatedResult<CreditCardDTO>>>;
}
