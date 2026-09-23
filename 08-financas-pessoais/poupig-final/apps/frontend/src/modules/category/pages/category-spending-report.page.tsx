'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { cn } from '@/shared/lib/class-name.util';
import { CategoryGrainSelectorComponent } from '../components/category-grain-selector.component';
import {
  CATEGORY_REPORT_CARD_CLASSES,
  CATEGORY_SPENDING_CHART_MIN_HEIGHT,
  CategorySpendingChartComponent,
} from '../components/category-spending-chart.component';
import { CategorySpendingSummaryComponent } from '../components/category-spending-summary.component';
import { useCategorySpendingReport } from '../data/use-category-spending-report';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl border border-white/10 bg-white/3', className)} />;
}

/** Placeholders with the grids and heights of the final blocks, so a new search does not make the page jump. */
function CategorySpendingReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o relatório de gastos por categoria" className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <SkeletonBlock key={index} className="h-32" />
        ))}
      </div>
      <SkeletonBlock className={CATEGORY_SPENDING_CHART_MIN_HEIGHT} />
    </div>
  );
}

/**
 * Category spending report: how the outflows of the month selected in the header
 * are split by category or subcategory. Read only, in a single request per month;
 * switching the grain and hiding slices never reach the server.
 */
export function CategorySpendingReportPage() {
  const {
    grain,
    setGrain,
    slices,
    visibleSlices,
    totals,
    toggleSlice,
    showAllSlices,
    highlightedId,
    setHighlightedId,
    monthSentence,
    isLoading,
    error,
    refresh,
  } = useCategorySpendingReport();

  function renderReportBlocks() {
    if (isLoading) return <CategorySpendingReportSkeleton />;

    if (error) {
      return (
        <Card role="alert" className={cn(CATEGORY_REPORT_CARD_CLASSES, 'flex flex-col items-start gap-4 p-6')}>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Não foi possível carregar o relatório.</p>
            <p className="text-sm text-rose-300">{error}</p>
          </div>
          <Button type="button" variant="outline" onClick={refresh}>
            <RotateCcw className="size-4" />
            Tentar de novo
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <CategorySpendingSummaryComponent totals={totals} />
        <CategorySpendingChartComponent
          grain={grain}
          slices={slices}
          visibleSlices={visibleSlices}
          totals={totals}
          highlightedId={highlightedId}
          onToggleSlice={toggleSlice}
          onShowAllSlices={showAllSlices}
          onHighlight={setHighlightedId}
        />
        <p className="text-xs text-muted-foreground">
          O relatório soma as saídas pendentes e efetivadas do mês pela data prevista, incluindo as ocorrências
          previstas das séries e sem as canceladas. Saídas sem subcategoria aparecem em Sem classificação.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageSectionHeader
        badge="Relatórios"
        title="Gastos por Categoria"
        subtitle={`Distribuição das saídas de ${monthSentence}`}
        aside={<CategoryGrainSelectorComponent value={grain} onChange={setGrain} />}
      />

      {renderReportBlocks()}
    </div>
  );
}
