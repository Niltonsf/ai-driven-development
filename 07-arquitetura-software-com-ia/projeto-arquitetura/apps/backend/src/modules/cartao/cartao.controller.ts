import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type { PaginatedResultDTO, Result } from '@arquitetura/shared';
import { ExcluirCartaoUseCase, SalvarCartaoUseCase } from '@arquitetura/cartao';
import type { CartaoDTO, SalvarCartaoIn } from '@arquitetura/cartao';
import { CartaoPrisma } from './cartao.prisma';
import { Public } from 'src/shared/decorators';

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

@Controller('cartao')
export class CartaoController {
  constructor(private readonly cartoes: CartaoPrisma) {}

  // ---- Commands ------------------------------------------------------------

  @Post()
  @Public()
  @HttpCode(200)
  async salvar(@Body() body: SalvarCartaoIn): Promise<void> {
    const useCase = new SalvarCartaoUseCase(
      this.cartoes,
      this.cartoes.nomeCartaoEmUsoQuery,
    );

    const result = await useCase.execute(body);
    this.throwsIfFailed(result);
  }

  @Delete(':id')
  @Public()
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    const useCase = new ExcluirCartaoUseCase(this.cartoes);

    const result = await useCase.execute({ id });
    this.throwsIfFailed(result);
  }

  // ---- Queries -------------------------------------------------------------

  @Get(':id')
  @Public()
  async consultarPorId(@Param('id') id: string): Promise<CartaoDTO> {
    const result = await this.cartoes.findById(id);
    if (result.isFailure) {
      throw new NotFoundException(result.errors);
    }

    return result.instance.props;
  }

  @Get()
  @Public()
  async consultarPaginado(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResultDTO<CartaoDTO>> {
    const result = await this.cartoes.cartoesPaginadosQuery.execute({
      page: this.normalizePage(page),
      pageSize: this.normalizePageSize(pageSize),
    });
    this.throwsIfFailed(result);

    return result.instance;
  }

  // ---- Helpers -------------------------------------------------------------

  private normalizePage(raw?: string): number {
    const page = Number(raw);
    return Number.isFinite(page) && page > 0 ? Math.trunc(page) : DEFAULT_PAGE;
  }

  private normalizePageSize(raw?: string): number {
    const pageSize = Number(raw);
    if (!Number.isFinite(pageSize) || pageSize <= 0) {
      return DEFAULT_PAGE_SIZE;
    }

    return Math.min(Math.trunc(pageSize), MAX_PAGE_SIZE);
  }

  private throwsIfFailed(result: Result<unknown>): void {
    if (!result.isFailure) {
      return;
    }

    const errors = result.errors;
    const isNotFound = errors.some((error) => /NOT_FOUND|EMPTY/i.test(error));
    if (isNotFound) {
      throw new NotFoundException(errors);
    }

    throw new BadRequestException(errors);
  }
}
