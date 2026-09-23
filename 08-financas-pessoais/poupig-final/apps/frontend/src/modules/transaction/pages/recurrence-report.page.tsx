'use client';

import Link from 'next/link';
import { ArrowRight, Repeat, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { useSelectedMonth } from '@/shared/hooks/selected-month.hook';
import { cn } from '@/shared/lib/class-name.util';
import { CashFlowWindowSelectorComponent } from '../components/cash-flow-window-selector.component';
import { DASHBOARD_CARD_CLASSES } from '../components/dashboard-card.styles';
import { RecurrenceChartComponent } from '../components/recurrence-chart.component';
import { RecurrenceSummaryComponent } from '../components/recurrence-summary.component';
import { RecurrenceTableComponent } from '../components/recurrence-table.component';
import { formatMonthInSentence } from '../data/statement-format';
import { useRecurrenceReport } from '../data/use-recurrence-report';

/** Minimum height shared by the chart card and its skeleton, so switching month or window does not make the page jump. */
const CHART_PANEL_MIN_HEIGHT = 'min-h-110';

/** Approximate height of a table with a few recurrences, used by the skeleton. */
const TABLE_SKELETON_HEIGHT = 'h-96';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl border border-white/10 bg-white/3', className)} />;
}

/** Placeholders with the grids and approximate heights of the final blocks. */
function RecurrenceReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o relatório de recorrências" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonBlock key={index} className="h-36" />
        ))}
      </div>
      <SkeletonBlock className={CHART_PANEL_MIN_HEIGHT} />
      <SkeletonBlock className={TABLE_SKELETON_HEIGHT} />
    </div>
  );
}

/**
 * Recurrence report: the month by month evolution of every recurrence of a
 * window that ends at the month selected in the header, where checking and
 * unchecking recalculates everything without a new request. Read only.
 */
export function RecurrenceReportPage() {
  const { selectedMonth } = useSelectedMonth();
  const {
    months,
    setMonths,
    report,
    chart,
    hasRecurrences,
    toggleRecurrence,
    setGroupChecked,
    checkAll,
    toggleChartLine,
    toggleChartSection,
    showAllChartLines,
    highlightedLineId,
    setHighlightedLineId,
    excludeHiddenFromTotals,
    setExcludeHiddenFromTotals,
    isLoading,
    error,
    refresh,
  } = useRecurrenceReport();

  function renderReportBlocks() {
    if (isLoading) return <RecurrenceReportSkeleton />;

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

    if (!hasRecurrences) {
      return (
        <Card className={cn(DASHBOARD_CARD_CLASSES, 'flex flex-col items-start gap-4 p-6')}>
          <span className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 [&_svg]:size-5">
            <Repeat />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Nenhuma recorrência cadastrada no período.</p>
            <p className="text-sm text-zinc-400">
              As recorrências, como salário, aluguel e assinaturas, são criadas no Extrato Mensal.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/transactions">
              Ir para o Extrato Mensal
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <RecurrenceSummaryComponent totals={report.totals} />
        <div className={CHART_PANEL_MIN_HEIGHT}>
          <RecurrenceChartComponent
            chart={chart}
            highlightedLineId={highlightedLineId}
            onToggleLine={toggleChartLine}
            onToggleSection={toggleChartSection}
            onShowAllLines={showAllChartLines}
            onHighlightLine={setHighlightedLineId}
            excludeHiddenFromTotals={excludeHiddenFromTotals}
            onExcludeHiddenFromTotalsChange={setExcludeHiddenFromTotals}
          />
        </div>
        <RecurrenceTableComponent
          monthLabels={report.monthLabels}
          groups={report.groups}
          resultByMonth={report.resultByMonth}
          result={report.totals.result}
          uncheckedCount={report.uncheckedCount}
          excludesHidden={report.excludesHidden}
          onToggleRecurrence={toggleRecurrence}
          onSetGroupChecked={setGroupChecked}
          onCheckAll={checkAll}
        />
        <p className="text-xs text-muted-foreground">
          O relatório soma as ocorrências pendentes e efetivadas das recorrências pela data prevista, incluindo as que
          ainda não foram abertas (com o valor atual da série) e sem as canceladas. Parcelamentos e transações avulsas
          não entram. Esconder uma recorrência só a tira do gráfico; os totais continuam considerando todas, a não ser
          com a opção de descontar as ocultas ligada.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageSectionHeader
        badge="Relatórios"
        title="Recorrências"
        subtitle={`Últimos ${months} meses, até ${formatMonthInSentence(selectedMonth)}`}
        aside={<CashFlowWindowSelectorComponent value={months} onChange={setMonths} />}
      />

      {renderReportBlocks()}
    </div>
  );
}
