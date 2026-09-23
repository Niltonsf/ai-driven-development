import { Result, UseCase } from '@poupig/shared';
import {
  Direction,
  ListActiveTransactionSeriesQuery,
  ListMaterializedOccurrenceKeysQuery,
  ScheduledTransactionGenerator,
} from '@poupig/transaction';
import { CategorySpendingSliceDTO } from '../dto';
import { isValidCategorySpendingPeriod } from '../model';
import {
  FindSubcategoryAppearancesQuery,
  SubcategoryAppearance,
  SummarizeStoredCategorySpendingQuery,
} from '../provider';

export const SummarizeCategorySpendingErrors = {
  INVALID_CATEGORY_REPORT_PERIOD: 'INVALID_CATEGORY_REPORT_PERIOD',
} as const;

/**
 * Raw input of the report, as received by the API: the use case validates it.
 * `from` and `to` are the inclusive ends of the period (`YYYY-MM-DD`), and
 * `userId` is always the authenticated user.
 */
export interface SummarizeCategorySpendingInput {
  userId: string;
  from: string;
  to: string;
}

/** A slice while it is being summed: the identity, `null` for the unclassified bucket, and integer cents. */
interface SliceInCents {
  appearance: SubcategoryAppearance | null;
  cents: number;
}

/**
 * How much went out of each subcategory in the period, with the appearance of
 * the subcategory and of its category, ordered by total descending.
 *
 * The period sees exactly the outflows the statement of the same period sees,
 * without its ceiling of entries:
 *
 * - the stored rows (standalone transactions and stored occurrences) are summed
 *   per subcategory by storage, only `OUT`, without `CANCELED` and ignoring
 *   soft deleted series, by `expectedOn`;
 * - a stored occurrence whose `occurrenceOn` is inside the period suppresses
 *   the generation of its pair `(seriesId, occurrenceIndex)` with **any**
 *   status — a canceled one did not happen, and must not come back as
 *   `PENDING` — even when its `expectedOn` was moved out of the period;
 * - the occurrences of the active outflow series that are not stored are
 *   generated in memory with the same rule of the statement and added to the
 *   subcategory of the series (always `PENDING`, with `expectedOn` equal to
 *   `occurrenceOn`, so always summed). Inflow series are skipped before generating.
 *
 * Everything without subcategory, and every subcategory whose appearance is
 * not found, is summed in a single unclassified row with the identity `null`,
 * so the rows always add up to the total spent. Values are summed as integer
 * cents: adding reais as floating point would drift (`0.1 + 0.2`). The report
 * stores nothing.
 */
export class SummarizeCategorySpending implements UseCase<SummarizeCategorySpendingInput, CategorySpendingSliceDTO[]> {
  constructor(
    private readonly summarizeStoredCategorySpending: SummarizeStoredCategorySpendingQuery,
    private readonly listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery,
    private readonly listActiveTransactionSeries: ListActiveTransactionSeriesQuery,
    private readonly findSubcategoryAppearances: FindSubcategoryAppearancesQuery,
  ) {}

  async execute(input: SummarizeCategorySpendingInput): Promise<Result<CategorySpendingSliceDTO[]>> {
    const { userId, from, to } = input;
    if (!isValidCategorySpendingPeriod(from, to)) {
      return Result.fail(SummarizeCategorySpendingErrors.INVALID_CATEGORY_REPORT_PERIOD);
    }

    const [storedResult, keysResult, seriesResult] = await Promise.all([
      this.summarizeStoredCategorySpending.execute({ userId, from, to }),
      this.listMaterializedOccurrenceKeys.execute({ userId, from, to }),
      this.listActiveTransactionSeries.execute({ userId, from, to }),
    ]);

    const queries = Result.combine([storedResult, keysResult, seriesResult]);
    if (queries.isFailure) return Result.fail(queries.errors!);

    const suppressed = new Set(
      keysResult.instance.map((key) => SummarizeCategorySpending.occurrenceKey(key.seriesId, key.occurrenceIndex)),
    );

    const centsBySubcategory = new Map<string | null, number>();
    const add = (subcategoryId: string | null, value: number) => {
      const cents = Math.round(value * 100);
      centsBySubcategory.set(subcategoryId, (centsBySubcategory.get(subcategoryId) ?? 0) + cents);
    };

    for (const row of storedResult.instance) {
      add(row.subcategoryId, row.total);
    }

    for (const series of seriesResult.instance) {
      if (series.direction !== Direction.OUT) continue;

      const generated = ScheduledTransactionGenerator.generateForPeriod(
        series,
        { from, to },
        (seriesId, occurrenceIndex) =>
          suppressed.has(SummarizeCategorySpending.occurrenceKey(seriesId, occurrenceIndex)),
      );
      for (const occurrence of generated) {
        add(occurrence.subcategoryId, occurrence.value);
      }
    }

    const subcategoryIds = [...centsBySubcategory.keys()].filter((id): id is string => id !== null);
    let appearances: SubcategoryAppearance[] = [];
    if (subcategoryIds.length > 0) {
      const appearancesResult = await this.findSubcategoryAppearances.execute({ userId, subcategoryIds });
      if (appearancesResult.isFailure) return Result.fail(appearancesResult.errors);
      appearances = appearancesResult.instance;
    }

    return Result.ok(SummarizeCategorySpending.toDTOs(centsBySubcategory, appearances));
  }

  /**
   * One slice per subcategory with appearance, plus the unclassified bucket with
   * the rows without subcategory and the subcategories without appearance.
   * Cents are converted back to reais only here, after every sum.
   */
  private static toDTOs(
    centsBySubcategory: ReadonlyMap<string | null, number>,
    appearances: readonly SubcategoryAppearance[],
  ): CategorySpendingSliceDTO[] {
    const appearanceById = new Map(appearances.map((appearance) => [appearance.subcategoryId, appearance]));

    const slices: SliceInCents[] = [];
    let unclassifiedCents = 0;
    for (const [subcategoryId, cents] of centsBySubcategory) {
      const appearance = subcategoryId === null ? undefined : appearanceById.get(subcategoryId);
      if (appearance) {
        slices.push({ appearance, cents });
      } else {
        unclassifiedCents += cents;
      }
    }
    if (unclassifiedCents !== 0) {
      slices.push({ appearance: null, cents: unclassifiedCents });
    }

    return slices.sort(SummarizeCategorySpending.compareSlices).map(({ appearance, cents }) => ({
      categoryId: appearance?.categoryId ?? null,
      categoryName: appearance?.categoryName ?? null,
      categoryColor: appearance?.categoryColor ?? null,
      categoryIcon: appearance?.categoryIcon ?? null,
      subcategoryId: appearance?.subcategoryId ?? null,
      subcategoryName: appearance?.subcategoryName ?? null,
      subcategoryColor: appearance?.subcategoryColor ?? null,
      subcategoryIcon: appearance?.subcategoryIcon ?? null,
      total: cents / 100,
    }));
  }

  /**
   * Total descending (compared in cents, so no float tie is missed), then the
   * category name and the subcategory name in `pt-BR` collation, with the
   * unclassified bucket last on a tie.
   */
  private static compareSlices(a: SliceInCents, b: SliceInCents): number {
    if (a.cents !== b.cents) return b.cents - a.cents;
    if (a.appearance === null) return b.appearance === null ? 0 : 1;
    if (b.appearance === null) return -1;

    return (
      a.appearance.categoryName.localeCompare(b.appearance.categoryName, 'pt-BR') ||
      a.appearance.subcategoryName.localeCompare(b.appearance.subcategoryName, 'pt-BR')
    );
  }

  private static occurrenceKey(seriesId: string, occurrenceIndex: number): string {
    return `${seriesId}:${occurrenceIndex}`;
  }
}
