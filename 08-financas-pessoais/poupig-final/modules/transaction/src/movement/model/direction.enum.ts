export enum Direction {
  IN = 'IN',
  OUT = 'OUT',
}

export function isDirection(value: unknown): value is Direction {
  return (Object.values(Direction) as unknown[]).includes(value);
}
