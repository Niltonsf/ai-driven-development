import { Result } from '@poupig/shared';
import { Category, CategoryRepository } from '../../src/category';

export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly items = new Map<string, Category>();

  async save(category: Category): Promise<Result<void>> {
    this.items.set(category.id, category);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<Category | null>> {
    return Result.ok(this.items.get(id) ?? null);
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Result<Category | null>> {
    const found = [...this.items.values()].find(
      (category) => category.userId === userId && category.name === name && !category.deletedAt,
    );
    return Result.ok(found ?? null);
  }

  async delete(id: string): Promise<Result<void>> {
    this.items.delete(id);
    return Result.ok();
  }
}
