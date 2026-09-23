import { CashFlowAccumulator, Direction } from '../../src';

const monthKeys = ['2026-07', '2026-08', '2026-09'];

describe('CashFlowAccumulator', () => {
  test('starts every month at zero, in the order of the keys', () => {
    const accumulator = new CashFlowAccumulator(monthKeys);

    expect(accumulator.toDTOs()).toEqual([
      { month: '2026-07', inflow: 0, outflow: 0, balance: 0 },
      { month: '2026-08', inflow: 0, outflow: 0, balance: 0 },
      { month: '2026-09', inflow: 0, outflow: 0, balance: 0 },
    ]);
  });

  test('sums each value on the side of its direction', () => {
    const accumulator = new CashFlowAccumulator(monthKeys);

    accumulator.add('2026-08', Direction.IN, 5000);
    accumulator.add('2026-08', Direction.IN, 150.25);
    accumulator.add('2026-08', Direction.OUT, 200);
    accumulator.add('2026-09', Direction.OUT, 99.9);

    expect(accumulator.toDTOs()).toEqual([
      { month: '2026-07', inflow: 0, outflow: 0, balance: 0 },
      { month: '2026-08', inflow: 5150.25, outflow: 200, balance: 4950.25 },
      { month: '2026-09', inflow: 0, outflow: 99.9, balance: -99.9 },
    ]);
  });

  test('ignores a month outside the window without failing', () => {
    const accumulator = new CashFlowAccumulator(monthKeys);

    expect(() => accumulator.add('2026-10', Direction.IN, 100)).not.toThrow();
    accumulator.add('2026-06', Direction.OUT, 100);

    expect(accumulator.toDTOs().map((bucket) => bucket.month)).toEqual(monthKeys);
    expect(accumulator.toDTOs().every((bucket) => bucket.inflow === 0 && bucket.outflow === 0)).toBe(true);
  });

  test('sums cents without floating point drift', () => {
    const accumulator = new CashFlowAccumulator(['2026-09']);

    accumulator.add('2026-09', Direction.IN, 0.1);
    accumulator.add('2026-09', Direction.IN, 0.2);

    expect(0.1 + 0.2).not.toBe(0.3);
    expect(accumulator.toDTOs()).toEqual([{ month: '2026-09', inflow: 0.3, outflow: 0, balance: 0.3 }]);
  });

  test('a month with more outflow than inflow has a negative balance', () => {
    const accumulator = new CashFlowAccumulator(['2026-09']);

    accumulator.add('2026-09', Direction.IN, 1000);
    accumulator.add('2026-09', Direction.OUT, 1250.5);

    expect(accumulator.toDTOs()).toEqual([{ month: '2026-09', inflow: 1000, outflow: 1250.5, balance: -250.5 }]);
  });
});
