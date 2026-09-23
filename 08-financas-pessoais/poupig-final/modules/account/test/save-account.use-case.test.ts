import { Id, Result } from '@poupig/shared';
import { Account, AccountType, SaveAccount, SaveAccountErrors } from '../src/account';
import { AccountRepository } from '../src/account/provider';
import { InMemoryAccountRepository } from './mock/in-memory-account.repository';

const userId = Id.createUUID();

function baseInput(overrides: Partial<Parameters<SaveAccount['execute']>[0]> = {}) {
  return {
    id: Id.createUUID(),
    userId,
    name: 'Conta Corrente',
    type: AccountType.CHECKING,
    ...overrides,
  } as Parameters<SaveAccount['execute']>[0];
}

class ScriptedAccountRepository implements AccountRepository {
  constructor(
    private readonly findByIdResult: () => Result<Account | null>,
    private readonly findByNameResult: () => Result<Account | null> = () => Result.ok(null),
  ) {}

  async save(): Promise<Result<void>> {
    return Result.ok();
  }
  async findById(): Promise<Result<Account | null>> {
    return this.findByIdResult();
  }
  async findByNameAndUserId(): Promise<Result<Account | null>> {
    return this.findByNameResult();
  }
  async delete(): Promise<Result<void>> {
    return Result.ok();
  }
}

describe('SaveAccount — create flow', () => {
  test('creates a new account and persists it as active', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new SaveAccount(repository);
    const id = Id.createUUID();

    const result = await useCase.execute(baseInput({ id, name: 'Nubank' }));

    expect(result.isOk).toBe(true);
    const saved = await repository.findById(id);
    expect(saved.instance!.name).toBe('Nubank');
    expect(saved.instance!.isActive).toBe(true);
  });

  test('fails when the user already has an account with the same name', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new SaveAccount(repository);

    await useCase.execute(baseInput({ name: 'Itaú' }));
    const result = await useCase.execute(baseInput({ name: 'Itaú' }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SaveAccountErrors.ACCOUNT_NAME_ALREADY_EXISTS);
  });

  test('fails when the account cannot be built from the input', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new SaveAccount(repository);

    const result = await useCase.execute(baseInput({ name: '' }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).not.toContain(SaveAccountErrors.ACCOUNT_NAME_ALREADY_EXISTS);
  });

  test('propagates the failure when the initial lookup fails', async () => {
    const repository = new ScriptedAccountRepository(() => Result.fail('FIND_BY_ID_FAILED'));
    const useCase = new SaveAccount(repository);

    const result = await useCase.execute(baseInput());

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_BY_ID_FAILED');
  });

  test('propagates the failure when the duplicate-name lookup fails', async () => {
    const repository = new ScriptedAccountRepository(
      () => Result.ok(null),
      () => Result.fail('FIND_BY_NAME_FAILED'),
    );
    const useCase = new SaveAccount(repository);

    const result = await useCase.execute(baseInput());

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_BY_NAME_FAILED');
  });
});

describe('SaveAccount — edit flow', () => {
  test('updates an existing account owned by the user', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new SaveAccount(repository);
    const id = Id.createUUID();

    await useCase.execute(baseInput({ id, name: 'Conta Antiga' }));
    const result = await useCase.execute(baseInput({ id, name: 'Conta Nova', isActive: false }));

    expect(result.isOk).toBe(true);
    const updated = await repository.findById(id);
    expect(updated.instance!.name).toBe('Conta Nova');
    expect(updated.instance!.isActive).toBe(false);
  });

  test('keeps the current isActive when the update omits it', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new SaveAccount(repository);
    const id = Id.createUUID();

    // Create forces isActive=true; a first update turns it off, so the second
    // (which omits isActive) must preserve that inactive state.
    await useCase.execute(baseInput({ id, name: 'Conta' }));
    await useCase.execute(baseInput({ id, name: 'Conta', isActive: false }));
    const result = await useCase.execute(baseInput({ id, name: 'Conta Renomeada' }));

    expect(result.isOk).toBe(true);
    const updated = await repository.findById(id);
    expect(updated.instance!.isActive).toBe(false);
  });

  test('fails when the account belongs to another user', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new SaveAccount(repository);
    const id = Id.createUUID();

    await useCase.execute(baseInput({ id, name: 'Conta' }));
    const result = await useCase.execute(baseInput({ id, userId: Id.createUUID(), name: 'Conta' }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SaveAccountErrors.UNAUTHORIZED);
  });

  test('fails when the updated fields are invalid', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new SaveAccount(repository);
    const id = Id.createUUID();

    await useCase.execute(baseInput({ id, name: 'Conta' }));
    const result = await useCase.execute(baseInput({ id, name: '', color: 'invalid' }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).not.toContain(SaveAccountErrors.UNAUTHORIZED);
  });
});
