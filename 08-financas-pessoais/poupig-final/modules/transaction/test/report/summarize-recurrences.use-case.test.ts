import { Id, Result } from '@poupig/shared';
import {
  CashFlowCalendar,
  DayOfWeek,
  Direction,
  FindTransactionSeriesByIdQuery,
  FrequencyUnit,
  ListActiveTransactionSeriesInput,
  ListActiveTransactionSeriesQuery,
  ListMaterializedOccurrenceKeysInput,
  ListMaterializedOccurrenceKeysQuery,
  RecurrenceReportLineDTO,
  ScheduledTransactionGenerator,
  SeriesKind,
  StoredRecurrenceOccurrenceTotal,
  SummarizeMonthlyCashFlowErrors,
  SummarizeRecurrences,
  SummarizeStoredRecurrenceOccurrencesInput,
  SummarizeStoredRecurrenceOccurrencesQuery,
  TransactionSeriesDTO,
  TransactionStatus,
} from '../../src';
import {
  InMemoryFindTransactionSeriesByIdQuery,
  SeriesDTOOverrides,
  seriesDTO,
} from '../mock/transaction-series-dto.fixture';

const userId = Id.createUUID();

/** A stored occurrence with only what the report queries read. */
interface StoredOccurrence {
  seriesId: string;
  occurrenceIndex: number;
  occurrenceOn: string;
  expectedOn: string;
  value: number;
  status: TransactionStatus;
}

/**
 * The monthly recurrence "Aluguel" of R$ 1.500,00 on day 5, an outflow started
 * long before the windows of the tests and without end.
 */
function recurrence(overrides: SeriesDTOOverrides = {}): TransactionSeriesDTO {
  return seriesDTO({
    userId,
    name: 'Aluguel',
    value: 1500,
    kind: SeriesKind.OPEN,
    installments: null,
    recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 5 },
    startDate: '2025-01-01',
    ...overrides,
  });
}

/** The index of the occurrence of the series on `date`, found by walking its schedule. */
function indexOn(series: TransactionSeriesDTO, date: string): number {
  for (let index = 0; index < 1000; index++) {
    if (ScheduledTransactionGenerator.occurrenceDate(series, index) === date) return index;
  }
  throw new Error(`the series has no occurrence on ${date}`);
}

/** The stored version of the occurrence of the series on `occurrenceOn`, by default untouched and `PENDING`. */
function storedOn(
  series: TransactionSeriesDTO,
  occurrenceOn: string,
  overrides: Partial<StoredOccurrence> = {},
): StoredOccurrence {
  return {
    seriesId: series.id,
    occurrenceIndex: indexOn(series, occurrenceOn),
    occurrenceOn,
    expectedOn: occurrenceOn,
    value: series.value,
    status: TransactionStatus.PENDING,
    ...overrides,
  };
}

/** Sums reais through integer cents, so the doubles do not carry floating point drift. */
function sumInCents(values: number[]): number {
  return values.reduce((total, value) => total + Math.round(value * 100), 0) / 100;
}

type FailingQuery = 'stored' | 'keys' | 'series' | 'find';

/**
 * One in-memory storage (series and stored occurrences) feeding the doubles of
 * the four queries, each one applying its own contract:
 *
 * - stored sum: by series and month of `expectedOn`, without `CANCELED`, only
 *   `OPEN` series; `extraStoredTotals` are appended as they are, to model rows
 *   the contract should not produce;
 * - materialized keys: by `occurrenceOn`, any status;
 * - active series: `startDate <= to` and `endDate` null or `>= from`, both kinds;
 * - series by id: the fixture double;
 * - every query ignores the soft deleted series.
 */
function setup(failing?: FailingQuery) {
  const series: TransactionSeriesDTO[] = [];
  const stored: StoredOccurrence[] = [];
  const extraStoredTotals: StoredRecurrenceOccurrenceTotal[] = [];
  const deletedSeries = new Set<string>();
  const inPeriod = (date: string, from: string, to: string) => from <= date && date <= to;
  const seriesOf = (id: string) => series.find((item) => item.id === id);
  const visibleStored = () => stored.filter((item) => !deletedSeries.has(item.seriesId));

  const storedInputs: SummarizeStoredRecurrenceOccurrencesInput[] = [];
  const keyInputs: ListMaterializedOccurrenceKeysInput[] = [];
  const seriesInputs: ListActiveTransactionSeriesInput[] = [];
  const findInputs: string[] = [];

  const summarizeStoredRecurrenceOccurrences: SummarizeStoredRecurrenceOccurrencesQuery = {
    execute: async (input) => {
      storedInputs.push(input);
      if (failing === 'stored') return Result.fail('STORED_FAILED');

      const rows = visibleStored().filter(
        (item) =>
          seriesOf(item.seriesId)?.kind === SeriesKind.OPEN &&
          item.status !== TransactionStatus.CANCELED &&
          inPeriod(item.expectedOn, input.from, input.to),
      );
      const pairs = new Map<string, StoredRecurrenceOccurrenceTotal>();
      for (const item of rows) {
        const month = CashFlowCalendar.monthKeyOf(item.expectedOn);
        const key = `${item.seriesId}|${month}`;
        const current = pairs.get(key) ?? { seriesId: item.seriesId, month, total: 0 };
        pairs.set(key, { ...current, total: sumInCents([current.total, item.value]) });
      }
      return Result.ok([...pairs.values(), ...extraStoredTotals]);
    },
  };

  const listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery = {
    execute: async (input) => {
      keyInputs.push(input);
      if (failing === 'keys') return Result.fail('KEYS_FAILED');

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
      if (failing === 'series') return Result.fail('SERIES_FAILED');

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

  const findTransactionSeriesById: FindTransactionSeriesByIdQuery = {
    execute: async (id, owner) => {
      findInputs.push(id);
      if (failing === 'find') return Result.fail('FIND_FAILED');

      const double = new InMemoryFindTransactionSeriesByIdQuery();
      series.forEach((item) => double.add(item));
      deletedSeries.forEach((deletedId) => double.softDelete(deletedId));
      return double.execute(id, owner);
    },
  };

  const useCase = new SummarizeRecurrences(
    summarizeStoredRecurrenceOccurrences,
    listMaterializedOccurrenceKeys,
    listActiveTransactionSeries,
    findTransactionSeriesById,
  );

  const execute = (reference: string, months: number) => useCase.execute({ userId, reference, months });
  const queriedNothing = () => storedInputs.length + keyInputs.length + seriesInputs.length + findInputs.length === 0;

  return {
    series,
    stored,
    extraStoredTotals,
    deletedSeries,
    storedInputs,
    keyInputs,
    seriesInputs,
    findInputs,
    queriedNothing,
    execute,
  };
}

/** The months of a line as a map `month → total`, for short assertions. */
function byMonth(line: RecurrenceReportLineDTO): Record<string, number> {
  return Object.fromEntries(line.months.map((bucket) => [bucket.month, bucket.total]));
}

/** The line of the series, failing the test when it is absent. */
function lineOf(lines: RecurrenceReportLineDTO[], series: TransactionSeriesDTO): RecurrenceReportLineDTO {
  const line = lines.find((item) => item.seriesId === series.id);
  if (!line) throw new Error(`no line for the series ${series.name}`);
  return line;
}

describe('SummarizeRecurrences — input', () => {
  test.each([['2026-13'], ['2026-9'], ['2026-09-01'], [''], [undefined as unknown as string]])(
    'fails with INVALID_REPORT_REFERENCE for the reference %p, querying nothing',
    async (reference) => {
      const { execute, queriedNothing } = setup();

      const result = await execute(reference, 12);

      expect(result.errors).toEqual([SummarizeMonthlyCashFlowErrors.INVALID_REPORT_REFERENCE]);
      expect(queriedNothing()).toBe(true);
    },
  );

  test.each([[7], [0], [-6], [12.5], [NaN], ['12' as unknown as number]])(
    'fails with INVALID_REPORT_WINDOW for the window %p, querying nothing',
    async (months) => {
      const { execute, queriedNothing } = setup();

      const result = await execute('2026-09', months);

      expect(result.errors).toEqual([SummarizeMonthlyCashFlowErrors.INVALID_REPORT_WINDOW]);
      expect(queriedNothing()).toBe(true);
    },
  );

  test('passes the period of the whole window to the three queries, without reading series by id', async () => {
    const { series, execute, storedInputs, keyInputs, seriesInputs, findInputs } = setup();
    series.push(recurrence());

    await execute('2026-09', 12);

    const period = { userId, from: '2025-10-01', to: '2026-09-30' };
    expect(storedInputs).toEqual([period]);
    expect(keyInputs).toEqual([period]);
    expect(seriesInputs).toEqual([period]);
    expect(findInputs).toEqual([]);
  });
});

describe('SummarizeRecurrences — lines', () => {
  test('a user without recurrence gets an empty list', async () => {
    const { execute } = setup();

    const result = await execute('2026-09', 12);

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual([]);
  });

  test('an installment plan (CLOSED) neither appears nor is generated', async () => {
    const { series, execute } = setup();
    const internet = recurrence({ name: 'Internet', value: 120, startDate: '2026-01-01' });
    const notebook = seriesDTO({ userId, startDate: '2026-01-01' });
    series.push(internet, notebook);
    expect(notebook.kind).toBe(SeriesKind.CLOSED);

    const result = await execute('2026-09', 6);

    expect(result.instance.map((line) => line.name)).toEqual(['Internet']);
    expect(result.instance[0].total).toBe(720);
  });

  test('a monthly recurrence without stored occurrences has the value of the series in every month', async () => {
    const { series, execute } = setup();
    const rent = recurrence();
    series.push(rent);

    const result = await execute('2026-09', 6);

    expect(result.instance).toHaveLength(1);
    const line = result.instance[0];
    expect(byMonth(line)).toEqual({
      '2026-04': 1500,
      '2026-05': 1500,
      '2026-06': 1500,
      '2026-07': 1500,
      '2026-08': 1500,
      '2026-09': 1500,
    });
    expect(line.total).toBe(9000);
    expect(line).toMatchObject({
      seriesId: rent.id,
      name: 'Aluguel',
      direction: Direction.OUT,
      value: 1500,
      recurrence: rent.recurrence,
      accountName: 'Nubank',
      creditCardName: null,
      categoryName: null,
      subcategoryName: null,
      startDate: '2025-01-01',
      endDate: null,
    });
    expect(Object.keys(line).sort()).toEqual(
      [
        'seriesId',
        'name',
        'direction',
        'value',
        'recurrence',
        'accountName',
        'creditCardName',
        'categoryName',
        'subcategoryName',
        'startDate',
        'endDate',
        'total',
        'months',
      ].sort(),
    );
  });

  test('a weekly recurrence sums five Mondays in August 2026 and four in September 2026', async () => {
    const { series, execute } = setup();
    const market = recurrence({
      name: 'Feira',
      value: 100,
      recurrence: { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.MONDAY },
      startDate: '2026-01-01',
    });
    series.push(market);

    const result = await execute('2026-09', 6);

    const line = lineOf(result.instance, market);
    expect(byMonth(line)).toEqual({
      '2026-04': 400,
      '2026-05': 400,
      '2026-06': 500,
      '2026-07': 400,
      '2026-08': 500,
      '2026-09': 400,
    });
    expect(line.total).toBe(2600);
  });

  test('an annual recurrence without occurrence in the window appears zeroed', async () => {
    const { series, execute } = setup();
    const insurance = recurrence({
      name: 'Seguro',
      value: 2400,
      recurrence: { unit: FrequencyUnit.YEAR, interval: 1, month: 12, dayOfMonth: 20 },
    });
    series.push(insurance);

    const result = await execute('2026-09', 6);

    const line = lineOf(result.instance, insurance);
    expect(line.months).toHaveLength(6);
    expect(line.months.every((bucket) => bucket.total === 0)).toBe(true);
    expect(line.total).toBe(0);
  });

  test('a recurrence that starts in the middle of the window is zeroed before its start', async () => {
    const { series, execute } = setup();
    const gym = recurrence({ name: 'Academia', value: 99.9, startDate: '2026-07-01' });
    series.push(gym);

    const result = await execute('2026-09', 6);

    expect(byMonth(lineOf(result.instance, gym))).toEqual({
      '2026-04': 0,
      '2026-05': 0,
      '2026-06': 0,
      '2026-07': 99.9,
      '2026-08': 99.9,
      '2026-09': 99.9,
    });
  });

  test('a recurrence that ends in the middle of the window is zeroed after its end', async () => {
    const { series, execute } = setup();
    const course = recurrence({ name: 'Curso', value: 300, endDate: '2026-06-30' });
    series.push(course);

    const result = await execute('2026-09', 6);

    const line = lineOf(result.instance, course);
    expect(byMonth(line)).toEqual({
      '2026-04': 300,
      '2026-05': 300,
      '2026-06': 300,
      '2026-07': 0,
      '2026-08': 0,
      '2026-09': 0,
    });
    expect(line.endDate).toBe('2026-06-30');
  });

  test('a recurrence that ended before the window does not appear', async () => {
    const { series, execute } = setup();
    series.push(recurrence({ endDate: '2026-01-31' }));

    const result = await execute('2026-09', 6);

    expect(result.instance).toEqual([]);
  });

  test('a soft deleted recurrence does not appear, with its stored occurrences or not', async () => {
    const { series, stored, deletedSeries, execute } = setup();
    const rent = recurrence();
    series.push(rent);
    stored.push(storedOn(rent, '2026-09-05', { status: TransactionStatus.SETTLED, value: 1550 }));
    deletedSeries.add(rent.id);

    const result = await execute('2026-09', 6);

    expect(result.instance).toEqual([]);
  });

  test('every line has exactly the months of the window, ascending, ending at the reference', async () => {
    const { series, execute } = setup();
    series.push(recurrence(), recurrence({ name: 'Salário', direction: Direction.IN, value: 8000 }));

    const result = await execute('2026-09', 24);

    expect(result.instance).toHaveLength(2);
    for (const line of result.instance) {
      expect(line.months).toHaveLength(24);
      expect(line.months.map((bucket) => bucket.month)).toEqual(CashFlowCalendar.periodOf('2026-09', 24).monthKeys);
      expect(line.months[0].month).toBe('2024-10');
      expect(line.months[23].month).toBe('2026-09');
    }
  });

  test('values are positive and the direction carries the sign', async () => {
    const { series, execute } = setup();
    const salary = recurrence({ name: 'Salário', direction: Direction.IN, value: 8000 });
    series.push(salary);

    const result = await execute('2026-09', 6);

    const line = lineOf(result.instance, salary);
    expect(line.direction).toBe(Direction.IN);
    expect(line.months.every((bucket) => bucket.total === 8000)).toBe(true);
    expect(line.total).toBe(48000);
  });

  test('orders the inflows before the outflows and by name in Portuguese', async () => {
    const { series, execute } = setup();
    series.push(
      recurrence({ name: 'Internet', value: 120 }),
      recurrence({ name: 'Água', value: 80 }),
      recurrence({ name: 'Salário', direction: Direction.IN, value: 8000 }),
    );

    const result = await execute('2026-09', 6);

    expect(result.instance.map((line) => line.name)).toEqual(['Salário', 'Água', 'Internet']);
  });
});

describe('SummarizeRecurrences — stored occurrences', () => {
  test('a stored occurrence sums its stored value and suppresses the generated one of the same key', async () => {
    const { series, stored, execute } = setup();
    const rent = recurrence();
    series.push(rent);
    stored.push(storedOn(rent, '2026-09-05', { status: TransactionStatus.SETTLED, value: 1550 }));

    const result = await execute('2026-09', 6);

    const line = lineOf(result.instance, rent);
    expect(byMonth(line)['2026-09']).toBe(1550);
    expect(byMonth(line)['2026-08']).toBe(1500);
    expect(line.total).toBe(9050);
  });

  test('a CANCELED stored occurrence (absent from the stored sum) is not generated again', async () => {
    const { series, stored, execute } = setup();
    const rent = recurrence();
    series.push(rent);
    stored.push(storedOn(rent, '2026-09-05', { status: TransactionStatus.CANCELED }));

    const result = await execute('2026-09', 6);

    const line = lineOf(result.instance, rent);
    expect(byMonth(line)['2026-09']).toBe(0);
    expect(line.total).toBe(7500);
  });

  test('a stored occurrence moved to another month of the window is summed in the new month', async () => {
    const { series, stored, execute } = setup();
    const rent = recurrence();
    series.push(rent);
    stored.push(storedOn(rent, '2026-08-05', { expectedOn: '2026-09-02' }));

    const result = await execute('2026-09', 6);

    const line = lineOf(result.instance, rent);
    expect(byMonth(line)['2026-08']).toBe(0);
    expect(byMonth(line)['2026-09']).toBe(3000);
    expect(line.total).toBe(9000);
  });

  test('stored and generated cents are summed without floating point drift', async () => {
    const { series, stored, execute } = setup();
    const fee = recurrence({ name: 'Tarifa', value: 0.2, startDate: '2026-09-01' });
    series.push(fee);
    // The October occurrence was brought forward into September, next to the generated one.
    stored.push(storedOn(fee, '2026-10-05', { expectedOn: '2026-09-20', value: 0.1 }));

    const result = await execute('2026-09', 6);

    const line = lineOf(result.instance, fee);
    expect(byMonth(line)['2026-09']).toBe(0.3);
    expect(line.total).toBe(0.3);
  });

  test('a recurrence that ended before the window becomes a line through its postponed stored occurrence', async () => {
    const { series, stored, execute, findInputs } = setup();
    const gym = recurrence({
      name: 'Academia',
      value: 200,
      recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 10 },
      startDate: '2025-06-01',
      endDate: '2026-01-31',
    });
    series.push(gym);
    stored.push(storedOn(gym, '2026-01-10', { expectedOn: '2026-05-10' }));

    const result = await execute('2026-09', 6);

    expect(findInputs).toEqual([gym.id]);
    expect(result.instance).toHaveLength(1);
    const line = lineOf(result.instance, gym);
    expect(byMonth(line)).toEqual({
      '2026-04': 0,
      '2026-05': 200,
      '2026-06': 0,
      '2026-07': 0,
      '2026-08': 0,
      '2026-09': 0,
    });
    expect(line.total).toBe(200);
    expect(line.endDate).toBe('2026-01-31');
  });

  test('a stored total of a series read as null is discarded', async () => {
    const { extraStoredTotals, execute, findInputs } = setup();
    const unknownId = Id.createUUID();
    extraStoredTotals.push({ seriesId: unknownId, month: '2026-09', total: 500 });

    const result = await execute('2026-09', 6);

    expect(findInputs).toEqual([unknownId]);
    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual([]);
  });

  test('a stored total of a CLOSED series is discarded, read by id or already listed', async () => {
    const { series, extraStoredTotals, execute, findInputs } = setup();
    const endedPlan = seriesDTO({ userId, startDate: '2024-01-01', installments: 3 });
    const activePlan = seriesDTO({ userId, name: 'Geladeira', startDate: '2026-08-01' });
    series.push(endedPlan, activePlan);
    extraStoredTotals.push(
      { seriesId: endedPlan.id, month: '2026-09', total: 250 },
      { seriesId: activePlan.id, month: '2026-09', total: 250 },
    );

    const result = await execute('2026-09', 6);

    expect(findInputs).toEqual([endedPlan.id]);
    expect(result.instance).toEqual([]);
  });

  test('reads each missing series only once, even with totals in many months', async () => {
    const { extraStoredTotals, execute, findInputs } = setup();
    const unknownId = Id.createUUID();
    extraStoredTotals.push(
      { seriesId: unknownId, month: '2026-08', total: 10 },
      { seriesId: unknownId, month: '2026-09', total: 10 },
    );

    await execute('2026-09', 6);

    expect(findInputs).toEqual([unknownId]);
  });
});

describe('SummarizeRecurrences — failures', () => {
  test.each<[FailingQuery, string]>([
    ['stored', 'STORED_FAILED'],
    ['keys', 'KEYS_FAILED'],
    ['series', 'SERIES_FAILED'],
    ['find', 'FIND_FAILED'],
  ])('a failure of the query %p is propagated without a partial result', async (failing, error) => {
    const { series, extraStoredTotals, execute } = setup(failing);
    series.push(recurrence());
    extraStoredTotals.push({ seriesId: Id.createUUID(), month: '2026-09', total: 100 });

    const result = await execute('2026-09', 6);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([error]);
  });
});
