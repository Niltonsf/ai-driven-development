import { PageResult } from "@sdd/shared";
import { Product, ProductPageParams, ProductRepository } from "../../src/product";

export class FakeProductRepository implements ProductRepository {
  readonly products: Product[] = [];

  async create(data: Product): Promise<Product> {
    this.products.push(data);
    return data;
  }

  async update(data: Product): Promise<Product> {
    const index = this.products.findIndex((p) => p.id === data.id);
    if (index >= 0) this.products[index] = data;
    return data;
  }

  async delete(id: string): Promise<void> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index >= 0) this.products.splice(index, 1);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async findPage(params: ProductPageParams): Promise<PageResult<Product>> {
    const start = (params.page - 1) * params.perPage;
    const items = this.products.slice(start, start + params.perPage);
    return { items, total: this.products.length, page: params.page, perPage: params.perPage };
  }
}
