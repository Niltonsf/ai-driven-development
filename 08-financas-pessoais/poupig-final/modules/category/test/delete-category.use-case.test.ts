import { Id } from '@poupig/shared';
import { DeleteCategory, DeleteCategoryErrors, SaveCategory } from '../src/category';
import { InMemoryCategoryRepository } from './mock/in-memory-category.repository';

describe('DeleteCategory', () => {
  const userId = Id.createUUID();

  test('soft deletes an existing category and propagates deletedAt to subcategories', async () => {
    const repository = new InMemoryCategoryRepository();
    const saveUseCase = new SaveCategory(repository);
    const deleteUseCase = new DeleteCategory(repository);
    const id = Id.createUUID();

    await saveUseCase.execute({
      id,
      userId,
      name: 'Investimentos',
      subcategories: [
        { name: 'Renda Fixa', order: 1 },
        { name: 'Renda Variável', order: 2 },
      ],
    });

    const result = await deleteUseCase.execute({ id, userId });

    expect(result.isOk).toBe(true);

    const deleted = await repository.findById(id);
    expect(deleted.instance!.deletedAt).not.toBeNull();
    for (const subcategory of deleted.instance!.subcategories) {
      expect(subcategory.deletedAt).not.toBeNull();
    }
  });

  test('fails when the category does not exist', async () => {
    const repository = new InMemoryCategoryRepository();
    const deleteUseCase = new DeleteCategory(repository);

    const result = await deleteUseCase.execute({ id: Id.createUUID(), userId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(DeleteCategoryErrors.CATEGORY_NOT_FOUND);
  });

  test('fails when the category belongs to another user', async () => {
    const repository = new InMemoryCategoryRepository();
    const saveUseCase = new SaveCategory(repository);
    const deleteUseCase = new DeleteCategory(repository);
    const id = Id.createUUID();

    await saveUseCase.execute({
      id,
      userId,
      name: 'Viagens',
      subcategories: [],
    });

    const otherUserId = Id.createUUID();
    const result = await deleteUseCase.execute({ id, userId: otherUserId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(DeleteCategoryErrors.UNAUTHORIZED);
  });
});
