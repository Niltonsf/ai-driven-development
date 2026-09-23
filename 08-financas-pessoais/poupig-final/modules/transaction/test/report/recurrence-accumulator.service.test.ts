import { Direction, FrequencyUnit, RecurrenceAccumulator, SeriesKind, TransactionSeriesDTO } from '../../src';
import { SeriesDTOOverrides, seriesDTO } from '../mock/transaction-series-dto.fixture';

const monthKeys = ['2026-07', '2026-08', '2026-09'];

/** A monthly recurrence on day 5, starting on 2026-01-01, without end. */
function recurrence(overrides: SeriesDTOOverrides = {}): TransactionSeriesDTO {
  return seriesDTO({
    name: 'Aluguel',
    value: 1500,
    kind: SeriesKind.OPEN,
    installments: null,
    recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 5 },
    startDate: '2026-01-01',
    ...overrides,
  });
}

describe('RecurrenceAccumulator', () => {
  test('a registered series without values has every month at zero, in the order of the keys', () => {
    const rent = recurrence();
    const accumulator = new RecurrenceAccumulator(monthKeys);

    accumulator.register(rent);

    expect(accumulator.toDTOs()).toEqual([
      {
        seriesId: rent.id,
        name: 'Aluguel',
        direction: Direction.OUT,
        value: 1500,
        recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 5 },
        accountName: 'Nubank',
        creditCardName: null,
        categoryName: null,
        subcategoryName: null,
        startDate: '2026-01-01',
        endDate: null,
        total: 0,
        months: [
          { month: '2026-07', total: 0 },
          { month: '2026-08', total: 0 },
          { month: '2026-09', total: 0 },
        ],
      },
    ]);
  });

  test('without any series the result is empty', () => {
    expect(new RecurrenceAccumulator(monthKeys).toDTOs()).toEqual([]);
  });

  test('sums each value in its month and the total of the line', () => {
    const rent = recurrence();
    const accumulator = new RecurrenceAccumulator(monthKeys);

    accumulator.add(rent, '2026-08', 1500);
    accumulator.add(rent, '2026-09', 1500);
    accumulator.add(rent, '2026-09', 50.25);

    const [line] = accumulator.toDTOs();
    expect(line.months).toEqual([
      { month: '2026-07', total: 0 },
      { month: '2026-08', total: 1500 },
      { month: '2026-09', total: 1550.25 },
    ]);
    expect(line.total).toBe(3050.25);
  });

  test('sums cents without floating point drift, in the month and in the total', () => {
    const rent = recurrence();
    const accumulator = new RecurrenceAccumulator(['2026-09']);

    accumulator.add(rent, '2026-09', 0.1);
    accumulator.add(rent, '2026-09', 0.2);

    expect(0.1 + 0.2).not.toBe(0.3);
    const [line] = accumulator.toDTOs();
    expect(line.months).toEqual([{ month: '2026-09', total: 0.3 }]);
    expect(line.total).toBe(0.3);
  });

  test('ignores a month outside the window without failing', () => {
    const rent = recurrence();
    const accumulator = new RecurrenceAccumulator(monthKeys);

    expect(() => accumulator.add(rent, '2026-10', 100)).not.toThrow();
    accumulator.add(rent, '2026-06', 100);

    const [line] = accumulator.toDTOs();
    expect(line.months.map((bucket) => bucket.month)).toEqual(monthKeys);
    expect(line.months.every((bucket) => bucket.total === 0)).toBe(true);
    expect(line.total).toBe(0);
  });

  test('registering twice and adding after registering keep a single line', () => {
    const rent = recurrence();
    const accumulator = new RecurrenceAccumulator(monthKeys);

    accumulator.register(rent);
    accumulator.register(rent);
    accumulator.add(rent, '2026-07', 1500);
    accumulator.register(rent);
    accumulator.add(rent, '2026-07', 1500);

    const lines = accumulator.toDTOs();
    expect(lines).toHaveLength(1);
    expect(lines[0].months[0]).toEqual({ month: '2026-07', total: 3000 });
  });

  test('orders IN before OUT, then by name in Portuguese ignoring accents and case, then by seriesId', () => {
    const internet = recurrence({ name: 'Internet' });
    const water = recurrence({ name: 'Água' });
    const salary = recurrence({ name: 'Salário', direction: Direction.IN });
    const bonus = recurrence({ name: 'bônus', direction: Direction.IN });
    const [firstGym, secondGym] = [recurrence({ name: 'Academia' }), recurrence({ name: 'academia' })].sort((a, b) =>
      a.id < b.id ? -1 : 1,
    );
    const accumulator = new RecurrenceAccumulator(monthKeys);

    // Registered in an order unrelated to the expected one, and with values that must not matter.
    accumulator.add(internet, '2026-09', 9999);
    accumulator.register(secondGym);
    accumulator.register(salary);
    accumulator.register(water);
    accumulator.register(firstGym);
    accumulator.add(bonus, '2026-07', 1);

    expect(accumulator.toDTOs().map((line) => line.seriesId)).toEqual([
      bonus.id,
      salary.id,
      firstGym.id,
      secondGym.id,
      water.id,
      internet.id,
    ]);
  });
});
