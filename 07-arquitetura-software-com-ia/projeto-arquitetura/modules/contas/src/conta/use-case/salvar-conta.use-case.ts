import { Result, UseCase } from '@arquitetura/shared';
import { Conta } from '../model';
import { ContaDTO } from '../dto';
import { ContaRepository } from '../provider/conta.repository';
import { NomeContaEmUsoQuery } from '../provider/nome-conta-em-uso.query';

export interface SalvarContaIn extends ContaDTO {}

export const SalvarContaErrors = {
  NAME_ALREADY_IN_USE: 'CONTA_NAME_ALREADY_IN_USE',
} as const;

export class SalvarContaUseCase implements UseCase<SalvarContaIn, void> {
  constructor(
    private readonly contaRepository: ContaRepository,
    private readonly nomeContaEmUsoQuery: NomeContaEmUsoQuery,
  ) {}

  async execute(data: SalvarContaIn): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const isUpdate = !!data.id && (await this.contaRepository.findById(data.id)).isOk;

      const tryNameInUse = await this.nomeContaEmUsoQuery.execute({
        name: data.name,
        ignoreId: isUpdate ? data.id : undefined,
      });
      tryNameInUse.validator.throwsIfFailed().throwsIfTrue(SalvarContaErrors.NAME_ALREADY_IN_USE);

      const conta = Conta.tryCreate({ ...data }).validator.throwsIfFailed().result.instance;

      const tryPersist = isUpdate ? await this.contaRepository.update(conta) : await this.contaRepository.create(conta);
      tryPersist.validator.throwsIfFailed();
    });
  }
}
