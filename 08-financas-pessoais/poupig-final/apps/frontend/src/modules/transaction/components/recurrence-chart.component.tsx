'use client';

import { ChartLine } from 'lucide-react';
import { useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { MultiLineChart } from '@/shared/components/ui/multi-line-chart';
import { cn } from '@/shared/lib/class-name.util';
import type { RecurrenceChart, RecurrenceChartSectionId } from '../data/recurrence-chart';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';
import { RecurrenceChartLegendComponent } from './recurrence-chart-legend.component';

export type RecurrenceChartProps = {
  chart: RecurrenceChart;
  highlightedLineId: string | null;
  onToggleLine: (lineId: string) => void;
  onToggleSection: (sectionId: RecurrenceChartSectionId) => void;
  onShowAllLines: () => void;
  onHighlightLine: (lineId: string | null) => void;
  /** The single switch of the report: whether the hidden recurrences leave every total. */
  excludeHiddenFromTotals: boolean;
  onExcludeHiddenFromTotalsChange: (exclude: boolean) => void;
};

const CHART_HEIGHT = 360;

/**
 * Line chart of the recurrences: one line per recurrence that is on, plus the
 * recurring inflows, the recurring outflows and the total (inflows minus
 * outflows) of the checked recurrences. The legend at the side turns every line
 * on and off without a new request. Read only.
 */
export function RecurrenceChartComponent({
  chart,
  highlightedLineId,
  onToggleLine,
  onToggleSection,
  onShowAllLines,
  onHighlightLine,
  excludeHiddenFromTotals,
  onExcludeHiddenFromTotalsChange,
}: RecurrenceChartProps) {
  const switchId = useId();

  const series = chart.visibleLines.map((line) => ({
    key: line.id,
    label: line.label,
    color: line.color,
    emphasis: line.emphasis,
    dashed: line.dashed,
  }));

  return (
    <Card className={cn(DASHBOARD_CARD_CLASSES, 'flex h-full flex-col')}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-zinc-100">Evolução das recorrências</CardTitle>
          <p className="text-xs text-zinc-400">
            Clique na legenda para habilitar ou desabilitar uma linha ou um grupo inteiro
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id={switchId}
              checked={excludeHiddenFromTotals}
              onCheckedChange={(checked) => onExcludeHiddenFromTotalsChange(checked === true)}
            />
            <Label htmlFor={switchId} className="cursor-pointer text-xs font-normal text-zinc-300">
              Descontar dos totais as recorrências ocultas
            </Label>
          </div>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 [&_svg]:size-5">
          <ChartLine />
        </span>
      </CardHeader>

      <CardContent className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <MultiLineChart
          data={chart.points}
          xKey="label"
          series={series}
          height={CHART_HEIGHT}
          highlightedKey={highlightedLineId}
          valueFormatter={(value) => formatCurrency(value)}
          emptyState={
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 px-4 text-center text-sm text-zinc-500">
              Habilite ao menos uma linha na legenda para ver a evolução
            </div>
          }
        />
        <RecurrenceChartLegendComponent
          sections={chart.sections}
          hiddenCount={chart.hiddenCount}
          highlightedLineId={highlightedLineId}
          onToggle={onToggleLine}
          onToggleSection={onToggleSection}
          onShowAll={onShowAllLines}
          onHighlight={onHighlightLine}
        />
      </CardContent>
    </Card>
  );
}
