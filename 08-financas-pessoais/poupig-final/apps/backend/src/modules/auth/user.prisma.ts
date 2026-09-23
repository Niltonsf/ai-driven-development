import { Injectable } from '@nestjs/common';
import { Result, TransactionContext } from '@poupig/shared';
import { User, UserRepository } from '@poupig/auth';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../db/prisma.service';

@Injectable()
export class UserPrisma implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private resolveClient(tx?: TransactionContext) {
    const ctx = tx as PrismaTransactionContext | undefined;
    return ctx?.client ?? this.prisma.client;
  }

  private toDomain(row: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Result<User> {
    return User.tryCreate({
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(user: User, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const client = this.resolveClient(tx);
      await client.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    });
  }

  async findByEmail(
    email: string,
    tx?: TransactionContext,
  ): Promise<Result<User>> {
    const client = this.resolveClient(tx);
    const row = await client.user.findUnique({ where: { email } });
    if (!row) return Result.fail('USER_NOT_FOUND');
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Result<User>> {
    const row = await this.prisma.client.user.findUnique({ where: { id } });
    if (!row) return Result.fail('USER_NOT_FOUND');
    return this.toDomain(row);
  }

  async update(user: User, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const client = this.resolveClient(tx);
      await client.user.update({
        where: { id: user.id },
        data: {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    });
  }

  async delete(id: string, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const client = this.resolveClient(tx);
      await client.user.delete({ where: { id } });
    });
  }
}
