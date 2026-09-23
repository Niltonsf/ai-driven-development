import { DateOnly, Id, Money, Text } from '@poupig/shared';
import { MovementName, MovementNote, TransactionStatus, type Direction } from '@poupig/transaction';
import { v } from '@/shared/components/form/validator';
import { getMessage } from '@/shared/i18n';

/**
 * `direction` and `status` are not Value Objects: they are declared as `Text`
 * only so the resolver hands them to the refinement and to the submit handler
 * (undeclared fields are dropped). The form controls only produce enum values
 * and the domain/backend still rejects anything else.
 *
 * `accountId` uses `Text`, not `Id`: `Id.tryCreate` turns an empty value into a
 * fresh uuid, which would let a missing account through.
 */
export const transactionSchema = v
  .defineObject({
    name: MovementName,
    note: { vo: MovementNote, optional: true },
    value: Money,
    direction: Text,
    expectedOn: DateOnly,
    accountId: Text,
    creditCardId: { vo: Id, optional: true },
    subcategoryId: { vo: Id, optional: true },
    status: Text,
    settledOn: { vo: DateOnly, optional: true },
  })
  .refine((data) => data.status !== TransactionStatus.SETTLED || Boolean(data.settledOn), {
    field: 'settledOn',
    // The validator shows refinement messages as they are, so the text is translated here.
    message: getMessage('TRANSACTION_SETTLED_ON_REQUIRED'),
  });

/**
 * Narrows the transport fields to the domain enums. The dates are narrowed to
 * `string` as well: `DateOnly` also accepts `Date`, but the form only handles
 * `YYYY-MM-DD` strings.
 */
export type TransactionFormData = Omit<
  v.infer<typeof transactionSchema>,
  'direction' | 'status' | 'expectedOn' | 'settledOn'
> & {
  direction: Direction;
  status: TransactionStatus;
  expectedOn: string;
  settledOn?: string;
};
