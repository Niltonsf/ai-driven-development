import { Result, Text } from '@poupig/shared';

export class CategoryName extends Text {
  protected static override readonly TOO_SHORT: string = 'CATEGORY_NAME_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'CATEGORY_NAME_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 1;
  protected static override readonly DEFAULT_MAX_LENGTH = 100;

  public static override tryCreate(value: string): Result<CategoryName> {
    return super.tryCreate(value) as Result<CategoryName>;
  }

  public static override create(value: string): CategoryName {
    const result = CategoryName.tryCreate(value);
    result.validator.throwsIfFailed();
    return result.instance;
  }
}
