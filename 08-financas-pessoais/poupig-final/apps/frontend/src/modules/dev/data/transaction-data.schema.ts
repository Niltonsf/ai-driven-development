import { DEV_DATA_LIMITS } from '@poupig/dev';
import { Text } from '@poupig/shared';
import { v } from '@/shared/components/form/validator';
import { getMessage } from '@/shared/i18n';

/**
 * Checkboxes of the one-off transaction generator. They live in component state,
 * outside the schema (like `isActive` in the registration forms): "unchecked" is
 * not data to send, and keeping the quantity field untouched restores the typed
 * value when the item is checked again.
 */
export type TransactionDataSelection = {
  accounts: boolean;
  creditCards: boolean;
  transactions: boolean;
};

export type TransactionDataItem = keyof TransactionDataSelection;

/** Ceiling of each checklist item, read from the domain package (never repeated here). */
export const TRANSACTION_DATA_ITEM_LIMITS: Record<TransactionDataItem, number> = {
  accounts: DEV_DATA_LIMITS.maxAccounts,
  creditCards: DEV_DATA_LIMITS.maxCreditCards,
  transactions: DEV_DATA_LIMITS.maxTransactions,
};

/**
 * Error key of the "nothing checked" refinement. It is not `root` because
 * react-hook-form discards `root` errors returned by a resolver and would submit.
 */
export const TRANSACTION_DATA_SELECTION_FIELD = 'selection' as const;

const INTEGER_PATTERN = /^-?\d+$/;

/** Whole number typed in a text/number input, or `null` when it is not one. */
export function parseInteger(value: string | undefined): number | null {
  const trimmed = value?.trim() ?? '';
  if (!INTEGER_PATTERN.test(trimmed)) return null;

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

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
export function createTransactionDataSchema(selection: TransactionDataSelection) {
  const quantityMessage = getMessage('INVALID_DEV_DATA_QUANTITY');

  return v
    .defineObject({
      accounts: { vo: Text, optional: true },
      creditCards: { vo: Text, optional: true },
      transactions: { vo: Text, optional: true },
      months: Text,
      seed: { vo: Text, optional: true },
    })
    .refine(() => selection.accounts || selection.creditCards || selection.transactions, {
      field: TRANSACTION_DATA_SELECTION_FIELD,
      message: getMessage('INVALID_DEV_DATA_REQUEST'),
    })
    .refine((data) => !selection.accounts || isIntegerUpTo(data.accounts, TRANSACTION_DATA_ITEM_LIMITS.accounts), {
      field: 'accounts',
      message: quantityMessage,
    })
    .refine(
      (data) => !selection.creditCards || isIntegerUpTo(data.creditCards, TRANSACTION_DATA_ITEM_LIMITS.creditCards),
      { field: 'creditCards', message: quantityMessage },
    )
    .refine(
      (data) => !selection.transactions || isIntegerUpTo(data.transactions, TRANSACTION_DATA_ITEM_LIMITS.transactions),
      { field: 'transactions', message: quantityMessage },
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
export type TransactionDataFormData = v.infer<ReturnType<typeof createTransactionDataSchema>> & {
  [TRANSACTION_DATA_SELECTION_FIELD]?: never;
};
