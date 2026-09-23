import { Result } from '@poupig/shared';
import { MovementReferencesQuery } from '../../src';

type ReferenceKind = 'account' | 'creditCard' | 'subcategory';

export interface ReferenceCheck {
  kind: ReferenceKind;
  id: string;
  userId: string;
}

/**
 * Only registered references exist. A soft deleted reference (or one whose
 * category is soft deleted) is modeled by simply not registering it.
 */
export class InMemoryMovementReferencesQuery implements MovementReferencesQuery {
  readonly checks: ReferenceCheck[] = [];
  /** When set, every check fails with this technical error. */
  failure?: string;

  private readonly owners: Record<ReferenceKind, Map<string, string>> = {
    account: new Map(),
    creditCard: new Map(),
    subcategory: new Map(),
  };

  addAccount(id: string, userId: string): this {
    this.owners.account.set(id, userId);
    return this;
  }

  addCreditCard(id: string, userId: string): this {
    this.owners.creditCard.set(id, userId);
    return this;
  }

  addSubcategory(id: string, userId: string): this {
    this.owners.subcategory.set(id, userId);
    return this;
  }

  async accountBelongsToUser(id: string, userId: string): Promise<Result<boolean>> {
    return this.check('account', id, userId);
  }

  async creditCardBelongsToUser(id: string, userId: string): Promise<Result<boolean>> {
    return this.check('creditCard', id, userId);
  }

  async subcategoryBelongsToUser(id: string, userId: string): Promise<Result<boolean>> {
    return this.check('subcategory', id, userId);
  }

  private check(kind: ReferenceKind, id: string, userId: string): Result<boolean> {
    this.checks.push({ kind, id, userId });
    if (this.failure) return Result.fail(this.failure);
    return Result.ok(this.owners[kind].get(id) === userId);
  }
}
