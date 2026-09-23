import { Result, Text } from '@poupig/shared';

export class SubcategoryName extends Text {
  protected static override readonly TOO_SHORT: string = 'SUBCATEGORY_NAME_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'SUBCATEGORY_NAME_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 1;
  protected static override readonly DEFAULT_MAX_LENGTH = 100;

  public static override tryCreate(value: string): Result<SubcategoryName> {
    return super.tryCreate(value) as Result<SubcategoryName>;
  }

  public static override create(value: string): SubcategoryName {
    const result = SubcategoryName.tryCreate(value);
    result.validator.throwsIfFailed();
    return result.instance;
  }
}
