import { Result, UseCase } from '@poupig/shared';
import { Account, AccountType } from '../model';
import { AccountRepository } from '../provider';

export const SaveAccountErrors = {
  ACCOUNT_NAME_ALREADY_EXISTS: 'ACCOUNT_NAME_ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export interface SaveAccountInput {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  description?: string;
  accountNumber?: string;
  agency?: string;
  financialInstitution?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export class SaveAccount implements UseCase<SaveAccountInput, void> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: SaveAccountInput): Promise<Result<void>> {
    const existingResult = await this.accountRepository.findById(input.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const existing = existingResult.instance;

    if (!existing) {
      // Create flow
      const duplicateResult = await this.accountRepository.findByNameAndUserId(input.name, input.userId);
      if (duplicateResult.isFailure) return Result.fail(duplicateResult.errors!);

      if (duplicateResult.instance !== null) {
        return Result.fail(SaveAccountErrors.ACCOUNT_NAME_ALREADY_EXISTS);
      }

      const accountResult = Account.tryCreate({
        ...input,
        isActive: true,
      });
      if (accountResult.isFailure) return Result.fail(accountResult.errors!);

      return this.accountRepository.save(accountResult.instance);
    } else {
      // Edit flow
      if (existing.userId !== input.userId) {
        return Result.fail(SaveAccountErrors.UNAUTHORIZED);
      }

      const updatedResult = existing.cloneWith({
        name: input.name,
        type: input.type,
        description: input.description,
        accountNumber: input.accountNumber,
        agency: input.agency,
        financialInstitution: input.financialInstitution,
        color: input.color,
        icon: input.icon,
        isActive: input.isActive ?? existing.isActive,
      });
      if (updatedResult.isFailure) return Result.fail(updatedResult.errors!);

      return this.accountRepository.save(updatedResult.instance);
    }
  }
}
