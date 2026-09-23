import { Id, Result } from '@poupig/shared';
import { Category, CategoryRepository, SaveCategory, SaveCategoryErrors } from '../src/category';
import { InMemoryCategoryRepository } from './mock/in-memory-category.repository';

class ScriptedCategoryRepository implements CategoryRepository {
  constructor(
    private readonly findByIdResult: () => Result<Category | null>,
    private readonly findByNameResult: () => Result<Category | null> = () => Result.ok(null),
  ) {}

  async save(): Promise<Result<void>> {
    return Result.ok();
  }

  async findById(): Promise<Result<Category | null>> {
    return this.findByIdResult();
  }

  async findByNameAndUserId(): Promise<Result<Category | null>> {
    return this.findByNameResult();
  }

  async delete(): Promise<Result<void>> {
    return Result.ok();
  }
}

describe('SaveCategory — repository failure propagation', () => {
  const userId = Id.createUUID();

  test('propagates the failure when the initial lookup by id fails', async () => {
    const repository = new ScriptedCategoryRepository(() => Result.fail('FIND_BY_ID_FAILED'));
    const useCase = new SaveCategory(repository);

    const result = await useCase.execute({
      id: Id.createUUID(),
      userId,
      name: 'Alimentação',
      subcategories: [],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_BY_ID_FAILED');
  });

  test('propagates the failure when the duplicate-name lookup fails during creation', async () => {
    const repository = new ScriptedCategoryRepository(
      () => Result.ok(null),
      () => Result.fail('FIND_BY_NAME_FAILED'),
    );
    const useCase = new SaveCategory(repository);

    const result = await useCase.execute({
      id: Id.createUUID(),
      userId,
      name: 'Alimentação',
      subcategories: [],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_BY_NAME_FAILED');
    expect(result.errors).not.toContain(SaveCategoryErrors.CATEGORY_NAME_ALREADY_EXISTS);
  });
});

describe('SaveCategory — update flow validation failures', () => {
  const userId = Id.createUUID();

  test('fails when a subcategory in the desired list is invalid while updating', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);
    const id = Id.createUUID();

    await useCase.execute({ id, userId, name: 'Saúde', subcategories: [{ name: 'Farmácia', order: 1 }] });

    // order 0 is invalid: reconcileSubcategories fails before the aggregate is rebuilt.
    const result = await useCase.execute({
      id,
      userId,
      name: 'Saúde',
      subcategories: [{ name: 'Consultas', order: 0 }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('remaps duplicated subcategory order to the use-case error code while updating', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);
    const id = Id.createUUID();

    await useCase.execute({ id, userId, name: 'Lazer', subcategories: [] });

    // Two brand-new (id-less) subcategories share order 1: each is individually
    // valid, so reconcile succeeds and the duplicate is caught when the
    // aggregate is rebuilt via cloneWith, exercising the mapErrors remap branch.
    const result = await useCase.execute({
      id,
      userId,
      name: 'Lazer',
      subcategories: [
        { name: 'Cinema', order: 1 },
        { name: 'Streaming', order: 1 },
      ],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SaveCategoryErrors.DUPLICATE_SUBCATEGORY_ORDER);
  });
});

describe('SaveCategory — mapErrors selective remap', () => {
  // `mapErrors` must remap *only* the duplicate-order error to the use-case
  // code and leave every other error untouched. This mixed array cannot be
  // produced through `execute()`: `Category.tryCreate` short-circuits its base
  // validation before the uniqueness check, so a `DUPLICATE_SUBCATEGORY_ORDER`
  // never co-occurs with another error there — hence the contract is asserted
  // against the mapper directly.
  test('remaps the duplicate-order error while preserving co-occurring errors', () => {
    const repository = new ScriptedCategoryRepository(() => Result.ok(null));
    const useCase = new SaveCategory(repository);

    const mapped = (useCase as unknown as { mapErrors(errors: string[]): string[] }).mapErrors([
      'DUPLICATE_SUBCATEGORY_ORDER',
      'INVALID_SUBCATEGORY_NAME',
    ]);

    expect(mapped).toEqual([SaveCategoryErrors.DUPLICATE_SUBCATEGORY_ORDER, 'INVALID_SUBCATEGORY_NAME']);
    // The unrelated error is passed through verbatim, not swallowed or rewritten.
    expect(mapped).toContain('INVALID_SUBCATEGORY_NAME');
  });
});
