'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { PieBreakdownChart } from '@/shared/components/ui/pie-breakdown-chart';
import { cn } from '@/shared/lib/class-name.util';
import type { CategorySpendingGrain, SpendingSliceItem, SpendingTotals } from '../data/category-spending-slices';
import { CategorySpendingLegendComponent } from './category-spending-legend.component';

/**
 * Surface of the report cards: the same dark gradient and inner highlight of
 * `MetricCard`, so totals and chart read as one set. A copy of the dashboard
 * surface, kept here because the `category` screen module does not import from
 * the `transaction` one.
 */
export const CATEGORY_REPORT_CARD_CLASSES =
  'relative overflow-hidden border border-white/10 bg-linear-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]';

/** Minimum height of the chart card; the loading skeleton of the page uses the same value. */
export const CATEGORY_SPENDING_CHART_MIN_HEIGHT = 'min-h-120';

/** Height of the donut, in pixels. The radii of the shared chart fit in it. */
const CHART_HEIGHT = 320;

const GRAIN_SUBTITLES: Record<CategorySpendingGrain, string> = {
  category: 'Uma fatia por categoria. Clique numa fatia para ocultá-la; a lista mostra de novo.',
  subcategory: 'Uma fatia por subcategoria, agrupadas pela categoria. Clique numa fatia para ocultá-la.',
};

export type CategorySpendingChartProps = {
  grain: CategorySpendingGrain;
  /** Every slice, hidden ones included, in the order of the chart. */
  slices: SpendingSliceItem[];
  /** Only the slices turned on: what the donut draws. */
  visibleSlices: SpendingSliceItem[];
  totals: SpendingTotals;
  highlightedId: string | null;
  onToggleSlice: (id: string) => void;
  onShowAllSlices: () => void;
  onHighlight: (id: string | null) => void;
};

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 px-6 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}

function pluralizeSlices(count: number): string {
  return count === 1 ? '1 fatia oculta' : `${count} fatias ocultas`;
}

/**
 * Card of the donut and of the toggle list. The center of the donut shows the
 * total of the slices turned on, and a line below says the month total when any
 * slice is hidden, so a `100%` is never read as the whole month. Presentation only:
 * every total comes ready.
 */
export function CategorySpendingChartComponent({
  grain,
  slices,
  visibleSlices,
  totals,
  highlightedId,
  onToggleSlice,
  onShowAllSlices,
  onHighlight,
}: CategorySpendingChartProps) {
  const hasHidden = totals.hiddenCount > 0;
  const hasSlices = slices.length > 0;

  return (
    <Card className={cn(CATEGORY_REPORT_CARD_CLASSES, CATEGORY_SPENDING_CHART_MIN_HEIGHT, 'flex flex-col')}>
      <CardHeader className="relative space-y-1">
        <CardTitle className="text-base font-semibold text-zinc-100">Distribuição dos gastos</CardTitle>
        <p className="text-xs text-zinc-400">{GRAIN_SUBTITLES[grain]}</p>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col">
        <div className={cn('grid flex-1 items-center gap-6', hasSlices && 'lg:grid-cols-[minmax(0,1fr)_20rem]')}>
          <div className="space-y-3">
            <PieBreakdownChart
              data={visibleSlices.map((slice) => ({
                id: slice.id,
                label: slice.label,
                value: slice.total,
                color: slice.color,
              }))}
              height={CHART_HEIGHT}
              showLegend={false}
              valueFormatter={formatCurrency}
              onSliceClick={onToggleSlice}
              onSliceHover={onHighlight}
              highlightedId={highlightedId}
              centerContent={
                <div className="flex flex-col items-center text-center">
                  <span className="text-base font-bold tabular-nums text-zinc-100">
                    {formatCurrency(totals.visibleTotal)}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    {hasHidden ? 'Total visível' : 'Total do mês'}
                  </span>
                </div>
              }
              emptyState={
                <EmptyChart
                  text={
                    hasSlices
                      ? 'Todas as fatias estão ocultas. Use a lista ao lado para mostrá-las de novo.'
                      : 'Nenhuma saída neste mês.'
                  }
                />
              }
            />

            <p aria-live="polite" className="min-h-4 text-center text-xs text-zinc-400">
              {hasHidden
                ? `Total do mês: ${formatCurrency(totals.total)} · ${pluralizeSlices(totals.hiddenCount)}`
                : null}
            </p>
          </div>

          {hasSlices ? (
            <CategorySpendingLegendComponent
              grain={grain}
              slices={slices}
              visibleTotal={totals.visibleTotal}
              hiddenCount={totals.hiddenCount}
              highlightedId={highlightedId}
              onToggle={onToggleSlice}
              onShowAll={onShowAllSlices}
              onHighlight={onHighlight}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
