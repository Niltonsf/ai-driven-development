import { Result, UseCase } from '@arquitetura/shared';
import { ContaRepository } from '../provider/conta.repository';

export interface ExcluirContaIn {
  id: string;
}

export const ExcluirContaErrors = {
  NOT_FOUND: 'CONTA_NOT_FOUND',
} as const;

export class ExcluirContaUseCase implements UseCase<ExcluirContaIn, void> {
  constructor(private readonly contaRepository: ContaRepository) {}

  async execute(data: ExcluirContaIn): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const tryConta = await this.contaRepository.findById(data.id);
      tryConta.validator.throwsIfFailed(ExcluirContaErrors.NOT_FOUND).throwsIfEmpty(ExcluirContaErrors.NOT_FOUND);

      const tryDelete = await this.contaRepository.delete(data.id);
      tryDelete.validator.throwsIfFailed();
    });
  }
}
