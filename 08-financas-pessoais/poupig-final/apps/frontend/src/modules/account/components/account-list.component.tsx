'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { LucideIconByKey, pickSmartIconColor } from '@/shared/components/ui/lucide-icon-by-key';
import type { AccountDTO, AccountType } from '../data/account-api.client';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Corrente',
  SAVINGS: 'Poupança',
  CASH: 'Dinheiro Físico',
  INVESTMENT: 'Investimento',
  OTHER: 'Outro',
};

type AccountListProps = {
  accounts: AccountDTO[];
  onEdit: (account: AccountDTO) => void;
  onDelete: (account: AccountDTO) => void;
};

export function AccountListComponent({ accounts, onEdit, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <EmptyListState
        title="Nenhuma conta cadastrada"
        subtitle="Adicione uma conta para começar a organizar suas finanças."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {accounts.map((account) => (
        <li
          key={account.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: account.color ?? '#6366f1' }}
            >
              {account.icon ? (
                <LucideIconByKey name={account.icon} className="size-4" backgroundColor={account.color ?? '#6366f1'} />
              ) : (
                <span
                  className="text-xs font-bold"
                  style={{ color: pickSmartIconColor(account.color ?? '#6366f1') }}
                >
                  {account.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{account.name}</p>
              {account.financialInstitution ? (
                <p className="truncate text-sm text-muted-foreground">{account.financialInstitution}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</Badge>
            <Button variant="ghost" size="icon" onClick={() => onEdit(account)} aria-label="Editar conta">
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(account)} aria-label="Excluir conta">
              <Trash2 className="size-4 text-red-500" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
