import { createRandom } from '../../src';

function sequence(seed: number, length = 20): number[] {
  const random = createRandom(seed);
  return Array.from({ length }, () => random.next());
}

describe('createRandom', () => {
  test('same seed yields the same sequence', () => {
    expect(sequence(42)).toEqual(sequence(42));
  });

  test('different seeds yield different sequences', () => {
    expect(sequence(42)).not.toEqual(sequence(43));
  });

  test('seed is normalized to an unsigned 32-bit integer', () => {
    expect(sequence(-1)).toEqual(sequence(2 ** 32 - 1));
  });

  test('next stays within [0, 1)', () => {
    for (const value of sequence(7, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test('int respects inclusive bounds and reaches both ends', () => {
    const random = createRandom(123);
    const values = Array.from({ length: 2000 }, () => random.int(1, 3));

    expect(values.every((value) => value >= 1 && value <= 3 && Number.isInteger(value))).toBe(true);
    expect(values).toContain(1);
    expect(values).toContain(3);
    expect(createRandom(9).int(5, 5)).toBe(5);
  });

  test('int rejects an invalid range', () => {
    expect(() => createRandom(1).int(3, 1)).toThrow();
  });

  test('pick returns an item of the list and rejects an empty list', () => {
    const random = createRandom(5);
    const list = ['a', 'b', 'c'];

    for (let i = 0; i < 100; i++) expect(list).toContain(random.pick(list));
    expect(() => random.pick([])).toThrow();
  });

  test('weightedPick never chooses an item with weight zero', () => {
    const random = createRandom(99);
    const list = [
      { id: 'zero-a', weight: 0 },
      { id: 'heavy', weight: 5 },
      { id: 'zero-b', weight: 0 },
      { id: 'light', weight: 1 },
    ];

    const picked = new Set(Array.from({ length: 1000 }, () => random.weightedPick(list, (item) => item.weight).id));

    expect(picked.has('zero-a')).toBe(false);
    expect(picked.has('zero-b')).toBe(false);
    expect(picked.has('heavy')).toBe(true);
    expect(() => random.weightedPick([{ weight: 0 }], (item) => item.weight)).toThrow();
  });

  test('chance respects the extremes', () => {
    const random = createRandom(11);

    for (let i = 0; i < 100; i++) {
      expect(random.chance(0)).toBe(false);
      expect(random.chance(1)).toBe(true);
    }
  });

  test('shuffle returns a permutation without mutating the input', () => {
    const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const shuffled = createRandom(2024).shuffle(input);

    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(shuffled).not.toBe(input);
    expect([...shuffled].sort((a, b) => a - b)).toEqual([...input]);
    expect(createRandom(2024).shuffle(input)).toEqual(shuffled);
  });
});
