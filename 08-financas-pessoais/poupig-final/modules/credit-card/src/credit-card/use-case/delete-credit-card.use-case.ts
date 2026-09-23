import { Result, UseCase } from '@poupig/shared';
import { CreditCardRepository } from '../provider';

export const DeleteCreditCardErrors = {
  CREDIT_CARD_NOT_FOUND: 'CREDIT_CARD_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export interface DeleteCreditCardInput {
  id: string;
  userId: string;
}

export class DeleteCreditCard implements UseCase<DeleteCreditCardInput, void> {
  constructor(private readonly creditCardRepository: CreditCardRepository) {}

  async execute(input: DeleteCreditCardInput): Promise<Result<void>> {
    const existingResult = await this.creditCardRepository.findById(input.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const card = existingResult.instance;

    if (!card) {
      return Result.fail(DeleteCreditCardErrors.CREDIT_CARD_NOT_FOUND);
    }

    if (card.userId !== input.userId) {
      return Result.fail(DeleteCreditCardErrors.UNAUTHORIZED);
    }

    const deletedResult = card.softDelete();
    if (deletedResult.isFailure) return Result.fail(deletedResult.errors!);

    return this.creditCardRepository.save(deletedResult.instance);
  }
}
