import { Result, Text } from '@poupig/shared';

export class MovementName extends Text {
  protected static override readonly TOO_SHORT: string = 'MOVEMENT_NAME_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'MOVEMENT_NAME_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 2;
  protected static override readonly DEFAULT_MAX_LENGTH = 100;

  public static override tryCreate(value: string): Result<MovementName> {
    return super.tryCreate(value) as Result<MovementName>;
  }

  public static override create(value: string): MovementName {
    const result = MovementName.tryCreate(value);
    result.validator.throwsIfFailed();
    return result.instance;
  }
}
