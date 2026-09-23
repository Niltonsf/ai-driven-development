import { Id } from '@poupig/shared';
import { Category, CategoryErrors, Subcategory } from '../src/category';

function buildSubcategory(overrides: Partial<{ id: string; name: string; order: number; color: string }> = {}): Subcategory {
  return Subcategory.create({
    id: overrides.id ?? Id.createUUID(),
    name: overrides.name ?? 'Subcategoria',
    order: overrides.order ?? 1,
    color: overrides.color,
    isActive: true,
  });
}

describe('Category', () => {
  const userId = Id.createUUID();

  test('creates a category with required fields, defaulting isActive and subcategories', () => {
    const result = Category.tryCreate({
      id: Id.createUUID(),
      userId,
      name: 'Alimentação',
      subcategories: [],
    } as any);

    expect(result.isOk).toBe(true);
    expect(result.instance.isActive).toBe(true);
    expect(result.instance.subcategories).toEqual([]);
    expect(result.instance.icon).toBeUndefined();
    expect(result.instance.color).toBeUndefined();
  });

  test('fails when name is empty', () => {
    const result = Category.tryCreate({
      id: Id.createUUID(),
      userId,
      name: '   ',
      subcategories: [],
    } as any);

    expect(result.isFailure).toBe(true);
  });

  test('fails when color is not a valid hex value', () => {
    const result = Category.tryCreate({
      id: Id.createUUID(),
      userId,
      name: 'Lazer',
      color: 'not-a-color',
      subcategories: [],
    } as any);

    expect(result.isFailure).toBe(true);
  });

  test('creates successfully with a valid hex color', () => {
    const result = Category.tryCreate({
      id: Id.createUUID(),
      userId,
      name: 'Lazer',
      color: '#FF5733',
      subcategories: [],
    } as any);

    expect(result.isOk).toBe(true);
    expect(result.instance.color).toBe('#FF5733');
  });

  test('rejects creation when two subcategories share the same order', () => {
    const result = Category.tryCreate({
      id: Id.createUUID(),
      userId,
      name: 'Transporte',
      subcategories: [buildSubcategory({ order: 1 }), buildSubcategory({ order: 1 })],
    } as any);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(CategoryErrors.DUPLICATE_SUBCATEGORY_ORDER);
  });

  test('accepts creation when subcategories have unique orders', () => {
    const result = Category.tryCreate({
      id: Id.createUUID(),
      userId,
      name: 'Transporte',
      subcategories: [buildSubcategory({ order: 1 }), buildSubcategory({ order: 2 })],
    } as any);

    expect(result.isOk).toBe(true);
    expect(result.instance.subcategories).toHaveLength(2);
  });

  test('replaceSubcategories rejects a list with duplicated order', () => {
    const category = Category.create({
      id: Id.createUUID(),
      userId,
      name: 'Saúde',
      subcategories: [buildSubcategory({ order: 1 })],
    } as any);

    const result = category.replaceSubcategories([buildSubcategory({ order: 5 }), buildSubcategory({ order: 5 })]);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(CategoryErrors.DUPLICATE_SUBCATEGORY_ORDER);
  });

  test('replaceSubcategories accepts a valid list and updates the aggregate', () => {
    const category = Category.create({
      id: Id.createUUID(),
      userId,
      name: 'Saúde',
      subcategories: [buildSubcategory({ order: 1, name: 'Antigo' })],
    } as any);

    const newList = [buildSubcategory({ order: 1, name: 'Novo' }), buildSubcategory({ order: 2, name: 'Outro' })];
    const result = category.replaceSubcategories(newList);

    expect(result.isOk).toBe(true);
    expect(result.instance.subcategories).toHaveLength(2);
    expect(result.instance.subcategories.map((s) => s.name)).toEqual(['Novo', 'Outro']);
  });

  test('softDelete marks the root and propagates deletedAt to all subcategories', () => {
    const category = Category.create({
      id: Id.createUUID(),
      userId,
      name: 'Educação',
      subcategories: [buildSubcategory({ order: 1 }), buildSubcategory({ order: 2 })],
    } as any);

    const result = category.softDelete();

    expect(result.isOk).toBe(true);
    expect(result.instance.deletedAt).not.toBeNull();
    expect(result.instance.subcategories).toHaveLength(2);
    for (const subcategory of result.instance.subcategories) {
      expect(subcategory.deletedAt).not.toBeNull();
    }
  });
});

describe('Subcategory', () => {
  test('creates a subcategory with required fields, defaulting isActive', () => {
    const result = Subcategory.tryCreate({
      id: Id.createUUID(),
      name: 'Supermercado',
      order: 1,
    } as any);

    expect(result.isOk).toBe(true);
    expect(result.instance.isActive).toBe(true);
    expect(result.instance.icon).toBeUndefined();
    expect(result.instance.color).toBeUndefined();
  });

  test.each([0, -1, 1.5])('rejects invalid order value %p', (order) => {
    const result = Subcategory.tryCreate({
      id: Id.createUUID(),
      name: 'Supermercado',
      order,
    } as any);

    expect(result.isFailure).toBe(true);
  });

  test('accepts a positive integer order', () => {
    const result = Subcategory.tryCreate({
      id: Id.createUUID(),
      name: 'Supermercado',
      order: 3,
    } as any);

    expect(result.isOk).toBe(true);
    expect(result.instance.order).toBe(3);
  });
});
