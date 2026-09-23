'use client';

import type { ComponentType } from 'react';
import { ChevronDown, LayoutGrid, List, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Combobox } from '@/shared/components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { FilterPill } from '@/shared/components/ui/filter-pill';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/class-name.util';
import {
  STATEMENT_GROUPINGS,
  STATEMENT_GROUPING_LABELS,
  STATEMENT_VIEWS,
  STATEMENT_VIEW_LABELS,
  isStatementGrouping,
  type StatementGrouping,
  type StatementView,
} from '../data/statement-view';

const VIEW_ICONS: Record<StatementView, ComponentType<{ className?: string }>> = {
  table: List,
  cards: LayoutGrid,
};

const GROUPING_OPTIONS = STATEMENT_GROUPINGS.map((grouping) => ({
  label: `Por ${STATEMENT_GROUPING_LABELS[grouping].toLowerCase()}`,
  value: grouping,
}));

type StatementToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filtersOpen: boolean;
  filtersPanelId: string;
  /** Search, direction, situation, account and card — never the month. */
  activeFilterCount: number;
  onToggleFilters: () => void;
  grouping: StatementGrouping;
  onGroupingChange: (grouping: StatementGrouping) => void;
  view: StatementView;
  onViewChange: (view: StatementView) => void;
  /** Month total (`meta.total`); `null` hides it while loading. */
  total: number | null;
  onCreateSingle: () => void;
  onCreateSeries: () => void;
};

function formatTotal(total: number): string {
  return `${total} ${total === 1 ? 'transação' : 'transações'}`;
}

export function StatementToolbarComponent({
  search,
  onSearchChange,
  filtersOpen,
  filtersPanelId,
  activeFilterCount,
  onToggleFilters,
  grouping,
  onGroupingChange,
  view,
  onViewChange,
  total,
  onCreateSingle,
  onCreateSeries,
}: StatementToolbarProps) {
  return (
    // Mobile: search + total on the first line, controls on the second. Desktop: one line.
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="relative order-1 min-w-0 flex-1 lg:max-w-xs">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nome"
          aria-label="Buscar transações por nome"
          className="h-9 pl-9"
        />
      </div>

      {total !== null ? (
        <span className="order-2 shrink-0 text-xs text-muted-foreground tabular-nums lg:order-3 lg:ml-auto">
          {formatTotal(total)}
        </span>
      ) : null}

      <div className="order-3 flex w-full flex-wrap items-center gap-2 lg:order-4 lg:w-auto lg:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls={filtersOpen ? filtersPanelId : undefined}
        >
          <SlidersHorizontal className="size-4" />
          Filtros
          {activeFilterCount > 0 ? (
            <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-xs text-primary-foreground tabular-nums">
              {activeFilterCount}
              <span className="sr-only"> {activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'}</span>
            </span>
          ) : null}
        </Button>

        <div role="group" aria-label="Agrupar por" className="hidden items-center gap-1 sm:flex">
          <span className="px-1 text-xs text-muted-foreground">Agrupar</span>
          {STATEMENT_GROUPINGS.map((option) => {
            const active = grouping === option;
            return (
              <FilterPill
                key={option}
                active={active}
                onClick={() => onGroupingChange(option)}
                className={cn('h-7 px-2.5 text-xs', !active && 'border-transparent')}
              >
                {STATEMENT_GROUPING_LABELS[option]}
              </FilterPill>
            );
          })}
        </div>

        <div className="w-36 sm:hidden [&>button]:h-9 [&>button]:text-xs">
          <Combobox
            options={GROUPING_OPTIONS}
            value={grouping}
            onChange={(value) => {
              if (isStatementGrouping(value)) onGroupingChange(value);
            }}
            placeholder="Agrupar"
          />
        </div>

        <div role="group" aria-label="Visualização" className="flex items-center rounded-md border border-border/60 p-0.5">
          {STATEMENT_VIEWS.map((option) => {
            const Icon = VIEW_ICONS[option];
            const active = view === option;
            const label = `Visualizar em ${STATEMENT_VIEW_LABELS[option].toLowerCase()}`;
            return (
              <Button
                key={option}
                type="button"
                variant="ghost"
                size="icon"
                className={cn('size-8', active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}
                aria-pressed={active}
                aria-label={label}
                title={label}
                onClick={() => onViewChange(option)}
              >
                <Icon className="size-4" />
              </Button>
            );
          })}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" aria-label="Nova transação" className="ml-auto lg:ml-0">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nova transação</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onCreateSingle}>Transação avulsa</DropdownMenuItem>
            <DropdownMenuItem onSelect={onCreateSeries}>Série parcelada ou recorrente</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
