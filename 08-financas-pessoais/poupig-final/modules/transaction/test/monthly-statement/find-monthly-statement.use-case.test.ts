import { Id, Result } from '@poupig/shared';
import {
  DayOfWeek,
  Direction,
  FindMonthlyStatement,
  FindMonthlyStatementErrors,
  FindMonthlyStatementInput,
  FrequencyUnit,
  ListActiveTransactionSeriesQuery,
  ListScheduledTransactionsInPeriodQuery,
  ListTransactionsInput,
  ListTransactionsQuery,
  ScheduledTransactionDTO,
  ScheduledTransactionGenerator,
  SeriesKind,
  STATEMENT_MAX_ENTRIES,
  StatementEntryKind,
  StatementEntryMapper,
  TransactionDTO,
  TransactionSeriesDTO,
  TransactionStatus,
} from '../../src';
import { SeriesDTOOverrides, seriesDTO } from '../mock/transaction-series-dto.fixture';

const userId = Id.createUUID();
const itauAccountId = Id.createUUID();
const nubankAccountId = Id.createUUID();

const october2026 = { from: '2026-10-01', to: '2026-10-31' };
const november2026 = { from: '2026-11-01', to: '2026-11-30' };

function transactionDTO(overrides: Partial<TransactionDTO> = {}): TransactionDTO {
  return {
    id: Id.createUUID(),
    userId,
    name: 'Mercado',
    note: null,
    value: 120,
    direction: Direction.OUT,
    accountId: itauAccountId,
    accountName: 'Itaú',
    creditCardId: null,
    creditCardName: null,
    subcategoryId: null,
    subcategoryName: null,
    categoryName: null,
    status: TransactionStatus.PENDING,
    expectedOn: '2026-10-05',
    settledOn: null,
    createdAt: new Date('2026-09-01T12:00:00.000Z'),
    updatedAt: new Date('2026-09-01T12:00:00.000Z'),
    ...overrides,
  };
}

/** The installment plan of 12, monthly on day 10, starting on 2026-09-15: index 0 is 2026-10-10. */
function planSeries(overrides: SeriesDTOOverrides = {}): TransactionSeriesDTO {
  return seriesDTO({ userId, accountId: itauAccountId, accountName: 'Itaú', ...overrides });
}

/** The stored version of an occurrence, as the query of stored occurrences projects it. */
function storedDTO(
  series: TransactionSeriesDTO,
  occurrenceIndex: number,
  overrides: Partial<ScheduledTransactionDTO> = {},
): ScheduledTransactionDTO {
  const occurrenceOn = ScheduledTransactionGenerator.occurrenceDate(series, occurrenceIndex)!;
  const [generated] = ScheduledTransactionGenerator.generateForPeriod(
    series,
    { from: occurrenceOn, to: occurrenceOn },
    () => false,
  );
  return { ...ScheduledTransactionGenerator.toGeneratedDTO(generated, series), materialized: true, ...overrides };
}

function setup() {
  const transactions: TransactionDTO[] = [];
  const stored: ScheduledTransactionDTO[] = [];
  const series: TransactionSeriesDTO[] = [];
  const deletedSeries = new Set<string>();
  const transactionInputs: ListTransactionsInput[] = [];
  const inPeriod = (date: string, from: string, to: string) => from <= date && date <= to;

  // Double of the SQL of the standalone transactions: period, status and account, bounded by the page size.
  const listTransactions: ListTransactionsQuery = {
    execute: async (input) => {
      transactionInputs.push(input);
      const data = transactions
        .filter((item) => inPeriod(item.expectedOn, input.expectedFrom!, input.expectedTo!))
        .filter((item) => !input.status || item.status === input.status)
        .filter((item) => !input.accountId || item.accountId === input.accountId)
        .slice(0, input.pageSize);
      return Result.ok({
        data,
        meta: { page: input.page, pageSize: input.pageSize, total: data.length, totalPages: 1 },
      });
    },
  };

  const listScheduledTransactionsInPeriod: ListScheduledTransactionsInPeriodQuery = {
    execute: async ({ from, to }) =>
      Result.ok(
        stored.filter(
          (item) =>
            !deletedSeries.has(item.seriesId) &&
            (inPeriod(item.expectedOn, from, to) || inPeriod(item.occurrenceOn, from, to)),
        ),
      ),
  };

  const listActiveTransactionSeries: ListActiveTransactionSeriesQuery = {
    execute: async ({ from, to }) =>
      Result.ok(
        series.filter(
          (item) =>
            !deletedSeries.has(item.id) && item.startDate <= to && (item.endDate === null || item.endDate >= from),
        ),
      ),
  };

  const useCase = new FindMonthlyStatement(listTransactions, listScheduledTransactionsInPeriod, listActiveTransactionSeries);
  const execute = (input: Partial<FindMonthlyStatementInput> & { from: string; to: string }) =>
    useCase.execute({ userId, ...input });

  return { transactions, stored, series, deletedSeries, transactionInputs, execute, listTransactions };
}

describe('FindMonthlyStatement — period', () => {
  test.each([
    ['without from', { from: '', to: '2026-09-30' }],
    ['with an absent from', { from: undefined as unknown as string, to: '2026-09-30' }],
    ['with an impossible date', { from: '2026-09-31', to: '2026-09-30' }],
    ['with from after to', { from: '2026-09-30', to: '2026-09-01' }],
    ['with a date outside the YYYY-MM-DD format', { from: '2026-9-1', to: '2026-09-30' }],
  ])('fails with INVALID_STATEMENT_PERIOD %s, querying nothing', async (_, period) => {
    const { transactionInputs, execute } = setup();

    const result = await execute(period);

    expect(result.errors).toEqual([FindMonthlyStatementErrors.INVALID_STATEMENT_PERIOD]);
    expect(transactionInputs).toHaveLength(0);
  });

  test('FindMonthlyStatementErrors has only INVALID_STATEMENT_PERIOD and the ceiling is 500', () => {
    expect(FindMonthlyStatementErrors).toEqual({ INVALID_STATEMENT_PERIOD: 'INVALID_STATEMENT_PERIOD' });
    expect(STATEMENT_MAX_ENTRIES).toBe(500);
  });

  test('queries the standalone transactions of the period with the filters and the ceiling as page size', async () => {
    const { transactionInputs, execute } = setup();
    const creditCardId = Id.createUUID();

    await execute({
      ...october2026,
      search: 'net',
      direction: 'OUT',
      status: 'PENDING',
      accountId: itauAccountId,
      creditCardId,
      onlyCreditCard: true,
    });

    expect(transactionInputs).toEqual([
      {
        userId,
        page: 1,
        pageSize: 500,
        expectedFrom: '2026-10-01',
        expectedTo: '2026-10-31',
        search: 'net',
        direction: 'OUT',
        status: 'PENDING',
        accountId: itauAccountId,
        creditCardId,
        onlyCreditCard: true,
      },
    ]);
  });
});

describe('FindMonthlyStatement — composition', () => {
  test('a month with only standalone transactions', async () => {
    const { transactions, execute } = setup();
    transactions.push(transactionDTO({ expectedOn: '2026-09-05' }), transactionDTO({ expectedOn: '2026-09-20' }));

    const result = await execute({ from: '2026-09-01', to: '2026-09-30' });

    expect(result.isOk).toBe(true);
    expect(result.instance.data.map((item) => item.kind)).toEqual([
      StatementEntryKind.TRANSACTION,
      StatementEntryKind.TRANSACTION,
    ]);
    expect(result.instance.meta).toEqual({ page: 1, pageSize: 500, total: 2, totalPages: 1 });
  });

  test('a month with only generated occurrences', async () => {
    const { series, stored, execute } = setup();
    const plan = planSeries();
    series.push(plan);

    const result = await execute(october2026);

    expect(result.instance.data).toHaveLength(1);
    const [entry] = result.instance.data;
    expect(entry.kind).toBe(StatementEntryKind.SCHEDULED);
    expect(entry.seriesId).toBe(plan.id);
    expect(entry.occurrenceIndex).toBe(0);
    expect(entry.expectedOn).toBe('2026-10-10');
    expect(entry.status).toBe(TransactionStatus.PENDING);
    expect(stored).toHaveLength(0);
  });

  test('a mixed month', async () => {
    const { transactions, series, execute } = setup();
    transactions.push(transactionDTO({ expectedOn: '2026-10-05' }));
    series.push(planSeries());

    const result = await execute(october2026);

    expect(result.instance.data.map((item) => item.kind).sort()).toEqual([
      StatementEntryKind.SCHEDULED,
      StatementEntryKind.TRANSACTION,
    ]);
    expect(result.instance.meta.total).toBe(2);
  });

  test('a stored occurrence suppresses the generated one', async () => {
    const { series, stored, execute } = setup();
    const plan = planSeries();
    series.push(plan);
    const override = storedDTO(plan, 0, { value: 300 });
    stored.push(override);

    const result = await execute(october2026);

    const entries = result.instance.data.filter((item) => item.seriesId === plan.id && item.occurrenceIndex === 0);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(override.id);
    expect(entries[0].value).toBe(300);
  });

  test('an occurrence moved to the next month leaves its month and is not generated again', async () => {
    const { series, stored, execute } = setup();
    const plan = planSeries();
    series.push(plan);
    const moved = storedDTO(plan, 0, { expectedOn: '2026-11-02' });
    stored.push(moved);

    const october = await execute(october2026);
    const november = await execute(november2026);

    expect(october.instance.data.filter((item) => item.seriesId === plan.id)).toEqual([]);
    const novemberOccurrences = november.instance.data.filter((item) => item.seriesId === plan.id);
    expect(novemberOccurrences.map((item) => [item.occurrenceIndex, item.expectedOn])).toEqual([
      [1, '2026-11-10'],
      [0, '2026-11-02'],
    ]);
    expect(novemberOccurrences[1].id).toBe(moved.id);
    expect(novemberOccurrences[1].occurrenceOn).toBe('2026-10-10');
  });

  test('a stored occurrence hidden by a filter still suppresses the generated one', async () => {
    const { series, stored, execute } = setup();
    const plan = planSeries();
    series.push(plan);
    stored.push(storedDTO(plan, 0, { status: TransactionStatus.CANCELED }));

    const result = await execute({ ...october2026, status: 'PENDING' });

    expect(result.instance.data).toEqual([]);
  });

  test('the status filter excludes the generated occurrences', async () => {
    const { transactions, series, execute } = setup();
    series.push(planSeries());
    const settled = transactionDTO({ status: TransactionStatus.SETTLED, settledOn: '2026-10-05' });
    transactions.push(settled);

    const result = await execute({ ...october2026, status: 'SETTLED' });

    expect(result.instance.data.map((item) => item.id)).toEqual([settled.id]);
  });

  test('the account filter applies to both kinds', async () => {
    const { transactions, series, stored, execute } = setup();
    const itauTransaction = transactionDTO({ accountId: itauAccountId });
    transactions.push(itauTransaction, transactionDTO({ accountId: nubankAccountId, accountName: 'Nubank' }));
    const itauPlan = planSeries({ name: 'Plano Itaú' });
    const nubankPlan = planSeries({ name: 'Plano Nubank', accountId: nubankAccountId, accountName: 'Nubank' });
    const storedNubankPlan = planSeries({ name: 'Gravado Nubank', accountId: nubankAccountId, accountName: 'Nubank' });
    series.push(itauPlan, nubankPlan, storedNubankPlan);
    stored.push(storedDTO(storedNubankPlan, 0, { value: 99 }));

    const result = await execute({ ...october2026, accountId: itauAccountId });

    expect(result.instance.data.map((item) => item.accountId)).toEqual([itauAccountId, itauAccountId]);
    expect(result.instance.data.map((item) => item.kind).sort()).toEqual([
      StatementEntryKind.SCHEDULED,
      StatementEntryKind.TRANSACTION,
    ]);
  });

  test('a soft deleted series disappears from the statement', async () => {
    const { series, stored, deletedSeries, execute } = setup();
    const weekly = planSeries({
      kind: SeriesKind.OPEN,
      recurrence: { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.MONDAY },
      installments: null,
    });
    series.push(weekly);
    stored.push(storedDTO(weekly, 2, { value: 300 }));
    deletedSeries.add(weekly.id);

    const result = await execute(october2026);

    expect(result.instance.data).toEqual([]);
  });

  test('propagates a technical failure of a query', async () => {
    const { series, execute } = setup();
    series.push(planSeries());
    const failing = new FindMonthlyStatement(
      { execute: async () => Result.fail('DATABASE_ERROR') },
      { execute: async () => Result.ok([]) },
      { execute: async () => Result.ok([]) },
    );

    const result = await failing.execute({ userId, ...october2026 });

    expect(result.errors).toEqual(['DATABASE_ERROR']);
    expect((await execute(october2026)).isOk).toBe(true);
  });
});

describe('FindMonthlyStatement — ordering and ceiling', () => {
  test('a tie of date keeps standalone, stored and generated in this order', async () => {
    const { transactions, series, stored, execute } = setup();
    const storedPlan = planSeries({ name: 'Gravada' });
    const generatedPlan = planSeries({ name: 'Gerada' });
    // The generated series comes first in its query: the result must not depend on that.
    series.push(generatedPlan, storedPlan);
    stored.push(storedDTO(storedPlan, 0));
    transactions.push(transactionDTO({ name: 'Avulsa', expectedOn: '2026-10-10' }));

    const result = await execute(october2026);

    expect(result.instance.data.map((item) => item.name)).toEqual(['Avulsa', 'Gravada', 'Gerada']);
  });

  test('different dates are sorted by expected date desc', async () => {
    const { transactions, series, execute } = setup();
    transactions.push(transactionDTO({ name: 'Avulsa', expectedOn: '2026-10-05' }));
    series.push(
      planSeries({ name: 'Gerada', recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 20 } }),
    );

    const result = await execute(october2026);

    expect(result.instance.data.map((item) => [item.name, item.expectedOn])).toEqual([
      ['Gerada', '2026-10-20'],
      ['Avulsa', '2026-10-05'],
    ]);
  });

  test('cuts the statement at the ceiling after sorting', async () => {
    const { transactions, series, execute } = setup();
    // 450 standalone transactions over the month + 14 weekly series on Thursday (5 in October 2026) = 520 entries.
    for (let index = 0; index < 450; index++) {
      const day = String((index % 31) + 1).padStart(2, '0');
      transactions.push(transactionDTO({ name: `Avulsa ${index}`, expectedOn: `2026-10-${day}` }));
    }
    for (let index = 0; index < 14; index++) {
      series.push(
        planSeries({
          name: `Semanal ${index}`,
          kind: SeriesKind.OPEN,
          recurrence: { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.THURSDAY },
          startDate: '2026-10-01',
          installments: null,
        }),
      );
    }
    const allDates = [
      ...transactions.map((item) => item.expectedOn),
      ...Array.from({ length: 14 }).flatMap(() => ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22', '2026-10-29']),
    ];
    expect(allDates).toHaveLength(520);

    const result = await execute(october2026);

    expect(result.instance.data).toHaveLength(500);
    expect(result.instance.meta).toEqual({ page: 1, pageSize: 500, total: 500, totalPages: 1 });
    const expectedDates = [...allDates].sort().reverse().slice(0, 500);
    expect(result.instance.data.map((item) => item.expectedOn)).toEqual(expectedDates);
  });
});

describe('StatementEntryMapper', () => {
  test('converts a standalone transaction with the whole series block null', () => {
    const transaction = transactionDTO({ note: 'Feira' });

    const entry = StatementEntryMapper.fromTransaction(transaction);

    expect(entry).toEqual({
      id: transaction.id,
      kind: StatementEntryKind.TRANSACTION,
      name: transaction.name,
      note: 'Feira',
      value: transaction.value,
      direction: transaction.direction,
      accountId: transaction.accountId,
      accountName: transaction.accountName,
      creditCardId: null,
      creditCardName: null,
      subcategoryId: null,
      subcategoryName: null,
      categoryName: null,
      status: transaction.status,
      expectedOn: transaction.expectedOn,
      settledOn: null,
      seriesId: null,
      seriesName: null,
      seriesKind: null,
      occurrenceIndex: null,
      occurrenceOn: null,
      installments: null,
    });
  });

  test('converts an installment of a plan with the series block filled', () => {
    const plan = planSeries();
    const occurrence = storedDTO(plan, 2);

    const entry = StatementEntryMapper.fromScheduled(occurrence);

    expect(entry.kind).toBe(StatementEntryKind.SCHEDULED);
    expect(entry.id).toBe(occurrence.id);
    expect(entry.occurrenceIndex).toBe(2);
    expect(entry.installments).toBe(12);
    expect(entry.seriesId).toBe(plan.id);
    expect(entry.seriesName).toBe('Notebook');
    expect(entry.seriesKind).toBe(SeriesKind.CLOSED);
    expect(entry.occurrenceOn).toBe('2026-12-10');
  });
});
