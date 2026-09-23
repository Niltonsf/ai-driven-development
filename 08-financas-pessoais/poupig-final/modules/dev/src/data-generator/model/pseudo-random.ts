/**
 * Seeded pseudo-random generator (`mulberry32`).
 *
 * The seed is what makes a generation run reproducible: the same seed yields
 * the same sequence, so a plan that exposed a bug can be generated again.
 * `Math.random()` does not appear anywhere in this module; when the request has
 * no seed, one is drawn outside the domain through a `SeedSource`.
 */
export type SeedSource = () => number;

export interface PseudoRandom {
  /** Next number in `[0, 1)`. */
  next(): number;
  /** Integer in `[min, max]`, both inclusive. */
  int(min: number, max: number): number;
  /** One item of a non-empty list. */
  pick<T>(list: readonly T[]): T;
  /** One item of the list, proportionally to its weight; items with weight `<= 0` are never chosen. */
  weightedPick<T>(list: readonly T[], weight: (item: T) => number): T;
  /** `true` with the given probability. */
  chance(probability: number): boolean;
  /** Shuffled copy of the list (Fisher–Yates); the input is not mutated. */
  shuffle<T>(list: readonly T[]): T[];
}

export function createRandom(seed: number): PseudoRandom {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error(`Invalid integer range: [${min}, ${max}]`);
    }
    return min + Math.floor(next() * (max - min + 1));
  };

  const pick = <T>(list: readonly T[]): T => {
    if (list.length === 0) throw new Error('Cannot pick from an empty list');
    return list[int(0, list.length - 1)] as T;
  };

  const weightedPick = <T>(list: readonly T[], weight: (item: T) => number): T => {
    const candidates = list.filter((item) => weight(item) > 0);
    if (candidates.length === 0) throw new Error('Cannot pick from a list without positive weights');

    const total = candidates.reduce((sum, item) => sum + weight(item), 0);
    let remaining = next() * total;

    for (const item of candidates) {
      remaining -= weight(item);
      if (remaining < 0) return item;
    }

    // Floating point rounding can leave a tiny remainder: the last candidate absorbs it.
    return candidates[candidates.length - 1] as T;
  };

  const chance = (probability: number): boolean => next() < probability;

  const shuffle = <T>(list: readonly T[]): T[] => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i);
      const current = copy[i] as T;
      copy[i] = copy[j] as T;
      copy[j] = current;
    }
    return copy;
  };

  return { next, int, pick, weightedPick, chance, shuffle };
}
