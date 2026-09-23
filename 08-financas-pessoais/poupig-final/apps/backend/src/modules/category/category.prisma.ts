import { Injectable } from '@nestjs/common';
import { Result } from '@poupig/shared';
import {
  Category,
  CategoryDTO,
  CategoryRepository,
  FindCategoriesByUserIdQuery,
  Subcategory,
  SubcategoryDTO,
} from '@poupig/category';
import { PrismaService } from '../../db/prisma.service';

type SubcategoryRow = {
  id: string;
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type CategoryRow = {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  subcategories: SubcategoryRow[];
};

function toDomain(row: CategoryRow): Result<Category> {
  const subcategoryResults = row.subcategories.map((subcategory) =>
    Subcategory.tryCreate({
      id: subcategory.id,
      name: subcategory.name,
      icon: subcategory.icon ?? undefined,
      color: subcategory.color ?? undefined,
      isActive: subcategory.isActive,
      order: subcategory.order,
      createdAt: subcategory.createdAt,
      updatedAt: subcategory.updatedAt,
      deletedAt: subcategory.deletedAt,
    }),
  );

  const combined = Result.combine(subcategoryResults);
  if (combined.isFailure) return Result.fail(combined.errors!);

  return Category.tryCreate({
    id: row.id,
    userId: row.userId,
    name: row.name,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
    isActive: row.isActive,
    subcategories: combined.instance as unknown as Subcategory[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}

function toSubcategoryDTO(row: SubcategoryRow): SubcategoryDTO {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
    isActive: row.isActive,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDTO(row: CategoryRow): CategoryDTO {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
    isActive: row.isActive,
    subcategories: row.subcategories
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(toSubcategoryDTO),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class CategoryPrisma implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategoriesByUserId: FindCategoriesByUserIdQuery = {
    execute: async (userId: string): Promise<Result<CategoryDTO[]>> => {
      return Result.tryAsync(async () => {
        const rows = await this.prisma.client.category.findMany({
          where: { userId, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            subcategories: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
            },
          },
        });
        return rows.map((row) => toDTO(row as CategoryRow));
      });
    },
  };

  /**
   * Persists the `Category` aggregate root and all of its composed
   * `Subcategory` entities as a single transactional unit. Subcategories
   * currently persisted for this `categoryId` are diffed by `id` against
   * `category.subcategories`: ids present in both are updated, ids only in
   * the incoming list are created, and ids only in the persisted list (i.e.
   * missing from the incoming list) are hard-deleted. The root upsert and
   * every subcategory write happen inside the same `$transaction`, so a
   * failure at any step reverts the whole operation.
   */
  async save(category: Category): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.prisma.client.$transaction(async (tx) => {
        await tx.category.upsert({
          where: { id: category.id },
          create: {
            id: category.id,
            userId: category.userId,
            name: category.name,
            icon: category.icon ?? null,
            color: category.color ?? null,
            isActive: category.isActive,
            deletedAt: category.deletedAt,
          },
          update: {
            name: category.name,
            icon: category.icon ?? null,
            color: category.color ?? null,
            isActive: category.isActive,
            deletedAt: category.deletedAt,
          },
        });

        const persistedRows = await tx.subcategory.findMany({
          where: { categoryId: category.id },
          select: { id: true },
        });
        const persistedIds = new Set(persistedRows.map((row) => row.id));
        const incomingIds = new Set(category.subcategories.map((subcategory) => subcategory.id));

        for (const subcategory of category.subcategories) {
          await tx.subcategory.upsert({
            where: { id: subcategory.id },
            create: {
              id: subcategory.id,
              categoryId: category.id,
              name: subcategory.name,
              icon: subcategory.icon ?? null,
              color: subcategory.color ?? null,
              isActive: subcategory.isActive,
              order: subcategory.order,
              deletedAt: subcategory.deletedAt,
            },
            update: {
              name: subcategory.name,
              icon: subcategory.icon ?? null,
              color: subcategory.color ?? null,
              isActive: subcategory.isActive,
              order: subcategory.order,
              deletedAt: subcategory.deletedAt,
            },
          });
        }

        const removedIds = [...persistedIds].filter((id) => !incomingIds.has(id));
        if (removedIds.length > 0) {
          await tx.subcategory.deleteMany({
            where: { id: { in: removedIds } },
          });
        }
      });
    });
  }

  async findById(id: string): Promise<Result<Category | null>> {
    const row = await this.prisma.client.category.findUnique({
      where: { id },
      include: { subcategories: true },
    });
    if (!row) return Result.ok(null);
    return toDomain(row as CategoryRow);
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Result<Category | null>> {
    const row = await this.prisma.client.category.findFirst({
      where: { name, userId, deletedAt: null },
      include: { subcategories: true },
    });
    if (!row) return Result.ok(null);
    return toDomain(row as CategoryRow);
  }

  async delete(id: string): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const deletedAt = new Date();
      await this.prisma.client.$transaction(async (tx) => {
        await tx.category.update({
          where: { id },
          data: { deletedAt },
        });
        await tx.subcategory.updateMany({
          where: { categoryId: id },
          data: { deletedAt },
        });
      });
    });
  }
}
