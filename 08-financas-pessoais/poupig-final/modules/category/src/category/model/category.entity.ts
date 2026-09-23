import { Entity, EntityProps, HexColor, Id, Result } from '@poupig/shared';
import { CategoryName } from './category-name.vo';
import { Subcategory } from './subcategory.entity';

export interface CategoryProps extends EntityProps {
  userId: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
  subcategories: Subcategory[];
}

export const CategoryErrors = {
  DUPLICATE_SUBCATEGORY_ORDER: 'DUPLICATE_SUBCATEGORY_ORDER',
} as const;

export class Category extends Entity<Category, CategoryProps> {
  private constructor(props: CategoryProps) {
    super(props);
  }

  static create(props: CategoryProps): Category {
    const result = Category.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: CategoryProps): Result<Category> {
    const id = Id.tryCreate(props.id);
    const userId = Id.tryCreate(props.userId, { attribute: 'userId' });
    const name = CategoryName.tryCreate(props.name);

    const baseResults: Result<any>[] = [id, userId, name];

    if (props.color) {
      const color = HexColor.tryCreate(props.color);
      baseResults.push(color);
    }

    const combined = Result.combine(baseResults);
    if (combined.isFailure) return Result.fail(combined.errors!);

    const subcategories = props.subcategories ?? [];
    const uniqueOrderResult = Category.validateUniqueOrder(subcategories);
    if (uniqueOrderResult.isFailure) return Result.fail(uniqueOrderResult.errors!);

    return Result.ok(
      new Category({
        ...props,
        id: id.instance.value,
        userId: userId.instance.value,
        name: name.instance.value,
        isActive: props.isActive ?? true,
        subcategories,
      }),
    );
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get icon(): string | null | undefined {
    return this.props.icon;
  }

  get color(): string | null | undefined {
    return this.props.color;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get subcategories(): Subcategory[] {
    return this.props.subcategories;
  }

  /**
   * Replaces the current list of subcategories with the given list, validating
   * that there are no two subcategories sharing the same `order` before
   * accepting the change. This is the single entry point through which the
   * aggregate root enforces the uniqueness invariant of `order` across its
   * composed `Subcategory` children.
   */
  replaceSubcategories(subcategories: Subcategory[]): Result<Category> {
    const uniqueOrderResult = Category.validateUniqueOrder(subcategories);
    if (uniqueOrderResult.isFailure) return Result.fail(uniqueOrderResult.errors!);

    return this.cloneWith({ subcategories });
  }

  softDelete(): Result<Category> {
    const deletedAt = new Date();
    const subcategories = this.props.subcategories.map((subcategory) => {
      const result = subcategory.softDelete();
      result.validator.throwsIfFailed();
      return result.instance;
    });

    return this.cloneWith({ deletedAt, subcategories });
  }

  private static validateUniqueOrder(subcategories: Subcategory[]): Result<void> {
    const orders = subcategories.map((subcategory) => subcategory.order);
    const uniqueOrders = new Set(orders);

    if (uniqueOrders.size !== orders.length) {
      return Result.fail(CategoryErrors.DUPLICATE_SUBCATEGORY_ORDER);
    }

    return Result.ok();
  }
}
