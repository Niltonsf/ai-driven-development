'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Tags, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth';
import { DashboardApiError, getDashboardSummary } from '../api/dashboard.api';
import type { DashboardSummary } from '../types/dashboard.type';
import { DashboardActivityChart } from './dashboard-activity-chart.component';
import { DashboardLatestIdeas } from './dashboard-latest-ideas.component';
import { DashboardQuickActions } from './dashboard-quick-actions.component';

const SKELETON = (
  <span className="inline-block h-8 w-16 animate-pulse rounded-md bg-white/10" />
);

export function DashboardSummaryComponent() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setErrorCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await getDashboardSummary(token);
      setSummary(data);
      setErrorCode(null);
    } catch (error) {
      const code =
        error instanceof DashboardApiError
          ? (error.codes[0] ?? 'DEFAULT_API_ERROR')
          : 'DEFAULT_API_ERROR';
      setErrorCode(code);
      toast.error(getMessage(code));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = summary?.stats ?? null;

  return (
    <div className="space-y-8">
      <PageSectionHeader
        badge="Visão geral"
        title="Dashboard"
        subtitle="Resumo das suas ideias e processamentos."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Ideias cadastradas"
          subtitle="Total de ideias salvas"
          value={stats ? stats.ideasCount : SKELETON}
          icon={<Lightbulb />}
          iconColorClassName="text-amber-300/80"
        />
        <MetricCard
          title="Tipos cadastrados"
          subtitle="Categorias disponíveis"
          value={stats ? stats.ideaTypesCount : SKELETON}
          icon={<Tags />}
          iconColorClassName="text-sky-300/80"
        />
        <MetricCard
          title="Processamentos executados"
          subtitle="Gerações concluídas"
          value={stats ? stats.processingsCount : SKELETON}
          icon={<Workflow />}
          iconColorClassName="text-emerald-300/80"
        />
      </div>

      <DashboardQuickActions />

      <DashboardActivityChart
        data={summary?.activity ?? []}
        isLoading={isLoading}
      />

      <DashboardLatestIdeas
        items={summary?.latestIdeas ?? []}
        isLoading={isLoading}
        hasAnyIdea={(summary?.stats.ideasCount ?? 0) > 0}
      />
    </div>
  );
}
