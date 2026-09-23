'use client';

import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { ColorInput } from '@/shared/components/ui/color-input';
import { IconCombobox } from '@/shared/components/ui/icon-combobox';
import { v } from '@/shared/components/form/validator';
import { creditCardSchema, type CreditCardFormData } from '../data/credit-card.schema';
import type { CreditCardDTO } from '../data/credit-card-api.client';

const BRAND_OPTIONS = [
  { value: 'VISA', label: 'Visa' },
  { value: 'MASTERCARD', label: 'Mastercard' },
  { value: 'ELO', label: 'Elo' },
  { value: 'AMEX', label: 'American Express' },
  { value: 'HIPERCARD', label: 'Hipercard' },
  { value: 'DINERS', label: 'Diners Club' },
  { value: 'OTHER', label: 'Outro' },
];

type CreditCardFormProps = {
  card?: CreditCardDTO;
  isSubmitting: boolean;
  onSubmit: (data: CreditCardFormData) => void;
  onCancel: () => void;
};

export function CreditCardFormComponent({ card, isSubmitting, onSubmit, onCancel }: CreditCardFormProps) {
  const isEditing = Boolean(card);
  const nameId = useId();
  const brandId = useId();
  const lastFourDigitsId = useId();
  const closingDayId = useId();
  const dueDayId = useId();
  const limitId = useId();
  const descriptionId = useId();
  const colorId = useId();
  const iconId = useId();
  const isActiveId = useId();

  const form = useForm<CreditCardFormData>({
    resolver: v.resolver(creditCardSchema),
    defaultValues: {
      name: card?.name ?? '',
      brand: card?.brand ?? 'VISA',
      closingDay: card ? String(card.closingDay) : '',
      dueDay: card ? String(card.dueDay) : '',
      description: card?.description ?? '',
      lastFourDigits: card?.lastFourDigits ?? '',
      limit: card?.limit ? String(card.limit / 100) : '',
      color: card?.color ?? '',
      icon: card?.icon ?? '',
      isActive: card?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (card) {
      form.reset({
        name: card.name,
        brand: card.brand,
        closingDay: String(card.closingDay),
        dueDay: String(card.dueDay),
        description: card.description ?? '',
        lastFourDigits: card.lastFourDigits ?? '',
        limit: card.limit ? String(card.limit / 100) : '',
        color: card.color ?? '',
        icon: card.icon ?? '',
        isActive: card.isActive,
      });
    }
  }, [card, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-6">
      <FormSectionLayout title="Identificação" description="Informações básicas do cartão.">
        <div className="space-y-2">
          <Label htmlFor={nameId}>Nome *</Label>
          <Input id={nameId} {...form.register('name')} placeholder="Ex: Nubank Roxinho" />
          {form.formState.errors.name && (
            <FormErrorMessage>{form.formState.errors.name.message as string}</FormErrorMessage>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={brandId}>Bandeira *</Label>
          <select
            id={brandId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('brand')}
          >
            {BRAND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {form.formState.errors.brand && (
            <FormErrorMessage>{form.formState.errors.brand.message as string}</FormErrorMessage>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={descriptionId}>Descrição</Label>
          <Input id={descriptionId} {...form.register('description')} placeholder="Ex: Cartão principal de crédito" />
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Dados do Cartão" description="Informações financeiras do cartão.">
        <div className="space-y-2">
          <Label htmlFor={lastFourDigitsId}>Últimos 4 dígitos</Label>
          <Input
            id={lastFourDigitsId}
            {...form.register('lastFourDigits')}
            placeholder="Ex: 1234"
            maxLength={4}
          />
          {form.formState.errors.lastFourDigits && (
            <FormErrorMessage>{form.formState.errors.lastFourDigits.message as string}</FormErrorMessage>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={closingDayId}>Dia de fechamento *</Label>
            <Input
              id={closingDayId}
              type="number"
              min={1}
              max={31}
              {...form.register('closingDay')}
              placeholder="1–31"
            />
            {form.formState.errors.closingDay && (
              <FormErrorMessage>{form.formState.errors.closingDay.message as string}</FormErrorMessage>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={dueDayId}>Dia de vencimento *</Label>
            <Input
              id={dueDayId}
              type="number"
              min={1}
              max={31}
              {...form.register('dueDay')}
              placeholder="1–31"
            />
            {form.formState.errors.dueDay && (
              <FormErrorMessage>{form.formState.errors.dueDay.message as string}</FormErrorMessage>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={limitId}>Limite (R$)</Label>
          <Input
            id={limitId}
            type="number"
            min={0}
            step="0.01"
            {...form.register('limit')}
            placeholder="Ex: 5000.00"
          />
          {form.formState.errors.limit && (
            <FormErrorMessage>{form.formState.errors.limit.message as string}</FormErrorMessage>
          )}
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Visual" description="Personalização visual do cartão." showDivider={isEditing}>
        <div className="space-y-2">
          <Label htmlFor={colorId}>Cor</Label>
          <Controller
            name="color"
            control={form.control}
            render={({ field }) => (
              <ColorInput id={colorId} value={field.value} onChange={field.onChange} />
            )}
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
            render={({ field }) => (
              <IconCombobox id={iconId} value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </FormSectionLayout>

      {isEditing ? (
        <FormSectionLayout title="Status" description="Ativar ou desativar o cartão." showDivider={false}>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={isActiveId}
              className="h-4 w-4 rounded border-input"
              {...form.register('isActive')}
            />
            <Label htmlFor={isActiveId}>Cartão ativo</Label>
          </div>
        </FormSectionLayout>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar cartão'}
        </Button>
      </div>
    </form>
  );
}
