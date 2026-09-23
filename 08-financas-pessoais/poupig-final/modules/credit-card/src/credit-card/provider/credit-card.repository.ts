import { Result } from '@poupig/shared';
import { Card } from '../model';

export interface CreditCardRepository {
  save(card: Card): Promise<Result<void>>;
  findById(id: string): Promise<Result<Card | null>>;
  findByNameAndUserId(name: string, userId: string): Promise<Result<Card | null>>;
  delete(id: string): Promise<Result<void>>;
}
