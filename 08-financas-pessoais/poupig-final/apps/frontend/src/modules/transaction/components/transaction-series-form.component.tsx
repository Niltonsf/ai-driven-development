'use client';

import { useId, useState } from 'react';
import { Controller, useForm, useWatch, type DefaultValues, type Resolver } from 'react-hook-form';
import { DateOnly, PositiveInteger } from '@poupig/shared';
import {
  DayOfWeek,
  Direction,
  FrequencyUnit,
  MAX_INSTALLMENTS,
  MAX_RECURRENCE_INTERVAL,
  RecurrenceScheduleCalculator,
  SeriesKind,
  isDirection,
  isFrequencyUnit,
  isSeriesKind,
  tryCreateRecurrenceRule,
  type RecurrenceRule,
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
import { ReadonlyTextField } from '@/shared/components/ui/readonly-text-field';
import { Textarea } from '@/shared/components/ui/textarea';
import { v } from '@/shared/components/form/validator';
import type { SaveTransactionSeriesInput, TransactionSeriesDTO } from '../data/transaction-series-api.client';
import {
  DAY_OF_WEEK_LABELS,
  FREQUENCY_UNIT_LABELS,
  MONTH_LABELS,
  SERIES_KIND_LABELS,
} from '../data/transaction-series.labels';
import { transactionSeriesSchema, type TransactionSeriesFormData } from '../data/transaction-series.schema';
import { DIRECTION_LABELS } from '../data/transaction.labels';
import type { TransactionOptions } from '../data/use-transactions';

const DIRECTION_OPTIONS = [Direction.OUT, Direction.IN];

const KIND_OPTIONS = [SeriesKind.CLOSED, SeriesKind.OPEN];

const UNIT_OPTIONS = Object.values(FrequencyUnit).map((unit) => ({
  label: FREQUENCY_UNIT_LABELS[unit],
  value: unit,
}));

const WEEK_DAY_OPTIONS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
].map((weekDay) => ({ label: DAY_OF_WEEK_LABELS[weekDay], value: String(weekDay) }));

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  label: MONTH_LABELS[index + 1],
  value: String(index + 1),
}));

/** Phrase shown next to the interval, so the frequency reads as plain Portuguese. */
const INTERVAL_PHRASES: Record<FrequencyUnit, { single: string; plural: string }> = {
  [FrequencyUnit.WEEK]: { single: 'toda semana', plural: 'semanas' },
  [FrequencyUnit.MONTH]: { single: 'todo mês', plural: 'meses' },
  [FrequencyUnit.YEAR]: { single: 'todo ano', plural: 'anos' },
};

const PREVIEW_OCCURRENCES = 3;

type SchedulePreview = { occurrences: string[]; lastOccurrence: string | null };

const EMPTY_SCHEDULE_PREVIEW: SchedulePreview = { occurrences: [], lastOccurrence: null };

type TransactionSeriesFormProps = {
  /**
   * The series being edited. The values only apply on mount, so the page renders
   * the form with `key={series.id}` after loading instead of resetting it.
   */
  series?: TransactionSeriesDTO;
  options: TransactionOptions;
  isLoadingOptions?: boolean;
  isSubmitting: boolean;
  onSubmit: (input: SaveTransactionSeriesInput) => void;
  onCancel: () => void;
};

/** Today in the browser's local time zone (`toISOString` would shift the day at night in UTC-3). */
function getTodayDateOnly(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * The anchors suggested by the chosen start date. This only reads the date the
 * user picked — the schedule arithmetic lives in the domain calculator.
 */
function deriveAnchor(startDate: string): { weekDay: string; dayOfMonth: string; month: string } {
  const [yearText, monthText, dayText] = startDate.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return { weekDay: '', dayOfMonth: '', month: '' };
  }

  // ISO week day (Monday = 1 … Sunday = 7) from the UTC week day (Sunday = 0).
  const isoWeekDay = ((new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7) + 1;
  return { weekDay: String(isoWeekDay), dayOfMonth: String(day), month: String(month) };
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/** The filled number of installments when the entity would accept it, `null` otherwise. */
function toInstallments(value?: string): number | null {
  if (!value?.trim()) return null;

  const parsed = PositiveInteger.tryCreate(Number(value.trim()));
  if (parsed.isFailure || parsed.instance.value > MAX_INSTALLMENTS) return null;

  return parsed.instance.value;
}

function intervalPhrase(unit: FrequencyUnit, interval?: string): string {
  const phrases = INTERVAL_PHRASES[unit];
  const parsed = Number(interval?.trim());

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_RECURRENCE_INTERVAL) return '';
  if (parsed === 1) return phrases.single;

  return `a cada ${parsed} ${phrases.plural}`;
}

type SchedulePreviewInput = {
  kind: SeriesKind;
  unit: FrequencyUnit;
  startDate?: string;
  interval?: string;
  weekDay?: string;
  dayOfMonth?: string;
  month?: string;
  installments?: string;
};

/**
 * Derived on render from the current values, by the same calculation the entity
 * uses, so the preview and the stored dates never diverge. An incomplete start
 * date or rule shows no date at all.
 */
function toSchedulePreview(values: SchedulePreviewInput): SchedulePreview {
  const start = DateOnly.tryCreate(values.startDate ?? '');
  if (start.isFailure) return EMPTY_SCHEDULE_PREVIEW;

  const rule = tryCreateRecurrenceRule(values);
  if (rule.isFailure) return EMPTY_SCHEDULE_PREVIEW;

  const startDate = start.instance.value;
  const installments = values.kind === SeriesKind.CLOSED ? toInstallments(values.installments) : null;
  const count = installments === null ? PREVIEW_OCCURRENCES : Math.min(PREVIEW_OCCURRENCES, installments);

  return {
    occurrences: Array.from({ length: count }, (_, index) =>
      formatDateOnly(RecurrenceScheduleCalculator.occurrenceAt(startDate, rule.instance, index)),
    ),
    lastOccurrence:
      installments === null
        ? null
        : formatDateOnly(RecurrenceScheduleCalculator.lastOccurrence(startDate, rule.instance, installments)),
  };
}

/**
 * Creating starts from today; editing flattens the stored rule back into the
 * fields. The anchors of the other units keep the ones derived from the start
 * date, so switching the frequency still finds a sensible value.
 */
function toDefaultValues(series?: TransactionSeriesDTO): DefaultValues<TransactionSeriesFormData> {
  if (series) {
    const { recurrence } = series;
    const anchor = deriveAnchor(series.startDate);
    const isClosed = series.kind === SeriesKind.CLOSED;

    return {
      name: series.name,
      value: series.value,
      direction: series.direction,
      accountId: series.accountId,
      creditCardId: series.creditCardId ?? '',
      subcategoryId: series.subcategoryId ?? '',
      kind: series.kind,
      startDate: series.startDate,
      unit: recurrence.unit,
      interval: String(recurrence.interval),
      weekDay: 'weekDay' in recurrence ? String(recurrence.weekDay) : anchor.weekDay,
      dayOfMonth: 'dayOfMonth' in recurrence ? String(recurrence.dayOfMonth) : anchor.dayOfMonth,
      month: 'month' in recurrence ? String(recurrence.month) : anchor.month,
      installments: isClosed && series.installments !== null ? String(series.installments) : '',
      endDate: isClosed ? '' : (series.endDate ?? ''),
      note: series.note ?? '',
    };
  }

  const startDate = getTodayDateOnly();
  const anchor = deriveAnchor(startDate);

  return {
    name: '',
    value: undefined,
    direction: Direction.OUT,
    accountId: '',
    creditCardId: '',
    subcategoryId: '',
    kind: SeriesKind.CLOSED,
    startDate,
    unit: FrequencyUnit.MONTH,
    interval: '1',
    weekDay: anchor.weekDay,
    dayOfMonth: anchor.dayOfMonth,
    month: anchor.month,
    installments: '',
    endDate: '',
    note: '',
  };
}

function toNullable(value?: string): string | null {
  return value?.trim() ? value : null;
}

/**
 * The payload is built from the normalized rule: the anchors of the other units
 * disappear as `null`, the installments only exist in an installment plan and
 * the end date only in a recurrence.
 */
function toSaveInput(data: TransactionSeriesFormData, rule: RecurrenceRule): SaveTransactionSeriesInput {
  const isClosed = data.kind === SeriesKind.CLOSED;

  return {
    name: data.name,
    note: toNullable(data.note),
    value: data.value,
    direction: data.direction,
    accountId: data.accountId,
    creditCardId: toNullable(data.creditCardId),
    subcategoryId: toNullable(data.subcategoryId),
    kind: data.kind,
    unit: rule.unit,
    interval: rule.interval,
    weekDay: 'weekDay' in rule ? rule.weekDay : null,
    dayOfMonth: 'dayOfMonth' in rule ? rule.dayOfMonth : null,
    month: 'month' in rule ? rule.month : null,
    startDate: data.startDate,
    endDate: isClosed ? null : toNullable(data.endDate),
    installments: isClosed ? toInstallments(data.installments) : null,
  };
}

export function TransactionSeriesFormComponent({
  series,
  options,
  isLoadingOptions = false,
  isSubmitting,
  onSubmit,
  onCancel,
}: TransactionSeriesFormProps) {
  const nameId = useId();
  const valueId = useId();
  const directionId = useId();
  const kindId = useId();
  const startDateId = useId();
  const intervalId = useId();
  const dayOfMonthId = useId();
  const installmentsId = useId();
  const endDateId = useId();
  const noteId = useId();

  const isEditing = series !== undefined;
  const [defaultValues] = useState(() => toDefaultValues(series));
  // The anchor stops being derived from the start date as soon as the user sets it by hand;
  // a stored series already has its anchor chosen.
  const [anchorTouched, setAnchorTouched] = useState(isEditing);

  const form = useForm<TransactionSeriesFormData>({
    // The schema carries the enums and the numbers as `Text`; the form type narrows them.
    resolver: v.resolver(transactionSeriesSchema) as unknown as Resolver<TransactionSeriesFormData>,
    defaultValues,
  });
  const { errors } = form.formState;

  const kind = useWatch({ control: form.control, name: 'kind' });
  const unit = useWatch({ control: form.control, name: 'unit' });
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const interval = useWatch({ control: form.control, name: 'interval' });
  const weekDay = useWatch({ control: form.control, name: 'weekDay' });
  const dayOfMonth = useWatch({ control: form.control, name: 'dayOfMonth' });
  const month = useWatch({ control: form.control, name: 'month' });
  const installments = useWatch({ control: form.control, name: 'installments' });

  const isClosed = kind === SeriesKind.CLOSED;
  const schedule = toSchedulePreview({ kind, unit, startDate, interval, weekDay, dayOfMonth, month, installments });
  const phrase = intervalPhrase(unit, interval);

  const optionsPlaceholder = isLoadingOptions ? 'Carregando...' : 'Selecionar...';
  const creditCardOptions = [{ label: 'Sem cartão', value: '' }, ...options.creditCards];
  const subcategoryOptions = [{ label: 'Sem subcategoria', value: '' }, ...options.subcategories];

  function applyDerivedAnchor(nextStartDate: string) {
    const anchor = deriveAnchor(nextStartDate);
    form.setValue('weekDay', anchor.weekDay);
    form.setValue('dayOfMonth', anchor.dayOfMonth);
    form.setValue('month', anchor.month);
    form.clearErrors(['weekDay', 'dayOfMonth', 'month']);
  }

  function handleStartDateChange(nextStartDate: string, onChange: (value: string) => void) {
    onChange(nextStartDate);
    if (!anchorTouched) applyDerivedAnchor(nextStartDate);
  }

  function handleUnitChange(nextUnit: string, onChange: (value: FrequencyUnit) => void) {
    if (!isFrequencyUnit(nextUnit)) return;

    onChange(nextUnit);
    // The three anchors are refreshed at once, so the next frequency already finds its own.
    if (!anchorTouched) applyDerivedAnchor(startDate);
  }

  function handleAnchorChange(value: string, onChange: (value: string) => void) {
    setAnchorTouched(true);
    onChange(value);
  }

  function handleKindChange(nextKind: string, onChange: (value: SeriesKind) => void) {
    if (!isSeriesKind(nextKind)) return;

    onChange(nextKind);
    if (nextKind === SeriesKind.OPEN) {
      form.setValue('installments', '');
      form.clearErrors('installments');
    } else {
      form.setValue('endDate', '');
      form.clearErrors('endDate');
    }
  }

  function handleValidSubmit(data: TransactionSeriesFormData) {
    const rule = tryCreateRecurrenceRule(data);
    // The schema already approved the rule; this only narrows the type.
    if (rule.isFailure) return;

    onSubmit(toSaveInput(data, rule.instance));
  }

  return (
    <form onSubmit={form.handleSubmit(handleValidSubmit)} className="space-y-10 py-6">
      <FormSectionLayout title="Lançamento" description="O que se repete, quanto e em que sentido.">
        <div className="space-y-2">
          <Label htmlFor={nameId}>Nome *</Label>
          <Input id={nameId} {...form.register('name')} placeholder="Ex: Assinatura de streaming" />
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

      {isEditing ? (
        <div
          role="note"
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
        >
          As alterações valem para as ocorrências ainda não gravadas. As ocorrências já alteradas, efetivadas ou
          canceladas mantêm os próprios valores e podem ser revertidas uma a uma.
        </div>
      ) : null}

      <FormSectionLayout title="Recorrência" description="Com que frequência a série se repete e até quando.">
        <div className="space-y-2">
          <Label id={kindId}>Tipo *</Label>
          <Controller
            name="kind"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                aria-labelledby={kindId}
                className="flex flex-wrap gap-6"
                value={field.value}
                onValueChange={(nextKind) => handleKindChange(nextKind, field.onChange)}
              >
                {KIND_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <RadioGroupItem id={`${kindId}-${option}`} value={option} />
                    <Label htmlFor={`${kindId}-${option}`}>{SERIES_KIND_LABELS[option]}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
          {errors.kind?.message ? <FormErrorMessage>{errors.kind.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={startDateId}>Data de início *</Label>
          <Controller
            name="startDate"
            control={form.control}
            render={({ field }) => (
              <DatePickerInput
                id={startDateId}
                value={field.value}
                onChange={(nextStartDate) => handleStartDateChange(nextStartDate, field.onChange)}
              />
            )}
          />
          {errors.startDate?.message ? <FormErrorMessage>{errors.startDate.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label>Frequência *</Label>
          <Controller
            name="unit"
            control={form.control}
            render={({ field }) => (
              <Combobox
                options={UNIT_OPTIONS}
                value={field.value}
                onChange={(nextUnit) => handleUnitChange(nextUnit, field.onChange)}
              />
            )}
          />
          {errors.unit?.message ? <FormErrorMessage>{errors.unit.message}</FormErrorMessage> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={intervalId}>Intervalo *</Label>
          <div className="flex items-center gap-3">
            <Input
              id={intervalId}
              type="number"
              min={1}
              max={MAX_RECURRENCE_INTERVAL}
              className="w-24"
              {...form.register('interval')}
            />
            {phrase ? <span className="text-sm text-muted-foreground">{phrase}</span> : null}
          </div>
          {errors.interval?.message ? <FormErrorMessage>{errors.interval.message}</FormErrorMessage> : null}
        </div>

        {unit === FrequencyUnit.WEEK ? (
          <div className="space-y-2">
            <Label>Dia da semana *</Label>
            <Controller
              name="weekDay"
              control={form.control}
              render={({ field }) => (
                <Combobox
                  options={WEEK_DAY_OPTIONS}
                  value={field.value ?? ''}
                  onChange={(nextWeekDay) => handleAnchorChange(nextWeekDay, field.onChange)}
                />
              )}
            />
            {errors.weekDay?.message ? <FormErrorMessage>{errors.weekDay.message}</FormErrorMessage> : null}
          </div>
        ) : null}

        {unit === FrequencyUnit.YEAR ? (
          <div className="space-y-2">
            <Label>Mês *</Label>
            <Controller
              name="month"
              control={form.control}
              render={({ field }) => (
                <Combobox
                  options={MONTH_OPTIONS}
                  value={field.value ?? ''}
                  onChange={(nextMonth) => handleAnchorChange(nextMonth, field.onChange)}
                />
              )}
            />
            {errors.month?.message ? <FormErrorMessage>{errors.month.message}</FormErrorMessage> : null}
          </div>
        ) : null}

        {unit === FrequencyUnit.MONTH || unit === FrequencyUnit.YEAR ? (
          <div className="space-y-2">
            <Label htmlFor={dayOfMonthId}>Dia do mês *</Label>
            <Input
              id={dayOfMonthId}
              type="number"
              min={1}
              max={31}
              className="w-24"
              {...form.register('dayOfMonth', { onChange: () => setAnchorTouched(true) })}
            />
            {errors.dayOfMonth?.message ? <FormErrorMessage>{errors.dayOfMonth.message}</FormErrorMessage> : null}
          </div>
        ) : null}

        {isClosed ? (
          <div className="space-y-2">
            <Label htmlFor={installmentsId}>Parcelas *</Label>
            <Input
              id={installmentsId}
              type="number"
              min={1}
              max={MAX_INSTALLMENTS}
              className="w-24"
              placeholder="Ex: 12"
              {...form.register('installments')}
            />
            {errors.installments?.message ? <FormErrorMessage>{errors.installments.message}</FormErrorMessage> : null}
          </div>
        ) : null}

        {isClosed ? (
          <div className="space-y-2">
            <Label htmlFor={endDateId}>Data fim</Label>
            <ReadonlyTextField id={endDateId} value={schedule.lastOccurrence} />
            <p className="text-xs text-muted-foreground">Calculada a partir da última parcela.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={endDateId}>Data fim</Label>
            <Controller
              name="endDate"
              control={form.control}
              render={({ field }) => (
                <DatePickerInput
                  id={endDateId}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sem data fim"
                />
              )}
            />
            {errors.endDate?.message ? <FormErrorMessage>{errors.endDate.message}</FormErrorMessage> : null}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Próximas ocorrências</p>
          {schedule.occurrences.length > 0 ? (
            <p className="text-sm text-muted-foreground tabular-nums">{schedule.occurrences.join(' • ')}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Preencha a data de início e a frequência para ver as datas da série.
            </p>
          )}
          {schedule.lastOccurrence ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              Última parcela em {schedule.lastOccurrence}.
            </p>
          ) : null}
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Observação" description="Detalhes adicionais sobre a série." showDivider={false}>
        <div className="space-y-2">
          <Label htmlFor={noteId}>Observação</Label>
          <Textarea id={noteId} {...form.register('note')} placeholder="Detalhes adicionais sobre a série" />
          {errors.note?.message ? <FormErrorMessage>{errors.note.message}</FormErrorMessage> : null}
        </div>
      </FormSectionLayout>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar série'}
        </Button>
      </div>
    </form>
  );
}
