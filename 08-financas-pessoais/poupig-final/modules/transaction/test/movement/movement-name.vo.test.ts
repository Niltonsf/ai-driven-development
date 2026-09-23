import { MovementName } from '../../src';

describe('MovementName', () => {
  test('tryCreate returns a value object for a valid name', () => {
    const result = MovementName.tryCreate('Mercado do mês');

    expect(result.isOk).toBe(true);
    expect(result.instance).toBeInstanceOf(MovementName);
    expect(result.instance.value).toBe('Mercado do mês');
  });

  test('tryCreate trims surrounding spaces', () => {
    const result = MovementName.tryCreate('  Aluguel  ');

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe('Aluguel');
  });

  test('tryCreate fails with MOVEMENT_NAME_TOO_SHORT below the minimum length', () => {
    const result = MovementName.tryCreate('A');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MOVEMENT_NAME_TOO_SHORT');
  });

  test('tryCreate accepts the minimum and maximum lengths', () => {
    expect(MovementName.tryCreate('Ab').isOk).toBe(true);
    expect(MovementName.tryCreate('a'.repeat(100)).isOk).toBe(true);
  });

  test('tryCreate fails with MOVEMENT_NAME_TOO_LONG above the maximum length', () => {
    const result = MovementName.tryCreate('a'.repeat(101));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MOVEMENT_NAME_TOO_LONG');
  });

  test('tryCreate fails for an empty string', () => {
    const result = MovementName.tryCreate('');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MOVEMENT_NAME_TOO_SHORT');
  });

  test('tryCreate fails for undefined', () => {
    const result = MovementName.tryCreate(undefined as unknown as string);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MOVEMENT_NAME_TOO_SHORT');
  });

  test('create returns a value object for a valid name', () => {
    const name = MovementName.create('Salário');

    expect(name.value).toBe('Salário');
  });

  test('create throws when the name is invalid', () => {
    expect(() => MovementName.create('A')).toThrow('MOVEMENT_NAME_TOO_SHORT');
  });
});
