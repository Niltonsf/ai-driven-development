import { Injectable } from '@nestjs/common';
import {
  PaginatedInputDTO,
  PaginatedResultDTO,
  Result,
  TransactionContext,
} from '@arquitetura/shared';
import {
  Cartao,
  CartaoDTO,
  CartaoRepository,
  CartoesPaginadosQuery,
  NomeCartaoEmUsoInput,
  NomeCartaoEmUsoQuery,
} from '@arquitetura/cartao';
import { Cartao as CartaoRow, Prisma } from '@prisma/client';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../db/prisma.service';

@Injectable()
export class CartaoPrisma implements CartaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  get client() {
    return this.prisma.client;
  }

  // ---- Repository (command) ------------------------------------------------

  async create(entity: Cartao, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).cartao.create({ data: this.fromDomain(entity) });
    });
  }

  async update(entity: Cartao, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const { id, ...data } = this.fromDomain(entity);
      await this.db(tx).cartao.update({ where: { id }, data });
    });
  }

  async findById(id: string): Promise<Result<Cartao>> {
    return Result.tryAsync(async () => {
      const row = await this.client.cartao.findUnique({ where: { id } });
      if (!row) return Result.fail<Cartao>('ENTITY_NOT_FOUND');
      return this.toDomain(row);
    });
  }

  async delete(id: string, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).cartao.delete({ where: { id } });
    });
  }

  // ---- Queries (read / CQRS) -----------------------------------------------

  readonly nomeCartaoEmUsoQuery: NomeCartaoEmUsoQuery = {
    execute: (input: NomeCartaoEmUsoInput): Promise<Result<boolean>> =>
      Result.tryAsync(async () => {
        const count = await this.client.cartao.count({
          where: {
            name: input.name,
            ...(input.ignoreId ? { id: { not: input.ignoreId } } : {}),
          },
        });
        return count > 0;
      }),
  };

  readonly cartoesPaginadosQuery: CartoesPaginadosQuery = {
    execute: (
      input: PaginatedInputDTO,
    ): Promise<Result<PaginatedResultDTO<CartaoDTO>>> =>
      Result.tryAsync(async () => {
        const { page, pageSize } = input;
        const where: Prisma.CartaoWhereInput = { deletedAt: null };

        const [total, rows] = await this.client.$transaction([
          this.client.cartao.count({ where }),
          this.client.cartao.findMany({
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

  private fromDomain(cartao: Cartao): Prisma.CartaoUncheckedCreateInput {
    return {
      id: cartao.id,
      name: cartao.name,
      description: cartao.description ?? null,
      brand: cartao.flag ?? null,
      lastDigits: cartao.lastDigits ?? null,
      limit: cartao.limit ?? null,
      closingDay: cartao.closingDay ?? null,
      dueDay: cartao.dueDay ?? null,
      active: cartao.active,
      color: cartao.color ?? null,
      icon: cartao.icon ?? null,
      deletedAt: cartao.deletedAt ?? null,
    };
  }

  private toDTO(row: CartaoRow): CartaoDTO {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      flag: row.brand ?? undefined,
      lastDigits: row.lastDigits ?? undefined,
      limit: row.limit == null ? undefined : row.limit.toNumber(),
      closingDay: row.closingDay ?? undefined,
      dueDay: row.dueDay ?? undefined,
      active: row.active,
      color: row.color ?? undefined,
      icon: row.icon ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }

  private toDomain(row: CartaoRow): Result<Cartao> {
    return Cartao.tryCreate({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      flag: row.brand ?? undefined,
      lastDigits: row.lastDigits ?? undefined,
      limit: row.limit == null ? undefined : row.limit.toNumber(),
      closingDay: row.closingDay ?? undefined,
      dueDay: row.dueDay ?? undefined,
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
