import { Injectable } from '@nestjs/common';
import { Result } from '@poupig/shared';
import {
  Card,
  CardBrand,
  CreditCardDTO,
  CreditCardRepository,
  FindCreditCardsByUserIdQuery,
  PaginatedResult,
} from '@poupig/credit-card';
import { PrismaService } from '../../db/prisma.service';

type CardRow = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  brand: string;
  lastFourDigits: string | null;
  closingDay: number;
  dueDay: number;
  limit: number | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function toDomain(row: CardRow): Result<Card> {
  return Card.tryCreate({
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description ?? undefined,
    brand: row.brand as CardBrand,
    lastFourDigits: row.lastFourDigits ?? undefined,
    closingDay: row.closingDay,
    dueDay: row.dueDay,
    limit: row.limit ?? undefined,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}

function toDTO(row: CardRow): CreditCardDTO {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description ?? undefined,
    brand: row.brand as CardBrand,
    lastFourDigits: row.lastFourDigits ?? undefined,
    closingDay: row.closingDay,
    dueDay: row.dueDay,
    limit: row.limit ?? undefined,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class CreditCardPrisma implements CreditCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCreditCardsByUserId: FindCreditCardsByUserIdQuery = {
    execute: async (userId: string, page: number, pageSize: number): Promise<Result<PaginatedResult<CreditCardDTO>>> => {
      return Result.tryAsync(async () => {
        const skip = (page - 1) * pageSize;
        const [rows, total] = await Promise.all([
          this.prisma.client.card.findMany({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            skip,
            take: pageSize,
          }),
          this.prisma.client.card.count({ where: { userId, deletedAt: null } }),
        ]);
        return { items: rows.map(toDTO), total, page, pageSize };
      });
    },
  };

  async save(card: Card): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.prisma.client.card.upsert({
        where: { id: card.id },
        create: {
          id: card.id,
          userId: card.userId,
          name: card.name,
          description: card.description ?? null,
          brand: card.brand,
          lastFourDigits: card.lastFourDigits ?? null,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
          limit: card.limit ?? null,
          color: card.color ?? null,
          icon: card.icon ?? null,
          isActive: card.isActive,
          deletedAt: card.deletedAt,
        },
        update: {
          name: card.name,
          description: card.description ?? null,
          brand: card.brand,
          lastFourDigits: card.lastFourDigits ?? null,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
          limit: card.limit ?? null,
          color: card.color ?? null,
          icon: card.icon ?? null,
          isActive: card.isActive,
          deletedAt: card.deletedAt,
        },
      });
    });
  }

  async findById(id: string): Promise<Result<Card | null>> {
    const row = await this.prisma.client.card.findUnique({ where: { id } });
    if (!row) return Result.ok(null);
    return toDomain(row as CardRow);
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Result<Card | null>> {
    const row = await this.prisma.client.card.findFirst({
      where: { name, userId, deletedAt: null },
    });
    if (!row) return Result.ok(null);
    return toDomain(row as CardRow);
  }

  async delete(id: string): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.prisma.client.card.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
