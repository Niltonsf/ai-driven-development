import { Id } from '@poupig/shared';
import { ApplyDefaultCategories, DEFAULT_CATEGORIES, SaveCategory } from '../src/category';
import { InMemoryCategoryRepository } from './mock/in-memory-category.repository';

describe('ApplyDefaultCategories', () => {
  const userId = Id.createUUID();

  test('creates every category from the catalog for a user with no categories', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new ApplyDefaultCategories(repository);

    const result = await useCase.execute({ userId });

    expect(result.isOk).toBe(true);

    for (const category of DEFAULT_CATEGORIES) {
      const found = await repository.findByNameAndUserId(category.name, userId);
      expect(found.instance).not.toBeNull();
      expect(found.instance!.subcategories).toHaveLength(category.subcategories.length);
    }
  });

  test('is idempotent: reapplying the catalog creates nothing new and reports no error', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new ApplyDefaultCategories(repository);

    await useCase.execute({ userId });
    const result = await useCase.execute({ userId });

    expect(result.isOk).toBe(true);

    const first = DEFAULT_CATEGORIES[0];
    const found = await repository.findByNameAndUserId(first.name, userId);
    expect(found.instance!.subcategories).toHaveLength(first.subcategories.length);
  });

  test('skips categories the user already has and creates the remaining ones from the catalog', async () => {
    const repository = new InMemoryCategoryRepository();
    const saveCategory = new SaveCategory(repository);
    const useCase = new ApplyDefaultCategories(repository);

    const existing = DEFAULT_CATEGORIES[0];
    await saveCategory.execute({
      id: Id.createUUID(),
      userId,
      name: existing.name,
      icon: 'custom-icon',
      subcategories: [{ name: 'Subcategoria Personalizada', order: 1 }],
    });

    const result = await useCase.execute({ userId });

    expect(result.isOk).toBe(true);

    const untouched = await repository.findByNameAndUserId(existing.name, userId);
    expect(untouched.instance!.icon).toBe('custom-icon');
    expect(untouched.instance!.subcategories).toHaveLength(1);

    const other = DEFAULT_CATEGORIES[1];
    const created = await repository.findByNameAndUserId(other.name, userId);
    expect(created.instance).not.toBeNull();
    expect(created.instance!.subcategories).toHaveLength(other.subcategories.length);
  });
});
