import { Result } from '@poupig/shared';
import { Category } from '../model';

export interface CategoryRepository {
  /**
   * Persists the `Category` aggregate root and all of its composed
   * `Subcategory` entities as a single transactional unit (all-or-nothing).
   * Any implementation MUST guarantee that creations, updates and removals
   * of subcategories are committed together with the root, so the
   * aggregate is never left partially saved.
   */
  save(category: Category): Promise<Result<void>>;
  findById(id: string): Promise<Result<Category | null>>;
  findByNameAndUserId(name: string, userId: string): Promise<Result<Category | null>>;
  delete(id: string): Promise<Result<void>>;
}
