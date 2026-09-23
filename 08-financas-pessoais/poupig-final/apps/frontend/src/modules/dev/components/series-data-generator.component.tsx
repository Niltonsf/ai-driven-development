'use client';

import { useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { DEV_DATA_LIMITS, type SeriesDataRequestDTO, type SeriesDataSummaryDTO } from '@poupig/dev';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { v } from '@/shared/components/form/validator';
import {
  SERIES_DATA_ITEM_LIMITS,
  SERIES_DATA_SELECTION_FIELD,
  createSeriesDataSchema,
  type SeriesDataFormData,
  type SeriesDataItem,
  type SeriesDataSelection,
} from '../data/series-data.schema';
import { parseInteger } from '../data/transaction-data.schema';
import { useGenerateSeriesData } from '../data/use-data-generator';
import { DataGeneratorQuantityRow } from './data-generator-quantity-row.component';
import { DataGeneratorResult, type DataGeneratorResultRow } from './data-generator-result.component';

const ITEM_LABELS: Record<SeriesDataItem, string> = {
  recurrences: 'Recorrências',
  installmentPlans: 'Parcelamentos',
};

const OCCURRENCES_LABEL = 'Ocorrências';

const INITIAL_SELECTION: SeriesDataSelection = { recurrences: true, installmentPlans: true };

const DEFAULT_VALUES: SeriesDataFormData = {
  recurrences: '5',
  installmentPlans: '3',
  months: '3',
  seed: '',
};

/** Unchecked items are sent as `0`; an empty seed is not sent (the server draws one). */
function toSeriesDataRequest(data: SeriesDataFormData, selection: SeriesDataSelection): SeriesDataRequestDTO {
  const quantityOf = (item: SeriesDataItem) => (selection[item] ? (parseInteger(data[item]) ?? 0) : 0);
  const seed = parseInteger(data.seed);

  return {
    recurrences: quantityOf('recurrences'),
    installmentPlans: quantityOf('installmentPlans'),
    months: parseInteger(data.months) ?? 0,
    ...(seed === null ? {} : { seed }),
  };
}

/**
 * The result table is fixed (requested/created/skipped), so the occurrences are
 * converted into one more row: every occurrence attempted is requested, the
 * settled and pending ones are created and the rejected ones are skipped.
 */
function toSeriesResultRows(summary: SeriesDataSummaryDTO): DataGeneratorResultRow[] {
  const { settled, pending, skipped, errors } = summary.occurrences;

  return [
    { label: ITEM_LABELS.recurrences, summary: summary.recurrences },
    { label: ITEM_LABELS.installmentPlans, summary: summary.installmentPlans },
    {
      label: OCCURRENCES_LABEL,
      summary: { requested: settled + pending + skipped, created: settled + pending, skipped, errors },
    },
  ];
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatOccurrenceDetail(summary: SeriesDataSummaryDTO): string {
  const { settled, pending } = summary.occurrences;
  return `${pluralize(settled, 'efetivada', 'efetivadas')} · ${pluralize(pending, 'pendente', 'pendentes')}`;
}

function formatCreatedTotal(summary: SeriesDataSummaryDTO): string {
  const series = summary.recurrences.created + summary.installmentPlans.created;
  const occurrences = summary.occurrences.settled + summary.occurrences.pending;
  if (series === 0) return 'Nenhuma série criada.';
  return `${pluralize(series, 'série', 'séries')} e ${pluralize(occurrences, 'ocorrência gravada', 'ocorrências gravadas')}.`;
}

export function SeriesDataGenerator() {
  const monthsId = useId();
  const seedId = useId();
  const [selection, setSelection] = useState<SeriesDataSelection>(INITIAL_SELECTION);
  // The resolver follows the checkboxes: an unchecked item has its quantity ignored.
  const resolver = useMemo(() => v.resolver(createSeriesDataSchema(selection)), [selection]);
  const form = useForm<SeriesDataFormData>({ resolver, defaultValues: DEFAULT_VALUES });
  const { errors } = form.formState;
  const { generate, isSubmitting, summary, error } = useGenerateSeriesData();

  function handleSelectionChange(item: SeriesDataItem, checked: boolean) {
    setSelection((current) => ({ ...current, [item]: checked }));
    form.clearErrors([item, SERIES_DATA_SELECTION_FIELD]);
  }

  async function handleGenerate(data: SeriesDataFormData) {
    const result = await generate(toSeriesDataRequest(data, selection));
    // On failure the translated error is shown below and the typed values stay.
    if (result.ok) toast.success(formatCreatedTotal(result.summary));
  }

  function renderQuantityRow(item: SeriesDataItem) {
    return (
      <DataGeneratorQuantityRow
        label={ITEM_LABELS[item]}
        checked={selection[item]}
        onCheckedChange={(checked) => handleSelectionChange(item, checked)}
        max={SERIES_DATA_ITEM_LIMITS[item]}
        field={form.register(item)}
        error={errors[item]?.message}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Séries e parcelas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cria recorrências e parcelamentos ligados às contas e aos cartões existentes, com início dentro do período.
        </p>
      </CardHeader>

      <CardContent className="space-y-10">
        <form onSubmit={form.handleSubmit(handleGenerate)} noValidate className="space-y-10">
          <FormSectionLayout
            title="Séries"
            description="Recorrências sem data de fim e parcelamentos mensais com número fixo de parcelas."
          >
            {renderQuantityRow('recurrences')}
            {renderQuantityRow('installmentPlans')}
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

          <div
            role="note"
            className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground"
          >
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              As ocorrências até o fim do mês atual são gravadas: as anteriores a hoje nascem efetivadas e as de hoje em
              diante, pendentes. É preciso ter ao menos uma conta cadastrada.
            </p>
          </div>

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

        <div className="space-y-2">
          <DataGeneratorResult rows={summary ? toSeriesResultRows(summary) : null} seed={summary?.seed ?? null} />
          {summary ? (
            <p className="text-sm text-muted-foreground">
              {OCCURRENCES_LABEL}: {formatOccurrenceDetail(summary)}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
