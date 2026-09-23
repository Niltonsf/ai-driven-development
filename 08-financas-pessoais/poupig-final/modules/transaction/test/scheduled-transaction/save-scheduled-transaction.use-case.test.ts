import { Id, Result } from '@poupig/shared';
import {
  DayOfWeek,
  Direction,
  FrequencyUnit,
  SaveScheduledTransaction,
  SaveScheduledTransactionErrors,
  SaveScheduledTransactionInput,
  ScheduledTransactionErrors,
  SeriesKind,
  TransactionStatus,
} from '../../src';
import { InMemoryMovementReferencesQuery } from '../mock/in-memory-movement-references.query';
import { InMemoryScheduledTransactionRepository } from '../mock/in-memory-scheduled-transaction.repository';
import { InMemoryFindTransactionSeriesByIdQuery, seriesDTO } from '../mock/transaction-series-dto.fixture';
import { storeOccurrence } from './scheduled-transaction.fixture';

const userId = Id.createUUID();
const otherUserId = Id.createUUID();
const accountId = Id.createUUID();
const creditCardId = Id.createUUID();
const subcategoryId = Id.createUUID();

function setup() {
  const series = seriesDTO({ userId, accountId });
  const seriesQuery = new InMemoryFindTransactionSeriesByIdQuery().add(series);
  const repository = new InMemoryScheduledTransactionRepository().addSeries(series);
  const references = new InMemoryMovementReferencesQuery()
    .addAccount(accountId, userId)
    .addCreditCard(creditCardId, userId)
    .addSubcategory(subcategoryId, userId);
  const useCase = new SaveScheduledTransaction(
    repository,
    repository.findScheduledTransactionByOccurrence,
    seriesQuery,
    references,
  );

  const input = (overrides: Partial<SaveScheduledTransactionInput> = {}): SaveScheduledTransactionInput => ({
    seriesId: series.id,
    occurrenceIndex: 3,
    userId,
    id: Id.createUUID(),
    name: 'Notebook',
    value: 250,
    direction: Direction.OUT,
    accountId,
    expectedOn: '2027-01-10',
    ...overrides,
  });

  return { series, seriesQuery, repository, references, useCase, input };
}

describe('SaveScheduledTransaction — series and occurrence', () => {
  test('fails with SCHEDULED_TRANSACTION_SERIES_NOT_FOUND for a series of another user, saving nothing', async () => {
    const { seriesQuery, repository, references, useCase, input } = setup();
    const foreignSeries = seriesDTO({ userId: otherUserId });
    seriesQuery.add(foreignSeries);

    const result = await useCase.execute(input({ seriesId: foreignSeries.id }));

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
    expect(references.checks).toHaveLength(0);
  });

  test('fails with SCHEDULED_TRANSACTION_SERIES_NOT_FOUND for a soft deleted series', async () => {
    const { series, seriesQuery, repository, useCase, input } = setup();
    seriesQuery.softDelete(series.id);

    const result = await useCase.execute(input());

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with SCHEDULED_TRANSACTION_SERIES_NOT_FOUND for a series that does not exist', async () => {
    const { useCase, input } = setup();

    const result = await useCase.execute(input({ seriesId: Id.createUUID() }));

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND]);
  });

  test.each([12, -1, 1.5])(
    'fails with SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND for index %s outside an installment plan of 12',
    async (occurrenceIndex) => {
      const { repository, references, useCase, input } = setup();

      const result = await useCase.execute(input({ occurrenceIndex }));

      expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND]);
      expect(repository.all()).toHaveLength(0);
      expect(references.checks).toHaveLength(0);
    },
  );

  test('fails with SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND for an occurrence after the end of a recurrence', async () => {
    const { seriesQuery, repository, useCase, input } = setup();
    const recurrence = seriesDTO({
      userId,
      accountId,
      kind: SeriesKind.OPEN,
      recurrence: { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.MONDAY },
      installments: null,
      endDate: '2026-11-15',
    });
    seriesQuery.add(recurrence);

    const result = await useCase.execute(
      input({ seriesId: recurrence.id, occurrenceIndex: 8, expectedOn: '2026-11-16' }),
    );

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('ignores an occurrenceOn sent by the client', async () => {
    const { repository, useCase, input } = setup();

    const result = await useCase.execute({
      ...input(),
      occurrenceOn: '2027-01-25',
    } as SaveScheduledTransactionInput);

    expect(result.isOk).toBe(true);
    const saved = (await repository.findById(result.instance.id)).instance;
    expect(saved.occurrenceOn).toBe('2027-01-10');
  });

  test('propagates a technical failure of the series query', async () => {
    const { repository, references, input } = setup();
    const useCase = new SaveScheduledTransaction(
      repository,
      repository.findScheduledTransactionByOccurrence,
      { execute: async () => Result.fail('DATABASE_ERROR') },
      references,
    );

    const result = await useCase.execute(input());

    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });
});

describe('SaveScheduledTransaction — entity and references', () => {
  test('fails with the entity codes without checking references or saving', async () => {
    const { repository, references, useCase, input } = setup();

    const result = await useCase.execute(input({ value: 0 }));

    expect(result.errors).toEqual(['INVALID_MONEY_AMOUNT']);
    expect(references.checks).toHaveLength(0);
    expect(repository.all()).toHaveLength(0);
  });

  test('checks only the account when credit card and subcategory are absent', async () => {
    const { references, useCase, input } = setup();

    const result = await useCase.execute(input({ creditCardId: '', subcategoryId: null }));

    expect(result.isOk).toBe(true);
    expect(references.checks).toEqual([{ kind: 'account', id: accountId, userId }]);
  });

  test('checks every informed reference and saves them', async () => {
    const { repository, references, useCase, input } = setup();

    const result = await useCase.execute(input({ creditCardId, subcategoryId }));

    expect(result.isOk).toBe(true);
    expect(references.checks.map((check) => check.kind).sort()).toEqual(['account', 'creditCard', 'subcategory']);
    const saved = (await repository.findById(result.instance.id)).instance;
    expect(saved.creditCardId).toBe(creditCardId);
    expect(saved.subcategoryId).toBe(subcategoryId);
  });

  test('fails with SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND for an account of another user, saving nothing', async () => {
    const { repository, references, useCase, input } = setup();
    const foreignAccountId = Id.createUUID();
    references.addAccount(foreignAccountId, otherUserId);

    const result = await useCase.execute(input({ accountId: foreignAccountId }));

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND for a credit card that does not exist', async () => {
    const { repository, useCase, input } = setup();

    const result = await useCase.execute(input({ creditCardId: Id.createUUID() }));

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('fails with SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND for a subcategory of another user', async () => {
    const { repository, references, useCase, input } = setup();
    const foreignSubcategoryId = Id.createUUID();
    references.addSubcategory(foreignSubcategoryId, otherUserId);

    const result = await useCase.execute(input({ subcategoryId: foreignSubcategoryId }));

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND]);
    expect(repository.all()).toHaveLength(0);
  });

  test('does not update the stored occurrence when a reference is invalid', async () => {
    const { series, repository, useCase, input } = setup();
    const stored = await storeOccurrence(repository, series, 3, { value: 300 });

    const result = await useCase.execute(input({ id: stored.id, value: 400, creditCardId: Id.createUUID() }));

    expect(result.errors).toEqual([SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND]);
    expect((await repository.findById(stored.id)).instance.value).toBe(300);
  });

  test('SaveScheduledTransactionErrors has exactly the five codes', () => {
    expect(SaveScheduledTransactionErrors).toEqual({
      SCHEDULED_TRANSACTION_SERIES_NOT_FOUND: 'SCHEDULED_TRANSACTION_SERIES_NOT_FOUND',
      SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND: 'SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND',
      SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND: 'SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND',
      SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND: 'SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND',
      SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND: 'SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND',
    });
  });
});

describe('SaveScheduledTransaction — insert or update by occurrence', () => {
  test('first write creates the occurrence with the id of the payload', async () => {
    const { series, repository, useCase, input } = setup();
    const id = Id.createUUID();

    const result = await useCase.execute(input({ id, value: 300 }));

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ id });
    const saved = (await repository.findById(id)).instance;
    expect(saved.value).toBe(300);
    expect(saved.seriesId).toBe(series.id);
    expect(saved.occurrenceIndex).toBe(3);
    expect(saved.occurrenceOn).toBe('2027-01-10');
    expect(saved.userId).toBe(userId);
    expect(repository.all()).toHaveLength(1);
  });

  test('second write updates the same occurrence', async () => {
    const { repository, useCase, input } = setup();
    const id = Id.createUUID();
    await useCase.execute(input({ id, value: 300 }));

    const result = await useCase.execute(input({ id, value: 300, status: TransactionStatus.CANCELED }));

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ id });
    expect(repository.all()).toHaveLength(1);
    expect((await repository.findById(id)).instance.status).toBe(TransactionStatus.CANCELED);
  });

  test('an id of the client different from the stored one does not renumber the record', async () => {
    const { repository, useCase, input } = setup();
    const storedId = Id.createUUID();
    const clientId = Id.createUUID();
    await useCase.execute(input({ id: storedId, value: 300 }));

    const result = await useCase.execute(input({ id: clientId, value: 350 }));

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ id: storedId });
    expect((await repository.findById(clientId)).isFailure).toBe(true);
    expect(repository.all()).toHaveLength(1);
    expect((await repository.findById(storedId)).instance.value).toBe(350);
  });

  test('update clears omitted optionals and keeps the identity of the occurrence', async () => {
    const { series, repository, useCase, input } = setup();
    const stored = await storeOccurrence(repository, series, 3, { note: 'Loja', creditCardId });

    const result = await useCase.execute(
      input({ expectedOn: '2027-02-02', status: TransactionStatus.SETTLED, settledOn: '2027-02-02' }),
    );

    expect(result.instance).toEqual({ id: stored.id });
    const saved = (await repository.findById(stored.id)).instance;
    expect(saved.note).toBeNull();
    expect(saved.creditCardId).toBeNull();
    expect(saved.expectedOn).toBe('2027-02-02');
    expect(saved.status).toBe(TransactionStatus.SETTLED);
    expect(saved.settledOn).toBe('2027-02-02');
    expect(saved.id).toBe(stored.id);
    expect(saved.userId).toBe(stored.userId);
    expect(saved.seriesId).toBe(stored.seriesId);
    expect(saved.occurrenceIndex).toBe(3);
    expect(saved.occurrenceOn).toBe('2027-01-10');
    expect(saved.createdAt).toEqual(stored.createdAt);
  });

  test('update fails with the entity codes and keeps the stored occurrence', async () => {
    const { series, repository, useCase, input } = setup();
    const stored = await storeOccurrence(repository, series, 3);

    const result = await useCase.execute(input({ status: TransactionStatus.SETTLED }));

    expect(result.errors).toEqual([ScheduledTransactionErrors.SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED]);
    expect((await repository.findById(stored.id)).instance.status).toBe(TransactionStatus.PENDING);
  });

  test('propagates a failure of the repository', async () => {
    const { repository, useCase, input } = setup();
    repository.failure = 'DATABASE_ERROR';

    const result = await useCase.execute(input());

    expect(result.errors).toEqual(['DATABASE_ERROR']);
    expect(repository.all()).toHaveLength(0);
  });
});
