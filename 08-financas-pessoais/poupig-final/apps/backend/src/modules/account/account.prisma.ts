import { Injectable } from '@nestjs/common';
import { Result } from '@poupig/shared';
import { Account, AccountDTO, AccountRepository, AccountType, FindAccountsByUserIdQuery, PaginatedResult } from '@poupig/account';
import { PrismaService } from '../../db/prisma.service';

type AccountRow = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: string;
  accountNumber: string | null;
  agency: string | null;
  financialInstitution: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function toDomain(row: AccountRow): Result<Account> {
  return Account.tryCreate({
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type as AccountType,
    accountNumber: row.accountNumber ?? undefined,
    agency: row.agency ?? undefined,
    financialInstitution: row.financialInstitution ?? undefined,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}

function toDTO(row: AccountRow): AccountDTO {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type as AccountType,
    accountNumber: row.accountNumber ?? undefined,
    agency: row.agency ?? undefined,
    financialInstitution: row.financialInstitution ?? undefined,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class AccountPrisma implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAccountsByUserId: FindAccountsByUserIdQuery = {
    execute: async (userId: string, page: number, pageSize: number): Promise<Result<PaginatedResult<AccountDTO>>> => {
      return Result.tryAsync(async () => {
        const skip = (page - 1) * pageSize;
        const [rows, total] = await Promise.all([
          this.prisma.client.account.findMany({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            skip,
            take: pageSize,
          }),
          this.prisma.client.account.count({ where: { userId, deletedAt: null } }),
        ]);
        return { items: rows.map(toDTO), total, page, pageSize };
      });
    },
  };

  async save(account: Account): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.prisma.client.account.upsert({
        where: { id: account.id },
        create: {
          id: account.id,
          userId: account.userId,
          name: account.name,
          description: account.description ?? null,
          type: account.type,
          accountNumber: account.accountNumber ?? null,
          agency: account.agency ?? null,
          financialInstitution: account.financialInstitution ?? null,
          color: account.color ?? null,
          icon: account.icon ?? null,
          isActive: account.isActive,
          deletedAt: account.deletedAt,
        },
        update: {
          name: account.name,
          description: account.description ?? null,
          type: account.type,
          accountNumber: account.accountNumber ?? null,
          agency: account.agency ?? null,
          financialInstitution: account.financialInstitution ?? null,
          color: account.color ?? null,
          icon: account.icon ?? null,
          isActive: account.isActive,
          deletedAt: account.deletedAt,
        },
      });
    });
  }

  async findById(id: string): Promise<Result<Account | null>> {
    const row = await this.prisma.client.account.findUnique({ where: { id } });
    if (!row) return Result.ok(null);
    return toDomain(row as AccountRow);
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Result<Account | null>> {
    const row = await this.prisma.client.account.findFirst({
      where: { name, userId, deletedAt: null },
    });
    if (!row) return Result.ok(null);
    return toDomain(row as AccountRow);
  }

  async delete(id: string): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.prisma.client.account.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
