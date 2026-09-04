import { Result, ValueObject } from '../base';

export class Email extends ValueObject<string> {
  private static readonly INVALID_EMAIL = 'INVALID_EMAIL';

  constructor(value: string) {
    const email = value?.trim().toLowerCase();
    if (!Email.isValid(email)) {
      throw new Error('email.invalid');
    }

    super(email);
  }

  get local(): string {
    return this.value.split('@')?.[0] ?? '';
  }

  get username(): string {
    return this.local;
  }

  get domain(): string {
    return this.value.split('@')?.[1] ?? '';
  }

  public static create(value: string): Email {
    const result = Email.tryCreate(value);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  public static tryCreate(value: string): Result<Email> {
    try {
      const email = value.trim().toLowerCase();
      return Email.isValid(email) ? Result.ok(new Email(email)) : Result.fail(Email.INVALID_EMAIL);
    } catch (error: any) {
      return Result.fail(error.message);
    }
  }

  public static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  }
}
