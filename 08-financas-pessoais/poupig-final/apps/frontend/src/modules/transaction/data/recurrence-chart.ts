import { CASH_FLOW_COLORS } from './cash-flow-window';
import type { RecurrenceGroupId, RecurrenceReport } from './recurrence-report';

/**
 * Ids of the three summary lines. The recurrence lines use the series id (a
 * uuid), so these ids never collide with them.
 */
export const RECURRENCE_TOTAL_LINE_IDS = {
  inflow: 'total-inflow',
  outflow: 'total-outflow',
  result: 'total-result',
} as const;

export type RecurrenceTotalLineId = (typeof RECURRENCE_TOTAL_LINE_IDS)[keyof typeof RECURRENCE_TOTAL_LINE_IDS];

const TOTAL_LINE_ID_SET: ReadonlySet<string> = new Set(Object.values(RECURRENCE_TOTAL_LINE_IDS));

export function isRecurrenceTotalLineId(id: string): id is RecurrenceTotalLineId {
  return TOTAL_LINE_ID_SET.has(id);
}

/**
 * Colors of the recurrence lines, by position inside their direction, in the
 * order of the response (by name): the same recurrence keeps its color while the
 * user changes window or month. Inflows on green and blue hues, outflows on warm
 * hues, none equal to the colors of the summary lines.
 */
const INFLOW_LINE_COLORS: readonly string[] = ['#34d399', '#2dd4bf', '#22d3ee', '#a3e635', '#4ade80', '#38bdf8'];
const OUTFLOW_LINE_COLORS: readonly string[] = [
  '#fb7185',
  '#f97316',
  '#fbbf24',
  '#e879f9',
  '#a78bfa',
  '#f472b6',
  '#fca5a5',
  '#fdba74',
];

/** One line of the chart and, at the same time, one item of its legend. */
export type RecurrenceChartLine = {
  /** Series id for a recurrence, one of `RECURRENCE_TOTAL_LINE_IDS` for a summary line. */
  id: string;
  label: string;
  /** Short text under the label, e.g. `entradas − saídas` or `Mensal`. */
  description: string;
  color: string;
  kind: 'total' | 'recurrence';
  /** `false` when the line is off: an unchecked recurrence or a hidden summary line. */
  isOn: boolean;
  /** Window total of the line, shown by the legend. */
  total: number;
  /** Summary lines are thicker. */
  emphasis: boolean;
  /** The result line is dashed, because it is a difference and not a sum. */
  dashed: boolean;
};

export type RecurrenceChartSectionId = 'totals' | RecurrenceGroupId;

/** `on` with every line of the section on, `off` with none, `mixed` in between. */
export type RecurrenceChartSectionState = 'on' | 'off' | 'mixed';

/** A block of the legend: the summary lines, then the inflows, then the outflows. */
export type RecurrenceChartSection = {
  id: RecurrenceChartSectionId;
  label: string;
  lines: RecurrenceChartLine[];
  /** Lines of the section that are on. */
  onCount: number;
  state: RecurrenceChartSectionState;
};

/**
 * One month of the chart in the wide format recharts consumes: one property per
 * line, named by the line id, with the value of that line in the month.
 */
export type RecurrenceChartPoint = { month: string; label: string } & Record<string, number | string>;

export type RecurrenceChart = {
  /** Always the three sections, with the summary lines first. */
  sections: RecurrenceChartSection[];
  /** Only the lines that are on, summary lines first: what the chart draws. */
  visibleLines: RecurrenceChartLine[];
  points: RecurrenceChartPoint[];
  /** Lines that are off: unchecked recurrences plus hidden summary lines. */
  hiddenCount: number;
};

function toSection(id: RecurrenceChartSectionId, label: string, lines: RecurrenceChartLine[]): RecurrenceChartSection {
  const onCount = lines.filter((line) => line.isOn).length;
  const state: RecurrenceChartSectionState = onCount === 0 ? 'off' : onCount === lines.length ? 'on' : 'mixed';

  return { id, label, lines, onCount, state };
}

/**
 * The line chart of the report and its legend, built from the report.
 *
 * - A hidden recurrence has its line off; the legend and the table checkboxes
 *   control the same state. Whether it also leaves the summary lines follows the
 *   single switch of the report (`report.excludesHidden`), like every other sum.
 * - A summary line (`Entradas recorrentes`, `Saídas recorrentes`, `Total geral`)
 *   is only hidden or shown: hiding it never changes a sum.
 * - A recurrence line plots its own monthly totals (always positive); the total
 *   line is counted inflows minus counted outflows and may be negative.
 */
export function buildRecurrenceChart(report: RecurrenceReport, hiddenTotalIds: ReadonlySet<string>): RecurrenceChart {
  const inflowGroup = report.groups.find((group) => group.id === 'inflow');
  const outflowGroup = report.groups.find((group) => group.id === 'outflow');

  const totalLines: RecurrenceChartLine[] = [
    {
      id: RECURRENCE_TOTAL_LINE_IDS.inflow,
      label: 'Entradas recorrentes',
      description: report.excludesHidden ? 'soma das entradas visíveis' : 'soma de todas as entradas',
      color: CASH_FLOW_COLORS.inflow,
      kind: 'total',
      isOn: !hiddenTotalIds.has(RECURRENCE_TOTAL_LINE_IDS.inflow),
      total: inflowGroup?.total ?? 0,
      emphasis: true,
      dashed: false,
    },
    {
      id: RECURRENCE_TOTAL_LINE_IDS.outflow,
      label: 'Saídas recorrentes',
      description: report.excludesHidden ? 'soma das saídas visíveis' : 'soma de todas as saídas',
      color: CASH_FLOW_COLORS.outflow,
      kind: 'total',
      isOn: !hiddenTotalIds.has(RECURRENCE_TOTAL_LINE_IDS.outflow),
      total: outflowGroup?.total ?? 0,
      emphasis: true,
      dashed: false,
    },
    {
      id: RECURRENCE_TOTAL_LINE_IDS.result,
      label: 'Total geral',
      description: 'entradas − saídas',
      color: CASH_FLOW_COLORS.balance,
      kind: 'total',
      isOn: !hiddenTotalIds.has(RECURRENCE_TOTAL_LINE_IDS.result),
      total: report.totals.result,
      emphasis: true,
      dashed: true,
    },
  ];

  const groupSections: RecurrenceChartSection[] = report.groups.map((group) => {
    const palette = group.id === 'inflow' ? INFLOW_LINE_COLORS : OUTFLOW_LINE_COLORS;

    return toSection(
      group.id,
      group.label,
      group.rows.map(
        (row, index): RecurrenceChartLine => ({
          id: row.seriesId,
          label: row.name,
          description: row.frequencyLabel,
          color: palette[index % palette.length],
          kind: 'recurrence',
          isOn: row.isChecked,
          total: row.total,
          emphasis: false,
          dashed: false,
        }),
      ),
    );
  });

  const points: RecurrenceChartPoint[] = report.monthKeys.map((month, index) => {
    const point: RecurrenceChartPoint = { month, label: report.monthLabels[index] };

    point[RECURRENCE_TOTAL_LINE_IDS.inflow] = inflowGroup?.monthTotals[index] ?? 0;
    point[RECURRENCE_TOTAL_LINE_IDS.outflow] = outflowGroup?.monthTotals[index] ?? 0;
    point[RECURRENCE_TOTAL_LINE_IDS.result] = report.resultByMonth[index] ?? 0;

    for (const group of report.groups) {
      for (const row of group.rows) {
        point[row.seriesId] = row.months[index]?.total ?? 0;
      }
    }

    return point;
  });

  const sections: RecurrenceChartSection[] = [toSection('totals', 'Totais', totalLines), ...groupSections];
  const allLines = sections.flatMap((section) => section.lines);
  const visibleLines = allLines.filter((line) => line.isOn);

  return {
    sections,
    visibleLines,
    points,
    hiddenCount: allLines.length - visibleLines.length,
  };
}
