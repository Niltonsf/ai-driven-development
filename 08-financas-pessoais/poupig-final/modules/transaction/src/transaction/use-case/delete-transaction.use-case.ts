import { Result, UseCase } from '@poupig/shared';
import { TransactionErrors } from '../model';
import { TransactionRepository } from '../provider';

export interface DeleteTransactionInput {
  id: string;
  userId: string;
}

export class DeleteTransaction implements UseCase<DeleteTransactionInput, void> {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: DeleteTransactionInput): Promise<Result<void>> {
    const existingResult = await this.transactionRepository.findById(input.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const transaction = existingResult.instance;

    if (transaction.userId !== input.userId) {
      return Result.fail(TransactionErrors.TRANSACTION_NOT_FOUND);
    }

    const deletedResult = transaction.softDelete();
    if (deletedResult.isFailure) return Result.fail(deletedResult.errors!);

    return this.transactionRepository.update(deletedResult.instance);
  }
}
