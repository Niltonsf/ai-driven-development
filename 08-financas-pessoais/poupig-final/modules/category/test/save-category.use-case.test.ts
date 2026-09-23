import { Id } from '@poupig/shared';
import { SaveCategory, SaveCategoryErrors } from '../src/category';
import { InMemoryCategoryRepository } from './mock/in-memory-category.repository';

describe('SaveCategory', () => {
  const userId = Id.createUUID();

  test('creates a new category with unique subcategory orders', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);
    const id = Id.createUUID();

    const result = await useCase.execute({
      id,
      userId,
      name: 'Alimentação',
      subcategories: [
        { name: 'Mercado', order: 1 },
        { name: 'Restaurante', order: 2 },
      ],
    });

    expect(result.isOk).toBe(true);

    const saved = await repository.findById(id);
    expect(saved.instance).not.toBeNull();
    expect(saved.instance!.isActive).toBe(true);
    expect(saved.instance!.subcategories).toHaveLength(2);
  });

  test('fails to create when the user already has a category with the same name', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);

    await useCase.execute({
      id: Id.createUUID(),
      userId,
      name: 'Lazer',
      subcategories: [],
    });

    const result = await useCase.execute({
      id: Id.createUUID(),
      userId,
      name: 'Lazer',
      subcategories: [],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SaveCategoryErrors.CATEGORY_NAME_ALREADY_EXISTS);
  });

  test('fails to create when subcategories have duplicated order', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);

    const result = await useCase.execute({
      id: Id.createUUID(),
      userId,
      name: 'Transporte',
      subcategories: [
        { name: 'Combustível', order: 1 },
        { name: 'Estacionamento', order: 1 },
      ],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SaveCategoryErrors.DUPLICATE_SUBCATEGORY_ORDER);

    const duplicateCheck = await repository.findByNameAndUserId('Transporte', userId);
    expect(duplicateCheck.instance).toBeNull();
  });

  test('updates an existing category owned by the user', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);
    const id = Id.createUUID();

    await useCase.execute({
      id,
      userId,
      name: 'Saúde',
      subcategories: [{ name: 'Farmácia', order: 1 }],
    });

    const created = await repository.findById(id);
    const existingSubcategoryId = created.instance!.subcategories[0].id;

    const result = await useCase.execute({
      id,
      userId,
      name: 'Saúde e Bem-estar',
      subcategories: [{ id: existingSubcategoryId, name: 'Farmácia', order: 1 }],
    });

    expect(result.isOk).toBe(true);

    const updated = await repository.findById(id);
    expect(updated.instance!.name).toBe('Saúde e Bem-estar');
  });

  test('reconciles subcategories: updates existing by id, creates new without id, removes absent ones', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);
    const id = Id.createUUID();

    await useCase.execute({
      id,
      userId,
      name: 'Educação',
      subcategories: [
        { name: 'Cursos', order: 1 },
        { name: 'Livros', order: 2 },
      ],
    });

    const created = await repository.findById(id);
    const [cursos, livros] = created.instance!.subcategories;

    const result = await useCase.execute({
      id,
      userId,
      name: 'Educação',
      subcategories: [
        { id: cursos.id, name: 'Cursos Online', order: 1 },
        { name: 'Material Escolar', order: 3 },
      ],
    });

    expect(result.isOk).toBe(true);

    const updated = await repository.findById(id);
    const names = updated.instance!.subcategories.map((s) => s.name).sort();
    expect(names).toEqual(['Cursos Online', 'Material Escolar']);
    expect(updated.instance!.subcategories.find((s) => s.id === cursos.id)).toBeDefined();
    expect(updated.instance!.subcategories.find((s) => s.id === livros.id)).toBeUndefined();
  });

  test('fails to update when the category belongs to another user', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new SaveCategory(repository);
    const id = Id.createUUID();

    await useCase.execute({
      id,
      userId,
      name: 'Moradia',
      subcategories: [],
    });

    const otherUserId = Id.createUUID();
    const result = await useCase.execute({
      id,
      userId: otherUserId,
      name: 'Moradia',
      subcategories: [],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SaveCategoryErrors.UNAUTHORIZED);
  });
});
