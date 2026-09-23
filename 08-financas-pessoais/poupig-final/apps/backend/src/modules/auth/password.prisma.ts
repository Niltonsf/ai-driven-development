import { Injectable } from '@nestjs/common';
import { Result, TransactionContext } from '@poupig/shared';
import { Password, PasswordRepository } from '@poupig/auth';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../db/prisma.service';

@Injectable()
export class PasswordPrisma implements PasswordRepository {
  constructor(private readonly prisma: PrismaService) {}

  private resolveClient(tx?: TransactionContext) {
    const ctx = tx as PrismaTransactionContext | undefined;
    return ctx?.client ?? this.prisma.client;
  }

  async create(
    password: Password,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const client = this.resolveClient(tx);
      await client.password.create({
        data: {
          id: password.id,
          value: password.value,
        },
      });
    });
  }

  async findById(id: string): Promise<Result<Password>> {
    const row = await this.prisma.client.password.findUnique({ where: { id } });
    if (!row) return Result.fail('PASSWORD_NOT_FOUND');
    // The stored value is a bcrypt hash; reconstruct via toEncrypted so the
    // domain invariant (encrypted form at rest) is honored without requiring
    // the original plaintext.
    const base = Password.tryCreate({ id: row.id, value: '#Restored123' });
    if (base.isFailure) return Result.fail(base.errors!);
    return base.instance.toEncrypted(row.value);
  }

  async update(
    password: Password,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const client = this.resolveClient(tx);
      await client.password.update({
        where: { id: password.id },
        data: { value: password.value },
      });
    });
  }

  async delete(id: string, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const client = this.resolveClient(tx);
      await client.password.delete({ where: { id } });
    });
  }
}
