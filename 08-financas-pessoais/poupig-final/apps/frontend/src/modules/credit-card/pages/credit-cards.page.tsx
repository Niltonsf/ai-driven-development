'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { CreditCardListComponent } from '../components/credit-card-list.component';
import { CreditCardFormComponent } from '../components/credit-card-form.component';
import { useCreditCards, useSaveCreditCard, useDeleteCreditCard } from '../data/use-credit-cards';
import type { CreditCardDTO, CardBrand } from '../data/credit-card-api.client';
import type { CreditCardFormData } from '../data/credit-card.schema';

const PAGE_SIZE = 10;

type ViewMode = 'list' | 'form';

export function CreditCardsPage() {
  const [page, setPage] = useState(1);
  const { items, total, isLoading, error, refresh } = useCreditCards(page, PAGE_SIZE);
  const { save, isSubmitting } = useSaveCreditCard();
  const { remove, isDeleting } = useDeleteCreditCard();

  const [mode, setMode] = useState<ViewMode>('list');
  const [editingCard, setEditingCard] = useState<CreditCardDTO | undefined>(undefined);
  const [deletingCard, setDeletingCard] = useState<CreditCardDTO | undefined>(undefined);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleNewCard() {
    setEditingCard(undefined);
    setMode('form');
  }

  function handleEdit(card: CreditCardDTO) {
    setEditingCard(card);
    setMode('form');
  }

  function handleDeleteRequest(card: CreditCardDTO) {
    setDeletingCard(card);
  }

  async function handleSubmit(data: CreditCardFormData) {
    const limitInCents = data.limit ? Math.round(parseFloat(data.limit) * 100) : undefined;
    const closingDay = parseInt(data.closingDay, 10);
    const dueDay = parseInt(data.dueDay, 10);

    const input = {
      name: data.name,
      brand: data.brand as CardBrand,
      closingDay,
      dueDay,
      description: data.description || undefined,
      lastFourDigits: data.lastFourDigits || undefined,
      limit: limitInCents,
      color: data.color || undefined,
      icon: data.icon || undefined,
      isActive: data.isActive,
    };

    const result = await save(input, editingCard?.id);
    if (result.ok) {
      toast.success(editingCard ? 'Cartão atualizado com sucesso!' : 'Cartão criado com sucesso!');
      await refresh();
      setMode('list');
      setEditingCard(undefined);
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingCard) return;
    const result = await remove(deletingCard.id);
    if (result.ok) {
      toast.success('Cartão excluído com sucesso!');
      await refresh();
      setDeletingCard(undefined);
    } else {
      toast.error(result.error);
    }
  }

  if (mode === 'form') {
    return (
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</h1>
        </div>
        <CreditCardFormComponent
          card={editingCard}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => { setMode('list'); setEditingCard(undefined); }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cartões</h1>
        <Button onClick={handleNewCard}>
          <Plus className="mr-2 size-4" />
          Novo cartão
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando cartões...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <>
          <CreditCardListComponent
            cards={items}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />

          {totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                totalItems={total}
                totalLabel="cartões"
                onPageChange={setPage}
                disabled={isLoading}
              />
            </div>
          )}
        </>
      )}

      <DeleteConfirmationDialog
        open={Boolean(deletingCard)}
        onOpenChange={(open) => { if (!open) setDeletingCard(undefined); }}
        onConfirm={handleConfirmDelete}
        title="Excluir cartão"
        description="Esta ação irá desativar o cartão selecionado. Você poderá reativá-lo posteriormente."
        itemLabel="Cartão"
        itemValue={deletingCard?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}
