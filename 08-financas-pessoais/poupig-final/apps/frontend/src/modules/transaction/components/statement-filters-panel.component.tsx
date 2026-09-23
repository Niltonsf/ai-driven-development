'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Direction, TransactionStatus } from '@poupig/transaction';
import { Button } from '@/shared/components/ui/button';
import { FilterPill } from '@/shared/components/ui/filter-pill';
import type { StatementFilters } from '../data/statement-view';
import { DIRECTION_LABELS, TRANSACTION_STATUS_LABELS } from '../data/transaction.labels';
import type { StatementFilterSetter } from '../data/use-statement-preferences';
import type { TransactionSelectOption } from '../data/use-transactions';

const DIRECTIONS = Object.values(Direction);
const STATUSES = Object.values(TransactionStatus);

type StatementFiltersPanelProps = {
  id?: string;
  filters: StatementFilters;
  /** Active accounts, from the page's single `useTransactionOptions`. */
  accounts: TransactionSelectOption[];
  /** Active credit cards, from the page's single `useTransactionOptions`. */
  creditCards: TransactionSelectOption[];
  hasActiveFilters: boolean;
  onFilterChange: StatementFilterSetter;
  onClearFilters: () => void;
};

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-20 sm:pt-2">
        {label}
      </span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

/**
 * Single-choice pill groups. Each group starts with a neutral pill, and clicking
 * the active pill clears the group. Groups without options are not rendered.
 */
export function StatementFiltersPanelComponent({
  id,
  filters,
  accounts,
  creditCards,
  hasActiveFilters,
  onFilterChange,
  onClearFilters,
}: StatementFiltersPanelProps) {
  const hasCardFilter = Boolean(filters.creditCardId) || filters.onlyCreditCard === true;

  return (
    <section id={id} aria-label="Filtros do extrato" className="space-y-4 rounded-xl border border-border/60 p-4">
      <FilterGroup label="Direção">
        <FilterPill active={!filters.direction} onClick={() => onFilterChange('direction', undefined)}>
          Todas
        </FilterPill>
        {DIRECTIONS.map((direction) => {
          const active = filters.direction === direction;
          return (
            <FilterPill
              key={direction}
              active={active}
              onClick={() => onFilterChange('direction', active ? undefined : direction)}
            >
              {DIRECTION_LABELS[direction]}
            </FilterPill>
          );
        })}
      </FilterGroup>

      <FilterGroup label="Situação">
        <FilterPill active={!filters.status} onClick={() => onFilterChange('status', undefined)}>
          Todas
        </FilterPill>
        {STATUSES.map((status) => {
          const active = filters.status === status;
          return (
            <FilterPill key={status} active={active} onClick={() => onFilterChange('status', active ? undefined : status)}>
              {TRANSACTION_STATUS_LABELS[status]}
            </FilterPill>
          );
        })}
      </FilterGroup>

      {accounts.length > 0 ? (
        <FilterGroup label="Conta">
          <FilterPill active={!filters.accountId} onClick={() => onFilterChange('accountId', undefined)}>
            Todas as contas
          </FilterPill>
          {accounts.map((account) => {
            const active = filters.accountId === account.value;
            return (
              <FilterPill
                key={account.value}
                active={active}
                onClick={() => onFilterChange('accountId', active ? undefined : account.value)}
              >
                {account.label}
              </FilterPill>
            );
          })}
        </FilterGroup>
      ) : null}

      {creditCards.length > 0 ? (
        <FilterGroup label="Cartão">
          <FilterPill
            active={!hasCardFilter}
            onClick={() => {
              onFilterChange('creditCardId', undefined);
              onFilterChange('onlyCreditCard', undefined);
            }}
          >
            Todos os cartões
          </FilterPill>
          <FilterPill
            active={filters.onlyCreditCard === true}
            onClick={() => onFilterChange('onlyCreditCard', filters.onlyCreditCard ? undefined : true)}
          >
            Somente cartão
          </FilterPill>
          {creditCards.map((creditCard) => {
            const active = filters.creditCardId === creditCard.value;
            return (
              <FilterPill
                key={creditCard.value}
                active={active}
                onClick={() => onFilterChange('creditCardId', active ? undefined : creditCard.value)}
              >
                {creditCard.label}
              </FilterPill>
            );
          })}
        </FilterGroup>
      ) : null}

      {hasActiveFilters ? (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="size-4" />
            Limpar filtros
          </Button>
        </div>
      ) : null}
    </section>
  );
}
