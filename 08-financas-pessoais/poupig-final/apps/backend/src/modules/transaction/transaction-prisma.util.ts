/**
 * Conversions and selections shared by every movement adapter of the module
 * (transactions and transaction series), so the time zone rule and the
 * reference names have a single implementation.
 */

/** `@db.Date` columns are written and read in UTC so the day never shifts with the server time zone. */
export function toDbDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function fromDbDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * Selection of the reference names resolved in the query itself. Declared
 * `as const` so each `select` that spreads it keeps inferring its own payload
 * type through `satisfies Prisma.<Model>Select`.
 */
export const referenceNamesSelect = {
  account: { select: { name: true } },
  creditCard: { select: { name: true } },
  subcategory: { select: { name: true, category: { select: { name: true } } } },
} as const;

/** Shape produced by `referenceNamesSelect`, matched by every row that spreads it. */
interface ReferenceNamesRow {
  account: { name: string };
  creditCard: { name: string } | null;
  subcategory: { name: string; category: { name: string } } | null;
}

/** The four reference names of a row, with every absent link as `null`. */
export function toReferenceNames(row: ReferenceNamesRow) {
  return {
    accountName: row.account.name,
    creditCardName: row.creditCard?.name ?? null,
    subcategoryName: row.subcategory?.name ?? null,
    categoryName: row.subcategory?.category.name ?? null,
  };
}
