import { Result, ValueObject, ValueObjectConfig } from '../base';

export class Money extends ValueObject<number, ValueObjectConfig> {
  private static readonly INVALID_MONEY_AMOUNT = 'INVALID_MONEY_AMOUNT';

  private constructor(value: number, config?: ValueObjectConfig) {
    super(value, config);
  }

  public static create(value: number, config?: ValueObjectConfig): Money {
    const result = Money.tryCreate(value, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  public static tryCreate(value: number, config?: ValueObjectConfig): Result<Money> {
    try {
      if (typeof value !== 'number') {
        throw new Error(Money.INVALID_MONEY_AMOUNT);
      }
      if (!Number.isFinite(value)) {
        throw new Error(Money.INVALID_MONEY_AMOUNT);
      }

      const rounded = Math.round(value * 100) / 100;

      if (rounded <= 0) {
        throw new Error(Money.INVALID_MONEY_AMOUNT);
      }

      return Result.ok(new Money(rounded, config));
    } catch (error: any) {
      return Result.fail(error.message ?? Money.INVALID_MONEY_AMOUNT);
    }
  }
}
