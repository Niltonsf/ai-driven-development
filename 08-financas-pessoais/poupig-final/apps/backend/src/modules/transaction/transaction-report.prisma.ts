import { Injectable } from '@nestjs/common';
import { Result } from '@poupig/shared';
import {
  StoredMonthlyCashFlow,
  StoredRecurrenceOccurrenceTotal,
  SummarizeStoredCashFlowQuery,
  SummarizeStoredRecurrenceOccurrencesQuery,
} from '@poupig/transaction';
import { PrismaService } from '../../db/prisma.service';

/**
 * Raw row of the cash flow sum. The `numeric` sums may arrive as a Prisma
 * `Decimal`, a `string` or a `number` depending on the driver adapter, so they
 * stay `unknown` until `toAmount` converts them.
 */
interface StoredCashFlowRow {
  month: string;
  inflow: unknown;
  outflow: unknown;
}

/**
 * Raw row of the stored recurrence occurrences sum, one per series and month.
 * The `numeric` total stays `unknown` until `toAmount` converts it.
 */
interface StoredRecurrenceOccurrenceRow {
  seriesId: string;
  month: string;
  total: unknown;
}

/** Anything exposing `toNumber`, as the Prisma `Decimal` does, without importing its type. */
function hasToNumber(value: object): value is { toNumber(): number } {
  return typeof (value as { toNumber?: unknown }).toNumber === 'function';
}

/**
 * Converts a sum read by a raw query into a number with two decimals.
 *
 * Accepts a Prisma `Decimal` (any object with `toNumber`, which is what the
 * `PrismaPg` adapter returns for `numeric`), a numeric `string`, a `number`
 * and a `bigint`; `null` and `undefined` (a `SUM` without rows) become `0`.
 * Anything else, or a non-finite value, throws so the query fails instead of
 * summing `NaN`. The result is rounded to the cent, so no database type ever
 * reaches the domain.
 */
function toAmount(value: unknown): number {
  if (value === null || value === undefined) return 0;

  let amount: number;
  if (typeof value === 'number') amount = value;
  else if (typeof value === 'bigint' || typeof value === 'string') {
    amount = Number(value);
  } else if (typeof value === 'object' && hasToNumber(value)) {
    amount = value.toNumber();
  } else {
    amount = Number.NaN;
  }

  if (!Number.isFinite(amount)) {
    throw new Error('Invalid amount returned by a report query');
  }
  return Math.round(amount * 100) / 100;
}

/** Read adapter of the reports of the module, over more than one table. */
@Injectable()
export class TransactionReportPrisma {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One query summing, per month of `expected_on`, the standalone transactions
   * not soft deleted and the stored occurrences of series not soft deleted,
   * without `CANCELED`.
   *
   * - Every received value is a bind parameter with an explicit `::date` cast.
   * - The month key comes from `expected_on::timestamp` (without time zone):
   *   a bare `date` would be promoted to `timestamptz` and the month would
   *   depend on the `TimeZone` of the session.
   * - Every column is qualified by alias: the join with `transaction_series`
   *   repeats `user_id`, `value`, `direction` and `deleted_at`.
   * - The enum columns are compared with untyped literals, which Postgres
   *   resolves to the enum type of the column.
   */
  readonly summarizeStoredCashFlow: SummarizeStoredCashFlowQuery = {
    execute: ({ userId, from, to }) =>
      Result.tryAsync(async () => {
        const rows = await this.prisma.client.$queryRaw<StoredCashFlowRow[]>`
          SELECT to_char(m."expected_on"::timestamp, 'YYYY-MM') AS "month",
                 SUM(CASE WHEN m."direction" = 'IN' THEN m."value" ELSE 0 END) AS "inflow",
                 SUM(CASE WHEN m."direction" = 'OUT' THEN m."value" ELSE 0 END) AS "outflow"
          FROM (
            SELECT t."expected_on" AS "expected_on",
                   t."direction" AS "direction",
                   t."value" AS "value"
            FROM "transaction" t
            WHERE t."user_id" = ${userId}
              AND t."deleted_at" IS NULL
              AND t."status" <> 'CANCELED'
              AND t."expected_on" BETWEEN ${from}::date AND ${to}::date
            UNION ALL
            SELECT st."expected_on" AS "expected_on",
                   st."direction" AS "direction",
                   st."value" AS "value"
            FROM "scheduled_transaction" st
            JOIN "transaction_series" s ON s."id" = st."series_id"
            WHERE st."user_id" = ${userId}
              AND s."deleted_at" IS NULL
              AND st."status" <> 'CANCELED'
              AND st."expected_on" BETWEEN ${from}::date AND ${to}::date
          ) m
          GROUP BY 1
          ORDER BY 1
        `;

        return rows.map(
          (row): StoredMonthlyCashFlow => ({
            month: row.month,
            inflow: toAmount(row.inflow),
            outflow: toAmount(row.outflow),
          }),
        );
      }),
  };

  /**
   * One query summing, per series and per month of `expected_on`, the stored
   * occurrences of the user of series of kind `OPEN` not soft deleted, without
   * `CANCELED`. The period arrives already validated by the use case.
   *
   * - Every received value is a bind parameter with an explicit `::date` cast.
   * - The month key comes from `expected_on::timestamp` (without time zone), so
   *   it never depends on the `TimeZone` of the session.
   * - Every column is qualified by alias: the join with `transaction_series`
   *   repeats `user_id`, `value` and `deleted_at`.
   * - The enum columns are compared with untyped literals.
   * - No order: the use case orders the lines.
   */
  readonly summarizeStoredRecurrenceOccurrences: SummarizeStoredRecurrenceOccurrencesQuery =
    {
      execute: ({ userId, from, to }) =>
        Result.tryAsync(async () => {
          const rows = await this.prisma.client.$queryRaw<
            StoredRecurrenceOccurrenceRow[]
          >`
            SELECT st."series_id" AS "seriesId",
                   to_char(st."expected_on"::timestamp, 'YYYY-MM') AS "month",
                   SUM(st."value") AS "total"
            FROM "scheduled_transaction" st
            JOIN "transaction_series" s ON s."id" = st."series_id"
            WHERE st."user_id" = ${userId}
              AND s."deleted_at" IS NULL
              AND s."kind" = 'OPEN'
              AND st."status" <> 'CANCELED'
              AND st."expected_on" BETWEEN ${from}::date AND ${to}::date
            GROUP BY 1, 2
          `;

          return rows.map(
            (row): StoredRecurrenceOccurrenceTotal => ({
              seriesId: row.seriesId,
              month: row.month,
              total: toAmount(row.total),
            }),
          );
        }),
    };
}
