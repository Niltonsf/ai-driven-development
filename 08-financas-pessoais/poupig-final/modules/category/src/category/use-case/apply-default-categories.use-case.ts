import { Id, Result, UseCase } from '@poupig/shared';
import { DEFAULT_CATEGORIES } from '../constants';
import { CategoryRepository } from '../provider';
import { SaveCategory, SaveCategoryErrors } from './save-category.use-case';

export interface ApplyDefaultCategoriesInput {
  userId: string;
}

export class ApplyDefaultCategories implements UseCase<ApplyDefaultCategoriesInput, void> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: ApplyDefaultCategoriesInput): Promise<Result<void>> {
    const saveCategory = new SaveCategory(this.categoryRepository);
    const errors: string[] = [];

    for (const category of DEFAULT_CATEGORIES) {
      const result = await saveCategory.execute({
        id: Id.createUUID(),
        userId: input.userId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        subcategories: category.subcategories.map((subcategory) => ({
          name: subcategory.name,
          icon: subcategory.icon,
          color: subcategory.color,
          order: subcategory.order,
        })),
      });

      if (result.isFailure && !result.errors.includes(SaveCategoryErrors.CATEGORY_NAME_ALREADY_EXISTS)) {
        errors.push(...result.errors);
      }
    }

    if (errors.length > 0) return Result.fail(errors);

    return Result.ok();
  }
}
