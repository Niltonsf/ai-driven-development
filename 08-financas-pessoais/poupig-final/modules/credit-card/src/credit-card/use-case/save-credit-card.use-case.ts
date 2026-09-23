import { Result, UseCase } from '@poupig/shared';
import { Card, CardBrand } from '../model';
import { CreditCardRepository } from '../provider';

export const SaveCreditCardErrors = {
  CREDIT_CARD_NAME_ALREADY_EXISTS: 'CREDIT_CARD_NAME_ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export interface SaveCreditCardInput {
  id: string;
  userId: string;
  name: string;
  brand: CardBrand;
  closingDay: number;
  dueDay: number;
  description?: string;
  lastFourDigits?: string;
  limit?: number;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export class SaveCreditCard implements UseCase<SaveCreditCardInput, void> {
  constructor(private readonly creditCardRepository: CreditCardRepository) {}

  async execute(input: SaveCreditCardInput): Promise<Result<void>> {
    const existingResult = await this.creditCardRepository.findById(input.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const existing = existingResult.instance;

    if (!existing) {
      const duplicateResult = await this.creditCardRepository.findByNameAndUserId(input.name, input.userId);
      if (duplicateResult.isFailure) return Result.fail(duplicateResult.errors!);

      if (duplicateResult.instance !== null) {
        return Result.fail(SaveCreditCardErrors.CREDIT_CARD_NAME_ALREADY_EXISTS);
      }

      const cardResult = Card.tryCreate({ ...input, isActive: true });
      if (cardResult.isFailure) return Result.fail(cardResult.errors!);

      return this.creditCardRepository.save(cardResult.instance);
    } else {
      if (existing.userId !== input.userId) {
        return Result.fail(SaveCreditCardErrors.UNAUTHORIZED);
      }

      const updatedResult = existing.cloneWith({
        name: input.name,
        brand: input.brand,
        closingDay: input.closingDay,
        dueDay: input.dueDay,
        description: input.description,
        lastFourDigits: input.lastFourDigits,
        limit: input.limit,
        color: input.color,
        icon: input.icon,
        isActive: input.isActive ?? existing.isActive,
      });
      if (updatedResult.isFailure) return Result.fail(updatedResult.errors!);

      return this.creditCardRepository.save(updatedResult.instance);
    }
  }
}
