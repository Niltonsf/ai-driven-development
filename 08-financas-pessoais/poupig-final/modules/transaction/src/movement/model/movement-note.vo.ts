import { Result, Text } from '@poupig/shared';

export class MovementNote extends Text {
  protected static override readonly TOO_SHORT: string = 'MOVEMENT_NOTE_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'MOVEMENT_NOTE_TOO_LONG';

  protected static override readonly DEFAULT_MAX_LENGTH = 500;

  public static override tryCreate(value: string): Result<MovementNote> {
    return super.tryCreate(value) as Result<MovementNote>;
  }

  public static override create(value: string): MovementNote {
    const result = MovementNote.tryCreate(value);
    result.validator.throwsIfFailed();
    return result.instance;
  }
}
