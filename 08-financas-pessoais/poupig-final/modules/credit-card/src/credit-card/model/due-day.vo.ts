import { Result, ValueObject, ValueObjectConfig } from '@poupig/shared';

export class DueDay extends ValueObject<number, ValueObjectConfig> {
  private static readonly INVALID_DUE_DAY = 'INVALID_DUE_DAY';
  private static readonly DUE_DAY_OUT_OF_RANGE = 'DUE_DAY_OUT_OF_RANGE';

  private constructor(value: number, config?: ValueObjectConfig) {
    super(value, config);
  }

  public static create(value: number, config?: ValueObjectConfig): DueDay {
    const result = DueDay.tryCreate(value, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  public static tryCreate(value: number, config?: ValueObjectConfig): Result<DueDay> {
    if (typeof value !== 'number' || !Number.isInteger(value) || !Number.isFinite(value)) {
      return Result.fail(DueDay.INVALID_DUE_DAY);
    }
    if (value < 1 || value > 31) {
      return Result.fail(DueDay.DUE_DAY_OUT_OF_RANGE);
    }
    return Result.ok(new DueDay(value, config));
  }
}
