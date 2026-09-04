import {
  PaginatedInputDTO,
  PaginatedResultDTO,
  Result,
} from '@arquitetura/shared';
import { ContaDTO } from '../dto';

export interface ContasPaginadasQuery {
  execute(
    input: PaginatedInputDTO,
  ): Promise<Result<PaginatedResultDTO<ContaDTO>>>;
}
