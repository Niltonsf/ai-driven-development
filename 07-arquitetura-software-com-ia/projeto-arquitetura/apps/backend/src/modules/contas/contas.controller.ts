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
import { ExcluirContaUseCase, SalvarContaUseCase } from '@arquitetura/contas';
import type { ContaDTO, SalvarContaIn } from '@arquitetura/contas';
import { ContasPrisma } from './contas.prisma';
import { Public } from 'src/shared/decorators';

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

@Controller('contas')
export class ContasController {
  constructor(private readonly contas: ContasPrisma) {}

  // ---- Commands ------------------------------------------------------------

  @Post()
  @Public()
  @HttpCode(200)
  async salvar(@Body() body: SalvarContaIn): Promise<void> {
    const useCase = new SalvarContaUseCase(
      this.contas,
      this.contas.nomeContaEmUsoQuery,
    );

    const result = await useCase.execute(body);
    this.throwsIfFailed(result);
  }

  @Delete(':id')
  @Public()
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    const useCase = new ExcluirContaUseCase(this.contas);

    const result = await useCase.execute({ id });
    this.throwsIfFailed(result);
  }

  // ---- Queries -------------------------------------------------------------

  @Get(':id')
  @Public()
  async consultarPorId(@Param('id') id: string): Promise<ContaDTO> {
    const result = await this.contas.findById(id);
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
  ): Promise<PaginatedResultDTO<ContaDTO>> {
    const result = await this.contas.contasPaginadasQuery.execute({
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
