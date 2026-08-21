'use client';

import { ComposedBarLineChart } from '@/shared/components/ui/composed-bar-line-chart';
import type { DashboardActivityPoint } from '../types/dashboard.type';

type DashboardActivityChartProps = {
  data: DashboardActivityPoint[];
  isLoading: boolean;
};

function formatDayLabel(value: string | number | null | undefined): string {
  if (typeof value !== 'string') return '';
  // value e ISO YYYY-MM-DD (UTC). Formata para rotulo curto pt-BR.
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

export function DashboardActivityChart({
  data,
  isLoading,
}: DashboardActivityChartProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">
        Atividade dos últimos 7 dias
      </h2>
      {isLoading ? (
        <div className="h-[280px] w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      ) : (
        <ComposedBarLineChart
          data={data}
          xKey="date"
          barKey="processingsExecuted"
          lineKey="ideasCreated"
          barLabel="Processamentos"
          lineLabel="Ideias criadas"
          height={280}
          xAxisTickFormatter={formatDayLabel}
          tooltipLabelFormatter={formatDayLabel}
        />
      )}
    </section>
  );
}
