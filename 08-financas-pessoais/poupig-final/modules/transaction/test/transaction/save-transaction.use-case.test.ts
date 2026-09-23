import { Id, Result } from '@poupig/shared';
import {
  Direction,
  SaveTransaction,
  SaveTransactionErrors,
  SaveTransactionInput,
  Transaction,
  TransactionErrors,
  TransactionRepository,
  TransactionStatus,
} from '../../src';
import { InMemoryMovementReferencesQuery } from '../mock/in-memory-movement-references.query';
import { InMemoryTransactionRepository } from '../mock/in-memory-transaction.repository';

const userId = Id.createUUID();
const otherUserId = Id.createUUID();
const accountId = Id.createUUID();
const creditCardId = Id.createUUID();
const subcategoryId = Id.createUUID();

function input(overrides: Partial<SaveTransactionInput> = {}): SaveTransactionInput {
  return {
    userId,
    name: 'Mercado do mês',
    value: 320.4,
    direction: Direction.OUT,
    accountId,
    expectedOn: '2026-09-15',
    ...overrides,
  };
}

function setup() {
  const repository = new InMemoryTransactionRepository();
  const references = new InMemoryMovementReferencesQuery()
    .addAccount(accountId, userId)
    .addCreditCard(creditCardId, userId)
    .addSubcategory(subcategoryId, userId);
  const useCase = new SaveTransaction(repository, references);
  return { repository, references, useCase };
}

async function existingTransaction(repository: InMemoryTransactionRepository, overrides: Record<string, unknown> = {}) {
  const transaction = Transaction.create({ ...input(), ...overrides } as never);
  await repository.create(transaction);
  return transaction;
}

describe('SaveTransaction — create', () => {
  test('creates the transaction without id and returns the generated id', async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute(input());

    expect(result.isOk).toBe(true);
    const { id } = result.instance;
    expect(Id.tryCreate(id).isOk).toBe(true);
    const saved = await repository.findById(id);
    expect(saved.isOk).toBe(true);
    expect(saved.instance.userId).toBe(userId);
    expect(saved.instance.name).toBe('Mercado do mês');
    expect(saved.instance.status).toBe(TransactionStatus.PENDING);
    expect(repository.all()).toHaveLength(1);
  });

  test('checks only the account when credit card and subcategory are absent', async () => {
    const { references, useCase } = setup();

    const result = await useCase.execute(input({ creditCardId: '', subcategoryId: null }));

    expect(result.isOk).toBe(true);
    expect(references.checks).toEqual([{ kind: 'account', id: accountId, userId }]);
  });

  test('checks every informed reference and saves them', async () => {
    const { repository, references, useCase } = setup();

    const result = await useCase.execute(input({ creditCardId, subcategoryId }));

    expect(result.isOk).toBe(true);
    expect(references.checks.map((check) => check.kind).sort()).toEqual(['account', 'creditCard', 'subcategory']);
    const saved = await repository.findById(result.instance.id);
    expect(saved.instance.creditCardId).toBe(creditCardId);
    expect(saved.instance.subcategoryId).toBe(subcategoryId);
  });

  test('fails with the entity codes without checking references or persisting', async () => {
    const { repository, references, useCase } = setup();

    const result = await useCase.execute(input({ value: 0 }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual(['INVALID_MONEY_AMOUNT']);
    expect(references.checks).toHaveLength(0);
    expect(repository.all()).toHaveLength(0);
  });

  test('propagates a failure of the repository create', async () => {
    const references = new InMemoryMovementReferencesQuery().addAccount(accountId, userId);
    const repository: TransactionRepository = {
      create: async () => Result.fail('DATABASE_ERROR'),
      update: async () => Result.ok(),
      findById: async () => Result.fail(TransactionErrors.TRANSACTION_NOT_FOUND),
      delete: async () => Result.ok(),
    };

    const result = await new SaveTransaction(repository, references).execute(input());

    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });
});

describe('SaveTransaction — update', () => {
  test('updates the transaction with id, keeping id, userId and createdAt', async () => {
    const { repository, useCase } = setup();
    const existing = await existingTransaction(repository);

    const result = await useCase.execute(input({ id: existing.id, name: 'Feira' }));

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ id: existing.id });
    const saved = await repository.findById(existing.id);
    expect(saved.instance.name).toBe('Feira');
    expect(saved.instance.userId).toBe(userId);
    expect(saved.instance.createdAt).toEqual(existing.createdAt);
    expect(repository.all()).toHaveLength(1);
  });

  test('replaces every editable field, turning omitted optionals into null', async () => {
    const { repository, useCase } = setup();
    const existing = await existingTransaction(repository, {
      note: 'Pago no débito',
      creditCardId,
      subcategoryId,
      status: TransactionStatus.SETTLED,
      settledOn: '2026-09-15',
    });

    const result = await useCase.execute({
      id: existing.id,
      userId,
      name: 'Mercado do mês',
      value: 99.9,
      direction: Direction.IN,
      accountId,
      expectedOn: '2026-09-20',
    });

    expect(result.isOk).toBe(true);
    const saved = (await repository.findById(existing.id)).instance;
    expect(saved.note).toBeNull();
    expect(saved.creditCardId).toBeNull();
    expect(saved.subcategoryId).toBeNull();
    expect(saved.settledOn).toBeNull();
    expect(saved.status).toBe(TransactionStatus.PENDING);
    expect(saved.value).toBe(99.9);
    expect(saved.direction).toBe(Direction.IN);
    expect(saved.expectedOn).toBe('2026-09-20');
  });

  test('fails with TRANSACTION_NOT_FOUND for an id that does not exist, creating nothing', async () => {
    const { repository, references, useCase } = setup();

    const result = await useCase.execute(input({ id: Id.createUUID() }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
    expect(references.checks).toHaveLength(0);
  });

  test('treats a soft deleted transaction as not found', async () => {
    const { repository, useCase } = setup();
    const existing = await existingTransaction(repository);
    await repository.delete(existing.id);

    const result = await useCase.execute(input({ id: existing.id, name: 'Feira' }));

    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
  });

  test('treats a transaction of another user as not found and keeps it unchanged', async () => {
    const { repository, useCase } = setup();
    const existing = await existingTransaction(repository, { userId: otherUserId });

    const result = await useCase.execute(input({ id: existing.id, name: 'Feira' }));

    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_NOT_FOUND]);
    const stored = (await repository.findById(existing.id)).instance;
    expect(stored.name).toBe('Mercado do mês');
    expect(stored.userId).toBe(otherUserId);
  });

  test('propagates a technical failure of findById', async () => {
    const references = new InMemoryMovementReferencesQuery().addAccount(accountId, userId);
    const repository: TransactionRepository = {
      create: async () => Result.ok(),
      update: async () => Result.ok(),
      findById: async () => Result.fail('DATABASE_ERROR'),
      delete: async () => Result.ok(),
    };

    const result = await new SaveTransaction(repository, references).execute(input({ id: Id.createUUID() }));

    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });

  test('fails with the entity codes on update without checking references', async () => {
    const { repository, references, useCase } = setup();
    const existing = await existingTransaction(repository);

    const result = await useCase.execute(input({ id: existing.id, status: TransactionStatus.SETTLED }));

    expect(result.errors).toEqual([TransactionErrors.TRANSACTION_SETTLED_ON_REQUIRED]);
    expect(references.checks).toHaveLength(0);
    expect((await repository.findById(existing.id)).instance.status).toBe(TransactionStatus.PENDING);
  });
});

describe('SaveTransaction — references', () => {
  test('fails with TRANSACTION_ACCOUNT_NOT_FOUND for an account of another user, persisting nothing', async () => {
    const { repository, references, useCase } = setup();
    const foreignAccountId = Id.createUUID();
    references.addAccount(foreignAccountId, otherUserId);

    const result = await useCase.execute(input({ accountId: foreignAccountId }));

    expect(result.errors).toEqual([SaveTransactionErrors.TRANSACTION_ACCOUNT_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with TRANSACTION_CREDIT_CARD_NOT_FOUND for a missing or deleted credit card', async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute(input({ creditCardId: Id.createUUID() }));

    expect(result.errors).toEqual([SaveTransactionErrors.TRANSACTION_CREDIT_CARD_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with TRANSACTION_SUBCATEGORY_NOT_FOUND for a subcategory of another user', async () => {
    const { repository, references, useCase } = setup();
    const foreignSubcategoryId = Id.createUUID();
    references.addSubcategory(foreignSubcategoryId, otherUserId);

    const result = await useCase.execute(input({ subcategoryId: foreignSubcategoryId }));

    expect(result.errors).toEqual([SaveTransactionErrors.TRANSACTION_SUBCATEGORY_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('accumulates every invalid reference in a single failure', async () => {
    const { useCase } = setup();

    const result = await useCase.execute(
      input({ accountId: Id.createUUID(), creditCardId: Id.createUUID(), subcategoryId: Id.createUUID() }),
    );

    expect(result.errors).toEqual([
      SaveTransactionErrors.TRANSACTION_ACCOUNT_NOT_FOUND,
      SaveTransactionErrors.TRANSACTION_CREDIT_CARD_NOT_FOUND,
      SaveTransactionErrors.TRANSACTION_SUBCATEGORY_NOT_FOUND,
    ]);
  });

  test('does not update the existing transaction when a reference is invalid', async () => {
    const { repository, useCase } = setup();
    const existing = await existingTransaction(repository);

    const result = await useCase.execute(input({ id: existing.id, name: 'Feira', creditCardId: Id.createUUID() }));

    expect(result.errors).toEqual([SaveTransactionErrors.TRANSACTION_CREDIT_CARD_NOT_FOUND]);
    expect((await repository.findById(existing.id)).instance.name).toBe('Mercado do mês');
  });

  test('propagates a technical failure of the references query', async () => {
    const { repository, references, useCase } = setup();
    references.failure = 'DATABASE_ERROR';

    const result = await useCase.execute(input());

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('DATABASE_ERROR');
    expect(result.errors).not.toContain(SaveTransactionErrors.TRANSACTION_ACCOUNT_NOT_FOUND);
    expect(repository.all()).toHaveLength(0);
  });

  test('SaveTransactionErrors has exactly the three reference codes', () => {
    expect(SaveTransactionErrors).toEqual({
      TRANSACTION_ACCOUNT_NOT_FOUND: 'TRANSACTION_ACCOUNT_NOT_FOUND',
      TRANSACTION_CREDIT_CARD_NOT_FOUND: 'TRANSACTION_CREDIT_CARD_NOT_FOUND',
      TRANSACTION_SUBCATEGORY_NOT_FOUND: 'TRANSACTION_SUBCATEGORY_NOT_FOUND',
    });
  });
});
