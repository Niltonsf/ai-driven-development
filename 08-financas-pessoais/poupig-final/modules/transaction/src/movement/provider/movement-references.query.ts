import { Result } from '@poupig/shared';

/**
 * Checks whether the references of a movement (account, credit card and
 * subcategory) belong to a user, so use cases can validate them without
 * importing the `account`, `credit-card` and `category` domain modules.
 *
 * Each method resolves `Result.ok(true)` only when the record exists, is not
 * soft deleted and belongs to the given user. For the subcategory, ownership
 * comes from its category, which must not be soft deleted either. Technical
 * failures are returned as `Result.fail`.
 */
export interface MovementReferencesQuery {
  accountBelongsToUser(id: string, userId: string): Promise<Result<boolean>>;
  creditCardBelongsToUser(id: string, userId: string): Promise<Result<boolean>>;
  subcategoryBelongsToUser(id: string, userId: string): Promise<Result<boolean>>;
}
