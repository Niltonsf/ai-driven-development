import {
  Entity,
  EntityState,
  InRule,
  MaxLengthRule,
  MinLengthRule,
  MinValueRule,
  PrecisionRule,
  RequiredRule,
  Validator,
} from "@sdd/shared";

export type ProductStatus = "active" | "inactive" | "draft";

export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = [
  "active",
  "inactive",
  "draft",
];

export interface ProductState extends EntityState {
  name: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  availableOnline: boolean;
  featured: boolean;
  allowsPreOrder: boolean;
}

export interface ProductInput extends EntityState {
  name: string;
  description?: string | null;
  price: number;
  status: ProductStatus;
  availableOnline?: boolean;
  featured?: boolean;
  allowsPreOrder?: boolean;
}

export class Product extends Entity<ProductState> {
  constructor(props: ProductInput) {
    super({
      ...props,
      description: props.description ?? null,
      availableOnline: props.availableOnline ?? false,
      featured: props.featured ?? false,
      allowsPreOrder: props.allowsPreOrder ?? false,
    });
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get availableOnline(): boolean {
    return this.props.availableOnline;
  }

  get featured(): boolean {
    return this.props.featured;
  }

  get allowsPreOrder(): boolean {
    return this.props.allowsPreOrder;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "product.name",
        value: this.name,
        rules: [
          new RequiredRule(),
          new MinLengthRule(2),
          new MaxLengthRule(120),
        ],
      },
      {
        code: "product.description",
        value: this.description,
        rules: [new MaxLengthRule(500)],
      },
      {
        code: "product.price",
        value: this.price,
        rules: [
          new RequiredRule(),
          new MinValueRule(0),
          new PrecisionRule(2),
        ],
      },
      {
        code: "product.status",
        value: this.status,
        rules: [
          new RequiredRule(),
          new InRule(PRODUCT_STATUS_VALUES as unknown as string[]),
        ],
      },
    ]);
  }
}
