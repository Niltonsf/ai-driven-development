import { Injectable } from '@nestjs/common';
import { Prisma, type Transaction as TransactionRow } from '@prisma/client';
import {
  DateOnly,
  PaginatedResultDTO,
  Result,
  TransactionContext,
} from '@poupig/shared';
import {
  Direction,
  FindTransactionByIdQuery,
  isDirection,
  isTransactionStatus,
  ListTransactionsInput,
  ListTransactionsQuery,
  MovementErrors,
  MovementReferencesQuery,
  Transaction,
  TransactionDTO,
  TransactionErrors,
  TransactionRepository,
  TransactionStatus,
} from '@poupig/transaction';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../db/prisma.service';
import {
  fromDbDate,
  referenceNamesSelect,
  toDbDate,
  toReferenceNames,
} from './transaction-prisma.util';

const transactionDTOSelect = {
  id: true,
  userId: true,
  name: true,
  note: true,
  value: true,
  direction: true,
  accountId: true,
  creditCardId: true,
  subcategoryId: true,
  status: true,
  expectedOn: true,
  settledOn: true,
  createdAt: true,
  updatedAt: true,
  ...referenceNamesSelect,
} satisfies Prisma.TransactionSelect;

type TransactionDTORow = Prisma.TransactionGetPayload<{
  select: typeof transactionDTOSelect;
}>;

/** Single conversion point from the row columns (`Decimal`, `@db.Date`) to primitives, shared by entity and DTO. */
function fromRow(row: Omit<TransactionRow, 'deletedAt'>) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    note: row.note,
    value: row.value.toNumber(),
    direction: row.direction as Direction,
    accountId: row.accountId,
    creditCardId: row.creditCardId,
    subcategoryId: row.subcategoryId,
    status: row.status as TransactionStatus,
    expectedOn: fromDbDate(row.expectedOn),
    settledOn: row.settledOn ? fromDbDate(row.settledOn) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDomain(row: TransactionRow): Result<Transaction> {
  return Transaction.tryCreate({ ...fromRow(row), deletedAt: row.deletedAt });
}

function toDTO(row: TransactionDTORow): TransactionDTO {
  return {
    ...fromRow(row),
    ...toReferenceNames(row),
  };
}

function toData(transaction: Transaction) {
  return {
    userId: transaction.userId,
    name: transaction.name,
    note: transaction.note,
    value: transaction.value,
    direction: transaction.direction,
    accountId: transaction.accountId,
    creditCardId: transaction.creditCardId,
    subcategoryId: transaction.subcategoryId,
    status: transaction.status,
    expectedOn: toDbDate(transaction.expectedOn),
    settledOn: transaction.settledOn ? toDbDate(transaction.settledOn) : null,
    deletedAt: transaction.deletedAt,
  } satisfies Prisma.TransactionUncheckedUpdateInput;
}

/** Validates the raw filters and builds the listing `where`, always scoped by user and ignoring deleted rows. */
function buildListWhere(
  input: ListTransactionsInput,
): Result<Prisma.TransactionWhereInput> {
  const where: Prisma.TransactionWhereInput = {
    userId: input.userId,
    deletedAt: null,
  };
  const errors = new Set<string>();

  const search = input.search?.trim();
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  if (input.direction) {
    if (isDirection(input.direction)) where.direction = input.direction;
    else errors.add(MovementErrors.INVALID_DIRECTION);
  }

  if (input.status) {
    if (isTransactionStatus(input.status)) where.status = input.status;
    else errors.add(MovementErrors.INVALID_TRANSACTION_STATUS);
  }

  if (input.accountId) {
    where.accountId = input.accountId;
  }

  if (input.creditCardId) {
    where.creditCardId = input.creditCardId;
  } else if (input.onlyCreditCard === true) {
    where.creditCardId = { not: null };
  }

  const expectedOn: Prisma.DateTimeFilter = {};

  if (input.expectedFrom) {
    const from = DateOnly.tryCreate(input.expectedFrom);
    if (from.isFailure) from.errors.forEach((error) => errors.add(error));
    else expectedOn.gte = toDbDate(from.instance.value);
  }

  if (input.expectedTo) {
    const to = DateOnly.tryCreate(input.expectedTo);
    if (to.isFailure) to.errors.forEach((error) => errors.add(error));
    else expectedOn.lte = toDbDate(to.instance.value);
  }

  if (expectedOn.gte || expectedOn.lte) {
    where.expectedOn = expectedOn;
  }

  return errors.size ? Result.fail([...errors]) : Result.ok(where);
}

@Injectable()
export class TransactionPrisma implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly findTransactionById: FindTransactionByIdQuery = {
    execute: (id, userId) =>
      Result.tryAsync(async () => {
        const row = await this.prisma.client.transaction.findFirst({
          where: { id, userId, deletedAt: null },
          select: transactionDTOSelect,
        });
        return row ? toDTO(row) : null;
      }),
  };

  readonly listTransactions: ListTransactionsQuery = {
    execute: (input) =>
      Result.tryAsync(async () => {
        const whereResult = buildListWhere(input);
        if (whereResult.isFailure) {
          return Result.fail<PaginatedResultDTO<TransactionDTO>>(
            whereResult.errors,
          );
        }

        const where = whereResult.instance;
        const { page, pageSize } = input;
        const [rows, total] = await Promise.all([
          this.prisma.client.transaction.findMany({
            where,
            select: transactionDTOSelect,
            orderBy: [{ expectedOn: 'desc' }, { createdAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          this.prisma.client.transaction.count({ where }),
        ]);

        return Result.ok<PaginatedResultDTO<TransactionDTO>>({
          data: rows.map(toDTO),
          meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      }),
  };

  readonly movementReferences: MovementReferencesQuery = {
    accountBelongsToUser: (id, userId) =>
      Result.tryAsync(async () => {
        const total = await this.prisma.client.account.count({
          where: { id, userId, deletedAt: null },
        });
        return total > 0;
      }),
    creditCardBelongsToUser: (id, userId) =>
      Result.tryAsync(async () => {
        const total = await this.prisma.client.card.count({
          where: { id, userId, deletedAt: null },
        });
        return total > 0;
      }),
    subcategoryBelongsToUser: (id, userId) =>
      Result.tryAsync(async () => {
        const total = await this.prisma.client.subcategory.count({
          where: { id, deletedAt: null, category: { userId, deletedAt: null } },
        });
        return total > 0;
      }),
  };

  create(
    transaction: Transaction,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).transaction.create({
        data: {
          id: transaction.id,
          createdAt: transaction.createdAt,
          ...toData(transaction),
        },
      });
    });
  }

  update(
    transaction: Transaction,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).transaction.update({
        where: { id: transaction.id },
        data: toData(transaction),
      });
    });
  }

  findById(id: string): Promise<Result<Transaction>> {
    return Result.tryAsync(async () => {
      const row = await this.prisma.client.transaction.findFirst({
        where: { id, deletedAt: null },
      });
      if (!row) {
        return Result.fail<Transaction>(
          TransactionErrors.TRANSACTION_NOT_FOUND,
        );
      }
      return toDomain(row);
    });
  }

  delete(id: string, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const { count } = await this.db(tx).transaction.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (count === 0) {
        return Result.fail<void>(TransactionErrors.TRANSACTION_NOT_FOUND);
      }
      return Result.ok<void>();
    });
  }

  private db(tx?: TransactionContext): Prisma.TransactionClient {
    return (
      (tx as PrismaTransactionContext | undefined)?.client ?? this.prisma.client
    );
  }
}
