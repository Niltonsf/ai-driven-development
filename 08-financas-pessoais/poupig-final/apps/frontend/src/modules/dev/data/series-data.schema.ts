import { DEV_DATA_LIMITS } from '@poupig/dev';
import { Text } from '@poupig/shared';
import { v } from '@/shared/components/form/validator';
import { getMessage } from '@/shared/i18n';
import { parseInteger } from './transaction-data.schema';

/**
 * Checkboxes of the series generator. As in the one-off transaction generator,
 * they live in component state, outside the schema: "unchecked" is not data to
 * send, and the untouched quantity field restores the typed value when checked again.
 */
export type SeriesDataSelection = {
  recurrences: boolean;
  installmentPlans: boolean;
};

export type SeriesDataItem = keyof SeriesDataSelection;

/** Ceiling of each checklist item, read from the domain package (never repeated here). */
export const SERIES_DATA_ITEM_LIMITS: Record<SeriesDataItem, number> = {
  recurrences: DEV_DATA_LIMITS.maxRecurrences,
  installmentPlans: DEV_DATA_LIMITS.maxInstallmentPlans,
};

/**
 * Error key of the "nothing checked" refinement. It is not `root` because
 * react-hook-form discards `root` errors returned by a resolver and would submit.
 */
export const SERIES_DATA_SELECTION_FIELD = 'selection' as const;

function isIntegerUpTo(value: string | undefined, max: number): boolean {
  const parsed = parseInteger(value);
  return parsed !== null && parsed >= 1 && parsed <= max;
}

/**
 * Quantities, period and seed are kept as input strings (`Text`) and checked by
 * refinements, because their rules depend on the checkboxes:
 * - a quantity is validated (whole, `1..limit`) only when its item is checked;
 * - `months` is always required (`1..maxMonths`);
 * - `seed` is empty or a whole number;
 * - at least one item must be checked.
 *
 * The validator shows refinement messages as they are, so they are translated here.
 */
export function createSeriesDataSchema(selection: SeriesDataSelection) {
  const quantityMessage = getMessage('INVALID_DEV_DATA_QUANTITY');

  return v
    .defineObject({
      recurrences: { vo: Text, optional: true },
      installmentPlans: { vo: Text, optional: true },
      months: Text,
      seed: { vo: Text, optional: true },
    })
    .refine(() => selection.recurrences || selection.installmentPlans, {
      field: SERIES_DATA_SELECTION_FIELD,
      message: getMessage('INVALID_DEV_DATA_REQUEST'),
    })
    .refine((data) => !selection.recurrences || isIntegerUpTo(data.recurrences, SERIES_DATA_ITEM_LIMITS.recurrences), {
      field: 'recurrences',
      message: quantityMessage,
    })
    .refine(
      (data) =>
        !selection.installmentPlans || isIntegerUpTo(data.installmentPlans, SERIES_DATA_ITEM_LIMITS.installmentPlans),
      { field: 'installmentPlans', message: quantityMessage },
    )
    .refine((data) => isIntegerUpTo(data.months, DEV_DATA_LIMITS.maxMonths), {
      field: 'months',
      message: getMessage('INVALID_DEV_DATA_PERIOD'),
    })
    .refine((data) => !data.seed?.trim() || parseInteger(data.seed) !== null, {
      field: 'seed',
      message: getMessage('INVALID_DEV_DATA_SEED'),
    });
}

/** `selection` is never a value: it only types the error key of the "nothing checked" refinement. */
export type SeriesDataFormData = v.infer<ReturnType<typeof createSeriesDataSchema>> & {
  [SERIES_DATA_SELECTION_FIELD]?: never;
};
