'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { useSelectedMonth } from '@/shared/hooks/selected-month.hook';
import { cn } from '@/shared/lib/class-name.util';
import { CashFlowBalanceChartComponent } from '../components/cash-flow-balance-chart.component';
import { CashFlowComparisonChartComponent } from '../components/cash-flow-comparison-chart.component';
import { CashFlowSummaryComponent } from '../components/cash-flow-summary.component';
import { CashFlowWindowSelectorComponent } from '../components/cash-flow-window-selector.component';
import { DASHBOARD_CARD_CLASSES } from '../components/dashboard-card.styles';
import { formatMonthInSentence } from '../data/statement-format';
import { useCashFlowReport } from '../data/use-cash-flow-report';

/** Minimum height shared by the chart cards and their skeletons, so switching month or window does not make the page jump. */
const CHART_PANEL_MIN_HEIGHT = 'min-h-110';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl border border-white/10 bg-white/3', className)} />;
}

/** Placeholders with the grids and approximate heights of the final blocks. */
function CashFlowReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o relatório de entradas e saídas" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonBlock key={index} className="h-36" />
        ))}
      </div>
      <SkeletonBlock className={CHART_PANEL_MIN_HEIGHT} />
      <SkeletonBlock className={CHART_PANEL_MIN_HEIGHT} />
    </div>
  );
}

/**
 * Cash flow report: inflow, outflow and balance of every month of a window that
 * ends at the month selected in the header. Read only, in a single request.
 */
export function CashFlowReportPage() {
  const { selectedMonth } = useSelectedMonth();
  const { months, setMonths, points, totals, hasMovement, isLoading, error, refresh } = useCashFlowReport();

  function renderReportBlocks() {
    if (isLoading) return <CashFlowReportSkeleton />;

    if (error) {
      return (
        <Card role="alert" className={cn(DASHBOARD_CARD_CLASSES, 'flex flex-col items-start gap-4 p-6')}>
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
        <CashFlowSummaryComponent totals={totals} />
        <div className={CHART_PANEL_MIN_HEIGHT}>
          <CashFlowComparisonChartComponent points={points} isEmpty={!hasMovement} />
        </div>
        <div className={CHART_PANEL_MIN_HEIGHT}>
          <CashFlowBalanceChartComponent points={points} isEmpty={!hasMovement} />
        </div>
        <p className="text-xs text-muted-foreground">
          O relatório soma as entradas e saídas pendentes e efetivadas pela data prevista, incluindo as ocorrências
          previstas das séries e sem as canceladas: são os mesmos números do extrato de cada mês. Meses futuros são
          previsão.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageSectionHeader
        badge="Relatórios"
        title="Entradas x Saídas"
        subtitle={`Últimos ${months} meses, até ${formatMonthInSentence(selectedMonth)}`}
        aside={<CashFlowWindowSelectorComponent value={months} onChange={setMonths} />}
      />

      {renderReportBlocks()}
    </div>
  );
}
