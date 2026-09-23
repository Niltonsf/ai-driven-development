import { Id, Result } from '@poupig/shared';
import { Account, AccountType, DeleteAccount, DeleteAccountErrors, SaveAccount } from '../src/account';
import { AccountRepository } from '../src/account/provider';
import { InMemoryAccountRepository } from './mock/in-memory-account.repository';

const userId = Id.createUUID();

async function seedAccount(repository: InMemoryAccountRepository, id: string) {
  const save = new SaveAccount(repository);
  await save.execute({ id, userId, name: 'Conta', type: AccountType.CHECKING });
}

describe('DeleteAccount', () => {
  test('soft deletes an existing account owned by the user', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new DeleteAccount(repository);
    const id = Id.createUUID();
    await seedAccount(repository, id);

    const result = await useCase.execute({ id, userId });

    expect(result.isOk).toBe(true);
    const stored = await repository.findById(id);
    expect(stored.instance!.deletedAt).not.toBeNull();
  });

  test('fails when the account does not exist', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new DeleteAccount(repository);

    const result = await useCase.execute({ id: Id.createUUID(), userId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(DeleteAccountErrors.ACCOUNT_NOT_FOUND);
  });

  test('fails when the account belongs to another user', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new DeleteAccount(repository);
    const id = Id.createUUID();
    await seedAccount(repository, id);

    const result = await useCase.execute({ id, userId: Id.createUUID() });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(DeleteAccountErrors.UNAUTHORIZED);
  });

  test('propagates the failure when the lookup fails', async () => {
    const repository: AccountRepository = {
      save: async () => Result.ok(),
      findById: async () => Result.fail<Account | null>('FIND_FAILED'),
      findByNameAndUserId: async () => Result.ok(null),
      delete: async () => Result.ok(),
    };
    const useCase = new DeleteAccount(repository);

    const result = await useCase.execute({ id: Id.createUUID(), userId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_FAILED');
    expect(result.errors).not.toContain(DeleteAccountErrors.ACCOUNT_NOT_FOUND);
  });

  test('propagates the failure when soft-deleting the account fails', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new DeleteAccount(repository);
    const id = Id.createUUID();
    await seedAccount(repository, id);

    const stored = (await repository.findById(id)).instance!;
    jest.spyOn(stored, 'softDelete').mockReturnValue(Result.fail('SOFT_DELETE_FAILED'));

    const result = await useCase.execute({ id, userId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('SOFT_DELETE_FAILED');
  });
});
