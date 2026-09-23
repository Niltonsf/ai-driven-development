import { Entity, EntityProps, HexColor, Id, Result } from '@poupig/shared';
import { AccountType } from './account-type.enum';
import { AccountName } from './account-name.vo';

export interface AccountProps extends EntityProps {
  userId: string;
  name: string;
  description?: string | null;
  type: AccountType;
  accountNumber?: string | null;
  agency?: string | null;
  financialInstitution?: string | null;
  color?: string | null;
  icon?: string | null;
  isActive: boolean;
}

export class Account extends Entity<Account, AccountProps> {
  private constructor(props: AccountProps) {
    super(props);
  }

  static create(props: AccountProps): Account {
    const result = Account.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: AccountProps): Result<Account> {
    const id = Id.tryCreate(props.id);
    const userId = Id.tryCreate(props.userId, { attribute: 'userId' });
    const name = AccountName.tryCreate(props.name);

    const baseResults: Result<any>[] = [id, userId, name];

    if (props.color) {
      const color = HexColor.tryCreate(props.color);
      baseResults.push(color);
    }

    const combined = Result.combine(baseResults);
    if (combined.isFailure) return Result.fail(combined.errors!);

    return Result.ok(
      new Account({
        ...props,
        id: id.instance.value,
        userId: userId.instance.value,
        name: name.instance.value,
        isActive: props.isActive ?? true,
      }),
    );
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get type(): AccountType {
    return this.props.type;
  }

  get accountNumber(): string | null | undefined {
    return this.props.accountNumber;
  }

  get agency(): string | null | undefined {
    return this.props.agency;
  }

  get financialInstitution(): string | null | undefined {
    return this.props.financialInstitution;
  }

  get color(): string | null | undefined {
    return this.props.color;
  }

  get icon(): string | null | undefined {
    return this.props.icon;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  softDelete(): Result<Account> {
    return this.cloneWith({ deletedAt: new Date() });
  }
}
