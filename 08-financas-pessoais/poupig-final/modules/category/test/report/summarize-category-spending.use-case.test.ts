import { Id, Result } from '@poupig/shared';
import {
  DayOfWeek,
  Direction,
  FrequencyUnit,
  ListActiveTransactionSeriesInput,
  ListActiveTransactionSeriesQuery,
  ListMaterializedOccurrenceKeysInput,
  ListMaterializedOccurrenceKeysQuery,
  ScheduledTransactionGenerator,
  SeriesKind,
  TransactionSeriesDTO,
  TransactionStatus,
} from '@poupig/transaction';
import {
  CategorySpendingSliceDTO,
  FindSubcategoryAppearancesInput,
  FindSubcategoryAppearancesQuery,
  StoredSubcategorySpending,
  SubcategoryAppearance,
  SummarizeCategorySpending,
  SummarizeCategorySpendingErrors,
  SummarizeStoredCategorySpendingInput,
  SummarizeStoredCategorySpendingQuery,
} from '../../src';
import { SeriesDTOOverrides, seriesDTO } from '../mock/transaction-series-dto.fixture';

const userId = Id.createUUID();
const september = { from: '2026-09-01', to: '2026-09-30' };

/** The fields of a stored row (standalone transaction or stored occurrence) the report queries read. */
interface StoredRow {
  subcategoryId: string | null;
  value: number;
  direction: Direction;
  status: TransactionStatus;
  expectedOn: string;
  /** Only in stored occurrences. */
  occurrence?: { seriesId: string; occurrenceIndex: number; occurrenceOn: string };
}

function transaction(overrides: Partial<StoredRow> = {}): StoredRow {
  return {
    subcategoryId: null,
    value: 100,
    direction: Direction.OUT,
    status: TransactionStatus.PENDING,
    expectedOn: '2026-09-10',
    ...overrides,
  };
}

/** The stored version of an occurrence of the series, as the storage keeps it. */
function storedOccurrence(
  series: TransactionSeriesDTO,
  occurrenceIndex: number,
  overrides: Partial<StoredRow> = {},
): StoredRow {
  const occurrenceOn = ScheduledTransactionGenerator.occurrenceDate(series, occurrenceIndex)!;
  return {
    subcategoryId: series.subcategoryId,
    value: series.value,
    direction: series.direction,
    status: TransactionStatus.PENDING,
    expectedOn: occurrenceOn,
    occurrence: { seriesId: series.id, occurrenceIndex, occurrenceOn },
    ...overrides,
  };
}

function outflowSeries(overrides: SeriesDTOOverrides = {}): TransactionSeriesDTO {
  return seriesDTO({ userId, ...overrides });
}

function appearance(
  categoryName: string,
  subcategoryName: string,
  overrides: Partial<SubcategoryAppearance> = {},
): SubcategoryAppearance {
  return {
    categoryId: Id.createUUID(),
    categoryName,
    categoryColor: '#22C55E',
    categoryIcon: 'utensils',
    subcategoryId: Id.createUUID(),
    subcategoryName,
    subcategoryColor: '#22C55E',
    subcategoryIcon: 'shopping-cart',
    ...overrides,
  };
}

/** Sums reais through integer cents, so the stub does not carry floating point drift. */
function sumInCents(values: number[]): number {
  return values.reduce((total, value) => total + Math.round(value * 100), 0) / 100;
}

/**
 * One in-memory storage (stored rows, series and appearances) feeding the
 * doubles of the four queries, each one applying its own contract:
 *
 * - stored sum: only `OUT`, by `expectedOn`, without `CANCELED`, per `subcategoryId`;
 * - materialized keys: by `occurrenceOn`, any status;
 * - active series: both directions, as the real query;
 * - appearances: only the requested ids that are known.
 */
function setup() {
  const rows: StoredRow[] = [];
  const series: TransactionSeriesDTO[] = [];
  const appearances: SubcategoryAppearance[] = [];
  const inPeriod = (date: string, from: string, to: string) => from <= date && date <= to;

  const storedInputs: SummarizeStoredCategorySpendingInput[] = [];
  const keyInputs: ListMaterializedOccurrenceKeysInput[] = [];
  const seriesInputs: ListActiveTransactionSeriesInput[] = [];
  const appearanceInputs: FindSubcategoryAppearancesInput[] = [];

  const summarizeStoredCategorySpending: SummarizeStoredCategorySpendingQuery = {
    execute: async (input) => {
      storedInputs.push(input);
      const counted = rows.filter(
        (row) =>
          row.direction === Direction.OUT &&
          row.status !== TransactionStatus.CANCELED &&
          inPeriod(row.expectedOn, input.from, input.to),
      );
      const ids = [...new Set(counted.map((row) => row.subcategoryId))];
      const summary: StoredSubcategorySpending[] = ids.map((subcategoryId) => ({
        subcategoryId,
        total: sumInCents(counted.filter((row) => row.subcategoryId === subcategoryId).map((row) => row.value)),
      }));
      return Result.ok(summary);
    },
  };

  const listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery = {
    execute: async (input) => {
      keyInputs.push(input);
      return Result.ok(
        rows
          .flatMap((row) => (row.occurrence ? [row.occurrence] : []))
          .filter((occurrence) => inPeriod(occurrence.occurrenceOn, input.from, input.to))
          .map(({ seriesId, occurrenceIndex }) => ({ seriesId, occurrenceIndex })),
      );
    },
  };

  const listActiveTransactionSeries: ListActiveTransactionSeriesQuery = {
    execute: async (input) => {
      seriesInputs.push(input);
      return Result.ok(
        series.filter((item) => item.startDate <= input.to && (item.endDate === null || item.endDate >= input.from)),
      );
    },
  };

  const findSubcategoryAppearances: FindSubcategoryAppearancesQuery = {
    execute: async (input) => {
      appearanceInputs.push(input);
      return Result.ok(appearances.filter((item) => input.subcategoryIds.includes(item.subcategoryId)));
    },
  };

  const useCase = new SummarizeCategorySpending(
    summarizeStoredCategorySpending,
    listMaterializedOccurrenceKeys,
    listActiveTransactionSeries,
    findSubcategoryAppearances,
  );

  /** September 2026 unless a raw period is given: no default parameter, so an `undefined` end really travels. */
  const execute = (period: { from: string; to: string } = september) => useCase.execute({ userId, ...period });
  const queriedNothing = () =>
    storedInputs.length + keyInputs.length + seriesInputs.length + appearanceInputs.length === 0;

  return {
    rows,
    series,
    appearances,
    storedInputs,
    keyInputs,
    seriesInputs,
    appearanceInputs,
    queriedNothing,
    execute,
  };
}

/** The rows as `[subcategoryName, total]` pairs, in the order of the result. */
function totals(slices: CategorySpendingSliceDTO[]): [string | null, number][] {
  return slices.map((slice) => [slice.subcategoryName, slice.total]);
}

const unclassified = (total: number): CategorySpendingSliceDTO => ({
  categoryId: null,
  categoryName: null,
  categoryColor: null,
  categoryIcon: null,
  subcategoryId: null,
  subcategoryName: null,
  subcategoryColor: null,
  subcategoryIcon: null,
  total,
});

describe('SummarizeCategorySpending — input', () => {
  test('SummarizeCategorySpendingErrors has exactly the period code with a value equal to its key', () => {
    expect(SummarizeCategorySpendingErrors).toEqual({
      INVALID_CATEGORY_REPORT_PERIOD: 'INVALID_CATEGORY_REPORT_PERIOD',
    });
  });

  test.each([
    ['2026-09-30', '2026-09-01'],
    ['2026-13-01', '2026-13-31'],
    ['2026-02-01', '2026-02-30'],
    ['', '2026-09-30'],
    [undefined as unknown as string, '2026-09-30'],
    ['2026-9-1', '2026-09-30'],
    ['2028-01-01', '2029-01-01'],
  ])('fails with INVALID_CATEGORY_REPORT_PERIOD for %p – %p, querying nothing', async (from, to) => {
    const { execute, queriedNothing } = setup();

    const result = await execute({ from, to });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([SummarizeCategorySpendingErrors.INVALID_CATEGORY_REPORT_PERIOD]);
    expect(queriedNothing()).toBe(true);
  });

  test('passes the user and the period to the three queries of the period', async () => {
    const { execute, storedInputs, keyInputs, seriesInputs } = setup();

    await execute();

    const period = { userId, ...september };
    expect(storedInputs).toEqual([period]);
    expect(keyInputs).toEqual([period]);
    expect(seriesInputs).toEqual([period]);
  });
});

describe('SummarizeCategorySpending — sums', () => {
  test('a period without anything returns an empty list, without looking up appearances', async () => {
    const { execute, appearanceInputs } = setup();

    const result = await execute();

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual([]);
    expect(appearanceInputs).toEqual([]);
  });

  test('an outflow series without anything stored sums in its subcategory, with the appearance', async () => {
    const { series, appearances, execute } = setup();
    const rent = appearance('Moradia', 'Aluguel', { categoryColor: null, subcategoryIcon: null });
    appearances.push(rent);
    series.push(outflowSeries({ subcategoryId: rent.subcategoryId }));

    const result = await execute();

    expect(result.instance).toEqual([{ ...rent, total: 1500 }]);
  });

  test('stored pending and settled outflows of the same subcategory are summed', async () => {
    const { rows, appearances, execute } = setup();
    const market = appearance('Alimentação', 'Supermercado');
    appearances.push(market);
    rows.push(
      transaction({ subcategoryId: market.subcategoryId, value: 100 }),
      transaction({ subcategoryId: market.subcategoryId, value: 50, status: TransactionStatus.SETTLED }),
    );

    const result = await execute();

    expect(totals(result.instance)).toEqual([['Supermercado', 150]]);
  });

  test('stored 0.10 and generated 0.20 in the same subcategory are exactly 0.3', async () => {
    const { rows, series, appearances, execute } = setup();
    const coffee = appearance('Alimentação', 'Café');
    appearances.push(coffee);
    rows.push(transaction({ subcategoryId: coffee.subcategoryId, value: 0.1 }));
    series.push(outflowSeries({ subcategoryId: coffee.subcategoryId, value: 0.2 }));

    const result = await execute();

    expect(result.instance).toHaveLength(1);
    expect(result.instance[0].total).toBe(0.3);
  });

  test('every generated occurrence inside the period is summed', async () => {
    const { series, appearances, execute } = setup();
    const market = appearance('Alimentação', 'Feira');
    appearances.push(market);
    series.push(
      outflowSeries({
        subcategoryId: market.subcategoryId,
        value: 45.5,
        startDate: '2026-08-01',
        recurrence: { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.SATURDAY },
      }),
    );

    const result = await execute();

    // Saturdays of September 2026: 5, 12, 19 and 26.
    expect(totals(result.instance)).toEqual([['Feira', 182]]);
  });

  test('an inflow series generates nothing, and stored inflows are not summed', async () => {
    const { rows, series, appearances, execute, appearanceInputs } = setup();
    const salary = appearance('Renda', 'Salário');
    appearances.push(salary);
    series.push(outflowSeries({ subcategoryId: salary.subcategoryId, direction: Direction.IN, value: 5000 }));
    rows.push(transaction({ subcategoryId: salary.subcategoryId, direction: Direction.IN, value: 300 }));

    const result = await execute();

    expect(result.instance).toEqual([]);
    expect(appearanceInputs).toEqual([]);
  });

  test('a canceled standalone outflow is not summed', async () => {
    const { rows, appearances, execute } = setup();
    const market = appearance('Alimentação', 'Supermercado');
    appearances.push(market);
    rows.push(transaction({ subcategoryId: market.subcategoryId, status: TransactionStatus.CANCELED }));

    const result = await execute();

    expect(result.instance).toEqual([]);
  });
});

describe('SummarizeCategorySpending — suppression', () => {
  test('a stored occurrence with a changed value replaces the generated one, once', async () => {
    const { rows, series, appearances, execute } = setup();
    const rent = appearance('Moradia', 'Aluguel');
    appearances.push(rent);
    const plan = outflowSeries({ subcategoryId: rent.subcategoryId });
    series.push(plan);
    rows.push(storedOccurrence(plan, 8, { value: 1550 }));
    expect(rows[0].expectedOn).toBe('2026-09-05');

    const result = await execute();

    expect(totals(result.instance)).toEqual([['Aluguel', 1550]]);
  });

  test('a CANCELED stored occurrence is neither summed nor generated again', async () => {
    const { rows, series, appearances, execute } = setup();
    const rent = appearance('Moradia', 'Aluguel');
    appearances.push(rent);
    const plan = outflowSeries({ subcategoryId: rent.subcategoryId });
    series.push(plan);
    rows.push(storedOccurrence(plan, 8, { status: TransactionStatus.CANCELED }));

    const result = await execute();

    expect(result.instance).toEqual([]);
  });

  test('an occurrence moved out of the period still suppresses its generation', async () => {
    const { rows, series, appearances, execute } = setup();
    const rent = appearance('Moradia', 'Aluguel');
    appearances.push(rent);
    const plan = outflowSeries({ subcategoryId: rent.subcategoryId });
    series.push(plan);
    rows.push(storedOccurrence(plan, 8, { expectedOn: '2026-10-02' }));

    const result = await execute();

    expect(result.instance).toEqual([]);
  });
});

describe('SummarizeCategorySpending — unclassified bucket', () => {
  test('a standalone outflow and a series without subcategory are summed in a single null row', async () => {
    const { rows, series, execute, appearanceInputs } = setup();
    rows.push(transaction({ value: 80 }));
    series.push(outflowSeries({ subcategoryId: null, value: 20 }));

    const result = await execute();

    expect(result.instance).toEqual([unclassified(100)]);
    expect(appearanceInputs).toEqual([]);
  });

  test('a subcategory whose appearance is not found is summed in the null row', async () => {
    const { rows, appearances, execute } = setup();
    const market = appearance('Alimentação', 'Supermercado');
    appearances.push(market);
    rows.push(
      transaction({ subcategoryId: market.subcategoryId, value: 300 }),
      transaction({ subcategoryId: Id.createUUID(), value: 40.25 }),
      transaction({ value: 9.75 }),
    );

    const result = await execute();

    expect(result.instance).toEqual([{ ...market, total: 300 }, unclassified(50)]);
  });

  test('looks up the appearance only of the non-null ids, for the user', async () => {
    const { rows, series, appearances, execute, appearanceInputs } = setup();
    const market = appearance('Alimentação', 'Supermercado');
    const rent = appearance('Moradia', 'Aluguel');
    appearances.push(market, rent);
    rows.push(transaction({ subcategoryId: market.subcategoryId }), transaction());
    series.push(outflowSeries({ subcategoryId: rent.subcategoryId }));

    await execute();

    expect(appearanceInputs).toHaveLength(1);
    expect(appearanceInputs[0].userId).toBe(userId);
    expect([...appearanceInputs[0].subcategoryIds].sort()).toEqual([market.subcategoryId, rent.subcategoryId].sort());
  });
});

describe('SummarizeCategorySpending — order', () => {
  test('orders by total, then by category and subcategory names', async () => {
    const { rows, appearances, execute } = setup();
    const fuel = appearance('Transporte', 'Combustível');
    const market = appearance('Alimentação', 'Supermercado');
    const bakery = appearance('Alimentação', 'Padaria');
    appearances.push(fuel, market, bakery);
    rows.push(
      transaction({ subcategoryId: fuel.subcategoryId, value: 100 }),
      transaction({ subcategoryId: market.subcategoryId, value: 300 }),
      transaction({ subcategoryId: bakery.subcategoryId, value: 100 }),
    );

    const result = await execute();

    expect(totals(result.instance)).toEqual([
      ['Supermercado', 300],
      ['Padaria', 100],
      ['Combustível', 100],
    ]);
  });

  test('breaks a tie of category by the subcategory name in pt-BR collation', async () => {
    const { rows, appearances, execute } = setup();
    const water = appearance('Moradia', 'Água');
    const rent = appearance('Moradia', 'Aluguel');
    const zelador = appearance('Moradia', 'Zelador');
    appearances.push(zelador, rent, water);
    for (const item of [zelador, rent, water]) {
      rows.push(transaction({ subcategoryId: item.subcategoryId, value: 70 }));
    }

    const result = await execute();

    expect(totals(result.instance).map(([name]) => name)).toEqual(['Água', 'Aluguel', 'Zelador']);
  });

  test('the unclassified row goes last on a tie, but follows its total otherwise', async () => {
    const { rows, appearances, execute } = setup();
    const market = appearance('Alimentação', 'Supermercado');
    const fuel = appearance('Transporte', 'Combustível');
    appearances.push(market, fuel);
    rows.push(
      transaction({ value: 100 }),
      transaction({ subcategoryId: market.subcategoryId, value: 100 }),
      transaction({ subcategoryId: fuel.subcategoryId, value: 20 }),
    );

    const result = await execute();

    expect(totals(result.instance)).toEqual([
      ['Supermercado', 100],
      [null, 100],
      ['Combustível', 20],
    ]);
  });

  test('a mixed month adds up to every counted outflow', async () => {
    const { rows, series, appearances, execute } = setup();
    const rent = appearance('Moradia', 'Aluguel');
    const market = appearance('Alimentação', 'Supermercado');
    appearances.push(rent, market);
    const plan = outflowSeries({ subcategoryId: rent.subcategoryId });
    const notebook = outflowSeries({
      subcategoryId: null,
      name: 'Notebook',
      value: 333.33,
      kind: SeriesKind.CLOSED,
      installments: 3,
      startDate: '2026-08-01',
      recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 20 },
    });
    series.push(plan, notebook);
    rows.push(
      storedOccurrence(notebook, 1, { value: 333.34 }),
      transaction({ subcategoryId: market.subcategoryId, value: 210.9 }),
      transaction({ subcategoryId: market.subcategoryId, value: 0.1, expectedOn: '2026-10-01' }),
    );

    const result = await execute();

    expect(result.instance).toEqual([{ ...rent, total: 1500 }, unclassified(333.34), { ...market, total: 210.9 }]);
  });
});

describe('SummarizeCategorySpending — failures', () => {
  const ok = <T>(value: T) => ({ execute: async () => Result.ok(value) });
  const failing = { execute: async () => Result.fail<never>('DATABASE_ERROR') };
  const stored = ok<StoredSubcategorySpending[]>([{ subcategoryId: Id.createUUID(), total: 10 }]);

  test.each([
    ['the stored sum', () => new SummarizeCategorySpending(failing, ok([]), ok([]), ok([]))],
    ['the materialized keys', () => new SummarizeCategorySpending(stored, failing, ok([]), ok([]))],
    ['the active series', () => new SummarizeCategorySpending(stored, ok([]), failing, ok([]))],
    ['the appearances', () => new SummarizeCategorySpending(stored, ok([]), ok([]), failing)],
  ])('propagates a failure of %s without a partial result', async (_, build) => {
    const result = await build().execute({ userId, ...september });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual(['DATABASE_ERROR']);
  });
});
