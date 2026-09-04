import { Result, UseCase } from '@arquitetura/shared';
import { CartaoRepository } from '../provider/cartao.repository';

export interface ExcluirCartaoIn {
  id: string;
}

export const ExcluirCartaoErrors = {
  NOT_FOUND: 'CARTAO_NOT_FOUND',
} as const;

export class ExcluirCartaoUseCase implements UseCase<ExcluirCartaoIn, void> {
  constructor(private readonly cartaoRepository: CartaoRepository) {}

  async execute(data: ExcluirCartaoIn): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const tryCartao = await this.cartaoRepository.findById(data.id);
      tryCartao.validator.throwsIfFailed(ExcluirCartaoErrors.NOT_FOUND).throwsIfEmpty(ExcluirCartaoErrors.NOT_FOUND);

      const tryDelete = await this.cartaoRepository.delete(data.id);
      tryDelete.validator.throwsIfFailed();
    });
  }
}
