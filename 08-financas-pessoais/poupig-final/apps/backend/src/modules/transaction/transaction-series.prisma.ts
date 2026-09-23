import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type TransactionSeries as TransactionSeriesRow,
} from '@prisma/client';
import { PaginatedResultDTO, Result, TransactionContext } from '@poupig/shared';
import {
  DayOfWeek,
  Direction,
  FindTransactionSeriesByIdQuery,
  FrequencyUnit,
  isDirection,
  isSeriesKind,
  ListActiveTransactionSeriesQuery,
  ListTransactionSeriesInput,
  ListTransactionSeriesQuery,
  MovementErrors,
  RecurrenceRule,
  SeriesKind,
  TransactionSeries,
  TransactionSeriesDTO,
  TransactionSeriesErrors,
  TransactionSeriesRepository,
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

const transactionSeriesDTOSelect = {
  id: true,
  userId: true,
  name: true,
  note: true,
  value: true,
  direction: true,
  accountId: true,
  creditCardId: true,
  subcategoryId: true,
  kind: true,
  frequencyUnit: true,
  frequencyInterval: true,
  weekDay: true,
  dayOfMonth: true,
  month: true,
  installments: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  ...referenceNamesSelect,
} satisfies Prisma.TransactionSeriesSelect;

type TransactionSeriesDTORow = Prisma.TransactionSeriesGetPayload<{
  select: typeof transactionSeriesDTOSelect;
}>;

type RecurrenceColumns = Pick<
  TransactionSeriesRow,
  'frequencyUnit' | 'frequencyInterval' | 'weekDay' | 'dayOfMonth' | 'month'
>;

/** Only the anchors of the unit are written; the columns of the other units stay `null`. */
function toRecurrenceColumns(rule: RecurrenceRule) {
  return {
    frequencyUnit: rule.unit,
    frequencyInterval: rule.interval,
    weekDay: rule.unit === FrequencyUnit.WEEK ? rule.weekDay : null,
    dayOfMonth: rule.unit === FrequencyUnit.WEEK ? null : rule.dayOfMonth,
    month: rule.unit === FrequencyUnit.YEAR ? rule.month : null,
  };
}

/**
 * Rebuilds the rule from the stored unit, reading only the anchors of that unit.
 * The row was written by a valid entity, so those anchors are always filled.
 */
function toRecurrenceRule(row: RecurrenceColumns): RecurrenceRule {
  const unit = row.frequencyUnit as FrequencyUnit;
  const interval = row.frequencyInterval;

  switch (unit) {
    case FrequencyUnit.WEEK:
      return { unit, interval, weekDay: row.weekDay as DayOfWeek };
    case FrequencyUnit.MONTH:
      return { unit, interval, dayOfMonth: row.dayOfMonth as number };
    case FrequencyUnit.YEAR:
      return {
        unit,
        interval,
        month: row.month as number,
        dayOfMonth: row.dayOfMonth as number,
      };
  }
}

/** Single conversion point from the row columns (`Decimal`, `@db.Date`) to primitives, shared by entity and DTO. */
function fromRow(row: Omit<TransactionSeriesRow, 'deletedAt'>) {
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
    kind: row.kind as SeriesKind,
    recurrence: toRecurrenceRule(row),
    startDate: fromDbDate(row.startDate),
    endDate: row.endDate ? fromDbDate(row.endDate) : null,
    installments: row.installments,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDomain(row: TransactionSeriesRow): Result<TransactionSeries> {
  return TransactionSeries.tryCreate({
    ...fromRow(row),
    deletedAt: row.deletedAt,
  });
}

function toDTO(row: TransactionSeriesDTORow): TransactionSeriesDTO {
  return {
    ...fromRow(row),
    ...toReferenceNames(row),
  };
}

function toData(series: TransactionSeries) {
  return {
    userId: series.userId,
    name: series.name,
    note: series.note,
    value: series.value,
    direction: series.direction,
    accountId: series.accountId,
    creditCardId: series.creditCardId,
    subcategoryId: series.subcategoryId,
    kind: series.kind,
    ...toRecurrenceColumns(series.recurrence),
    installments: series.installments,
    startDate: toDbDate(series.startDate),
    endDate: series.endDate ? toDbDate(series.endDate) : null,
    deletedAt: series.deletedAt,
  } satisfies Prisma.TransactionSeriesUncheckedUpdateInput;
}

/** Validates the raw filters and builds the listing `where`, always scoped by user and ignoring deleted rows. */
function buildListWhere(
  input: ListTransactionSeriesInput,
): Result<Prisma.TransactionSeriesWhereInput> {
  const where: Prisma.TransactionSeriesWhereInput = {
    userId: input.userId,
    deletedAt: null,
  };
  const errors = new Set<string>();

  const search = input.search?.trim();
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  if (input.kind) {
    if (isSeriesKind(input.kind)) where.kind = input.kind;
    else errors.add(TransactionSeriesErrors.INVALID_SERIES_KIND);
  }

  if (input.direction) {
    if (isDirection(input.direction)) where.direction = input.direction;
    else errors.add(MovementErrors.INVALID_DIRECTION);
  }

  if (input.accountId) {
    where.accountId = input.accountId;
  }

  return errors.size ? Result.fail([...errors]) : Result.ok(where);
}

@Injectable()
export class TransactionSeriesPrisma implements TransactionSeriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly findTransactionSeriesById: FindTransactionSeriesByIdQuery = {
    execute: (id, userId) =>
      Result.tryAsync(async () => {
        const row = await this.prisma.client.transactionSeries.findFirst({
          where: { id, userId, deletedAt: null },
          select: transactionSeriesDTOSelect,
        });
        return row ? toDTO(row) : null;
      }),
  };

  readonly listTransactionSeries: ListTransactionSeriesQuery = {
    execute: (input) =>
      Result.tryAsync(async () => {
        const whereResult = buildListWhere(input);
        if (whereResult.isFailure) {
          return Result.fail<PaginatedResultDTO<TransactionSeriesDTO>>(
            whereResult.errors,
          );
        }

        const where = whereResult.instance;
        const { page, pageSize } = input;
        const [rows, total] = await Promise.all([
          this.prisma.client.transactionSeries.findMany({
            where,
            select: transactionSeriesDTOSelect,
            orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          this.prisma.client.transactionSeries.count({ where }),
        ]);

        return Result.ok<PaginatedResultDTO<TransactionSeriesDTO>>({
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

  /** Series that may have occurrences in the period; the occurrences themselves are calculated by the domain. */
  readonly listActiveTransactionSeries: ListActiveTransactionSeriesQuery = {
    execute: ({ userId, from, to }) =>
      Result.tryAsync(async () => {
        const rows = await this.prisma.client.transactionSeries.findMany({
          where: {
            userId,
            deletedAt: null,
            startDate: { lte: toDbDate(to) },
            OR: [{ endDate: null }, { endDate: { gte: toDbDate(from) } }],
          },
          select: transactionSeriesDTOSelect,
          orderBy: { startDate: 'asc' },
        });
        return rows.map(toDTO);
      }),
  };

  create(
    series: TransactionSeries,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).transactionSeries.create({
        data: {
          id: series.id,
          createdAt: series.createdAt,
          ...toData(series),
        },
      });
    });
  }

  update(
    series: TransactionSeries,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      await this.db(tx).transactionSeries.update({
        where: { id: series.id },
        data: toData(series),
      });
    });
  }

  findById(id: string): Promise<Result<TransactionSeries>> {
    return Result.tryAsync(async () => {
      const row = await this.prisma.client.transactionSeries.findFirst({
        where: { id, deletedAt: null },
      });
      if (!row) {
        return Result.fail<TransactionSeries>(
          TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND,
        );
      }
      return toDomain(row);
    });
  }

  delete(id: string, tx?: TransactionContext): Promise<Result<void>> {
    return Result.tryAsync(async () => {
      const { count } = await this.db(tx).transactionSeries.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (count === 0) {
        return Result.fail<void>(
          TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND,
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
