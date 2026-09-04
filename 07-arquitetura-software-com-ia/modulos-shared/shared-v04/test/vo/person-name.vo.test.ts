import { PersonName } from '../../src';

describe('PersonName', () => {
  test('should create with valid first and last name', () => {
    const result = PersonName.tryCreate('Joao Silva');

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe('Joao Silva');
  });

  test('should trim value before creating', () => {
    const result = PersonName.tryCreate('  Maria   Souza  ');

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe('Maria   Souza');
  });

  test('should fail when name is too short', () => {
    const result = PersonName.tryCreate('Jo');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('NAME_TOO_SHORT');
  });

  test('should fail when name is too long', () => {
    const result = PersonName.tryCreate('a'.repeat(51));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('NAME_TOO_LONG');
  });

  test('should fail when name has only one word', () => {
    const result = PersonName.tryCreate('Joao');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MUST_HAVE_FIRST_AND_LAST_NAME');
  });

  test('should create with create method', () => {
    const value = PersonName.create('Ana Clara');

    expect(value.value).toBe('Ana Clara');
  });

  test('should throw when create receives invalid person name', () => {
    expect(() => PersonName.create('Ana')).toThrow();
  });

  test('should expose firstName, lastNames, lastName and initials', () => {
    const name = PersonName.create('Ana Clara Souza');

    expect(name.firstName).toBe('Ana');
    expect(name.lastNames).toEqual(['Clara', 'Souza']);
    expect(name.lastName).toBe('Souza');
    expect(name.initials).toBe('AS');
  });

  test('should fail when first or last word has only one character', () => {
    const result = PersonName.tryCreate('A Silva');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('NAME_TOO_SHORT');
  });

  test('should fail when name contains invalid characters', () => {
    const result = PersonName.tryCreate('Jo123 Silva');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MUST_HAVE_FIRST_AND_LAST_NAME');
  });

  test('should throw when constructing directly with undefined value', () => {
    expect(() => new PersonName(undefined)).toThrow('NAME_TOO_SHORT');
  });
});
