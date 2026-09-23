import { DateOnly, Entity, EntityProps, Id, Money, Result } from '@poupig/shared';
import {
  Direction,
  isDirection,
  isTransactionStatus,
  MovementErrors,
  MovementName,
  MovementNote,
  TransactionStatus,
} from '../../movement';

export interface TransactionProps extends EntityProps {
  userId: string;
  name: string;
  note?: string | null;
  value: number;
  direction: Direction;
  accountId: string;
  creditCardId?: string | null;
  subcategoryId?: string | null;
  status?: TransactionStatus;
  expectedOn: string;
  settledOn?: string | null;
}

export const TransactionErrors = {
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  TRANSACTION_SETTLED_ON_REQUIRED: 'TRANSACTION_SETTLED_ON_REQUIRED',
  INVALID_TRANSACTION_ACCOUNT_ID: 'INVALID_TRANSACTION_ACCOUNT_ID',
  INVALID_TRANSACTION_CREDIT_CARD_ID: 'INVALID_TRANSACTION_CREDIT_CARD_ID',
  INVALID_TRANSACTION_SUBCATEGORY_ID: 'INVALID_TRANSACTION_SUBCATEGORY_ID',
  INVALID_TRANSACTION_EXPECTED_ON: 'INVALID_TRANSACTION_EXPECTED_ON',
  INVALID_TRANSACTION_SETTLED_ON: 'INVALID_TRANSACTION_SETTLED_ON',
} as const;

export class Transaction extends Entity<Transaction, TransactionProps> {
  private constructor(props: TransactionProps) {
    super(props);
  }

  static create(props: TransactionProps): Transaction {
    const result = Transaction.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: TransactionProps): Result<Transaction> {
    const id = Id.tryCreate(props.id);
    const userId = Id.tryCreate(props.userId, { attribute: 'userId' });
    const name = MovementName.tryCreate(props.name);
    const value = Money.tryCreate(props.value);
    // `Id` generates a new uuid for an empty value, so a missing account must be rejected before it.
    const accountId = props.accountId ? Id.tryCreate(props.accountId, { attribute: 'accountId' }) : undefined;
    const expectedOn = DateOnly.tryCreate(props.expectedOn);
    const status = props.status ?? TransactionStatus.PENDING;

    const results: Result<unknown>[] = [id, userId, name, value];

    if (!isDirection(props.direction)) {
      results.push(Result.fail(MovementErrors.INVALID_DIRECTION));
    }

    if (!accountId || accountId.isFailure) {
      results.push(Result.fail(TransactionErrors.INVALID_TRANSACTION_ACCOUNT_ID));
    }

    if (expectedOn.isFailure) {
      results.push(Result.fail(TransactionErrors.INVALID_TRANSACTION_EXPECTED_ON));
    }

    if (!isTransactionStatus(status)) {
      results.push(Result.fail(MovementErrors.INVALID_TRANSACTION_STATUS));
    }

    const note = props.note ? MovementNote.tryCreate(props.note) : undefined;
    if (note) {
      results.push(note);
    }

    const creditCardId = props.creditCardId
      ? Id.tryCreate(props.creditCardId, { attribute: 'creditCardId' })
      : undefined;
    if (creditCardId?.isFailure) {
      results.push(Result.fail(TransactionErrors.INVALID_TRANSACTION_CREDIT_CARD_ID));
    }

    const subcategoryId = props.subcategoryId
      ? Id.tryCreate(props.subcategoryId, { attribute: 'subcategoryId' })
      : undefined;
    if (subcategoryId?.isFailure) {
      results.push(Result.fail(TransactionErrors.INVALID_TRANSACTION_SUBCATEGORY_ID));
    }

    const settledOn = props.settledOn ? DateOnly.tryCreate(props.settledOn) : undefined;
    if (settledOn?.isFailure) {
      results.push(Result.fail(TransactionErrors.INVALID_TRANSACTION_SETTLED_ON));
    }

    if (status === TransactionStatus.SETTLED && !settledOn) {
      results.push(Result.fail(TransactionErrors.TRANSACTION_SETTLED_ON_REQUIRED));
    }

    const combined = Result.combine(results);
    if (combined.isFailure) return Result.fail(combined.errors!);

    return Result.ok(
      new Transaction({
        ...props,
        id: id.instance.value,
        userId: userId.instance.value,
        name: name.instance.value,
        note: note ? note.instance.value : null,
        value: value.instance.value,
        direction: props.direction,
        accountId: accountId!.instance.value,
        creditCardId: creditCardId ? creditCardId.instance.value : null,
        subcategoryId: subcategoryId ? subcategoryId.instance.value : null,
        status,
        expectedOn: expectedOn.instance.value,
        // Only a settled transaction keeps its settlement date.
        settledOn: status === TransactionStatus.SETTLED && settledOn ? settledOn.instance.value : null,
      }),
    );
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get note(): string | null {
    return this.props.note ?? null;
  }

  get value(): number {
    return this.props.value;
  }

  get direction(): Direction {
    return this.props.direction;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get creditCardId(): string | null {
    return this.props.creditCardId ?? null;
  }

  get subcategoryId(): string | null {
    return this.props.subcategoryId ?? null;
  }

  get status(): TransactionStatus {
    return this.props.status ?? TransactionStatus.PENDING;
  }

  get expectedOn(): string {
    return this.props.expectedOn;
  }

  get settledOn(): string | null {
    return this.props.settledOn ?? null;
  }

  softDelete(): Result<Transaction> {
    return this.cloneWith({ deletedAt: new Date() });
  }
}
