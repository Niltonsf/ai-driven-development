import { Result, UseCase } from '@poupig/shared';
import { Direction, MovementReferencesQuery } from '../../movement';
import { RecurrenceRuleInput, SeriesKind, TransactionSeries, TransactionSeriesErrors } from '../model';
import { TransactionSeriesRepository } from '../provider';

export const SaveTransactionSeriesErrors = {
  TRANSACTION_SERIES_ACCOUNT_NOT_FOUND: 'TRANSACTION_SERIES_ACCOUNT_NOT_FOUND',
  TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND: 'TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND',
  TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND: 'TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND',
} as const;

export interface SaveTransactionSeriesInput {
  id?: string;
  userId: string;
  name: string;
  note?: string | null;
  value: number;
  direction: Direction;
  accountId: string;
  creditCardId?: string | null;
  subcategoryId?: string | null;
  kind: SeriesKind;
  recurrence: RecurrenceRuleInput;
  startDate: string;
  endDate?: string | null;
  installments?: number | null;
}

export interface SaveTransactionSeriesOutput {
  id: string;
}

export class SaveTransactionSeries implements UseCase<SaveTransactionSeriesInput, SaveTransactionSeriesOutput> {
  constructor(
    private readonly transactionSeriesRepository: TransactionSeriesRepository,
    private readonly movementReferences: MovementReferencesQuery,
  ) {}

  async execute(input: SaveTransactionSeriesInput): Promise<Result<SaveTransactionSeriesOutput>> {
    const isUpdate = Boolean(input.id);

    const seriesResult = isUpdate ? await this.buildUpdated(input) : this.buildNew(input);
    if (seriesResult.isFailure) return Result.fail(seriesResult.errors!);

    const series = seriesResult.instance;

    const referencesResult = await this.checkReferences(series);
    if (referencesResult.isFailure) return Result.fail(referencesResult.errors!);

    const persistResult = isUpdate
      ? await this.transactionSeriesRepository.update(series)
      : await this.transactionSeriesRepository.create(series);
    if (persistResult.isFailure) return Result.fail(persistResult.errors!);

    return Result.ok({ id: series.id });
  }

  private buildNew(input: SaveTransactionSeriesInput): Result<TransactionSeries> {
    return TransactionSeries.tryCreate({
      userId: input.userId,
      ...this.editableFields(input),
    });
  }

  private async buildUpdated(input: SaveTransactionSeriesInput): Promise<Result<TransactionSeries>> {
    const existingResult = await this.transactionSeriesRepository.findById(input.id!);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const existing = existingResult.instance;

    if (existing.userId !== input.userId) {
      return Result.fail(TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND);
    }

    // Full replacement of the editable fields: `id`, `userId` and `createdAt` come from the loaded entity.
    return existing.cloneWith({
      ...this.editableFields(input),
      updatedAt: new Date(),
    });
  }

  /** The entity decides what is worth for each kind: `endDate` and `installments` travel as they came. */
  private editableFields(input: SaveTransactionSeriesInput) {
    return {
      name: input.name,
      note: input.note ?? null,
      value: input.value,
      direction: input.direction,
      accountId: input.accountId,
      creditCardId: input.creditCardId ?? null,
      subcategoryId: input.subcategoryId ?? null,
      kind: input.kind,
      recurrence: input.recurrence,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      installments: input.installments ?? null,
    };
  }

  private async checkReferences(series: TransactionSeries): Promise<Result<void>> {
    const { userId, accountId, creditCardId, subcategoryId } = series;
    const notChecked = Promise.resolve(Result.ok(true));

    const [account, creditCard, subcategory] = await Promise.all([
      this.movementReferences.accountBelongsToUser(accountId, userId),
      creditCardId ? this.movementReferences.creditCardBelongsToUser(creditCardId, userId) : notChecked,
      subcategoryId ? this.movementReferences.subcategoryBelongsToUser(subcategoryId, userId) : notChecked,
    ]);

    const queries = Result.combine([account, creditCard, subcategory]);
    if (queries.isFailure) return Result.fail(queries.errors!);

    const errors: string[] = [];
    if (!account.instance) errors.push(SaveTransactionSeriesErrors.TRANSACTION_SERIES_ACCOUNT_NOT_FOUND);
    if (!creditCard.instance) errors.push(SaveTransactionSeriesErrors.TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND);
    if (!subcategory.instance) errors.push(SaveTransactionSeriesErrors.TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND);

    return errors.length ? Result.fail(errors) : Result.ok();
  }
}
