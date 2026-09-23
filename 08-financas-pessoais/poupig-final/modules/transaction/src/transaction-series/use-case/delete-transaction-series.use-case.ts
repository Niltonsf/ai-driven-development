import { Result, UseCase } from '@poupig/shared';
import { TransactionSeriesErrors } from '../model';
import { TransactionSeriesRepository } from '../provider';

export interface DeleteTransactionSeriesInput {
  id: string;
  userId: string;
}

export class DeleteTransactionSeries implements UseCase<DeleteTransactionSeriesInput, void> {
  constructor(private readonly transactionSeriesRepository: TransactionSeriesRepository) {}

  async execute(input: DeleteTransactionSeriesInput): Promise<Result<void>> {
    const existingResult = await this.transactionSeriesRepository.findById(input.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const series = existingResult.instance;

    if (series.userId !== input.userId) {
      return Result.fail(TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND);
    }

    const deletedResult = series.softDelete();
    if (deletedResult.isFailure) return Result.fail(deletedResult.errors!);

    return this.transactionSeriesRepository.update(deletedResult.instance);
  }
}
