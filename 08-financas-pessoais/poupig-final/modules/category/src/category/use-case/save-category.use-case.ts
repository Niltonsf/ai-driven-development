import { Result, UseCase } from '@poupig/shared';
import { Category, Subcategory } from '../model';
import { CategoryRepository } from '../provider';

export const SaveCategoryErrors = {
  CATEGORY_NAME_ALREADY_EXISTS: 'CATEGORY_NAME_ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DUPLICATE_SUBCATEGORY_ORDER: 'DUPLICATE_SUBCATEGORY_ORDER',
} as const;

export interface SaveSubcategoryInput {
  id?: string;
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  order: number;
}

export interface SaveCategoryInput {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  subcategories: SaveSubcategoryInput[];
}

export class SaveCategory implements UseCase<SaveCategoryInput, void> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: SaveCategoryInput): Promise<Result<void>> {
    const existingResult = await this.categoryRepository.findById(input.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const existing = existingResult.instance;

    if (!existing) {
      return this.create(input);
    }

    return this.update(existing, input);
  }

  private async create(input: SaveCategoryInput): Promise<Result<void>> {
    const duplicateResult = await this.categoryRepository.findByNameAndUserId(input.name, input.userId);
    if (duplicateResult.isFailure) return Result.fail(duplicateResult.errors!);

    if (duplicateResult.instance !== null) {
      return Result.fail(SaveCategoryErrors.CATEGORY_NAME_ALREADY_EXISTS);
    }

    const subcategoriesResult = this.buildSubcategories(input.subcategories);
    if (subcategoriesResult.isFailure) return Result.fail(subcategoriesResult.errors!);

    const categoryResult = Category.tryCreate({
      id: input.id,
      userId: input.userId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      isActive: true,
      subcategories: subcategoriesResult.instance,
    });
    if (categoryResult.isFailure) return Result.fail(this.mapErrors(categoryResult.errors!));

    return this.categoryRepository.save(categoryResult.instance);
  }

  private async update(existing: Category, input: SaveCategoryInput): Promise<Result<void>> {
    if (existing.userId !== input.userId) {
      return Result.fail(SaveCategoryErrors.UNAUTHORIZED);
    }

    const reconciledResult = this.reconcileSubcategories(existing.subcategories, input.subcategories);
    if (reconciledResult.isFailure) return Result.fail(reconciledResult.errors!);

    // Root field changes and the reconciled subcategories list are applied in
    // a single `cloneWith` call. Applying them in two separate steps would
    // make the second `cloneWith` run `structuredClone` over the previous
    // step's already-cloned `Subcategory` instances, stripping their
    // prototypes (and therefore their getters, e.g. `order`).
    const finalResult = existing.cloneWith({
      name: input.name,
      icon: input.icon,
      color: input.color,
      isActive: input.isActive ?? existing.isActive,
      subcategories: reconciledResult.instance,
    });
    if (finalResult.isFailure) return Result.fail(this.mapErrors(finalResult.errors!));

    return this.categoryRepository.save(finalResult.instance);
  }

  private buildSubcategories(inputs: SaveSubcategoryInput[]): Result<Subcategory[]> {
    const results = inputs.map((subcategory) =>
      Subcategory.tryCreate({
        id: subcategory.id,
        name: subcategory.name,
        icon: subcategory.icon,
        color: subcategory.color,
        isActive: subcategory.isActive ?? true,
        order: subcategory.order,
      }),
    );

    const combined = Result.combine(results);
    if (combined.isFailure) return Result.fail(this.mapErrors(combined.errors!));

    return Result.ok(combined.instance as unknown as Subcategory[]);
  }

  /**
   * Reconciles the desired subcategory list received by the use case against
   * the persisted list: items with an `id` that also exists in the persisted
   * list are updated, items without `id` are created, and persisted items
   * whose `id` is absent from the desired list are dropped.
   */
  private reconcileSubcategories(
    persisted: Subcategory[],
    desired: SaveSubcategoryInput[],
  ): Result<Subcategory[]> {
    const persistedById = new Map(persisted.map((subcategory) => [subcategory.id, subcategory]));

    const results = desired.map((item) => {
      if (item.id && persistedById.has(item.id)) {
        const current = persistedById.get(item.id)!;
        return current.cloneWith({
          name: item.name,
          icon: item.icon,
          color: item.color,
          isActive: item.isActive ?? current.isActive,
          order: item.order,
        });
      }

      return Subcategory.tryCreate({
        id: item.id,
        name: item.name,
        icon: item.icon,
        color: item.color,
        isActive: item.isActive ?? true,
        order: item.order,
      });
    });

    const combined = Result.combine(results);
    if (combined.isFailure) return Result.fail(this.mapErrors(combined.errors!));

    return Result.ok(combined.instance as unknown as Subcategory[]);
  }

  private mapErrors(errors: string[]): string[] {
    if (errors.includes('DUPLICATE_SUBCATEGORY_ORDER')) {
      return errors.map((error) =>
        error === 'DUPLICATE_SUBCATEGORY_ORDER' ? SaveCategoryErrors.DUPLICATE_SUBCATEGORY_ORDER : error,
      );
    }

    return errors;
  }
}
