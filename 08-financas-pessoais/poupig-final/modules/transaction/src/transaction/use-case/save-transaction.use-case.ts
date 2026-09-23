import { Result, UseCase } from '@poupig/shared';
import { Direction, MovementReferencesQuery, TransactionStatus } from '../../movement';
import { Transaction, TransactionErrors } from '../model';
import { TransactionRepository } from '../provider';

export const SaveTransactionErrors = {
  TRANSACTION_ACCOUNT_NOT_FOUND: 'TRANSACTION_ACCOUNT_NOT_FOUND',
  TRANSACTION_CREDIT_CARD_NOT_FOUND: 'TRANSACTION_CREDIT_CARD_NOT_FOUND',
  TRANSACTION_SUBCATEGORY_NOT_FOUND: 'TRANSACTION_SUBCATEGORY_NOT_FOUND',
} as const;

export interface SaveTransactionInput {
  id?: string;
  userId: string;
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

export interface SaveTransactionOutput {
  id: string;
}

export class SaveTransaction implements UseCase<SaveTransactionInput, SaveTransactionOutput> {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly movementReferences: MovementReferencesQuery,
  ) {}

  async execute(input: SaveTransactionInput): Promise<Result<SaveTransactionOutput>> {
    const isUpdate = Boolean(input.id);

    const transactionResult = isUpdate ? await this.buildUpdated(input) : this.buildNew(input);
    if (transactionResult.isFailure) return Result.fail(transactionResult.errors!);

    const transaction = transactionResult.instance;

    const referencesResult = await this.checkReferences(transaction);
    if (referencesResult.isFailure) return Result.fail(referencesResult.errors!);

    const persistResult = isUpdate
      ? await this.transactionRepository.update(transaction)
      : await this.transactionRepository.create(transaction);
    if (persistResult.isFailure) return Result.fail(persistResult.errors!);

    return Result.ok({ id: transaction.id });
  }

  private buildNew(input: SaveTransactionInput): Result<Transaction> {
    return Transaction.tryCreate({
      userId: input.userId,
      ...this.editableFields(input),
    });
  }

  private async buildUpdated(input: SaveTransactionInput): Promise<Result<Transaction>> {
    const existingResult = await this.transactionRepository.findById(input.id!);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const existing = existingResult.instance;

    if (existing.userId !== input.userId) {
      return Result.fail(TransactionErrors.TRANSACTION_NOT_FOUND);
    }

    // Full replacement of the editable fields: `id`, `userId` and `createdAt` come from the loaded entity.
    return existing.cloneWith({
      ...this.editableFields(input),
      updatedAt: new Date(),
    });
  }

  private editableFields(input: SaveTransactionInput) {
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

  private async checkReferences(transaction: Transaction): Promise<Result<void>> {
    const { userId, accountId, creditCardId, subcategoryId } = transaction;
    const notChecked = Promise.resolve(Result.ok(true));

    const [account, creditCard, subcategory] = await Promise.all([
      this.movementReferences.accountBelongsToUser(accountId, userId),
      creditCardId ? this.movementReferences.creditCardBelongsToUser(creditCardId, userId) : notChecked,
      subcategoryId ? this.movementReferences.subcategoryBelongsToUser(subcategoryId, userId) : notChecked,
    ]);

    const queries = Result.combine([account, creditCard, subcategory]);
    if (queries.isFailure) return Result.fail(queries.errors!);

    const errors: string[] = [];
    if (!account.instance) errors.push(SaveTransactionErrors.TRANSACTION_ACCOUNT_NOT_FOUND);
    if (!creditCard.instance) errors.push(SaveTransactionErrors.TRANSACTION_CREDIT_CARD_NOT_FOUND);
    if (!subcategory.instance) errors.push(SaveTransactionErrors.TRANSACTION_SUBCATEGORY_NOT_FOUND);

    return errors.length ? Result.fail(errors) : Result.ok();
  }
}
