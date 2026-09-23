'use client';

import { useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DEV_DATA_LIMITS, type TransactionDataRequestDTO, type TransactionDataSummaryDTO } from '@poupig/dev';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { v } from '@/shared/components/form/validator';
import {
  TRANSACTION_DATA_ITEM_LIMITS,
  TRANSACTION_DATA_SELECTION_FIELD,
  createTransactionDataSchema,
  parseInteger,
  type TransactionDataFormData,
  type TransactionDataItem,
  type TransactionDataSelection,
} from '../data/transaction-data.schema';
import { useGenerateTransactionData } from '../data/use-data-generator';
import { DataGeneratorQuantityRow } from './data-generator-quantity-row.component';
import { DataGeneratorResult, type DataGeneratorResultRow } from './data-generator-result.component';

const ITEM_LABELS: Record<TransactionDataItem, string> = {
  accounts: 'Contas',
  creditCards: 'Cartões de crédito',
  transactions: 'Transações avulsas',
};

const INITIAL_SELECTION: TransactionDataSelection = { accounts: true, creditCards: true, transactions: true };

const DEFAULT_VALUES: TransactionDataFormData = {
  accounts: '3',
  creditCards: '2',
  transactions: '150',
  months: '3',
  seed: '',
};

/** Unchecked items are sent as `0`; an empty seed is not sent (the server draws one). */
function toTransactionDataRequest(
  data: TransactionDataFormData,
  selection: TransactionDataSelection,
): TransactionDataRequestDTO {
  const quantityOf = (item: TransactionDataItem) => (selection[item] ? (parseInteger(data[item]) ?? 0) : 0);
  const seed = parseInteger(data.seed);

  return {
    accounts: quantityOf('accounts'),
    creditCards: quantityOf('creditCards'),
    transactions: quantityOf('transactions'),
    months: parseInteger(data.months) ?? 0,
    ...(seed === null ? {} : { seed }),
  };
}

function toResultRows(summary: TransactionDataSummaryDTO): DataGeneratorResultRow[] {
  return [
    { label: ITEM_LABELS.accounts, summary: summary.accounts },
    { label: ITEM_LABELS.creditCards, summary: summary.creditCards },
    { label: ITEM_LABELS.transactions, summary: summary.transactions },
  ];
}

function formatCreatedTotal(summary: TransactionDataSummaryDTO): string {
  const total = summary.accounts.created + summary.creditCards.created + summary.transactions.created;
  if (total === 0) return 'Nenhum registro criado.';
  return total === 1 ? '1 registro criado.' : `${total} registros criados.`;
}

export function TransactionDataGenerator() {
  const monthsId = useId();
  const seedId = useId();
  const [selection, setSelection] = useState<TransactionDataSelection>(INITIAL_SELECTION);
  // The resolver follows the checkboxes: an unchecked item has its quantity ignored.
  const resolver = useMemo(() => v.resolver(createTransactionDataSchema(selection)), [selection]);
  const form = useForm<TransactionDataFormData>({ resolver, defaultValues: DEFAULT_VALUES });
  const { errors } = form.formState;
  const { generate, isSubmitting, summary, error } = useGenerateTransactionData();

  function handleSelectionChange(item: TransactionDataItem, checked: boolean) {
    setSelection((current) => ({ ...current, [item]: checked }));
    form.clearErrors([item, TRANSACTION_DATA_SELECTION_FIELD]);
  }

  async function handleGenerate(data: TransactionDataFormData) {
    const result = await generate(toTransactionDataRequest(data, selection));
    // On failure the translated error is shown below and the typed values stay.
    if (result.ok) toast.success(formatCreatedTotal(result.summary));
  }

  function renderQuantityRow(item: TransactionDataItem) {
    return (
      <DataGeneratorQuantityRow
        label={ITEM_LABELS[item]}
        checked={selection[item]}
        onCheckedChange={(checked) => handleSelectionChange(item, checked)}
        max={TRANSACTION_DATA_ITEM_LIMITS[item]}
        field={form.register(item)}
        error={errors[item]?.message}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações avulsas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cria contas, cartões de crédito e lançamentos sem recorrência distribuídos pelo período.
        </p>
      </CardHeader>

      <CardContent className="space-y-10">
        <form onSubmit={form.handleSubmit(handleGenerate)} noValidate className="space-y-10">
          <FormSectionLayout
            title="Cadastros de apoio"
            description="Contas e cartões aos quais as transações podem ser vinculadas."
          >
            {renderQuantityRow('accounts')}
            {renderQuantityRow('creditCards')}
          </FormSectionLayout>

          <FormSectionLayout
            title="Transações"
            description="Lançamentos avulsos ligados às contas e aos cartões existentes e aos criados nesta execução."
          >
            {renderQuantityRow('transactions')}
          </FormSectionLayout>

          <FormSectionLayout
            title="Opções"
            description="O período conta o mês atual inteiro. A mesma semente reproduz a mesma execução."
            showDivider={false}
          >
            <div className="space-y-2">
              <Label htmlFor={monthsId}>Período (meses)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={monthsId}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={DEV_DATA_LIMITS.maxMonths}
                  step={1}
                  className="w-28"
                  aria-invalid={Boolean(errors.months)}
                  {...form.register('months')}
                />
                <span className="text-xs text-muted-foreground">máx. {DEV_DATA_LIMITS.maxMonths}</span>
              </div>
              {errors.months?.message ? <FormErrorMessage>{errors.months.message}</FormErrorMessage> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={seedId}>Semente</Label>
              <Input
                id={seedId}
                inputMode="numeric"
                placeholder="Vazia para sortear"
                className="max-w-xs"
                aria-invalid={Boolean(errors.seed)}
                {...form.register('seed')}
              />
              {errors.seed?.message ? <FormErrorMessage>{errors.seed.message}</FormErrorMessage> : null}
            </div>
          </FormSectionLayout>

          <div className="flex flex-col items-end gap-3">
            {errors.selection?.message ? (
              <FormErrorMessage size="sm">{errors.selection.message}</FormErrorMessage>
            ) : null}
            {error ? <FormErrorMessage size="sm">{error}</FormErrorMessage> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Gerando...' : 'Gerar dados'}
            </Button>
          </div>
        </form>

        <DataGeneratorResult rows={summary ? toResultRows(summary) : null} seed={summary?.seed ?? null} />
      </CardContent>
    </Card>
  );
}
