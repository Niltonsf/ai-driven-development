import { Injectable } from '@nestjs/common';
import {
  FindSubcategoryAppearancesQuery,
  StoredSubcategorySpending,
  SubcategoryAppearance,
  SummarizeStoredCategorySpendingQuery,
} from '@poupig/category';
import { Result } from '@poupig/shared';
import { PrismaService } from '../../db/prisma.service';

/**
 * Raw row of the spending sum. The `numeric` sum may arrive as a Prisma
 * `Decimal`, a `string` or a `number` depending on the driver adapter, so it
 * stays `unknown` until `toAmount` converts it.
 */
interface StoredSubcategorySpendingRow {
  subcategoryId: string | null;
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
 *
 * A local copy of the one in `TransactionReportPrisma`: sharing it would couple
 * two backend modules for a few lines.
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
    throw new Error('Invalid amount returned by the category spending query');
  }
  return Math.round(amount * 100) / 100;
}

/**
 * Read adapter of the category spending report. The period always arrives
 * validated by `SummarizeCategorySpending` (`YYYY-MM-DD`, ordered and capped),
 * so the adapter does not repeat the validation.
 */
@Injectable()
export class CategoryReportPrisma {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One query summing, per `subcategory_id`, the standalone outflows not soft
   * deleted and the stored outflow occurrences of series not soft deleted,
   * without `CANCELED`, by `expected_on`.
   *
   * - Every received value is a bind parameter with an explicit `::date` cast:
   *   `expected_on` is a `date` compared with a `date`, so neither the time
   *   zone of the server nor the one of the session changes the result.
   * - Every column is qualified by alias: the join with `transaction_series`
   *   repeats `user_id`, `value`, `direction`, `subcategory_id` and `deleted_at`.
   * - The enum columns are compared with untyped literals, which Postgres
   *   resolves to the enum type of the column.
   * - Only sums: no join with `subcategory`/`category` (the appearance is read
   *   by `findSubcategoryAppearances`, which also covers the subcategories that
   *   only have generated occurrences) and no order (the use case orders).
   */
  readonly summarizeStoredCategorySpending: SummarizeStoredCategorySpendingQuery =
    {
      execute: ({ userId, from, to }) =>
        Result.tryAsync(async () => {
          const rows = await this.prisma.client.$queryRaw<
            StoredSubcategorySpendingRow[]
          >`
            SELECT m."subcategory_id" AS "subcategoryId",
                   SUM(m."value") AS "total"
            FROM (
              SELECT t."subcategory_id" AS "subcategory_id",
                     t."value" AS "value"
              FROM "transaction" t
              WHERE t."user_id" = ${userId}
                AND t."deleted_at" IS NULL
                AND t."direction" = 'OUT'
                AND t."status" <> 'CANCELED'
                AND t."expected_on" BETWEEN ${from}::date AND ${to}::date
              UNION ALL
              SELECT st."subcategory_id" AS "subcategory_id",
                     st."value" AS "value"
              FROM "scheduled_transaction" st
              JOIN "transaction_series" s ON s."id" = st."series_id"
              WHERE st."user_id" = ${userId}
                AND s."deleted_at" IS NULL
                AND st."direction" = 'OUT'
                AND st."status" <> 'CANCELED'
                AND st."expected_on" BETWEEN ${from}::date AND ${to}::date
            ) m
            GROUP BY m."subcategory_id"
          `;

          return rows.map(
            (row): StoredSubcategorySpending => ({
              subcategoryId: row.subcategoryId,
              total: toAmount(row.total),
            }),
          );
        }),
    };

  /**
   * The appearance of the subcategories that had spending, owned by the user.
   *
   * - The owner is filtered through the category (`category.userId`): the
   *   subcategory has no `user_id`, and an id of another user never leaks.
   * - No `deletedAt`/`isActive` filter: an inactive or soft deleted category or
   *   subcategory with spending is shown under its own name.
   * - An empty list returns `[]` without querying.
   */
  readonly findSubcategoryAppearances: FindSubcategoryAppearancesQuery = {
    execute: ({ userId, subcategoryIds }) =>
      Result.tryAsync(async () => {
        if (subcategoryIds.length === 0) return [];

        const rows = await this.prisma.client.subcategory.findMany({
          where: { id: { in: subcategoryIds }, category: { userId } },
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            category: {
              select: { id: true, name: true, color: true, icon: true },
            },
          },
        });

        return rows.map(
          (row): SubcategoryAppearance => ({
            categoryId: row.category.id,
            categoryName: row.category.name,
            categoryColor: row.category.color,
            categoryIcon: row.category.icon,
            subcategoryId: row.id,
            subcategoryName: row.name,
            subcategoryColor: row.color,
            subcategoryIcon: row.icon,
          }),
        );
      }),
  };
}
