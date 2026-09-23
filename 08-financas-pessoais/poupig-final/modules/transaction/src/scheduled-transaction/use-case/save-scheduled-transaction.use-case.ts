import { Result, UseCase } from '@poupig/shared';
import { Direction, MovementReferencesQuery, TransactionStatus } from '../../movement';
import { FindTransactionSeriesByIdQuery } from '../../transaction-series/provider';
import { ScheduledTransaction, ScheduledTransactionGenerator } from '../model';
import { FindScheduledTransactionByOccurrenceQuery, ScheduledTransactionRepository } from '../provider';

export const SaveScheduledTransactionErrors = {
  SCHEDULED_TRANSACTION_SERIES_NOT_FOUND: 'SCHEDULED_TRANSACTION_SERIES_NOT_FOUND',
  SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND: 'SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND',
  SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND: 'SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND',
  SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND: 'SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND',
  SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND: 'SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND',
} as const;

/**
 * The occurrence is addressed by `(seriesId, occurrenceIndex)`. `id` is the id
 * of the opened occurrence — ephemeral while it is not stored — and is only
 * used by the first write. There is no `occurrenceOn`: it always comes from the series.
 */
export interface SaveScheduledTransactionInput {
  seriesId: string;
  occurrenceIndex: number;
  userId: string;
  id: string;
  name: string;
  note?: string | null;
  value: number;
  direction: Direction;
  accountId: string;
  creditCardId?: string | null;
  subcategoryId?: string | null;
  status?: TransactionStatus;
  expectedOn: string;
  settledOn?: string | null;
}

export interface SaveScheduledTransactionOutput {
  id: string;
}

/**
 * Stores an occurrence of a series: inserts it the first time and updates it
 * afterwards. The decision comes from the stored occurrence of the pair
 * `(seriesId, occurrenceIndex)`, never from the received `id`, so an id sent by
 * the client never renumbers a stored record.
 */
export class SaveScheduledTransaction
  implements UseCase<SaveScheduledTransactionInput, SaveScheduledTransactionOutput>
{
  constructor(
    private readonly scheduledTransactionRepository: ScheduledTransactionRepository,
    private readonly findScheduledTransactionByOccurrence: FindScheduledTransactionByOccurrenceQuery,
    private readonly findTransactionSeriesById: FindTransactionSeriesByIdQuery,
    private readonly movementReferences: MovementReferencesQuery,
  ) {}

  async execute(input: SaveScheduledTransactionInput): Promise<Result<SaveScheduledTransactionOutput>> {
    const seriesResult = await this.findTransactionSeriesById.execute(input.seriesId, input.userId);
    if (seriesResult.isFailure) return Result.fail(seriesResult.errors!);

    const series = seriesResult.instance;
    if (!series) {
      return Result.fail(SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND);
    }

    const occurrenceOn = ScheduledTransactionGenerator.occurrenceDate(series, input.occurrenceIndex);
    if (occurrenceOn === null) {
      return Result.fail(SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND);
    }

    const candidateResult = ScheduledTransaction.tryCreate({
      id: input.id,
      userId: input.userId,
      seriesId: series.id,
      occurrenceIndex: input.occurrenceIndex,
      occurrenceOn,
      ...this.editableFields(input),
    });
    if (candidateResult.isFailure) return Result.fail(candidateResult.errors!);

    const candidate = candidateResult.instance;

    const referencesResult = await this.checkReferences(candidate);
    if (referencesResult.isFailure) return Result.fail(referencesResult.errors!);

    const storedResult = await this.findScheduledTransactionByOccurrence.execute(
      candidate.seriesId,
      candidate.occurrenceIndex,
      candidate.userId,
    );
    if (storedResult.isFailure) return Result.fail(storedResult.errors!);

    const stored = storedResult.instance;
    if (!stored) {
      const createResult = await this.scheduledTransactionRepository.create(candidate);
      if (createResult.isFailure) return Result.fail(createResult.errors!);

      return Result.ok({ id: candidate.id });
    }

    const existingResult = await this.scheduledTransactionRepository.findById(stored.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    // Only the editable fields: `id`, `userId`, `seriesId`, `occurrenceIndex`,
    // `occurrenceOn` and `createdAt` come from the stored entity. A null
    // `updatedAt` is stamped again by the entity base.
    const updatedResult = existingResult.instance.cloneWith({
      ...this.editableFields(input),
      updatedAt: null,
    });
    if (updatedResult.isFailure) return Result.fail(updatedResult.errors!);

    const updateResult = await this.scheduledTransactionRepository.update(updatedResult.instance);
    if (updateResult.isFailure) return Result.fail(updateResult.errors!);

    return Result.ok({ id: stored.id });
  }

  /** Full replacement of the editable fields: an omitted optional becomes `null`. */
  private editableFields(input: SaveScheduledTransactionInput) {
    return {
      name: input.name,
      note: input.note ?? null,
      value: input.value,
      direction: input.direction,
      accountId: input.accountId,
      creditCardId: input.creditCardId ?? null,
      subcategoryId: input.subcategoryId ?? null,
      status: input.status,
      expectedOn: input.expectedOn,
      settledOn: input.settledOn ?? null,
    };
  }

  private async checkReferences(scheduledTransaction: ScheduledTransaction): Promise<Result<void>> {
    const { userId, accountId, creditCardId, subcategoryId } = scheduledTransaction;
    const notChecked = Promise.resolve(Result.ok(true));

    const [account, creditCard, subcategory] = await Promise.all([
      this.movementReferences.accountBelongsToUser(accountId, userId),
      creditCardId ? this.movementReferences.creditCardBelongsToUser(creditCardId, userId) : notChecked,
      subcategoryId ? this.movementReferences.subcategoryBelongsToUser(subcategoryId, userId) : notChecked,
    ]);

    const queries = Result.combine([account, creditCard, subcategory]);
    if (queries.isFailure) return Result.fail(queries.errors!);

    const errors: string[] = [];
    if (!account.instance) errors.push(SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND);
    if (!creditCard.instance) errors.push(SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND);
    if (!subcategory.instance) errors.push(SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND);

    return errors.length ? Result.fail(errors) : Result.ok();
  }
}
