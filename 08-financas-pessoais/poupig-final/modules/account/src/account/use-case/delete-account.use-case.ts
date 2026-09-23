import { Result, UseCase } from '@poupig/shared';
import { AccountRepository } from '../provider';

export const DeleteAccountErrors = {
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export interface DeleteAccountInput {
  id: string;
  userId: string;
}

export class DeleteAccount implements UseCase<DeleteAccountInput, void> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: DeleteAccountInput): Promise<Result<void>> {
    const existingResult = await this.accountRepository.findById(input.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const account = existingResult.instance;

    if (!account) {
      return Result.fail(DeleteAccountErrors.ACCOUNT_NOT_FOUND);
    }

    if (account.userId !== input.userId) {
      return Result.fail(DeleteAccountErrors.UNAUTHORIZED);
    }

    const deletedResult = account.softDelete();
    if (deletedResult.isFailure) return Result.fail(deletedResult.errors!);

    return this.accountRepository.save(deletedResult.instance);
  }
}
