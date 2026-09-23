import { Result, UseCase } from '@poupig/shared';
import { ScheduledTransactionErrors } from '../model';
import { FindScheduledTransactionByOccurrenceQuery, ScheduledTransactionRepository } from '../provider';

export interface ResetScheduledTransactionInput {
  seriesId: string;
  occurrenceIndex: number;
  userId: string;
}

/**
 * Reverts an occurrence to its series: the stored record of the user is
 * removed physically, so the occurrence is generated from the series again.
 */
export class ResetScheduledTransaction implements UseCase<ResetScheduledTransactionInput, void> {
  constructor(
    private readonly scheduledTransactionRepository: ScheduledTransactionRepository,
    private readonly findScheduledTransactionByOccurrence: FindScheduledTransactionByOccurrenceQuery,
  ) {}

  async execute(input: ResetScheduledTransactionInput): Promise<Result<void>> {
    const storedResult = await this.findScheduledTransactionByOccurrence.execute(
      input.seriesId,
      input.occurrenceIndex,
      input.userId,
    );
    if (storedResult.isFailure) return Result.fail(storedResult.errors!);

    const stored = storedResult.instance;
    if (!stored) {
      return Result.fail(ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND);
    }

    return this.scheduledTransactionRepository.delete(stored.id);
  }
}
