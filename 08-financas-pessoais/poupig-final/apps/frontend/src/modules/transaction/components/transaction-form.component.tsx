'use client';

import { useId, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type DefaultValues, type Resolver } from 'react-hook-form';
import {
  Direction,
  TransactionStatus,
  isDirection,
  isTransactionStatus,
  type StatementEntryDTO,
} from '@poupig/transaction';
import { Button } from '@/shared/components/ui/button';
import { Combobox } from '@/shared/components/ui/combobox';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { MoneyInput } from '@/shared/components/ui/money-input';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Textarea } from '@/shared/components/ui/textarea';
import { v } from '@/shared/components/form/validator';
import type { SaveTransactionInput } from '../data/transaction-api.client';
import { DIRECTION_LABELS, TRANSACTION_STATUS_LABELS } from '../data/transaction.labels';
import { transactionSchema, type TransactionFormData } from '../data/transaction.schema';
import type { TransactionOptions } from '../data/use-transactions';

const DIRECTION_OPTIONS = [Direction.OUT, Direction.IN];

const STATUS_OPTIONS = Object.values(TransactionStatus).map((status) => ({
  label: TRANSACTION_STATUS_LABELS[status],
  value: status,
}));

/**
 * The editable fields shared by a standalone transaction, a statement entry and
 * an occurrence of a series. `TransactionDTO`, `StatementEntryDTO` and
 * `ScheduledTransactionDTO` all satisfy it structurally.
 */
export type TransactionFormRecord = Pick<
  StatementEntryDTO,
  | 'name'
  | 'note'
  | 'value'
  | 'direction'
  | 'accountId'
  | 'creditCardId'
  | 'subcategoryId'
  | 'status'
  | 'expectedOn'
  | 'settledOn'
>;

type TransactionFormProps = {
  transaction?: TransactionFormRecord;
  /** Read-only block rendered before the first section (e.g. the series of an occurrence). */
  leadingSection?: ReactNode;
  options: TransactionOptions;
  isLoadingOptions?: boolean;
  isSubmitting: boolean;
  onSubmit: (input: SaveTransactionInput) => void;
  onCancel: () => void;
};

/** Today in the browser's local time zone (`toISOString` would shift the day at night in UTC-3). */
function getTodayDateOnly(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function toDefaultValues(transaction?: TransactionFormRecord): DefaultValues<TransactionFormData> {
  if (!transaction) {
    return {
      name: '',
      value: undefined,
      direction: Direction.OUT,
      expectedOn: getTodayDateOnly(),
      accountId: '',
      creditCardId: '',
      subcategoryId: '',
      status: TransactionStatus.PENDING,
      settledOn: '',
      note: '',
    };
  }

  return {
    name: transaction.name,
    value: transaction.value,
    direction: transaction.direction,
    expectedOn: transaction.expectedOn,
    accountId: transaction.accountId,
    creditCardId: transaction.creditCardId ?? '',
    subcategoryId: transaction.subcategoryId ?? '',
    status: transaction.status,
    settledOn: transaction.settledOn ?? '',
    note: transaction.note ?? '',
  };
}

/**
 * The resolver returns only filled fields, already normalized by the Value
 * Objects. `PUT` replaces the whole transaction, so empty optionals go as `null`.
 */
function toSaveInput(data: TransactionFormData): SaveTransactionInput {
  return {
    name: data.name,
    note: data.note ?? null,
    value: data.value,
    direction: data.direction,
    accountId: data.accountId,
    creditCardId: data.creditCardId ?? null,
    subcategoryId: data.subcategoryId ?? null,
    status: data.status,
    expectedOn: data.expectedOn,
    settledOn: data.status === TransactionStatus.SETTLED ? (data.settledOn ?? null) : null,
  };
}

export function TransactionFormComponent({
  transaction,
  leadingSection,
  options,
  isLoadingOptions = false,
  isSubmitting,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const isEditing = Boolean(transaction);
  const nameId = useId();
  const valueId = useId();
  const directionId = useId();
  const expectedOnId = useId();
  const settledOnId = useId();
  const noteId = useId();

  const [defaultValues] = useState(() => toDefaultValues(transaction));

  const form = useForm<TransactionFormData>({
    // The schema carries `direction`/`status` as `Text`; the form type narrows them to the enums.
    resolver: v.resolver(transactionSchema) as unknown as Resolver<TransactionFormData>,
    defaultValues,
  });
  const { errors } = form.formState;

  const status = useWatch({ control: form.control, name: 'status' });
  const isSettled = status === TransactionStatus.SETTLED;

  const optionsPlaceholder = isLoadingOptions ? 'Carregando...' : 'Selecionar...';
  const creditCardOptions = [{ label: 'Sem cartão', value: '' }, ...options.creditCards];
  const subcategoryOptions = [{ label: 'Sem subcategoria', value: '' }, ...options.subcategories];

  function handleStatusChange(nextStatus: string, onChange: (value: TransactionStatus) => void) {
    if (!isTransactionStatus(nextStatus)) return;

    onChange(nextStatus);
    if (nextStatus !== TransactionStatus.SETTLED) {
      form.setValue('settledOn', '');
      form.clearErrors('settledOn');
    }
  }

  function handleValidSubmit(data: TransactionFormData) {
    onSubmit(toSaveInput(data));
  }

  return (
    <form onSubmit={form.handleSubmit(handleValidSubmit)} className="space-y-10 py-6">
      {leadingSection}
      <FormSectionLayout title="Lançamento" description="O que foi movimentado, quanto e quando está previsto.">
        <div className="space-y-2">
          <Label htmlFor={nameId}>Nome *</Label>
          <Input id={nameId} {...form.register('name')} placeholder="Ex: Supermercado" />
          {errors.name?.message ? <FormErrorMessage>{errors.name.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={valueId}>Valor *</Label>
          <Controller
            name="value"
            control={form.control}
            render={({ field }) => (
              <MoneyInput
                id={valueId}
                ref={field.ref}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.value?.message ? <FormErrorMessage>{errors.value.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label id={directionId}>Direção *</Label>
          <Controller
            name="direction"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                aria-labelledby={directionId}
                className="flex flex-wrap gap-6"
                value={field.value}
                onValueChange={(nextDirection) => {
                  if (isDirection(nextDirection)) field.onChange(nextDirection);
                }}
              >
                {DIRECTION_OPTIONS.map((direction) => (
                  <div key={direction} className="flex items-center gap-2">
                    <RadioGroupItem id={`${directionId}-${direction}`} value={direction} />
                    <Label htmlFor={`${directionId}-${direction}`}>{DIRECTION_LABELS[direction]}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
          {errors.direction?.message ? <FormErrorMessage>{errors.direction.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={expectedOnId}>Data prevista *</Label>
          <Controller
            name="expectedOn"
            control={form.control}
            render={({ field }) => (
              <DatePickerInput id={expectedOnId} value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.expectedOn?.message ? <FormErrorMessage>{errors.expectedOn.message}</FormErrorMessage> : null}
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Vínculos" description="Conta movimentada e, se quiser, cartão e subcategoria.">
        <div className="space-y-2">
          <Label>Conta *</Label>
          <Controller
            name="accountId"
            control={form.control}
            render={({ field }) => (
              <Combobox
                options={options.accounts}
                value={field.value}
                onChange={field.onChange}
                placeholder={optionsPlaceholder}
                emptyText="Nenhuma conta ativa encontrada."
              />
            )}
          />
          {errors.accountId?.message ? <FormErrorMessage>{errors.accountId.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label>Cartão</Label>
          <Controller
            name="creditCardId"
            control={form.control}
            render={({ field }) => (
              <Combobox
                options={creditCardOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder={optionsPlaceholder}
                emptyText="Nenhum cartão ativo encontrado."
              />
            )}
          />
          {errors.creditCardId?.message ? <FormErrorMessage>{errors.creditCardId.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label>Subcategoria</Label>
          <Controller
            name="subcategoryId"
            control={form.control}
            render={({ field }) => (
              <Combobox
                options={subcategoryOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder={optionsPlaceholder}
                emptyText="Nenhuma subcategoria ativa encontrada."
              />
            )}
          />
          {errors.subcategoryId?.message ? (
            <FormErrorMessage>{errors.subcategoryId.message}</FormErrorMessage>
          ) : null}
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Situação"
        description="Se a transação já foi efetivada e observações adicionais."
        showDivider={false}
      >
        <div className="space-y-2">
          <Label>Status *</Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Combobox
                options={STATUS_OPTIONS}
                value={field.value}
                onChange={(nextStatus) => handleStatusChange(nextStatus, field.onChange)}
              />
            )}
          />
          {errors.status?.message ? <FormErrorMessage>{errors.status.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={settledOnId}>Data de efetivação{isSettled ? ' *' : ''}</Label>
          <Controller
            name="settledOn"
            control={form.control}
            render={({ field }) => (
              <DatePickerInput
                id={settledOnId}
                value={field.value}
                onChange={field.onChange}
                disabled={!isSettled}
                placeholder={isSettled ? 'Selecionar data' : 'Disponível apenas para transações efetivadas'}
              />
            )}
          />
          {errors.settledOn?.message ? <FormErrorMessage>{errors.settledOn.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={noteId}>Observação</Label>
          <Textarea id={noteId} {...form.register('note')} placeholder="Detalhes adicionais sobre a transação" />
          {errors.note?.message ? <FormErrorMessage>{errors.note.message}</FormErrorMessage> : null}
        </div>
      </FormSectionLayout>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar transação'}
        </Button>
      </div>
    </form>
  );
}
