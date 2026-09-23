import { Result } from '@poupig/shared';

/**
 * How a subcategory and the category that owns it are shown: identity, name,
 * color and icon. Colors and icons are returned as stored, so they may be `null`.
 */
export interface SubcategoryAppearance {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  subcategoryId: string;
  subcategoryName: string;
  subcategoryColor: string | null;
  subcategoryIcon: string | null;
}

export interface FindSubcategoryAppearancesInput {
  userId: string;
  /** Ids of the subcategories that had spending in the period. */
  subcategoryIds: string[];
}

/**
 * Finds the appearance of the given subcategories, only among the ones whose
 * category belongs to the user: the owner is resolved through the category,
 * so a subcategory of another user never leaks.
 *
 * - Inactive and soft deleted subcategories and categories **are** included:
 *   the money went out and the report shows it under its own name.
 * - An id that does not exist, or belongs to another user, simply does not
 *   come back; it is not a failure.
 * - An empty list of ids returns `[]` without querying.
 * - No guaranteed order.
 */
export interface FindSubcategoryAppearancesQuery {
  execute(input: FindSubcategoryAppearancesInput): Promise<Result<SubcategoryAppearance[]>>;
}
