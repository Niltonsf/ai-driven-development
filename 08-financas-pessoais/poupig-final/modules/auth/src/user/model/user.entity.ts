import { Email, Entity, EntityProps, Id, PersonName, Result, Url } from '@poupig/shared';

export interface UserProps extends EntityProps {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export class User extends Entity<User, UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  static create(props: UserProps): User {
    const result = User.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: UserProps): Result<User> {
    const id = Id.tryCreate(props.id);
    const name = PersonName.tryCreate(props.name);
    const email = Email.tryCreate(props.email);
    const avatarUrl = props.avatarUrl ? Url.tryCreate(props.avatarUrl) : Result.ok(null);

    const attributes = Result.combine([id, name, email, avatarUrl]);
    if (attributes.isFailure) return Result.fail(attributes.errors!);

    return Result.ok(
      new User({
        ...props,
        id: id.instance.value,
        name: name.instance.value,
        email: email.instance.value,
        avatarUrl: avatarUrl.instance ? avatarUrl.instance.value : null,
      }),
    );
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  get $name(): PersonName {
    return PersonName.create(this.props.name);
  }

  get $email(): Email {
    return Email.create(this.props.email);
  }

  get $avatarUrl(): Url | null {
    return this.props.avatarUrl ? Url.create(this.props.avatarUrl) : null;
  }
}
