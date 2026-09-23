'use client';

import { useMemo } from 'react';
import { Landmark, PieChart, RotateCcw } from 'lucide-react';
import { STATEMENT_MAX_ENTRIES } from '@poupig/transaction';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { useSelectedMonth } from '@/shared/hooks/selected-month.hook';
import { cn } from '@/shared/lib/class-name.util';
import { DashboardBreakdownChartComponent } from '../components/dashboard-breakdown-chart.component';
import { DASHBOARD_CARD_CLASSES } from '../components/dashboard-card.styles';
import { DashboardOnboardingComponent } from '../components/dashboard-onboarding.component';
import { DashboardPendingComponent } from '../components/dashboard-pending.component';
import { DashboardShortcutsComponent } from '../components/dashboard-shortcuts.component';
import { DashboardSummaryComponent } from '../components/dashboard-summary.component';
import {
  DASHBOARD_BREAKDOWN_LIMIT,
  breakdownOutflow,
  isStatementTruncated,
  splitPending,
  summarizeMonth,
  todayDateOnly,
} from '../data/dashboard-summary';
import type { ListStatementParams } from '../data/statement-api.client';
import { useDashboardOnboarding } from '../data/use-dashboard-onboarding';
import { useStatement } from '../data/use-statement';

/** Minimum height shared by the chart/list cards and their skeletons, so switching months does not make the page jump. */
const PANEL_MIN_HEIGHT = 'min-h-96';

/**
 * Full-width grid of the month panels: the two donuts side by side from `xl`, and
 * a third column for the pending entries on very wide screens.
 */
const PANELS_GRID = 'grid gap-6 xl:grid-cols-12';
const DONUT_PANEL = 'xl:col-span-6 2xl:col-span-4';
const PENDING_PANEL = 'xl:col-span-12 2xl:col-span-4';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl border border-white/10 bg-white/3', className)} />;
}

/** Placeholders with the grids and approximate heights of the final blocks. */
function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o dashboard do mês" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonBlock key={index} className="h-44" />
        ))}
      </div>
      <div className={PANELS_GRID}>
        <SkeletonBlock className={cn(PANEL_MIN_HEIGHT, DONUT_PANEL)} />
        <SkeletonBlock className={cn(PANEL_MIN_HEIGHT, DONUT_PANEL)} />
        <SkeletonBlock className={cn(PANEL_MIN_HEIGHT, PENDING_PANEL)} />
      </div>
    </div>
  );
}

/**
 * Home of the private area: a read-only view of the month selected in the header.
 * Every number comes from the statement of that month, in a single request.
 */
export function MonthDashboardPage() {
  const { monthStart, monthEnd, monthLabel } = useSelectedMonth();

  // Memoized on purpose: `params` is a dependency of the statement effect, and a new object per render loops.
  const statementParams = useMemo<ListStatementParams>(
    () => ({ from: monthStart, to: monthEnd }),
    [monthStart, monthEnd],
  );

  const { entries, isLoading, error, refresh } = useStatement(statementParams);
  const onboarding = useDashboardOnboarding();

  const { summary, pending, byCategory, byAccount, truncated } = useMemo(() => {
    const today = todayDateOnly();
    return {
      summary: summarizeMonth(entries),
      pending: splitPending(entries, today),
      byCategory: breakdownOutflow(entries, 'category', DASHBOARD_BREAKDOWN_LIMIT),
      byAccount: breakdownOutflow(entries, 'account', DASHBOARD_BREAKDOWN_LIMIT),
      truncated: isStatementTruncated(entries),
    };
  }, [entries]);

  const isStatementReady = !isLoading && !error;
  const showOnboarding = onboarding.status === 'ready' && isStatementReady;

  function renderMonthBlocks() {
    if (isLoading) return <DashboardSkeleton />;

    if (error) {
      return (
        <Card role="alert" className={cn(DASHBOARD_CARD_CLASSES, 'flex flex-col items-start gap-4 p-6')}>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Não foi possível carregar o mês.</p>
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
        <DashboardSummaryComponent summary={summary} />
        <div className={PANELS_GRID}>
          <div className={cn(PANEL_MIN_HEIGHT, DONUT_PANEL)}>
            <DashboardBreakdownChartComponent
              title="Gastos por categoria"
              description="Saídas do mês, pendentes e efetivadas"
              slices={byCategory.slices}
              totalOutflow={byCategory.totalOutflow}
              emptyText="Nenhum gasto neste mês"
              icon={<PieChart />}
            />
          </div>
          <div className={cn(PANEL_MIN_HEIGHT, DONUT_PANEL)}>
            <DashboardBreakdownChartComponent
              title="Saídas por conta"
              description="De onde sai o dinheiro do mês"
              slices={byAccount.slices}
              totalOutflow={byAccount.totalOutflow}
              emptyText="Nenhuma saída neste mês"
              icon={<Landmark />}
            />
          </div>
          <div className={cn(PANEL_MIN_HEIGHT, PENDING_PANEL)}>
            <DashboardPendingComponent overdue={pending.overdue} upcoming={pending.upcoming} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageSectionHeader badge="Dashboard" title={monthLabel} subtitle="Visão geral do mês selecionado" />

      {showOnboarding ? (
        <DashboardOnboardingComponent
          hasAccounts={onboarding.hasAccounts}
          hasActiveCategories={onboarding.hasActiveCategories}
          hasTransactions={summary.activeCount > 0}
        />
      ) : null}

      {renderMonthBlocks()}

      <DashboardShortcutsComponent />

      {isStatementReady && truncated ? (
        <p className="text-xs text-muted-foreground">
          Este mês chegou ao limite do extrato: os indicadores consideram as primeiras {STATEMENT_MAX_ENTRIES}{' '}
          transações do mês.
        </p>
      ) : null}
    </div>
  );
}
