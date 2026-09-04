import { Result, UseCase } from '@arquitetura/shared';
import { Cartao } from '../model';
import { CartaoDTO } from '../dto';
import { CartaoRepository } from '../provider/cartao.repository';
import { NomeCartaoEmUsoQuery } from '../provider/nome-cartao-em-uso.query';

export interface SalvarCartaoIn extends CartaoDTO {}

export const SalvarCartaoErrors = {
  NAME_ALREADY_IN_USE: 'CARTAO_NAME_ALREADY_IN_USE',
} as const;

export class SalvarCartaoUseCase implements UseCase<SalvarCartaoIn, void> {
  constructor(
    private readonly cartaoRepository: CartaoRepository,
    private readonly nomeCartaoEmUsoQuery: NomeCartaoEmUsoQuery,
  ) {}

  async execute(data: SalvarCartaoIn): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const isUpdate = !!data.id && (await this.cartaoRepository.findById(data.id)).isOk;

      const tryNameInUse = await this.nomeCartaoEmUsoQuery.execute({
        name: data.name,
        ignoreId: isUpdate ? data.id : undefined,
      });
      tryNameInUse.validator.throwsIfFailed().throwsIfTrue(SalvarCartaoErrors.NAME_ALREADY_IN_USE);

      const cartao = Cartao.tryCreate({ ...data }).validator.throwsIfFailed().result.instance;

      const tryPersist = isUpdate ? await this.cartaoRepository.update(cartao) : await this.cartaoRepository.create(cartao);
      tryPersist.validator.throwsIfFailed();
    });
  }
}
