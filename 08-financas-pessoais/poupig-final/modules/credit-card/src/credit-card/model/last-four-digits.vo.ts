import { Result, ValueObject, ValueObjectConfig } from '@poupig/shared';

export class LastFourDigits extends ValueObject<string, ValueObjectConfig> {
  private static readonly INVALID_LAST_FOUR_DIGITS = 'INVALID_LAST_FOUR_DIGITS';

  private constructor(value: string, config?: ValueObjectConfig) {
    super(value, config);
  }

  public static create(value: string, config?: ValueObjectConfig): LastFourDigits {
    const result = LastFourDigits.tryCreate(value, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  public static tryCreate(value: string, config?: ValueObjectConfig): Result<LastFourDigits> {
    if (typeof value !== 'string' || !/^\d{4}$/.test(value)) {
      return Result.fail(LastFourDigits.INVALID_LAST_FOUR_DIGITS);
    }
    return Result.ok(new LastFourDigits(value, config));
  }
}
