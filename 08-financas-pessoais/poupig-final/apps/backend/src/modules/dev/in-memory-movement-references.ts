import { Result } from '@poupig/shared';
import { MovementReferencesQuery } from '@poupig/transaction';

/**
 * In-memory `MovementReferencesQuery` used while the data generator writes.
 *
 * The writer loads the ids of the authenticated user's records once and keeps
 * them here, so `SaveTransaction` validates references without three database
 * queries per transaction. The sets only ever hold records of that single user,
 * which is why the `userId` argument of the contract is not needed.
 */
export class InMemoryMovementReferences implements MovementReferencesQuery {
  private accountIds = new Set<string>();
  private creditCardIds = new Set<string>();
  private subcategoryIds = new Set<string>();

  replaceAccounts(ids: Iterable<string>): void {
    this.accountIds = new Set(ids);
  }

  replaceCreditCards(ids: Iterable<string>): void {
    this.creditCardIds = new Set(ids);
  }

  setSubcategories(ids: Iterable<string>): void {
    this.subcategoryIds = new Set(ids);
  }

  accountBelongsToUser(id: string): Promise<Result<boolean>> {
    return Promise.resolve(Result.ok(this.accountIds.has(id)));
  }

  creditCardBelongsToUser(id: string): Promise<Result<boolean>> {
    return Promise.resolve(Result.ok(this.creditCardIds.has(id)));
  }

  subcategoryBelongsToUser(id: string): Promise<Result<boolean>> {
    return Promise.resolve(Result.ok(this.subcategoryIds.has(id)));
  }
}
