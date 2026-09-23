import { Id, Result } from '@poupig/shared';
import {
  CashFlowCalendar,
  DayOfWeek,
  Direction,
  FindMonthlyStatement,
  FrequencyUnit,
  ListActiveTransactionSeriesInput,
  ListActiveTransactionSeriesQuery,
  ListMaterializedOccurrenceKeysInput,
  ListMaterializedOccurrenceKeysQuery,
  ListScheduledTransactionsInPeriodQuery,
  ListTransactionsQuery,
  MonthlyCashFlowDTO,
  ScheduledTransactionDTO,
  ScheduledTransactionGenerator,
  SeriesKind,
  StoredMonthlyCashFlow,
  SummarizeMonthlyCashFlow,
  SummarizeMonthlyCashFlowErrors,
  SummarizeStoredCashFlowInput,
  SummarizeStoredCashFlowQuery,
  TransactionDTO,
  TransactionSeriesDTO,
  TransactionStatus,
} from '../../src';
import { SeriesDTOOverrides, seriesDTO } from '../mock/transaction-series-dto.fixture';

const userId = Id.createUUID();
const accountId = Id.createUUID();

function transactionDTO(overrides: Partial<TransactionDTO> = {}): TransactionDTO {
  return {
    id: Id.createUUID(),
    userId,
    name: 'Mercado',
    note: null,
    value: 120,
    direction: Direction.OUT,
    accountId,
    accountName: 'Itaú',
    creditCardId: null,
    creditCardName: null,
    subcategoryId: null,
    subcategoryName: null,
    categoryName: null,
    status: TransactionStatus.PENDING,
    expectedOn: '2026-09-05',
    settledOn: null,
    createdAt: new Date('2026-09-01T12:00:00.000Z'),
    updatedAt: new Date('2026-09-01T12:00:00.000Z'),
    ...overrides,
  };
}

/**
 * The installment plan of 12 × R$ 300,00, monthly on day 10, starting on
 * 2026-09-15: index 0 is 2026-10-10, index 1 is 2026-11-10 and index 2 is 2026-12-10.
 */
function planSeries(overrides: SeriesDTOOverrides = {}): TransactionSeriesDTO {
  return seriesDTO({ userId, accountId, accountName: 'Itaú', value: 300, ...overrides });
}

/** The stored version of an occurrence, as the queries of stored occurrences project it. */
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

/** Sums reais through integer cents, so the test does not carry floating point drift. */
function sumInCents(values: number[]): number {
  return values.reduce((total, value) => total + Math.round(value * 100), 0) / 100;
}

/**
 * One in-memory storage (standalone transactions, stored occurrences and
 * series) feeding the doubles of the report queries **and** of the statement
 * queries, each one applying its own contract:
 *
 * - stored sum: by `expectedOn`, without `CANCELED`;
 * - materialized keys: by `occurrenceOn`, any status;
 * - stored occurrences of the statement: `expectedOn` **or** `occurrenceOn`;
 * - every query ignores the soft deleted series.
 */
function setup() {
  const transactions: TransactionDTO[] = [];
  const stored: ScheduledTransactionDTO[] = [];
  const series: TransactionSeriesDTO[] = [];
  const deletedSeries = new Set<string>();
  const inPeriod = (date: string, from: string, to: string) => from <= date && date <= to;
  const visibleStored = () => stored.filter((item) => !deletedSeries.has(item.seriesId));

  const storedInputs: SummarizeStoredCashFlowInput[] = [];
  const keyInputs: ListMaterializedOccurrenceKeysInput[] = [];
  const seriesInputs: ListActiveTransactionSeriesInput[] = [];

  const summarizeStoredCashFlow: SummarizeStoredCashFlowQuery = {
    execute: async (input) => {
      storedInputs.push(input);
      const rows = [...transactions, ...visibleStored()].filter(
        (item) => item.status !== TransactionStatus.CANCELED && inPeriod(item.expectedOn, input.from, input.to),
      );
      const months = [...new Set(rows.map((item) => CashFlowCalendar.monthKeyOf(item.expectedOn)))];
      const summary: StoredMonthlyCashFlow[] = months.map((month) => {
        const ofMonth = rows.filter((item) => CashFlowCalendar.monthKeyOf(item.expectedOn) === month);
        const valuesOf = (direction: Direction) =>
          ofMonth.filter((item) => item.direction === direction).map((item) => item.value);
        return { month, inflow: sumInCents(valuesOf(Direction.IN)), outflow: sumInCents(valuesOf(Direction.OUT)) };
      });
      return Result.ok(summary);
    },
  };

  const listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery = {
    execute: async (input) => {
      keyInputs.push(input);
      return Result.ok(
        visibleStored()
          .filter((item) => inPeriod(item.occurrenceOn, input.from, input.to))
          .map((item) => ({ seriesId: item.seriesId, occurrenceIndex: item.occurrenceIndex })),
      );
    },
  };

  const listActiveTransactionSeries: ListActiveTransactionSeriesQuery = {
    execute: async (input) => {
      seriesInputs.push(input);
      return Result.ok(
        series.filter(
          (item) =>
            !deletedSeries.has(item.id) &&
            item.startDate <= input.to &&
            (item.endDate === null || item.endDate >= input.from),
        ),
      );
    },
  };

  const listTransactions: ListTransactionsQuery = {
    execute: async (input) => {
      const data = transactions
        .filter((item) => inPeriod(item.expectedOn, input.expectedFrom!, input.expectedTo!))
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
        visibleStored().filter((item) => inPeriod(item.expectedOn, from, to) || inPeriod(item.occurrenceOn, from, to)),
      ),
  };

  const useCase = new SummarizeMonthlyCashFlow(
    summarizeStoredCashFlow,
    listMaterializedOccurrenceKeys,
    listActiveTransactionSeries,
  );
  const statement = new FindMonthlyStatement(
    listTransactions,
    listScheduledTransactionsInPeriod,
    listActiveTransactionSeries,
  );

  const execute = (reference: string, months: number) => useCase.execute({ userId, reference, months });
  const queriedNothing = () => storedInputs.length + keyInputs.length + seriesInputs.length === 0;

  return {
    transactions,
    stored,
    series,
    deletedSeries,
    storedInputs,
    keyInputs,
    seriesInputs,
    queriedNothing,
    execute,
    statement,
  };
}

/** The buckets as a map `month → [inflow, outflow]`, for short assertions. */
function byMonth(buckets: MonthlyCashFlowDTO[]): Record<string, [number, number]> {
  return Object.fromEntries(buckets.map((bucket) => [bucket.month, [bucket.inflow, bucket.outflow]]));
}

describe('SummarizeMonthlyCashFlow — input', () => {
  test('SummarizeMonthlyCashFlowErrors has exactly the two codes with values equal to their keys', () => {
    expect(SummarizeMonthlyCashFlowErrors).toEqual({
      INVALID_REPORT_REFERENCE: 'INVALID_REPORT_REFERENCE',
      INVALID_REPORT_WINDOW: 'INVALID_REPORT_WINDOW',
    });
  });

  test.each([['2026-13'], ['2026-9'], ['2026-09-01'], [''], [undefined as unknown as string]])(
    'fails with INVALID_REPORT_REFERENCE for the reference %p, querying nothing',
    async (reference) => {
      const { execute, queriedNothing } = setup();

      const result = await execute(reference, 12);

      expect(result.errors).toEqual([SummarizeMonthlyCashFlowErrors.INVALID_REPORT_REFERENCE]);
      expect(queriedNothing()).toBe(true);
    },
  );

  test.each([[7], [0], [-6], [12.5], [NaN]])(
    'fails with INVALID_REPORT_WINDOW for the window %p, querying nothing',
    async (months) => {
      const { execute, queriedNothing } = setup();

      const result = await execute('2026-09', months);

      expect(result.errors).toEqual([SummarizeMonthlyCashFlowErrors.INVALID_REPORT_WINDOW]);
      expect(queriedNothing()).toBe(true);
    },
  );

  test('checks the reference before the window', async () => {
    const { execute, queriedNothing } = setup();

    const result = await execute('2026-13', 7);

    expect(result.errors).toEqual([SummarizeMonthlyCashFlowErrors.INVALID_REPORT_REFERENCE]);
    expect(queriedNothing()).toBe(true);
  });

  test('passes the period of the whole window to the three queries', async () => {
    const { execute, storedInputs, keyInputs, seriesInputs } = setup();

    await execute('2026-09', 12);

    const period = { userId, from: '2025-10-01', to: '2026-09-30' };
    expect(storedInputs).toEqual([period]);
    expect(keyInputs).toEqual([period]);
    expect(seriesInputs).toEqual([period]);
  });
});

describe('SummarizeMonthlyCashFlow — buckets', () => {
  test('a user without movement gets every month of the window, ascending and zeroed', async () => {
    const { execute } = setup();

    const result = await execute('2026-09', 12);

    expect(result.isOk).toBe(true);
    expect(result.instance).toHaveLength(12);
    expect(result.instance.map((bucket) => bucket.month)).toEqual(CashFlowCalendar.periodOf('2026-09', 12).monthKeys);
    expect(result.instance[0].month).toBe('2025-10');
    expect(result.instance[11].month).toBe('2026-09');
    expect(result.instance.every((bucket) => bucket.inflow === 0 && bucket.outflow === 0 && bucket.balance === 0)).toBe(
      true,
    );
  });

  test('stored rows are summed in the month of their expected date', async () => {
    const { transactions, stored, execute } = setup();
    const income = seriesDTO({ userId, direction: Direction.IN, value: 50, startDate: '2026-09-01' });
    transactions.push(
      transactionDTO({ expectedOn: '2026-08-12', value: 100 }),
      transactionDTO({ expectedOn: '2026-09-30', value: 40 }),
      transactionDTO({ expectedOn: '2026-10-01', direction: Direction.IN, value: 70 }),
    );
    // Stored only: the series is not active in the query, so nothing is generated.
    stored.push(storedDTO(income, 0));
    expect(stored[0].expectedOn).toBe('2026-09-10');

    const result = await execute('2026-10', 6);

    expect(byMonth(result.instance)).toEqual({
      '2026-05': [0, 0],
      '2026-06': [0, 0],
      '2026-07': [0, 0],
      '2026-08': [0, 100],
      '2026-09': [50, 40],
      '2026-10': [70, 0],
    });
  });

  test('standalone transactions pending and settled enter, canceled does not', async () => {
    const { transactions, execute } = setup();
    transactions.push(
      transactionDTO({
        direction: Direction.IN,
        value: 5000,
        status: TransactionStatus.SETTLED,
        settledOn: '2026-09-05',
      }),
      transactionDTO({ value: 200, status: TransactionStatus.PENDING }),
      transactionDTO({ value: 80, status: TransactionStatus.CANCELED }),
    );

    const result = await execute('2026-09', 6);

    expect(result.instance.find((bucket) => bucket.month === '2026-09')).toEqual({
      month: '2026-09',
      inflow: 5000,
      outflow: 200,
      balance: 4800,
    });
  });

  test('a series without stored occurrences appears in every month it occurs', async () => {
    const { series, execute } = setup();
    series.push(planSeries());

    const result = await execute('2026-12', 6);

    expect(byMonth(result.instance)).toEqual({
      '2026-07': [0, 0],
      '2026-08': [0, 0],
      '2026-09': [0, 0],
      '2026-10': [0, 300],
      '2026-11': [0, 300],
      '2026-12': [0, 300],
    });
  });

  test('an installment plan stops at its last installment', async () => {
    const { series, execute } = setup();
    const plan = planSeries({
      installments: 2,
      startDate: '2026-08-01',
      recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 5 },
    });
    series.push(plan);
    expect(ScheduledTransactionGenerator.occurrenceDate(plan, 0)).toBe('2026-08-05');
    expect(ScheduledTransactionGenerator.occurrenceDate(plan, 1)).toBe('2026-09-05');

    const result = await execute('2026-12', 6);

    expect(byMonth(result.instance)).toEqual({
      '2026-07': [0, 0],
      '2026-08': [0, 300],
      '2026-09': [0, 300],
      '2026-10': [0, 0],
      '2026-11': [0, 0],
      '2026-12': [0, 0],
    });
  });

  test('an open series stops at its end date', async () => {
    const { series, execute } = setup();
    const salary = planSeries({
      name: 'Salário',
      direction: Direction.IN,
      value: 5000,
      kind: SeriesKind.OPEN,
      installments: null,
      recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 5 },
      startDate: '2026-07-01',
      endDate: '2026-10-20',
    });
    series.push(salary);
    expect(salary.endDate).toBe('2026-10-20');

    const result = await execute('2026-12', 6);

    expect(byMonth(result.instance)).toEqual({
      '2026-07': [5000, 0],
      '2026-08': [5000, 0],
      '2026-09': [5000, 0],
      '2026-10': [5000, 0],
      '2026-11': [0, 0],
      '2026-12': [0, 0],
    });
  });
});

describe('SummarizeMonthlyCashFlow — suppression', () => {
  test('a stored occurrence with a changed value is not counted twice', async () => {
    const { series, stored, execute } = setup();
    const plan = planSeries();
    series.push(plan);
    stored.push(storedDTO(plan, 1, { value: 350 }));
    expect(stored[0].expectedOn).toBe('2026-11-10');

    const result = await execute('2026-12', 6);

    expect(byMonth(result.instance)['2026-11']).toEqual([0, 350]);
  });

  test('an occurrence moved to the next month leaves its month and is not generated again', async () => {
    const { series, stored, execute } = setup();
    const plan = planSeries();
    series.push(plan);
    stored.push(storedDTO(plan, 0, { expectedOn: '2026-11-02' }), storedDTO(plan, 1, { value: 350 }));
    expect(stored[0].occurrenceOn).toBe('2026-10-10');

    const result = await execute('2026-12', 6);

    expect(byMonth(result.instance)['2026-10']).toEqual([0, 0]);
    expect(byMonth(result.instance)['2026-11']).toEqual([0, 650]);
  });

  test('an occurrence moved out of the window still suppresses its generation', async () => {
    const { series, stored, execute } = setup();
    const plan = planSeries();
    series.push(plan);
    stored.push(storedDTO(plan, 2, { expectedOn: '2027-01-04' }));

    const result = await execute('2026-12', 6);

    expect(byMonth(result.instance)['2026-12']).toEqual([0, 0]);
  });

  test('a CANCELED occurrence is neither summed nor generated again', async () => {
    const { series, stored, execute } = setup();
    const plan = planSeries();
    series.push(plan);
    stored.push(storedDTO(plan, 2, { status: TransactionStatus.CANCELED }));
    expect(stored[0].expectedOn).toBe('2026-12-10');

    const result = await execute('2026-12', 6);

    expect(byMonth(result.instance)['2026-12']).toEqual([0, 0]);
    expect(byMonth(result.instance)['2026-11']).toEqual([0, 300]);
  });
});

describe('SummarizeMonthlyCashFlow — failures', () => {
  const ok = <T>(value: T) => ({ execute: async () => Result.ok(value) });
  const failing = { execute: async () => Result.fail('DATABASE_ERROR') };

  test.each([
    ['the stored sum', () => new SummarizeMonthlyCashFlow(failing, ok([]), ok([]))],
    ['the materialized keys', () => new SummarizeMonthlyCashFlow(ok([]), failing, ok([]))],
    ['the active series', () => new SummarizeMonthlyCashFlow(ok([]), ok([]), failing)],
  ])('propagates a failure of %s without partial buckets', async (_, build) => {
    const result = await build().execute({ userId, reference: '2026-09', months: 12 });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });
});

describe('SummarizeMonthlyCashFlow — equivalence with the monthly statement', () => {
  test('every bucket equals the non-canceled inflows and outflows of the statement of its month', async () => {
    const { transactions, stored, series, deletedSeries, execute, statement } = setup();

    // Standalone transactions, including both edges of the window, one canceled and one outside the window.
    transactions.push(
      transactionDTO({ expectedOn: '2026-07-01', value: 0.1 }),
      transactionDTO({ expectedOn: '2026-07-31', value: 0.2 }),
      transactionDTO({
        expectedOn: '2026-09-05',
        direction: Direction.IN,
        value: 5000,
        status: TransactionStatus.SETTLED,
        settledOn: '2026-09-05',
      }),
      transactionDTO({ expectedOn: '2026-09-18', value: 200 }),
      transactionDTO({ expectedOn: '2026-09-20', value: 80, status: TransactionStatus.CANCELED }),
      transactionDTO({ expectedOn: '2026-12-31', direction: Direction.IN, value: 1234.56 }),
      transactionDTO({ expectedOn: '2026-06-30', value: 999 }),
    );

    // A plan with a changed value, one moved to the next month and one canceled.
    const plan = planSeries();
    // A salary without anything stored.
    const salary = planSeries({
      name: 'Salário',
      direction: Direction.IN,
      value: 5000,
      kind: SeriesKind.OPEN,
      installments: null,
      recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 5 },
      startDate: '2026-07-01',
      endDate: '2026-10-20',
    });
    // An older plan whose first occurrence (2026-06-10) was moved into the window.
    const olderPlan = planSeries({ name: 'Geladeira', value: 99.9, startDate: '2026-05-15', installments: 3 });
    // A weekly series soft deleted, with a stored occurrence.
    const weekly = planSeries({
      name: 'Feira',
      kind: SeriesKind.OPEN,
      installments: null,
      recurrence: { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.SATURDAY },
    });
    series.push(plan, salary, olderPlan, weekly);
    deletedSeries.add(weekly.id);
    stored.push(
      storedDTO(plan, 0, { expectedOn: '2026-11-02' }),
      storedDTO(plan, 1, { value: 350 }),
      storedDTO(plan, 2, { status: TransactionStatus.CANCELED }),
      storedDTO(olderPlan, 0, { expectedOn: '2026-07-02' }),
      storedDTO(weekly, 1, { value: 45 }),
    );
    expect(stored[3].occurrenceOn).toBe('2026-06-10');

    const report = await execute('2026-12', 6);
    expect(report.isOk).toBe(true);

    for (const bucket of report.instance) {
      const [year, month] = bucket.month.split('-').map(Number) as [number, number];
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const monthStatement = await statement.execute({
        userId,
        from: `${bucket.month}-01`,
        to: `${bucket.month}-${String(lastDay).padStart(2, '0')}`,
      });
      expect(monthStatement.isOk).toBe(true);

      const counted = monthStatement.instance.data.filter((entry) => entry.status !== TransactionStatus.CANCELED);
      const valuesOf = (direction: Direction) =>
        counted.filter((entry) => entry.direction === direction).map((entry) => entry.value);

      expect([bucket.month, bucket.inflow, bucket.outflow]).toEqual([
        bucket.month,
        sumInCents(valuesOf(Direction.IN)),
        sumInCents(valuesOf(Direction.OUT)),
      ]);
    }

    // The mass really moves every kind of source: a guard against a vacuous comparison.
    expect(byMonth(report.instance)).toEqual({
      '2026-07': [5000, 200.1],
      '2026-08': [5000, 99.9],
      '2026-09': [10000, 200],
      '2026-10': [5000, 0],
      '2026-11': [0, 650],
      '2026-12': [1234.56, 0],
    });
  });
});
