import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CategorySpendingSliceDTO } from '@poupig/category';
import { mixHexColors, normalizeHexColor } from '@/shared/util/color.util';
import type { SelectedMonth } from '@/shared/util/month.util';

/** How the outflows of the month are split: one slice per category or one per subcategory. */
export type CategorySpendingGrain = 'category' | 'subcategory';

/** Order of the pills of the grain selector: nobody repeats the list. */
export const CATEGORY_SPENDING_GRAINS: readonly CategorySpendingGrain[] = ['category', 'subcategory'];

export function isCategorySpendingGrain(value: unknown): value is CategorySpendingGrain {
  return value === 'category' || value === 'subcategory';
}

export const CATEGORY_SPENDING_GRAIN_LABELS: Record<CategorySpendingGrain, string> = {
  category: 'Categorias',
  subcategory: 'Subcategorias',
};

/** Grain used when nothing valid is stored in the browser. */
export const DEFAULT_CATEGORY_SPENDING_GRAIN: CategorySpendingGrain = 'category';

/**
 * Only the grain is kept in the browser. Hidden slices are not: opening the report
 * another day with spending hidden without noticing is a defect in a money report.
 */
export type CategorySpendingPreferences = {
  version: 1;
  grain: CategorySpendingGrain;
};

export const CATEGORY_SPENDING_PREFERENCES_STORAGE_KEY = 'poupig:category-spending-report';

/**
 * Color of the slices without a color of their own (category without color, and the
 * unclassified bucket). A slate that reads on the dark surface without looking like
 * one more category identity.
 */
export const NEUTRAL_SLICE_COLOR = '#64748B';

/** Id of the slice of the outflows without subcategory; no category or subcategory id has this shape. */
export const UNCLASSIFIED_SLICE_ID = 'unclassified';

/**
 * Same text of the statement and of the dashboard donut. Defined here because the
 * `category` screen module never imports from the `transaction` screen module.
 */
export const UNCLASSIFIED_SLICE_LABEL = 'Sem classificação';

/** One slice of the donut and one item of the toggle list. */
export type SpendingSlice = {
  /** Category id, subcategory id or `UNCLASSIFIED_SLICE_ID`, depending on the grain. */
  id: string;
  label: string;
  /** Name of the owning category in the subcategory grain; `null` in the category grain and in the unclassified slice. */
  parentLabel: string | null;
  icon: string | null;
  /** Effective color, already resolved (own → category → neutral, with tones). */
  color: string;
  /** In reais, summed in integer cents. */
  total: number;
};

/** A slice with its toggle state, as the screen consumes it. */
export type SpendingSliceItem = SpendingSlice & {
  isHidden: boolean;
};

/** Consecutive slices of the same owning category, in the order of the slices. */
export type SpendingSliceGroup<TSlice extends SpendingSlice> = {
  parentLabel: string | null;
  slices: TSlice[];
};

export type SpendingTotals = {
  /** Whole month, regardless of hidden slices. */
  total: number;
  /** Only the slices turned on. */
  visibleTotal: number;
  hiddenCount: number;
  /** Largest slice turned on, or `null` when none is on. */
  largest: SpendingSlice | null;
  /** The unclassified slice, or `null` when every outflow has a subcategory. */
  unclassified: SpendingSlice | null;
};

type ClassifiedRow = {
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  row: CategorySpendingSliceDTO;
};

type CentsSlice = Omit<SpendingSlice, 'total'> & { cents: number };

/** Integer cents: summing reais in floating point would show `0.1 + 0.2` on the screen. */
function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

/** A blank stored color is treated as no color, so it falls back instead of painting nothing. */
function storedColor(color: string | null): string | null {
  return color && color.trim() ? color : null;
}

/**
 * A row is classified only with the whole identity filled. Anything else goes to
 * the unclassified bucket, so the slices always add up to the month total.
 */
function classify(row: CategorySpendingSliceDTO): ClassifiedRow | null {
  const { categoryId, categoryName, subcategoryId, subcategoryName } = row;
  if (categoryId === null || categoryName === null || subcategoryId === null || subcategoryName === null) return null;

  return { categoryId, categoryName, subcategoryId, subcategoryName, row };
}

function compareLabels(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR');
}

/** Total descending, then label; the unclassified slice goes last on a tie, as in the API response. */
function compareByTotal(
  a: { id: string; label: string; cents: number },
  b: { id: string; label: string; cents: number },
) {
  if (a.cents !== b.cents) return b.cents - a.cents;
  if (a.id === UNCLASSIFIED_SLICE_ID || b.id === UNCLASSIFIED_SLICE_ID) {
    return a.id === UNCLASSIFIED_SLICE_ID ? 1 : -1;
  }
  return compareLabels(a.label, b.label);
}

function unclassifiedSlice(cents: number): CentsSlice {
  return {
    id: UNCLASSIFIED_SLICE_ID,
    label: UNCLASSIFIED_SLICE_LABEL,
    parentLabel: null,
    icon: null,
    color: NEUTRAL_SLICE_COLOR,
    cents,
  };
}

function toSlice({ cents, ...slice }: CentsSlice): SpendingSlice {
  return { ...slice, total: fromCents(cents) };
}

function toCategorySlices(rows: CategorySpendingSliceDTO[]): SpendingSlice[] {
  const byCategory = new Map<string, CentsSlice>();
  let unclassifiedCents = 0;

  for (const row of rows) {
    const classified = classify(row);
    if (!classified) {
      unclassifiedCents += toCents(row.total);
      continue;
    }

    const current = byCategory.get(classified.categoryId);
    if (current) {
      current.cents += toCents(row.total);
      continue;
    }

    byCategory.set(classified.categoryId, {
      id: classified.categoryId,
      label: classified.categoryName,
      parentLabel: null,
      icon: row.categoryIcon,
      color: storedColor(row.categoryColor) ?? NEUTRAL_SLICE_COLOR,
      cents: toCents(row.total),
    });
  }

  const slices = [...byCategory.values()];
  if (unclassifiedCents > 0) slices.push(unclassifiedSlice(unclassifiedCents));

  return slices.sort(compareByTotal).map(toSlice);
}

type SubcategoryGroup = {
  id: string;
  label: string;
  cents: number;
  items: Map<string, { classified: ClassifiedRow; cents: number }>;
};

/**
 * Tone of the `n`-th repetition (0-based) of the same base color inside one
 * category group. The first keeps the base; the next ones alternate lighter and
 * darker in growing steps, capped at `0.54` so a tone never reaches pure white or
 * black. Deterministic: the same response always paints the same slice the same way.
 */
function toneOf(baseColor: string, repetition: number): string {
  if (repetition === 0) return baseColor;

  const mix = repetition % 2 === 1 ? '#ffffff' : '#000000';
  const weight = Math.min(0.18 * Math.ceil(repetition / 2), 0.54);
  return mixHexColors(baseColor, mix, weight);
}

function toSubcategorySlices(rows: CategorySpendingSliceDTO[]): SpendingSlice[] {
  const groups = new Map<string, SubcategoryGroup>();
  let unclassifiedCents = 0;

  for (const row of rows) {
    const classified = classify(row);
    if (!classified) {
      unclassifiedCents += toCents(row.total);
      continue;
    }

    const cents = toCents(row.total);
    let group = groups.get(classified.categoryId);
    if (!group) {
      group = { id: classified.categoryId, label: classified.categoryName, cents: 0, items: new Map() };
      groups.set(classified.categoryId, group);
    }
    group.cents += cents;

    const item = group.items.get(classified.subcategoryId);
    if (item) item.cents += cents;
    else group.items.set(classified.subcategoryId, { classified, cents });
  }

  // The unclassified bucket is a group of its own with a single slice, ordered by its total.
  const orderedGroups: Array<{ id: string; label: string; cents: number; slices: CentsSlice[] }> = [];

  for (const group of groups.values()) {
    const items = [...group.items.values()]
      .map(({ classified, cents }) => ({
        id: classified.subcategoryId,
        label: classified.subcategoryName,
        cents,
        classified,
      }))
      .sort(compareByTotal);

    const repetitions = new Map<string, number>();
    const slices = items.map(({ id, label, cents, classified: { row } }): CentsSlice => {
      const baseColor = storedColor(row.subcategoryColor) ?? storedColor(row.categoryColor) ?? NEUTRAL_SLICE_COLOR;
      const colorKey = normalizeHexColor(baseColor, baseColor.trim().toLowerCase());
      const repetition = repetitions.get(colorKey) ?? 0;
      repetitions.set(colorKey, repetition + 1);

      return {
        id,
        label,
        parentLabel: group.label,
        icon: row.subcategoryIcon ?? row.categoryIcon,
        color: toneOf(baseColor, repetition),
        cents,
      };
    });

    orderedGroups.push({ id: group.id, label: group.label, cents: group.cents, slices });
  }

  if (unclassifiedCents > 0) {
    orderedGroups.push({
      id: UNCLASSIFIED_SLICE_ID,
      label: UNCLASSIFIED_SLICE_LABEL,
      cents: unclassifiedCents,
      slices: [unclassifiedSlice(unclassifiedCents)],
    });
  }

  return orderedGroups.sort(compareByTotal).flatMap((group) => group.slices.map(toSlice));
}

/**
 * Slices of the report for the grain, from the rows of the API (fine grain:
 * subcategory). In the category grain the subcategories of each category are summed
 * in one slice; in the subcategory grain the slices are grouped by the owning
 * category (groups by the category total, then subcategories by their own total),
 * so the donut and the grouped list share the same order and the tones of a
 * category stay side by side. Outflows without subcategory form a single
 * `Sem classificação` slice in both grains.
 */
export function toSpendingSlices(rows: CategorySpendingSliceDTO[], grain: CategorySpendingGrain): SpendingSlice[] {
  return grain === 'category' ? toCategorySlices(rows) : toSubcategorySlices(rows);
}

/** Totals of the screen; components only format them, they never sum. */
export function summarizeSpending(slices: readonly SpendingSlice[], hiddenIds: ReadonlySet<string>): SpendingTotals {
  let totalCents = 0;
  let visibleCents = 0;
  let hiddenCount = 0;
  let largest: SpendingSlice | null = null;
  let unclassified: SpendingSlice | null = null;

  for (const slice of slices) {
    const cents = toCents(slice.total);
    totalCents += cents;

    if (slice.id === UNCLASSIFIED_SLICE_ID) unclassified = slice;

    if (hiddenIds.has(slice.id)) {
      hiddenCount += 1;
      continue;
    }

    visibleCents += cents;
    // Strictly greater: on a tie the first slice in the screen order wins.
    if (!largest || cents > toCents(largest.total)) largest = slice;
  }

  return {
    total: fromCents(totalCents),
    visibleTotal: fromCents(visibleCents),
    hiddenCount,
    largest,
    unclassified,
  };
}

/**
 * `value / whole` as a fraction from 0 to 1, or `0` when there is no whole: a
 * division by zero in a report becomes `NaN` on the screen.
 */
export function shareOf(value: number, whole: number): number {
  return whole > 0 ? Math.min(value / whole, 1) : 0;
}

/** A fraction from `shareOf` as a whole percentage, e.g. `0.6` → `60%`. */
export function formatSpendingShare(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Consecutive slices with the same owning category, for the headers of the list in
 * the subcategory grain. It relies on the order of `toSpendingSlices`, which keeps
 * the slices of a category together.
 */
export function groupSpendingSlices<TSlice extends SpendingSlice>(
  slices: readonly TSlice[],
): SpendingSliceGroup<TSlice>[] {
  const groups: SpendingSliceGroup<TSlice>[] = [];

  for (const slice of slices) {
    const last = groups[groups.length - 1];
    if (last && last.parentLabel === slice.parentLabel) last.slices.push(slice);
    else groups.push({ parentLabel: slice.parentLabel, slices: [slice] });
  }

  return groups;
}

/**
 * Month in a sentence, e.g. `setembro de 2026`. Same output of the statement
 * formatter of the `transaction` screen module, reproduced here to keep the two
 * screen modules apart.
 */
export function formatMonthSentence({ year, month }: SelectedMonth): string {
  return format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
}
