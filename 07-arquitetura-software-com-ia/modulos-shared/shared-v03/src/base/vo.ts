export interface ValueObjectConfig {}

export abstract class ValueObject<T, Config extends ValueObjectConfig = ValueObjectConfig> {
  constructor(
    readonly value: T,
    readonly config?: Config,
  ) {}

  equals(vo: ValueObject<T, Config>): boolean {
    return this.value === vo.value;
  }

  notEquals(vo: ValueObject<T, Config>): boolean {
    return !this.equals(vo);
  }
}
