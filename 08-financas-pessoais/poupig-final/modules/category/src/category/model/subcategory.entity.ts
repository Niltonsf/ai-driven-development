import { Entity, EntityProps, HexColor, Id, PositiveInteger, Result } from '@poupig/shared';
import { SubcategoryName } from './subcategory-name.vo';

export interface SubcategoryProps extends EntityProps {
  name: string;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
  order: number;
}

export class Subcategory extends Entity<Subcategory, SubcategoryProps> {
  private constructor(props: SubcategoryProps) {
    super(props);
  }

  static create(props: SubcategoryProps): Subcategory {
    const result = Subcategory.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: SubcategoryProps): Result<Subcategory> {
    const id = Id.tryCreate(props.id);
    const name = SubcategoryName.tryCreate(props.name);
    const order = PositiveInteger.tryCreate(props.order);

    const baseResults: Result<any>[] = [id, name, order];

    if (props.color) {
      const color = HexColor.tryCreate(props.color);
      baseResults.push(color);
    }

    const combined = Result.combine(baseResults);
    if (combined.isFailure) return Result.fail(combined.errors!);

    return Result.ok(
      new Subcategory({
        ...props,
        id: id.instance.value,
        name: name.instance.value,
        order: order.instance.value,
        isActive: props.isActive ?? true,
      }),
    );
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

  get order(): number {
    return this.props.order;
  }

  softDelete(): Result<Subcategory> {
    return this.cloneWith({ deletedAt: new Date() });
  }
}
