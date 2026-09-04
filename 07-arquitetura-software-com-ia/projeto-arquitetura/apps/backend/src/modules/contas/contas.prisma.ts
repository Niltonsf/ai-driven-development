import { Injectable } from '@nestjs/common';
import {
  PaginatedInputDTO,
  PaginatedResultDTO,
  Result,
  TransactionContext,
} from '@arquitetura/shared';
import {
  Conta,
  ContaDTO,
  ContaRepository,
  ContasPaginadasQuery,
  NomeContaEmUsoInput,
  NomeContaEmUsoQuery,
} from '@arquitetura/contas';
import { Conta as ContaRow, Prisma } from '@prisma/client';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../db/prisma.service';

@Injectable()
export class ContasPrisma implements ContaRepository {
  constructor(private readonly prisma: PrismaService) {}

  get client() {
    return this.prisma.client;
  }

  // ---- Repository (command) ------------------------------------------------

  async create(entity: Conta, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).conta.create({ data: this.fromDomain(entity) });
    });
  }

  async update(entity: Conta, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const { id, ...data } = this.fromDomain(entity);
      await this.db(tx).conta.update({ where: { id }, data });
    });
  }

  async findById(id: string): Promise<Result<Conta>> {
    return Result.tryAsync(async () => {
      const row = await this.client.conta.findUnique({ where: { id } });
      if (!row) return Result.fail<Conta>('ENTITY_NOT_FOUND');
      return this.toDomain(row);
    });
  }

  async delete(id: string, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).conta.delete({ where: { id } });
    });
  }

  // ---- Queries (read / CQRS) -----------------------------------------------

  readonly nomeContaEmUsoQuery: NomeContaEmUsoQuery = {
    execute: (input: NomeContaEmUsoInput): Promise<Result<boolean>> =>
      Result.tryAsync(async () => {
        const count = await this.client.conta.count({
          where: {
            name: input.name,
            ...(input.ignoreId ? { id: { not: input.ignoreId } } : {}),
          },
        });
        return count > 0;
      }),
  };

  readonly contasPaginadasQuery: ContasPaginadasQuery = {
    execute: (
      input: PaginatedInputDTO,
    ): Promise<Result<PaginatedResultDTO<ContaDTO>>> =>
      Result.tryAsync(async () => {
        const { page, pageSize } = input;
        const where: Prisma.ContaWhereInput = { deletedAt: null };

        const [total, rows] = await this.client.$transaction([
          this.client.conta.count({ where }),
          this.client.conta.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
        ]);

        return {
          data: rows.map((row) => this.toDTO(row)),
          meta: {
            page,
            pageSize,
            total,
            totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
          },
        };
      }),
  };

  // ---- Mapping -------------------------------------------------------------

  private fromDomain(conta: Conta): Prisma.ContaUncheckedCreateInput {
    return {
      id: conta.id,
      name: conta.name,
      description: conta.description ?? null,
      agency: conta.agency ?? null,
      accountNumber: conta.accountNumber ?? null,
      institutionName: conta.institutionName ?? null,
      active: conta.active,
      color: conta.color ?? null,
      icon: conta.icon ?? null,
      deletedAt: conta.deletedAt ?? null,
    };
  }

  private toDTO(row: ContaRow): ContaDTO {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      agency: row.agency ?? undefined,
      accountNumber: row.accountNumber ?? undefined,
      institutionName: row.institutionName ?? undefined,
      active: row.active,
      color: row.color ?? undefined,
      icon: row.icon ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }

  private toDomain(row: ContaRow): Result<Conta> {
    return Conta.tryCreate({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      agency: row.agency ?? undefined,
      accountNumber: row.accountNumber ?? undefined,
      institutionName: row.institutionName ?? undefined,
      active: row.active,
      color: row.color ?? undefined,
      icon: row.icon ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  private db(tx?: TransactionContext) {
    return (
      (tx as PrismaTransactionContext | undefined)?.client ?? this.prisma.client
    );
  }
}
