import {
  EncryptedPassword,
  Entity,
  EntityProps,
  Id,
  Result,
  StrongPassword,
} from '@poupig/shared'

export interface PasswordProps extends EntityProps {
  value: string
}

export class Password extends Entity<Password, PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props)
  }

  static create(props: PasswordProps): Password {
    const result = Password.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: PasswordProps): Result<Password> {
    const id = Id.tryCreate(props.id)
    // `value` is validated as a strong PLAINTEXT password to preserve the
    // domain invariant at construction. The encrypted (bcrypt) form persisted
    // at rest is produced later via `toEncrypted` (see create-user.use-case).
    const value = StrongPassword.tryCreate(props.value)

    const attributes = Result.combine([id, value])
    if (attributes.isFailure) return Result.fail(attributes.errors!)

    return Result.ok(
      new Password({
        ...props,
        id: id.instance.value,
        value: value.instance.value,
      }),
    )
  }

  /**
   * Returns a Password carrying the ENCRYPTED (bcrypt) value, keeping the same
   * identity/timestamps. The plaintext strong-password invariant was already
   * enforced at construction; here the value is validated as a bcrypt hash via
   * `EncryptedPassword`. This is the form the repository persists at rest.
   */
  toEncrypted(encrypted: string): Result<Password> {
    const hash = EncryptedPassword.tryCreate(encrypted)
    if (hash.isFailure) return Result.fail(hash.errors!)

    return Result.ok(
      new Password({
        ...this.props,
        value: hash.instance.value!,
      }),
    )
  }

  get value(): string {
    return this.props.value
  }
}
