import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type ScheduledTransaction as ScheduledTransactionRow,
} from '@prisma/client';
import { Result, TransactionContext } from '@poupig/shared';
import {
  Direction,
  FindScheduledTransactionByOccurrenceQuery,
  ListMaterializedOccurrenceKeysQuery,
  ListScheduledTransactionsInPeriodQuery,
  ScheduledTransaction,
  ScheduledTransactionDTO,
  ScheduledTransactionErrors,
  ScheduledTransactionRepository,
  SeriesKind,
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

const scheduledTransactionDTOSelect = {
  id: true,
  userId: true,
  seriesId: true,
  occurrenceIndex: true,
  occurrenceOn: true,
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
  series: { select: { name: true, kind: true, installments: true } },
} satisfies Prisma.ScheduledTransactionSelect;

type ScheduledTransactionDTORow = Prisma.ScheduledTransactionGetPayload<{
  select: typeof scheduledTransactionDTOSelect;
}>;

/** Highest value of the `INTEGER` column `occurrence_index`. */
const MAX_OCCURRENCE_INDEX = 2_147_483_647;

function isStorableOccurrenceIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_OCCURRENCE_INDEX;
}

/** Single conversion point from the row columns (`Decimal`, `@db.Date`) to primitives, shared by entity and DTO. */
function fromRow(row: ScheduledTransactionRow) {
  return {
    id: row.id,
    userId: row.userId,
    seriesId: row.seriesId,
    occurrenceIndex: row.occurrenceIndex,
    occurrenceOn: fromDbDate(row.occurrenceOn),
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

function toDomain(row: ScheduledTransactionRow): Result<ScheduledTransaction> {
  return ScheduledTransaction.tryCreate(fromRow(row));
}

/** A row read from storage is, by definition, a materialized occurrence. */
function toDTO(row: ScheduledTransactionDTORow): ScheduledTransactionDTO {
  return {
    ...fromRow(row),
    ...toReferenceNames(row),
    materialized: true,
    seriesName: row.series.name,
    seriesKind: row.series.kind as SeriesKind,
    installments: row.series.installments,
  };
}

/** Every persisted attribute except the id and `createdAt`; there is no `deletedAt` in this table. */
function toData(scheduledTransaction: ScheduledTransaction) {
  return {
    userId: scheduledTransaction.userId,
    seriesId: scheduledTransaction.seriesId,
    occurrenceIndex: scheduledTransaction.occurrenceIndex,
    occurrenceOn: toDbDate(scheduledTransaction.occurrenceOn),
    name: scheduledTransaction.name,
    note: scheduledTransaction.note,
    value: scheduledTransaction.value,
    direction: scheduledTransaction.direction,
    accountId: scheduledTransaction.accountId,
    creditCardId: scheduledTransaction.creditCardId,
    subcategoryId: scheduledTransaction.subcategoryId,
    status: scheduledTransaction.status,
    expectedOn: toDbDate(scheduledTransaction.expectedOn),
    settledOn: scheduledTransaction.settledOn
      ? toDbDate(scheduledTransaction.settledOn)
      : null,
  } satisfies Prisma.ScheduledTransactionUncheckedUpdateInput;
}

@Injectable()
export class ScheduledTransactionPrisma implements ScheduledTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly findScheduledTransactionByOccurrence: FindScheduledTransactionByOccurrenceQuery =
    {
      execute: (seriesId, occurrenceIndex, userId) =>
        Result.tryAsync(async () => {
          // An index that is not a stored `INTEGER` (e.g. `NaN` from a non-numeric route
          // param) cannot address a stored occurrence: answer "not stored" and let the
          // domain judge the index, instead of failing inside the Prisma validation.
          if (!isStorableOccurrenceIndex(occurrenceIndex)) return null;

          const row = await this.prisma.client.scheduledTransaction.findFirst({
            where: {
              seriesId,
              occurrenceIndex,
              userId,
              series: { deletedAt: null },
            },
            select: scheduledTransactionDTOSelect,
          });
          return row ? toDTO(row) : null;
        }),
    };

  readonly listScheduledTransactionsInPeriod: ListScheduledTransactionsInPeriodQuery =
    {
      execute: ({ userId, from, to }) =>
        Result.tryAsync(async () => {
          const period = { gte: toDbDate(from), lte: toDbDate(to) };
          const rows = await this.prisma.client.scheduledTransaction.findMany({
            where: {
              userId,
              series: { deletedAt: null },
              OR: [{ expectedOn: period }, { occurrenceOn: period }],
            },
            select: scheduledTransactionDTOSelect,
            orderBy: [{ expectedOn: 'desc' }, { createdAt: 'desc' }],
          });
          return rows.map(toDTO);
        }),
    };

  /**
   * Only the business keys of the stored occurrences whose `occurrenceOn` is in
   * the period, with any status (a `CANCELED` one also suppresses the
   * generation) and ignoring soft deleted series.
   */
  readonly listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery =
    {
      execute: ({ userId, from, to }) =>
        Result.tryAsync(async () => {
          // The selection is already the plain `{ seriesId, occurrenceIndex }` of the contract.
          const keys = await this.prisma.client.scheduledTransaction.findMany({
            where: {
              userId,
              series: { deletedAt: null },
              occurrenceOn: { gte: toDbDate(from), lte: toDbDate(to) },
            },
            select: { seriesId: true, occurrenceIndex: true },
          });
          return keys;
        }),
    };

  create(
    scheduledTransaction: ScheduledTransaction,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).scheduledTransaction.create({
        data: {
          id: scheduledTransaction.id,
          createdAt: scheduledTransaction.createdAt,
          ...toData(scheduledTransaction),
        },
      });
    });
  }

  update(
    scheduledTransaction: ScheduledTransaction,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).scheduledTransaction.update({
        where: { id: scheduledTransaction.id },
        data: toData(scheduledTransaction),
      });
    });
  }

  findById(id: string): Promise<Result<ScheduledTransaction>> {
    return Result.tryAsync(async () => {
      const row = await this.prisma.client.scheduledTransaction.findUnique({
        where: { id },
      });
      if (!row) {
        return Result.fail<ScheduledTransaction>(
          ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND,
        );
      }
      return toDomain(row);
    });
  }

  /** Physical removal: frees the pair `(seriesId, occurrenceIndex)` so the occurrence is generated again. */
  delete(id: string, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const { count } = await this.db(tx).scheduledTransaction.deleteMany({
        where: { id },
      });
      if (count === 0) {
        return Result.fail<void>(
          ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND,
        );
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
