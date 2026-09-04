import { NomeConta } from '../../src';

describe('NomeConta', () => {
  test('should create valid conta nome with tryCreate', () => {
    const result = NomeConta.tryCreate('Conta Corrente');

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe('Conta Corrente');
  });

  test('should trim conta nome before creating', () => {
    const result = NomeConta.tryCreate('   Conta Poupanca   ');

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe('Conta Poupanca');
  });

  test('should fail when conta nome is shorter than minimum length', () => {
    const result = NomeConta.tryCreate('ab');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('NOME_CONTA_TOO_SHORT');
  });

  test('should fail when conta nome is longer than maximum length', () => {
    const result = NomeConta.tryCreate('a'.repeat(81));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('NOME_CONTA_TOO_LONG');
  });

  test('should ignore max validation when maxLength is 0', () => {
    const result = NomeConta.tryCreate('a'.repeat(120), {
      maxLength: 0,
    });

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe('a'.repeat(120));
  });

  test('should fail when conta nome is undefined', () => {
    const result = NomeConta.tryCreate(undefined as unknown as string);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('NOME_CONTA_TOO_SHORT');
  });

  test('should create with create method', () => {
    const nomeConta = NomeConta.create('  Cartao de Credito  ');

    expect(nomeConta.value).toBe('Cartao de Credito');
  });

  test('should throw when create receives invalid conta nome', () => {
    expect(() => NomeConta.create('ab')).toThrow();
  });
});
