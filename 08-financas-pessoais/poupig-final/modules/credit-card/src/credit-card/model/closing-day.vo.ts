import { Result, ValueObject, ValueObjectConfig } from '@poupig/shared';

export class ClosingDay extends ValueObject<number, ValueObjectConfig> {
  private static readonly INVALID_CLOSING_DAY = 'INVALID_CLOSING_DAY';
  private static readonly CLOSING_DAY_OUT_OF_RANGE = 'CLOSING_DAY_OUT_OF_RANGE';

  private constructor(value: number, config?: ValueObjectConfig) {
    super(value, config);
  }

  public static create(value: number, config?: ValueObjectConfig): ClosingDay {
    const result = ClosingDay.tryCreate(value, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  public static tryCreate(value: number, config?: ValueObjectConfig): Result<ClosingDay> {
    if (typeof value !== 'number' || !Number.isInteger(value) || !Number.isFinite(value)) {
      return Result.fail(ClosingDay.INVALID_CLOSING_DAY);
    }
    if (value < 1 || value > 31) {
      return Result.fail(ClosingDay.CLOSING_DAY_OUT_OF_RANGE);
    }
    return Result.ok(new ClosingDay(value, config));
  }
}
