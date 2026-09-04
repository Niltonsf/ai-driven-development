/// <reference types="jest" />
import { Result } from '@arquitetura/shared';
import {
  Conta,
  NomeContaEmUsoInput,
  NomeContaEmUsoQuery,
  SalvarContaErrors,
  SalvarContaIn,
  SalvarContaUseCase,
} from '../../src/conta';
import { InMemoryContaRepository } from '../mock/in-memory-conta.repository';

class StubNomeContaEmUsoQuery implements NomeContaEmUsoQuery {
  constructor(private result: Result<boolean> = Result.ok(false)) {}

  public lastInput?: NomeContaEmUsoInput;

  setResult(result: Result<boolean>) {
    this.result = result;
  }

  async execute(input: NomeContaEmUsoInput): Promise<Result<boolean>> {
    this.lastInput = input;
    return this.result;
  }
}

const validInput: SalvarContaIn = {
  name: 'Conta Corrente',
  description: 'Conta corrente principal',
  agency: '0001',
  accountNumber: '12345-6',
  institutionName: 'Banco do Brasil',
  color: '#FF8800',
  icon: 'wallet',
};

function makeSut(query = new StubNomeContaEmUsoQuery()) {
  const repository = new InMemoryContaRepository();
  const sut = new SalvarContaUseCase(repository, query);
  return { sut, repository, query };
}

describe('SalvarContaUseCase', () => {
  test('should create a new conta when no id is provided', async () => {
    const { sut, repository, query } = makeSut();
    const createSpy = jest.spyOn(repository, 'create');
    const updateSpy = jest.spyOn(repository, 'update');

    const result = await sut.execute(validInput);

    expect(result.isOk).toBe(true);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).not.toHaveBeenCalled();
    expect(query.lastInput).toEqual({ name: validInput.name, ignoreId: undefined });
  });

  test('should update an existing conta when id is found in the database', async () => {
    const { sut, repository } = makeSut();
    const existing = Conta.create(validInput);
    await repository.create(existing);

    const createSpy = jest.spyOn(repository, 'create');
    const updateSpy = jest.spyOn(repository, 'update');

    const result = await sut.execute({ ...validInput, id: existing.id, name: 'Conta Atualizada' });

    expect(result.isOk).toBe(true);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).not.toHaveBeenCalled();

    const stored = await repository.findById(existing.id);
    expect(stored.instance.name).toBe('Conta Atualizada');
  });

  test('should create when an id is provided but does not exist in the database', async () => {
    const { sut, repository } = makeSut();
    const createSpy = jest.spyOn(repository, 'create');
    const updateSpy = jest.spyOn(repository, 'update');

    const result = await sut.execute({ ...validInput, id: '00000000-0000-0000-0000-000000000000' });

    expect(result.isOk).toBe(true);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test('should ignore the current conta id when checking the name on update', async () => {
    const { sut, repository, query } = makeSut();
    const existing = Conta.create(validInput);
    await repository.create(existing);

    await sut.execute({ ...validInput, id: existing.id });

    expect(query.lastInput).toEqual({ name: validInput.name, ignoreId: existing.id });
  });

  test('should fail when the conta name is already in use', async () => {
    const query = new StubNomeContaEmUsoQuery(Result.ok(true));
    const { sut, repository } = makeSut(query);
    const createSpy = jest.spyOn(repository, 'create');

    const result = await sut.execute(validInput);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SalvarContaErrors.NAME_ALREADY_IN_USE);
    expect(createSpy).not.toHaveBeenCalled();
  });

  test('should propagate failure from the name-in-use query', async () => {
    const query = new StubNomeContaEmUsoQuery(Result.fail('QUERY_ERROR'));
    const { sut, repository } = makeSut(query);
    const createSpy = jest.spyOn(repository, 'create');

    const result = await sut.execute(validInput);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('QUERY_ERROR');
    expect(createSpy).not.toHaveBeenCalled();
  });

  test('should fail when domain validation does not pass', async () => {
    const { sut } = makeSut();

    const result = await sut.execute({ ...validInput, name: '' });

    expect(result.isFailure).toBe(true);
  });

  test('should propagate failure when the repository fails to persist', async () => {
    const { sut, repository } = makeSut();
    jest.spyOn(repository, 'create').mockResolvedValue(Result.fail('PERSIST_ERROR'));

    const result = await sut.execute(validInput);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('PERSIST_ERROR');
  });
});
