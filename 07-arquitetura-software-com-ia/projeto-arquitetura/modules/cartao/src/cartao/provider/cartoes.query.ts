import {
  PaginatedInputDTO,
  PaginatedResultDTO,
  Result,
} from '@arquitetura/shared';
import { CartaoDTO } from '../dto';

export interface CartoesPaginadosQuery {
  execute(
    input: PaginatedInputDTO,
  ): Promise<Result<PaginatedResultDTO<CartaoDTO>>>;
}
