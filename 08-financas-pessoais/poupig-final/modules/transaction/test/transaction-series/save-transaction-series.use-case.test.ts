import { Id, Result } from '@poupig/shared';
import {
  DayOfWeek,
  Direction,
  FrequencyUnit,
  SaveTransactionSeries,
  SaveTransactionSeriesErrors,
  SaveTransactionSeriesInput,
  SeriesKind,
  TransactionSeries,
  TransactionSeriesErrors,
  TransactionSeriesRepository,
} from '../../src';
import { InMemoryMovementReferencesQuery } from '../mock/in-memory-movement-references.query';
import { InMemoryTransactionSeriesRepository } from '../mock/in-memory-transaction-series.repository';

const userId = Id.createUUID();
const otherUserId = Id.createUUID();
const accountId = Id.createUUID();
const creditCardId = Id.createUUID();
const subcategoryId = Id.createUUID();

const monthlyOnTenth = { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 10 };

function input(overrides: Partial<SaveTransactionSeriesInput> = {}): SaveTransactionSeriesInput {
  return {
    userId,
    name: 'Assinatura de streaming',
    value: 39.9,
    direction: Direction.OUT,
    accountId,
    kind: SeriesKind.CLOSED,
    recurrence: monthlyOnTenth,
    startDate: '2026-09-15',
    installments: 12,
    ...overrides,
  };
}

function setup() {
  const repository = new InMemoryTransactionSeriesRepository();
  const references = new InMemoryMovementReferencesQuery()
    .addAccount(accountId, userId)
    .addCreditCard(creditCardId, userId)
    .addSubcategory(subcategoryId, userId);
  const useCase = new SaveTransactionSeries(repository, references);
  return { repository, references, useCase };
}

async function existingSeries(repository: InMemoryTransactionSeriesRepository, overrides: Record<string, unknown> = {}) {
  const series = TransactionSeries.create({ ...input(), ...overrides } as never);
  await repository.create(series);
  return series;
}

function failingRepository(overrides: Partial<TransactionSeriesRepository> = {}): TransactionSeriesRepository {
  return {
    create: async () => Result.ok(),
    update: async () => Result.ok(),
    findById: async () => Result.fail(TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND),
    delete: async () => Result.ok(),
    ...overrides,
  };
}

describe('SaveTransactionSeries — create', () => {
  test('creates the series without id and returns the generated id', async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute(input());

    expect(result.isOk).toBe(true);
    const { id } = result.instance;
    expect(Id.tryCreate(id).isOk).toBe(true);
    const saved = await repository.findById(id);
    expect(saved.isOk).toBe(true);
    expect(saved.instance.userId).toBe(userId);
    expect(saved.instance.name).toBe('Assinatura de streaming');
    expect(repository.all()).toHaveLength(1);
  });

  test('the returned id loads the series with its installments and calculated end date', async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute(input({ installments: 12 }));

    const saved = (await repository.findById(result.instance.id)).instance;
    expect(saved.installments).toBe(12);
    expect(saved.endDate).toBe('2027-09-10');
  });

  test('creates an endless recurrence discarding the installments', async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute(
      input({
        kind: SeriesKind.OPEN,
        recurrence: { unit: FrequencyUnit.WEEK, interval: 2, weekDay: DayOfWeek.MONDAY },
        installments: 12,
      }),
    );

    expect(result.isOk).toBe(true);
    const saved = (await repository.findById(result.instance.id)).instance;
    expect(saved.installments).toBeNull();
    expect(saved.endDate).toBeNull();
  });

  test('always uses the userId received by the use case', async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute(input());

    expect((await repository.findById(result.instance.id)).instance.userId).toBe(userId);
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
    const saved = (await repository.findById(result.instance.id)).instance;
    expect(saved.creditCardId).toBe(creditCardId);
    expect(saved.subcategoryId).toBe(subcategoryId);
  });

  test('propagates a failure of the repository create', async () => {
    const references = new InMemoryMovementReferencesQuery().addAccount(accountId, userId);
    const repository = failingRepository({ create: async () => Result.fail('DATABASE_ERROR') });

    const result = await new SaveTransactionSeries(repository, references).execute(input());

    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });
});

describe('SaveTransactionSeries — update', () => {
  test('updates the series with id, keeping id, userId and createdAt', async () => {
    const { repository, useCase } = setup();
    const existing = await existingSeries(repository);

    const result = await useCase.execute(input({ id: existing.id, name: 'Academia' }));

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ id: existing.id });
    const saved = (await repository.findById(existing.id)).instance;
    expect(saved.name).toBe('Academia');
    expect(saved.userId).toBe(userId);
    expect(saved.createdAt).toEqual(existing.createdAt);
    expect(repository.all()).toHaveLength(1);
  });

  test('recalculates the end date when the installments change', async () => {
    const { repository, useCase } = setup();
    const existing = await existingSeries(repository);
    expect(existing.endDate).toBe('2027-09-10');

    const result = await useCase.execute(input({ id: existing.id, installments: 6 }));

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ id: existing.id });
    expect((await repository.findById(existing.id)).instance.endDate).toBe('2027-03-10');
  });

  test('replaces every editable field, turning omitted optionals into null', async () => {
    const { repository, useCase } = setup();
    const existing = await existingSeries(repository, { note: 'Plano anual', creditCardId, subcategoryId });

    const result = await useCase.execute({
      id: existing.id,
      userId,
      name: 'Assinatura de streaming',
      value: 59.9,
      direction: Direction.IN,
      accountId,
      kind: SeriesKind.CLOSED,
      recurrence: monthlyOnTenth,
      startDate: '2026-09-15',
      installments: 12,
    });

    expect(result.isOk).toBe(true);
    const saved = (await repository.findById(existing.id)).instance;
    expect(saved.note).toBeNull();
    expect(saved.creditCardId).toBeNull();
    expect(saved.subcategoryId).toBeNull();
    expect(saved.value).toBe(59.9);
    expect(saved.direction).toBe(Direction.IN);
  });

  test('fails with TRANSACTION_SERIES_NOT_FOUND for an id that does not exist, creating nothing', async () => {
    const { repository, references, useCase } = setup();

    const result = await useCase.execute(input({ id: Id.createUUID() }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
    expect(references.checks).toHaveLength(0);
  });

  test('treats a soft deleted series as not found', async () => {
    const { repository, useCase } = setup();
    const existing = await existingSeries(repository);
    await repository.delete(existing.id);

    const result = await useCase.execute(input({ id: existing.id, name: 'Academia' }));

    expect(result.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND]);
  });

  test('treats a series of another user as not found and keeps it unchanged', async () => {
    const { repository, useCase } = setup();
    const existing = await existingSeries(repository, { userId: otherUserId });

    const result = await useCase.execute(input({ id: existing.id, name: 'Academia' }));

    expect(result.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND]);
    const stored = (await repository.findById(existing.id)).instance;
    expect(stored.name).toBe('Assinatura de streaming');
    expect(stored.userId).toBe(otherUserId);
  });

  test('propagates a technical failure of findById', async () => {
    const references = new InMemoryMovementReferencesQuery().addAccount(accountId, userId);
    const repository = failingRepository({ findById: async () => Result.fail('DATABASE_ERROR') });

    const result = await new SaveTransactionSeries(repository, references).execute(input({ id: Id.createUUID() }));

    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });
});

describe('SaveTransactionSeries — references', () => {
  test('fails with the entity codes without checking references or persisting', async () => {
    const { repository, references, useCase } = setup();

    const result = await useCase.execute(input({ installments: undefined }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([TransactionSeriesErrors.TRANSACTION_SERIES_INSTALLMENTS_REQUIRED]);
    expect(references.checks).toHaveLength(0);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with TRANSACTION_SERIES_ACCOUNT_NOT_FOUND for an account of another user', async () => {
    const { repository, references, useCase } = setup();
    const foreignAccountId = Id.createUUID();
    references.addAccount(foreignAccountId, otherUserId);

    const result = await useCase.execute(input({ accountId: foreignAccountId }));

    expect(result.errors).toEqual([SaveTransactionSeriesErrors.TRANSACTION_SERIES_ACCOUNT_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND for a missing or deleted card', async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute(input({ creditCardId: Id.createUUID() }));

    expect(result.errors).toEqual([SaveTransactionSeriesErrors.TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND for a subcategory of another user', async () => {
    const { repository, references, useCase } = setup();
    const foreignSubcategoryId = Id.createUUID();
    references.addSubcategory(foreignSubcategoryId, otherUserId);

    const result = await useCase.execute(input({ subcategoryId: foreignSubcategoryId }));

    expect(result.errors).toEqual([SaveTransactionSeriesErrors.TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('accumulates every invalid reference in a single failure', async () => {
    const { useCase } = setup();

    const result = await useCase.execute(
      input({ accountId: Id.createUUID(), creditCardId: Id.createUUID(), subcategoryId: Id.createUUID() }),
    );

    expect(result.errors).toEqual([
      SaveTransactionSeriesErrors.TRANSACTION_SERIES_ACCOUNT_NOT_FOUND,
      SaveTransactionSeriesErrors.TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND,
      SaveTransactionSeriesErrors.TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND,
    ]);
  });

  test('does not update the existing series when a reference is invalid', async () => {
    const { repository, useCase } = setup();
    const existing = await existingSeries(repository);

    const result = await useCase.execute(input({ id: existing.id, name: 'Academia', creditCardId: Id.createUUID() }));

    expect(result.errors).toEqual([SaveTransactionSeriesErrors.TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND]);
    expect((await repository.findById(existing.id)).instance.name).toBe('Assinatura de streaming');
  });

  test('propagates a technical failure of the references query', async () => {
    const { repository, references, useCase } = setup();
    references.failure = 'DATABASE_ERROR';

    const result = await useCase.execute(input());

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('DATABASE_ERROR');
    expect(result.errors).not.toContain(SaveTransactionSeriesErrors.TRANSACTION_SERIES_ACCOUNT_NOT_FOUND);
    expect(repository.all()).toHaveLength(0);
  });

  test('SaveTransactionSeriesErrors has exactly the three reference codes', () => {
    expect(SaveTransactionSeriesErrors).toEqual({
      TRANSACTION_SERIES_ACCOUNT_NOT_FOUND: 'TRANSACTION_SERIES_ACCOUNT_NOT_FOUND',
      TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND: 'TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND',
      TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND: 'TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND',
    });
  });
});
