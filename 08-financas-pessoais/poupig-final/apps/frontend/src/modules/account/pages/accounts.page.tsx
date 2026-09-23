'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { AccountListComponent } from '../components/account-list.component';
import { AccountFormComponent } from '../components/account-form.component';
import { useAccounts, useSaveAccount, useDeleteAccount } from '../data/use-accounts';
import type { AccountDTO } from '../data/account-api.client';
import type { AccountFormData } from '../data/account.schema';

const PAGE_SIZE = 10;

type ViewMode = 'list' | 'form';

export function AccountsPage() {
  const [page, setPage] = useState(1);
  const { items, total, isLoading, error, refresh } = useAccounts(page, PAGE_SIZE);
  const { save, isSubmitting } = useSaveAccount();
  const { remove, isDeleting } = useDeleteAccount();

  const [mode, setMode] = useState<ViewMode>('list');
  const [editingAccount, setEditingAccount] = useState<AccountDTO | undefined>(undefined);
  const [deletingAccount, setDeletingAccount] = useState<AccountDTO | undefined>(undefined);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleNewAccount() {
    setEditingAccount(undefined);
    setMode('form');
  }

  function handleEdit(account: AccountDTO) {
    setEditingAccount(account);
    setMode('form');
  }

  function handleDeleteRequest(account: AccountDTO) {
    setDeletingAccount(account);
  }

  async function handleSubmit(data: AccountFormData) {
    const input = {
      name: data.name,
      type: data.type as any,
      description: data.description || undefined,
      accountNumber: data.accountNumber || undefined,
      agency: data.agency || undefined,
      financialInstitution: data.financialInstitution || undefined,
      color: data.color || undefined,
      icon: data.icon || undefined,
      isActive: data.isActive,
    };

    const result = await save(input, editingAccount?.id);
    if (result.ok) {
      toast.success(editingAccount ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!');
      await refresh();
      setMode('list');
      setEditingAccount(undefined);
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingAccount) return;
    const result = await remove(deletingAccount.id);
    if (result.ok) {
      toast.success('Conta excluída com sucesso!');
      await refresh();
      setDeletingAccount(undefined);
    } else {
      toast.error(result.error);
    }
  }

  if (mode === 'form') {
    return (
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{editingAccount ? 'Editar Conta' : 'Nova Conta'}</h1>
        </div>
        <AccountFormComponent
          account={editingAccount}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => { setMode('list'); setEditingAccount(undefined); }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas</h1>
        <Button onClick={handleNewAccount}>
          <Plus className="mr-2 size-4" />
          Nova conta
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando contas...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <>
          <AccountListComponent
            accounts={items}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />

          {totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                totalItems={total}
                totalLabel="contas"
                onPageChange={setPage}
                disabled={isLoading}
              />
            </div>
          )}
        </>
      )}

      <DeleteConfirmationDialog
        open={Boolean(deletingAccount)}
        onOpenChange={(open) => { if (!open) setDeletingAccount(undefined); }}
        onConfirm={handleConfirmDelete}
        title="Excluir conta"
        description="Esta ação irá desativar a conta selecionada. Você poderá reativá-la posteriormente."
        itemLabel="Conta"
        itemValue={deletingAccount?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}
