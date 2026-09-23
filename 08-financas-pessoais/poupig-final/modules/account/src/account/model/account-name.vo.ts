import { Result, Text } from '@poupig/shared';

export class AccountName extends Text {
  protected static override readonly TOO_SHORT: string = 'ACCOUNT_NAME_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'ACCOUNT_NAME_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 1;
  protected static override readonly DEFAULT_MAX_LENGTH = 100;

  public static override tryCreate(value: string): Result<AccountName> {
    return super.tryCreate(value) as Result<AccountName>;
  }

  public static override create(value: string): AccountName {
    const result = AccountName.tryCreate(value);
    result.validator.throwsIfFailed();
    return result.instance;
  }
}
