'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import type { DashboardIdeaSummary } from '../types/dashboard.type';

type DashboardLatestIdeasProps = {
  items: DashboardIdeaSummary[];
  isLoading: boolean;
  hasAnyIdea: boolean;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function DashboardLatestIdeas({
  items,
  isLoading,
  hasAnyIdea,
}: DashboardLatestIdeasProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">
        Últimas ideias atualizadas
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-14 w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : !hasAnyIdea ? (
        <div className="flex flex-col items-center gap-6">
          <EmptyListState
            title="Você ainda não cadastrou nenhuma ideia."
            subtitle="Comece criando sua primeira ideia."
          />
          <Button asChild>
            <Link href="/ideas/new">
              <Plus className="size-4" />
              Nova Ideia
            </Link>
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-400">Nada para mostrar agora.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((idea) => (
            <li key={idea.id}>
              <Link
                href={`/ideas/${idea.id}/edit`}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/[0.08]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="truncate text-sm font-medium text-zinc-200">
                    {idea.name}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {idea.ideaTypeName}
                  </Badge>
                </div>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatTimestamp(idea.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
