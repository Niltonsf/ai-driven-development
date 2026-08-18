import { Injectable } from '@nestjs/common';
import {
  Product,
  ProductPageParams,
  ProductRepository,
  ProductStatus,
} from '@sdd/catalog';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service';

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  status: string;
  availableOnline: boolean;
  featured: boolean;
  allowsPreOrder: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Product): Promise<Product> {
    const created = await this.prisma.product.create({
      data: this.toPersistence(data),
    });
    return this.toDomain(created);
  }

  async update(data: Product): Promise<Product> {
    const updated = await this.prisma.product.update({
      where: { id: data.id },
      data: this.toPersistence(data),
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async findById(id: string): Promise<Product | null> {
    const found = await this.prisma.product.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findPage(params: ProductPageParams) {
    const page = Math.max(params.page, 1);
    const perPage = Math.max(params.perPage, 1);
    const skip = (page - 1) * perPage;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);

    return {
      items: items.map((item) => this.toDomain(item)),
      page,
      perPage,
      total,
    };
  }

  private toPersistence(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: new Prisma.Decimal(product.price),
      status: product.status,
      availableOnline: product.availableOnline,
      featured: product.featured,
      allowsPreOrder: product.allowsPreOrder,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt ?? null,
    };
  }

  private toDomain(raw: ProductRow): Product {
    return new Product({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      price: Number(raw.price),
      status: raw.status as ProductStatus,
      availableOnline: raw.availableOnline,
      featured: raw.featured,
      allowsPreOrder: raw.allowsPreOrder,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
