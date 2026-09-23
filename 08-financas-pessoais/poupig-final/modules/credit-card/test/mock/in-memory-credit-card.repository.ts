import { Result } from '@poupig/shared';
import { Card } from '../../src/credit-card/model';
import { CreditCardRepository } from '../../src/credit-card/provider';

export class InMemoryCreditCardRepository implements CreditCardRepository {
  private readonly items = new Map<string, Card>();

  async save(card: Card): Promise<Result<void>> {
    this.items.set(card.id, card);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<Card | null>> {
    return Result.ok(this.items.get(id) ?? null);
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Result<Card | null>> {
    const found = [...this.items.values()].find(
      (card) => card.userId === userId && card.name === name && !card.deletedAt,
    );
    return Result.ok(found ?? null);
  }

  async delete(id: string): Promise<Result<void>> {
    this.items.delete(id);
    return Result.ok();
  }
}
