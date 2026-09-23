import { CategoryName, SubcategoryName } from '../src/category';

describe('CategoryName', () => {
  test('create returns a value object for a valid name', () => {
    const name = CategoryName.create('Alimentação');

    expect(name.value).toBe('Alimentação');
  });

  test('create throws when the name is blank', () => {
    expect(() => CategoryName.create('   ')).toThrow('CATEGORY_NAME_TOO_SHORT');
  });

  test('create throws when the name exceeds the maximum length', () => {
    expect(() => CategoryName.create('a'.repeat(101))).toThrow('CATEGORY_NAME_TOO_LONG');
  });

  test('tryCreate reports the domain-specific error code', () => {
    const result = CategoryName.tryCreate('');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('CATEGORY_NAME_TOO_SHORT');
  });
});

describe('SubcategoryName', () => {
  test('create returns a value object for a valid name', () => {
    const name = SubcategoryName.create('Mercado');

    expect(name.value).toBe('Mercado');
  });

  test('create throws when the name is blank', () => {
    expect(() => SubcategoryName.create('   ')).toThrow('SUBCATEGORY_NAME_TOO_SHORT');
  });

  test('tryCreate reports the domain-specific error code', () => {
    const result = SubcategoryName.tryCreate('a'.repeat(101));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('SUBCATEGORY_NAME_TOO_LONG');
  });
});
