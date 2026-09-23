'use client';

import { useEffect, useId } from 'react';
import { useForm, useFieldArray, useWatch, Controller, type Resolver } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { ColorInput } from '@/shared/components/ui/color-input';
import { IconCombobox } from '@/shared/components/ui/icon-combobox';
import { OrderableObjectList } from '@/shared/components/ui/orderable-object-list';
import { v } from '@/shared/components/form/validator';
import { categorySchema, type CategoryFormData, type SubcategoryFormItem } from '../data/category.schema';
import type { CategoryDTO, SaveCategoryInput } from '../data/category-api.client';

type CategoryFormProps = {
  category?: CategoryDTO;
  isSubmitting: boolean;
  onSubmit: (input: SaveCategoryInput) => void;
  onCancel: () => void;
};

function toFormSubcategories(category?: CategoryDTO): SubcategoryFormItem[] {
  if (!category) return [];

  return [...category.subcategories]
    .sort((left, right) => left.order - right.order)
    .map((subcategory, index) => ({
      id: subcategory.id,
      name: subcategory.name,
      icon: subcategory.icon ?? '',
      color: subcategory.color ?? '',
      isActive: subcategory.isActive,
      order: index + 1,
    }));
}

function toDefaultValues(category?: CategoryDTO): CategoryFormData {
  return {
    name: category?.name ?? '',
    icon: category?.icon ?? '',
    color: category?.color ?? '',
    isActive: category?.isActive ?? true,
    subcategories: toFormSubcategories(category),
  };
}

/**
 * O resolver do validador compartilhado devolve apenas os campos declarados no
 * schema — `isActive`, e o `id`/`order`/`isActive` de cada subcategoria seriam
 * descartados. Por isso o payload é montado a partir do estado bruto do
 * formulário (`form.getValues()`), com o `order` reatribuído pela posição.
 */
function toSaveInput(values: CategoryFormData): SaveCategoryInput {
  return {
    name: values.name.trim(),
    icon: values.icon?.trim() || undefined,
    color: values.color?.trim() || undefined,
    isActive: values.isActive,
    subcategories: (values.subcategories ?? []).map((subcategory, index) => ({
      ...(subcategory.id ? { id: subcategory.id } : {}),
      name: subcategory.name.trim(),
      icon: subcategory.icon?.trim() || undefined,
      color: subcategory.color?.trim() || undefined,
      isActive: subcategory.isActive,
      order: index + 1,
    })),
  };
}

export function CategoryFormComponent({ category, isSubmitting, onSubmit, onCancel }: CategoryFormProps) {
  const isEditing = Boolean(category);
  const nameId = useId();
  const colorId = useId();
  const iconId = useId();
  const isActiveId = useId();

  const form = useForm<CategoryFormData>({
    // O schema valida apenas os campos com Value Object; o estado do formulário
    // carrega ainda os campos de controle (`isActive`, `id` e `order`).
    resolver: v.resolver(categorySchema) as unknown as Resolver<CategoryFormData>,
    defaultValues: toDefaultValues(category),
  });

  useEffect(() => {
    if (category) {
      form.reset(toDefaultValues(category));
    }
  }, [category, form]);

  /**
   * `useFieldArray.replace` é o que mantém os inputs registrados por índice em
   * sincronia quando a lista é reordenada ou tem itens removidos — sem ele, o
   * array substituído descarta o que já havia sido digitado nos campos filhos.
   * `watch` garante que o array enviado ao `replace` carregue as edições atuais.
   */
  const { replace } = useFieldArray({ control: form.control, name: 'subcategories' });
  const subcategories = (useWatch({ control: form.control, name: 'subcategories' }) ??
    []) as SubcategoryFormItem[];

  const subcategoryErrors = form.formState.errors.subcategories as
    | Array<{ name?: { message?: string }; color?: { message?: string } } | undefined>
    | undefined;

  function handleValidSubmit() {
    onSubmit(toSaveInput(form.getValues()));
  }

  return (
    <form onSubmit={form.handleSubmit(handleValidSubmit)} className="space-y-10 py-6">
      <FormSectionLayout title="Categoria" description="Dados principais da categoria.">
        <div className="space-y-2">
          <Label htmlFor={nameId}>Nome *</Label>
          <Input id={nameId} {...form.register('name')} placeholder="Ex: Moradia" />
          {form.formState.errors.name && (
            <FormErrorMessage>{form.formState.errors.name.message as string}</FormErrorMessage>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={colorId}>Cor</Label>
          <Controller
            name="color"
            control={form.control}
            render={({ field }) => <ColorInput id={colorId} value={field.value} onChange={field.onChange} />}
          />
          {form.formState.errors.color && (
            <FormErrorMessage>{form.formState.errors.color.message as string}</FormErrorMessage>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={iconId}>Ícone</Label>
          <Controller
            name="icon"
            control={form.control}
            render={({ field }) => <IconCombobox id={iconId} value={field.value} onChange={field.onChange} />}
          />
        </div>

        {isEditing ? (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={isActiveId}
              className="h-4 w-4 rounded border-input"
              {...form.register('isActive')}
            />
            <Label htmlFor={isActiveId}>Categoria ativa</Label>
          </div>
        ) : null}
      </FormSectionLayout>

      <FormSectionLayout
        title="Subcategorias"
        description="A ordem de exibição é definida pela posição na lista."
        showDivider={false}
        contentClassName="md:max-w-none"
      >
        <div className="space-y-4">
          <OrderableObjectList<SubcategoryFormItem>
            items={subcategories}
            onChange={(nextItems) => replace(nextItems)}
            disabled={isSubmitting}
            setItemOrder={(item, order) => ({ ...item, order })}
            orderStartsAt={1}
            getItemKey={(item, index) => item.id ?? `new-${index}`}
            getItemTitle={({ index }) => `Subcategoria ${index + 1}`}
            emptyState="Nenhuma subcategoria adicionada."
            renderItem={({ index }) => {
              const itemErrors = subcategoryErrors?.[index];

              return (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor={`${nameId}-sub-${index}`}>Nome *</Label>
                    <Input
                      id={`${nameId}-sub-${index}`}
                      {...form.register(`subcategories.${index}.name` as const)}
                      placeholder="Ex: Aluguel"
                    />
                    {itemErrors?.name?.message ? <FormErrorMessage>{itemErrors.name.message}</FormErrorMessage> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${colorId}-sub-${index}`}>Cor</Label>
                    <Controller
                      name={`subcategories.${index}.color` as const}
                      control={form.control}
                      render={({ field: colorField }) => (
                        <ColorInput
                          id={`${colorId}-sub-${index}`}
                          value={colorField.value}
                          onChange={colorField.onChange}
                        />
                      )}
                    />
                    {itemErrors?.color?.message ? (
                      <FormErrorMessage>{itemErrors.color.message}</FormErrorMessage>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${iconId}-sub-${index}`}>Ícone</Label>
                    <Controller
                      name={`subcategories.${index}.icon` as const}
                      control={form.control}
                      render={({ field: iconField }) => (
                        <IconCombobox
                          id={`${iconId}-sub-${index}`}
                          value={iconField.value}
                          onChange={iconField.onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-3 md:col-span-3">
                    <input
                      type="checkbox"
                      id={`${isActiveId}-sub-${index}`}
                      className="h-4 w-4 rounded border-input"
                      {...form.register(`subcategories.${index}.isActive` as const)}
                    />
                    <Label htmlFor={`${isActiveId}-sub-${index}`}>Subcategoria ativa</Label>
                  </div>
                </div>
              );
            }}
          />

          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={() =>
              replace([
                ...subcategories,
                { name: '', icon: '', color: '', isActive: true, order: subcategories.length + 1 },
              ])
            }
          >
            <Plus className="mr-2 size-4" />
            Adicionar subcategoria
          </Button>
        </div>
      </FormSectionLayout>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar categoria'}
        </Button>
      </div>
    </form>
  );
}
