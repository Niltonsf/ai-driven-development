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
import { accountSchema, type AccountFormData } from '../data/account.schema';
import type { AccountDTO } from '../data/account-api.client';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'CHECKING', label: 'Corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'CASH', label: 'Dinheiro Físico' },
  { value: 'INVESTMENT', label: 'Investimento' },
  { value: 'OTHER', label: 'Outro' },
];

type AccountFormProps = {
  account?: AccountDTO;
  isSubmitting: boolean;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
};

export function AccountFormComponent({ account, isSubmitting, onSubmit, onCancel }: AccountFormProps) {
  const isEditing = Boolean(account);
  const nameId = useId();
  const typeId = useId();
  const descriptionId = useId();
  const accountNumberId = useId();
  const agencyId = useId();
  const financialInstitutionId = useId();
  const colorId = useId();
  const iconId = useId();
  const isActiveId = useId();

  const form = useForm<AccountFormData>({
    resolver: v.resolver(accountSchema),
    defaultValues: {
      name: account?.name ?? '',
      type: account?.type ?? 'CHECKING',
      description: account?.description ?? '',
      accountNumber: account?.accountNumber ?? '',
      agency: account?.agency ?? '',
      financialInstitution: account?.financialInstitution ?? '',
      color: account?.color ?? '',
      icon: account?.icon ?? '',
      isActive: account?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        description: account.description ?? '',
        accountNumber: account.accountNumber ?? '',
        agency: account.agency ?? '',
        financialInstitution: account.financialInstitution ?? '',
        color: account.color ?? '',
        icon: account.icon ?? '',
        isActive: account.isActive,
      });
    }
  }, [account, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-6">
      <FormSectionLayout title="Identificação" description="Informações básicas da conta.">
        <div className="space-y-2">
          <Label htmlFor={nameId}>Nome *</Label>
          <Input id={nameId} {...form.register('name')} placeholder="Ex: Conta Corrente Itaú" />
          {form.formState.errors.name && (
            <FormErrorMessage>{form.formState.errors.name.message as string}</FormErrorMessage>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={typeId}>Tipo *</Label>
          <select
            id={typeId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('type')}
          >
            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {form.formState.errors.type && (
            <FormErrorMessage>{form.formState.errors.type.message as string}</FormErrorMessage>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={descriptionId}>Descrição</Label>
          <Input id={descriptionId} {...form.register('description')} placeholder="Ex: Conta principal para gastos do dia a dia" />
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Dados Bancários" description="Informações da instituição financeira.">
        <div className="space-y-2">
          <Label htmlFor={financialInstitutionId}>Instituição Financeira</Label>
          <Input id={financialInstitutionId} {...form.register('financialInstitution')} placeholder="Ex: Nubank, Itaú, Bradesco" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={agencyId}>Agência</Label>
            <Input id={agencyId} {...form.register('agency')} placeholder="Ex: 0001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={accountNumberId}>Número da Conta</Label>
            <Input id={accountNumberId} {...form.register('accountNumber')} placeholder="Ex: 12345-6" />
          </div>
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Visual" description="Personalização visual da conta." showDivider={isEditing}>
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
        <FormSectionLayout title="Status" description="Ativar ou desativar a conta." showDivider={false}>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={isActiveId}
              className="h-4 w-4 rounded border-input"
              {...form.register('isActive')}
            />
            <Label htmlFor={isActiveId}>Conta ativa</Label>
          </div>
        </FormSectionLayout>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar conta'}
        </Button>
      </div>
    </form>
  );
}
