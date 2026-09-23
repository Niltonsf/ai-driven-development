import { Direction, type CashFlowWindow, type RecurrenceReportLineDTO } from '@poupig/transaction';
import { formatShortMonthLabel, parseMonthKey } from '@/shared/util/month.util';
import { formatRecurrenceFrequency } from './transaction-series.labels';

/** The two groups of the report table, one per direction. */
export type RecurrenceGroupId = 'inflow' | 'outflow';

export const RECURRENCE_GROUP_LABELS: Record<RecurrenceGroupId, string> = {
  inflow: 'Entradas recorrentes',
  outflow: 'Saídas recorrentes',
};

/**
 * Only the window is kept in the browser, under a key of its own so it never
 * mixes with the cash flow report window. The reference month always comes from
 * the header, and the checked recurrences are a simulation of the session: a
 * stored unchecking would silently hide money the next time the page opens.
 */
export type RecurrencePreferences = {
  version: 1;
  months: CashFlowWindow;
};

/** Window used when nothing valid is stored in the browser. */
export const DEFAULT_RECURRENCE_WINDOW: CashFlowWindow = 12;

export const RECURRENCE_PREFERENCES_STORAGE_KEY = 'poupig:recurrence-report';

/** A line of the response as the table shows it. */
export type RecurrenceRow = RecurrenceReportLineDTO & {
  /** `false` when the user hid the recurrence from the chart (legend or table checkbox). */
  isChecked: boolean;
  /**
   * `true` when the recurrence enters every sum: always, unless it is hidden and
   * the report was asked to leave the hidden recurrences out of the totals.
   */
  isCounted: boolean;
  /** E.g. `Mensal` or `A cada 2 meses`. */
  frequencyLabel: string;
  /** Classification, account and end, e.g. `Moradia · Condomínio · Nubank · até dez/2026`. */
  detailLabel: string;
};

export type RecurrenceGroup = {
  id: RecurrenceGroupId;
  label: string;
  /** Lines of the direction, in the order of the response. */
  rows: RecurrenceRow[];
  /** Rows visible in the chart. */
  checkedCount: number;
  /** `true` with every row checked, `false` with none (or no row) and `'indeterminate'` in between. */
  checkState: boolean | 'indeterminate';
  /** Sum of the counted rows in each month of the window, in the order of `monthKeys`. */
  monthTotals: number[];
  /** Sum of the counted rows in the whole window. */
  total: number;
};

/** Totals of the counted recurrences in the window. */
export type RecurrenceTotals = {
  inflow: number;
  outflow: number;
  /** `inflow - outflow` of the window. */
  result: number;
  /** The window sums divided by every month of the window (not only the months with value). */
  inflowMonthlyAverage: number;
  outflowMonthlyAverage: number;
  resultMonthlyAverage: number;
  /** `outflow / inflow` as a fraction (`0.38` is 38%), `null` when there is no checked inflow. */
  commitment: number | null;
};

export type RecurrenceReport = {
  /** Months of the window, `YYYY-MM`, ascending. */
  monthKeys: string[];
  /** Short labels of `monthKeys`, e.g. `set/2026`. */
  monthLabels: string[];
  /** Always both groups, `inflow` first. */
  groups: RecurrenceGroup[];
  /** Counted inflows minus counted outflows of each month. */
  resultByMonth: number[];
  totals: RecurrenceTotals;
  /** Whether the hidden recurrences were left out of the sums, so the screen can say what the totals mean. */
  excludesHidden: boolean;
  /** Hidden recurrences present in the response; ids of other responses are ignored. */
  uncheckedCount: number;
};

const GROUP_OF_DIRECTION: Record<Direction, RecurrenceGroupId> = {
  [Direction.IN]: 'inflow',
  [Direction.OUT]: 'outflow',
};

const GROUP_ORDER: readonly RecurrenceGroupId[] = ['inflow', 'outflow'];

const UNCLASSIFIED_LABEL = 'Sem classificação';

/** Money math in integer cents, so repeated sums do not drift (`0.1 + 0.2`). */
function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

/** The window average in cents, `0` without months. */
function monthlyAverage(cents: number, monthCount: number): number {
  return monthCount === 0 ? 0 : fromCents(Math.round(cents / monthCount));
}

function isPresent(value: string | null): value is string {
  return Boolean(value);
}

function detailLabelOf(line: RecurrenceReportLineDTO): string {
  const classification = [line.categoryName, line.subcategoryName].filter(isPresent).join(' · ');
  const parts = [classification || UNCLASSIFIED_LABEL, line.accountName];

  if (line.endDate) {
    parts.push(`até ${formatShortMonthLabel(parseMonthKey(line.endDate.slice(0, 7)))}`);
  }

  return parts.join(' · ');
}

function checkStateOf(checkedCount: number, rowCount: number): boolean | 'indeterminate' {
  if (rowCount === 0 || checkedCount === 0) return false;
  return checkedCount === rowCount ? true : 'indeterminate';
}

/** A group with its sums still in cents, so the result and the totals are derived without drift. */
function buildGroup(id: RecurrenceGroupId, rows: RecurrenceRow[], monthCount: number) {
  const monthCents = Array.from({ length: monthCount }, () => 0);
  let checkedCount = 0;

  for (const row of rows) {
    if (row.isChecked) checkedCount += 1;
    if (!row.isCounted) continue;
    row.months.forEach((item, index) => {
      if (index < monthCount) monthCents[index] += toCents(item.total);
    });
  }

  const totalCents = monthCents.reduce((sum, cents) => sum + cents, 0);

  const group: RecurrenceGroup = {
    id,
    label: RECURRENCE_GROUP_LABELS[id],
    rows,
    checkedCount,
    checkState: checkStateOf(checkedCount, rows.length),
    monthTotals: monthCents.map(fromCents),
    total: fromCents(totalCents),
  };

  return { group, monthCents, totalCents };
}

/**
 * Everything the report screen shows. `uncheckedIds` are the recurrences hidden
 * from the chart; hiding only cleans the chart, and the sums (cards, group
 * totals, result and the summary lines of the chart) keep every recurrence unless
 * `excludeHiddenFromTotals` is on — a single switch for the whole report, never a
 * choice per recurrence. The months come from the first line (every line has the
 * same ones); an empty list returns no month, both groups empty and zeroed
 * totals. `uncheckedIds` may carry ids of previous responses: they are ignored.
 */
export function buildRecurrenceReport(
  lines: readonly RecurrenceReportLineDTO[],
  uncheckedIds: ReadonlySet<string>,
  excludeHiddenFromTotals: boolean,
): RecurrenceReport {
  const monthKeys = lines[0]?.months.map((item) => item.month) ?? [];
  const monthLabels = monthKeys.map((key) => formatShortMonthLabel(parseMonthKey(key)));
  const monthCount = monthKeys.length;

  const rowsByGroup: Record<RecurrenceGroupId, RecurrenceRow[]> = { inflow: [], outflow: [] };
  let uncheckedCount = 0;

  for (const line of lines) {
    const isChecked = !uncheckedIds.has(line.seriesId);
    if (!isChecked) uncheckedCount += 1;

    rowsByGroup[GROUP_OF_DIRECTION[line.direction]].push({
      ...line,
      isChecked,
      isCounted: isChecked || !excludeHiddenFromTotals,
      frequencyLabel: formatRecurrenceFrequency(line.recurrence),
      detailLabel: detailLabelOf(line),
    });
  }

  const inflow = buildGroup('inflow', rowsByGroup.inflow, monthCount);
  const outflow = buildGroup('outflow', rowsByGroup.outflow, monthCount);
  const built: Record<RecurrenceGroupId, ReturnType<typeof buildGroup>> = { inflow, outflow };

  const resultCents = inflow.totalCents - outflow.totalCents;

  return {
    monthKeys,
    monthLabels,
    groups: GROUP_ORDER.map((id) => built[id].group),
    resultByMonth: monthKeys.map((_, index) => fromCents(inflow.monthCents[index] - outflow.monthCents[index])),
    totals: {
      inflow: fromCents(inflow.totalCents),
      outflow: fromCents(outflow.totalCents),
      result: fromCents(resultCents),
      inflowMonthlyAverage: monthlyAverage(inflow.totalCents, monthCount),
      outflowMonthlyAverage: monthlyAverage(outflow.totalCents, monthCount),
      resultMonthlyAverage: monthlyAverage(resultCents, monthCount),
      commitment: inflow.totalCents === 0 ? null : outflow.totalCents / inflow.totalCents,
    },
    excludesHidden: excludeHiddenFromTotals,
    uncheckedCount,
  };
}

/** Percentage without decimals (`38%`), or a dash when there is no counted inflow. */
export function formatCommitment(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}
