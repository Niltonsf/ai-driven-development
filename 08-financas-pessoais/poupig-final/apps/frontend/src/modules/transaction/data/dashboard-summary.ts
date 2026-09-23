import { Direction, STATEMENT_MAX_ENTRIES, TransactionStatus, type StatementEntryDTO } from '@poupig/transaction';
import { UNCLASSIFIED_GROUP_LABEL } from './group-statement-entries';

/** Maximum entries listed in each pending group (`Atrasadas`/`Próximas`); the rest becomes `e mais N`. */
export const DASHBOARD_PENDING_LIMIT = 5;

/** Named slices of an outflow breakdown chart; everything past it folds into `Outras`. */
export const DASHBOARD_BREAKDOWN_LIMIT = 5;

/** Label of the slice that folds every group past the breakdown limit. */
export const OTHERS_SLICE_LABEL = 'Outras';

/**
 * Totals of a month, always without `CANCELED` entries. The expected totals sum
 * `PENDING` + `SETTLED`; the settled totals sum only `SETTLED`.
 */
export type MonthSummary = {
  inflow: number;
  outflow: number;
  expectedResult: number;
  settledInflow: number;
  settledOutflow: number;
  settledResult: number;
  /** Entries with `SETTLED` status. */
  settledCount: number;
  /** Every entry that is not `CANCELED`. */
  activeCount: number;
};

/** First pending entries of a group, already sorted and cut, plus how many were left out. */
export type PendingGroup = {
  items: StatementEntryDTO[];
  remaining: number;
};

/** Dimension an outflow breakdown groups by. */
export type OutflowBreakdownDimension = 'category' | 'account';

export type OutflowSlice = {
  /** Stable identity of the slice inside the breakdown (the label, or `__others__`). */
  key: string;
  label: string;
  total: number;
  /** Fraction (0–1) of the month outflow that is not canceled. */
  share: number;
  /** `true` only for the slice that folds the groups past the limit. */
  isOthers: boolean;
};

export type OutflowBreakdown = {
  slices: OutflowSlice[];
  /** Month outflow that is not canceled, the whole of every `share`. */
  totalOutflow: number;
};

/**
 * Local date of the browser as `YYYY-MM-DD`, built from year/month/day. Never
 * `toISOString()` on a local `Date`: it converts to UTC and, near midnight, the
 * day shifts. Same algorithm as the private helper of the transaction forms.
 */
export function todayDateOnly(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** One pass over the month: canceled entries are left out of every total and count. */
export function summarizeMonth(entries: StatementEntryDTO[]): MonthSummary {
  let inflow = 0;
  let outflow = 0;
  let settledInflow = 0;
  let settledOutflow = 0;
  let settledCount = 0;
  let activeCount = 0;

  for (const entry of entries) {
    if (entry.status === TransactionStatus.CANCELED) continue;

    const isSettled = entry.status === TransactionStatus.SETTLED;
    activeCount += 1;
    if (isSettled) settledCount += 1;

    if (entry.direction === Direction.IN) {
      inflow += entry.value;
      if (isSettled) settledInflow += entry.value;
    } else {
      outflow += entry.value;
      if (isSettled) settledOutflow += entry.value;
    }
  }

  return {
    inflow,
    outflow,
    expectedResult: inflow - outflow,
    settledInflow,
    settledOutflow,
    settledResult: settledInflow - settledOutflow,
    settledCount,
    activeCount,
  };
}

/** Most urgent first: expected date ascending, then name (pt-BR). Sorts a copy. */
function toPendingGroup(entries: StatementEntryDTO[]): PendingGroup {
  const sorted = [...entries].sort(
    (left, right) => left.expectedOn.localeCompare(right.expectedOn) || left.name.localeCompare(right.name, 'pt-BR'),
  );

  return {
    items: sorted.slice(0, DASHBOARD_PENDING_LIMIT),
    remaining: Math.max(sorted.length - DASHBOARD_PENDING_LIMIT, 0),
  };
}

/**
 * Only `PENDING` entries, split by the expected date against `today`
 * (`YYYY-MM-DD`, compared as strings): before today is overdue, today onwards is upcoming.
 */
export function splitPending(
  entries: StatementEntryDTO[],
  today: string,
): { overdue: PendingGroup; upcoming: PendingGroup } {
  const overdue: StatementEntryDTO[] = [];
  const upcoming: StatementEntryDTO[] = [];

  for (const entry of entries) {
    if (entry.status !== TransactionStatus.PENDING) continue;
    if (entry.expectedOn < today) {
      overdue.push(entry);
    } else {
      upcoming.push(entry);
    }
  }

  return { overdue: toPendingGroup(overdue), upcoming: toPendingGroup(upcoming) };
}

/** `part / whole`, or `0` when there is no whole. Always between 0 and 1 for non-negative inputs. */
export function shareOf(part: number, whole: number): number {
  return whole > 0 ? Math.min(part / whole, 1) : 0;
}

function breakdownLabel(entry: StatementEntryDTO, dimension: OutflowBreakdownDimension): string {
  return dimension === 'account' ? entry.accountName : (entry.categoryName ?? UNCLASSIFIED_GROUP_LABEL);
}

/**
 * Outflow that is not canceled, grouped by category (entries without category
 * sum under the `Sem classificação` label of the statement grouping) or by
 * account. Groups come by total descending (then label); the first `limit` are
 * named and the rest fold into a single `Outras` slice, always last, so a chart
 * never has more than `limit + 1` slices.
 */
export function breakdownOutflow(
  entries: StatementEntryDTO[],
  dimension: OutflowBreakdownDimension,
  limit: number,
): OutflowBreakdown {
  const totals = new Map<string, number>();
  let totalOutflow = 0;

  for (const entry of entries) {
    if (entry.direction !== Direction.OUT || entry.status === TransactionStatus.CANCELED) continue;

    const label = breakdownLabel(entry, dimension);
    totals.set(label, (totals.get(label) ?? 0) + entry.value);
    totalOutflow += entry.value;
  }

  const groups = [...totals.entries()].sort(
    ([leftLabel, leftTotal], [rightLabel, rightTotal]) =>
      rightTotal - leftTotal || leftLabel.localeCompare(rightLabel, 'pt-BR'),
  );

  const slices: OutflowSlice[] = groups.slice(0, limit).map(([label, total]) => ({
    key: label,
    label,
    total,
    share: shareOf(total, totalOutflow),
    isOthers: false,
  }));

  const othersTotal = groups.slice(limit).reduce((sum, [, total]) => sum + total, 0);
  if (othersTotal > 0) {
    slices.push({
      key: '__others__',
      label: OTHERS_SLICE_LABEL,
      total: othersTotal,
      share: shareOf(othersTotal, totalOutflow),
      isOthers: true,
    });
  }

  return { slices, totalOutflow };
}

/**
 * The statement is cut at `STATEMENT_MAX_ENTRIES` with no signal in the response,
 * so reaching the cap is treated as "possibly truncated".
 */
export function isStatementTruncated(entries: StatementEntryDTO[]): boolean {
  return entries.length >= STATEMENT_MAX_ENTRIES;
}
