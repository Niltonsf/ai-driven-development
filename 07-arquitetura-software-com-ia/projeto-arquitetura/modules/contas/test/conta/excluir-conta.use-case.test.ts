/// <reference types="jest" />
import { Result } from '@arquitetura/shared';
import { Conta, ExcluirContaErrors, ExcluirContaUseCase } from '../../src/conta';
import { InMemoryContaRepository } from '../mock/in-memory-conta.repository';

const validInput = {
  name: 'Conta Corrente',
  description: 'Conta corrente principal',
  agency: '0001',
  accountNumber: '12345-6',
  institutionName: 'Banco do Brasil',
  color: '#FF8800',
  icon: 'wallet',
};

function makeSut() {
  const repository = new InMemoryContaRepository();
  const sut = new ExcluirContaUseCase(repository);
  return { sut, repository };
}

describe('ExcluirContaUseCase', () => {
  test('should delete an existing conta', async () => {
    const { sut, repository } = makeSut();
    const existing = Conta.create(validInput);
    await repository.create(existing);

    const deleteSpy = jest.spyOn(repository, 'delete');

    const result = await sut.execute({ id: existing.id });

    expect(result.isOk).toBe(true);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith(existing.id);

    const stored = await repository.findById(existing.id);
    expect(stored.isFailure).toBe(true);
  });

  test('should fail when the conta is not found', async () => {
    const { sut, repository } = makeSut();
    const deleteSpy = jest.spyOn(repository, 'delete');

    const result = await sut.execute({ id: '00000000-0000-0000-0000-000000000000' });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(ExcluirContaErrors.NOT_FOUND);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  test('should propagate failure when the repository fails to delete', async () => {
    const { sut, repository } = makeSut();
    const existing = Conta.create(validInput);
    await repository.create(existing);

    jest.spyOn(repository, 'delete').mockResolvedValue(Result.fail('DELETE_ERROR'));

    const result = await sut.execute({ id: existing.id });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('DELETE_ERROR');
  });
});
