import { UseCase } from "@sdd/shared";
import { Product, ProductStatus } from "../model";
import { ProductRepository } from "../provider";

export interface SaveProductIn {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  status: ProductStatus;
  availableOnline?: boolean;
  featured?: boolean;
  allowsPreOrder?: boolean;
}

export class SaveProduct implements UseCase<SaveProductIn, void> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: SaveProductIn): Promise<void> {
    const existing = input.id
      ? await this.productRepository.findById(input.id)
      : null;

    if (existing) {
      const updated = existing.clone({
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        status: input.status,
        availableOnline: input.availableOnline ?? existing.availableOnline,
        featured: input.featured ?? existing.featured,
        allowsPreOrder: input.allowsPreOrder ?? existing.allowsPreOrder,
      });
      updated.validate();
      await this.productRepository.update(updated);
      return;
    }

    const product = new Product({
      id: input.id,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      status: input.status,
      availableOnline: input.availableOnline ?? false,
      featured: input.featured ?? false,
      allowsPreOrder: input.allowsPreOrder ?? false,
    });
    product.validate();
    await this.productRepository.create(product);
  }
}
