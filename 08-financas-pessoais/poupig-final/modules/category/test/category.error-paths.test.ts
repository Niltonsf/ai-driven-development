import { Id, Result } from '@poupig/shared';
import {
  ApplyDefaultCategories,
  Category,
  CategoryRepository,
  DeleteCategory,
  DeleteCategoryErrors,
  SaveCategory,
} from '../src/category';
import { InMemoryCategoryRepository } from './mock/in-memory-category.repository';

describe('Category.tryCreate — subcategories default', () => {
  test('defaults subcategories to an empty list when the field is omitted', () => {
    const result = Category.tryCreate({
      id: Id.createUUID(),
      userId: Id.createUUID(),
      name: 'Alimentação',
    } as any);

    expect(result.isOk).toBe(true);
    expect(result.instance.subcategories).toEqual([]);
  });
});

describe('SaveCategory — non-duplicate error mapping', () => {
  test('surfaces subcategory validation errors untouched (not remapped as duplicate order)', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);

    // order 0 is invalid (must be a positive integer): each subcategory fails
    // its own validation, so mapErrors takes the branch that keeps the errors
    // as-is instead of the DUPLICATE_SUBCATEGORY_ORDER remap branch.
    const result = await useCase.execute({
      id: Id.createUUID(),
      userId: Id.createUUID(),
      name: 'Transporte',
      subcategories: [{ name: 'Combustível', order: 0 }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).not.toContain('DUPLICATE_SUBCATEGORY_ORDER');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

/**
 * Repository whose write/read operations fail, used to exercise the error
 * propagation branches that the in-memory happy-path repository never reaches.
 */
class FailingCategoryRepository implements CategoryRepository {
  constructor(private readonly failOn: 'findById' | 'save') {}

  async save(): Promise<Result<void>> {
    if (this.failOn === 'save') return Result.fail('SAVE_FAILED');
    return Result.ok();
  }

  async findById(): Promise<Result<Category | null>> {
    if (this.failOn === 'findById') return Result.fail('FIND_FAILED');
    return Result.ok(null);
  }

  async findByNameAndUserId(): Promise<Result<Category | null>> {
    return Result.ok(null);
  }

  async delete(): Promise<Result<void>> {
    return Result.ok();
  }
}

describe('ApplyDefaultCategories — failure aggregation', () => {
  test('collects and returns non-duplicate errors raised while saving the catalog', async () => {
    const repository = new FailingCategoryRepository('save');
    const useCase = new ApplyDefaultCategories(repository);

    const result = await useCase.execute({ userId: Id.createUUID() });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('SAVE_FAILED');
  });
});

describe('DeleteCategory — error propagation', () => {
  test('propagates the repository failure when the lookup fails', async () => {
    const repository = new FailingCategoryRepository('findById');
    const useCase = new DeleteCategory(repository);

    const result = await useCase.execute({ id: Id.createUUID(), userId: Id.createUUID() });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_FAILED');
    expect(result.errors).not.toContain(DeleteCategoryErrors.CATEGORY_NOT_FOUND);
  });

  test('propagates the failure when soft-deleting the aggregate fails', async () => {
    const repository = new InMemoryCategoryRepository();
    const saveUseCase = new SaveCategory(repository);
    const deleteUseCase = new DeleteCategory(repository);
    const userId = Id.createUUID();
    const id = Id.createUUID();

    await saveUseCase.execute({ id, userId, name: 'Educação', subcategories: [] });

    const stored = (await repository.findById(id)).instance!;
    jest.spyOn(stored, 'softDelete').mockReturnValue(Result.fail('SOFT_DELETE_FAILED'));

    const result = await deleteUseCase.execute({ id, userId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('SOFT_DELETE_FAILED');
  });
});
