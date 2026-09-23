'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { StandardDialogContent } from '@/shared/components/ui/standard-dialog-content';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { CategoryListComponent } from '../components/category-list.component';
import { CategoryFormComponent } from '../components/category-form.component';
import {
  useCategories,
  useSaveCategory,
  useDeleteCategory,
  useApplyDefaultCategories,
} from '../data/use-categories';
import type { CategoryDTO, SaveCategoryInput } from '../data/category-api.client';

type ViewMode = 'list' | 'form';

export function CategoriesPage() {
  const { items, isLoading, error, refresh } = useCategories();
  const { save, isSubmitting } = useSaveCategory();
  const { remove, isDeleting } = useDeleteCategory();
  const { applyDefaults, isApplying } = useApplyDefaultCategories();

  const [mode, setMode] = useState<ViewMode>('list');
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | undefined>(undefined);
  const [deletingCategory, setDeletingCategory] = useState<CategoryDTO | undefined>(undefined);
  const [isDefaultsDialogOpen, setIsDefaultsDialogOpen] = useState(false);

  function handleNewCategory() {
    setEditingCategory(undefined);
    setMode('form');
  }

  function handleEdit(category: CategoryDTO) {
    setEditingCategory(category);
    setMode('form');
  }

  function backToList() {
    setMode('list');
    setEditingCategory(undefined);
  }

  async function handleSubmit(input: SaveCategoryInput) {
    const result = await save(input, editingCategory?.id);
    if (result.ok) {
      toast.success(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
      await refresh();
      backToList();
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingCategory) return;
    const result = await remove(deletingCategory.id);
    if (result.ok) {
      toast.success('Categoria excluída com sucesso!');
      await refresh();
      setDeletingCategory(undefined);
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmDefaults() {
    const result = await applyDefaults();
    if (result.ok) {
      toast.success('Categorias padrão aplicadas com sucesso!');
      await refresh();
      setIsDefaultsDialogOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  if (mode === 'form') {
    return (
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h1>
        </div>
        <CategoryFormComponent
          category={editingCategory}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={backToList}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsDefaultsDialogOpen(true)} disabled={isApplying}>
            <Sparkles className="mr-2 size-4" />
            Aplicar categorias padrão
          </Button>
          <Button onClick={handleNewCategory}>
            <Plus className="mr-2 size-4" />
            Nova categoria
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando categorias...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <CategoryListComponent categories={items} onEdit={handleEdit} onDelete={setDeletingCategory} />
      )}

      <DeleteConfirmationDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(undefined);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir categoria"
        description="Esta ação irá desativar a categoria selecionada e todas as suas subcategorias."
        itemLabel="Categoria"
        itemValue={deletingCategory?.name}
        isConfirming={isDeleting}
      />

      <Dialog open={isDefaultsDialogOpen} onOpenChange={setIsDefaultsDialogOpen}>
        <StandardDialogContent
          title="Aplicar categorias padrão"
          description="Serão criadas apenas as categorias padrão que você ainda não possui. As categorias já existentes serão ignoradas e nada será sobrescrito."
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setIsDefaultsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirmDefaults} disabled={isApplying}>
                {isApplying ? 'Aplicando...' : 'Aplicar'}
              </Button>
            </>
          }
        />
      </Dialog>
    </div>
  );
}
