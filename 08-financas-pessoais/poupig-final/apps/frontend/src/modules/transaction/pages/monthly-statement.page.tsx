'use client';

import { useId, useMemo, useState } from 'react';
import { Plus, Repeat, RotateCcw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { SeriesKind, StatementEntryKind, type StatementEntryDTO } from '@poupig/transaction';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { FormSkeleton } from '@/shared/components/ui/form-skeleton';
import { Label } from '@/shared/components/ui/label';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { ReadonlyTextField } from '@/shared/components/ui/readonly-text-field';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { useSelectedMonth } from '@/shared/hooks/selected-month.hook';
import { StatementCardsComponent } from '../components/statement-card.component';
import { StatementFiltersPanelComponent } from '../components/statement-filters-panel.component';
import { StatementTableComponent } from '../components/statement-table.component';
import { StatementToolbarComponent } from '../components/statement-toolbar.component';
import { TransactionFormComponent } from '../components/transaction-form.component';
import { TransactionSeriesFormComponent } from '../components/transaction-series-form.component';
import { groupStatementEntries } from '../data/group-statement-entries';
import type { ScheduledTransactionDTO } from '../data/scheduled-transaction-api.client';
import type { ListStatementParams } from '../data/statement-api.client';
import { formatDateOnly, formatMonthInSentence } from '../data/statement-format';
import type { SaveTransactionInput } from '../data/transaction-api.client';
import type { SaveTransactionSeriesInput } from '../data/transaction-series-api.client';
import { SERIES_KIND_LABELS } from '../data/transaction-series.labels';
import {
  useResetScheduledTransaction,
  useSaveScheduledTransaction,
  useScheduledTransaction,
} from '../data/use-scheduled-transaction';
import { useStatement, useToggleStatementEntrySettled } from '../data/use-statement';
import { useStatementPreferences } from '../data/use-statement-preferences';
import {
  useCreateTransactionSeries,
  useDeleteTransactionSeries,
  useTransactionSeries,
  useUpdateTransactionSeries,
} from '../data/use-transaction-series';
import { useDeleteTransaction, useSaveTransaction, useTransactionOptions } from '../data/use-transactions';

/** The address of an occurrence of a series: never its (possibly ephemeral) `id`. */
type OccurrenceAddress = { seriesId: string; occurrenceIndex: number };

type ViewMode =
  | { kind: 'list' }
  | { kind: 'form'; transaction?: StatementEntryDTO }
  | ({ kind: 'scheduled-form' } & OccurrenceAddress)
  | { kind: 'series-form'; seriesId?: string; returnTo?: OccurrenceAddress };

type TransactionOptions = ReturnType<typeof useTransactionOptions>;

/**
 * Entries settled/unsettled locally, valid only for the response array they were
 * applied on. A new response brings a new array, so the overlay is ignored
 * naturally, without any cleanup effect.
 */
type SettledOverlay = { source: StatementEntryDTO[] | null; items: Record<string, StatementEntryDTO> };

const EMPTY_OVERLAY: SettledOverlay = { source: null, items: {} };

const LIST_MODE: ViewMode = { kind: 'list' };

export function MonthlyStatementPage() {
  const { selectedMonth, monthStart, monthEnd, monthLabel } = useSelectedMonth();
  const { preferences, setView, setGrouping, toggleFilters, setFilter, clearFilters } = useStatementPreferences();
  const statementFilters = preferences.filters;
  const [search, setSearch] = useState('');

  const statementParams = useMemo<ListStatementParams>(
    () => ({ ...statementFilters, search, from: monthStart, to: monthEnd }),
    [statementFilters, search, monthStart, monthEnd],
  );

  const trimmedSearch = search.trim();
  const hasCardFilter = Boolean(statementFilters.creditCardId) || statementFilters.onlyCreditCard === true;
  const hasStatusFilter = Boolean(statementFilters.status);
  const activeFilterCount = [
    trimmedSearch,
    statementFilters.direction,
    statementFilters.status,
    statementFilters.accountId,
    hasCardFilter,
  ].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;

  const { entries, total, isLoading, error, refresh } = useStatement(statementParams);
  const options = useTransactionOptions();
  const { save, isSubmitting } = useSaveTransaction();
  const { remove, isDeleting } = useDeleteTransaction();
  const { toggleSettled, togglingId } = useToggleStatementEntrySettled();
  const { create: createSeries, isSubmitting: isSubmittingSeries } = useCreateTransactionSeries();

  const [mode, setMode] = useState<ViewMode>(LIST_MODE);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [settledOverlay, setSettledOverlay] = useState<SettledOverlay>(EMPTY_OVERLAY);
  const filtersPanelId = useId();

  const visibleEntries = useMemo(
    () =>
      settledOverlay.source === entries ? entries.map((entry) => settledOverlay.items[entry.id] ?? entry) : entries,
    [settledOverlay, entries],
  );
  const groups = useMemo(
    () => groupStatementEntries(visibleEntries, preferences.grouping),
    [visibleEntries, preferences.grouping],
  );

  function handleClearFilters() {
    clearFilters();
    setSearch('');
  }

  function handleNewTransaction() {
    setMode({ kind: 'form' });
  }

  function handleNewSeries() {
    setMode({ kind: 'series-form' });
  }

  function handleOpen(entry: StatementEntryDTO) {
    if (entry.kind === StatementEntryKind.SCHEDULED && entry.seriesId !== null && entry.occurrenceIndex !== null) {
      setMode({ kind: 'scheduled-form', seriesId: entry.seriesId, occurrenceIndex: entry.occurrenceIndex });
      return;
    }
    setMode({ kind: 'form', transaction: entry });
  }

  function backToList() {
    setIsDeleteDialogOpen(false);
    setMode(LIST_MODE);
  }

  /** Something on the month may have changed: back to the list and ask the statement again. */
  function backToReloadedList() {
    refresh();
    backToList();
  }

  function showNotFound(message: string) {
    toast.error(message);
    backToList();
  }

  async function handleToggleSettled(entry: StatementEntryDTO) {
    // Tie the result to the response on screen when the click happened.
    const source = entries;
    const shouldReload = hasStatusFilter;

    const updated = await toggleSettled(entry);
    if (!updated) return;

    if (shouldReload) {
      // The entry may no longer match the situation filter and has to leave the list.
      refresh();
      return;
    }

    setSettledOverlay((current) => ({
      source,
      items: { ...(current.source === source ? current.items : {}), [updated.id]: updated },
    }));
  }

  if (mode.kind === 'scheduled-form') {
    return (
      <ScheduledTransactionFormView
        key={`${mode.seriesId}:${mode.occurrenceIndex}`}
        seriesId={mode.seriesId}
        occurrenceIndex={mode.occurrenceIndex}
        options={options}
        onNotFound={showNotFound}
        onCancel={backToList}
        onDone={backToReloadedList}
        onEditSeries={() =>
          setMode({
            kind: 'series-form',
            seriesId: mode.seriesId,
            returnTo: { seriesId: mode.seriesId, occurrenceIndex: mode.occurrenceIndex },
          })
        }
      />
    );
  }

  if (mode.kind === 'series-form' && mode.seriesId) {
    const { returnTo } = mode;

    return (
      <SeriesEditView
        key={mode.seriesId}
        seriesId={mode.seriesId}
        options={options}
        onNotFound={showNotFound}
        onCancel={() => (returnTo ? setMode({ kind: 'scheduled-form', ...returnTo }) : backToList())}
        onDone={backToReloadedList}
      />
    );
  }

  if (mode.kind === 'series-form') {
    /** The occurrences generated by the new series may fall on the selected month, so the list is reloaded. */
    const handleSubmitSeries = async (input: SaveTransactionSeriesInput) => {
      const result = await createSeries(input);
      if (result.ok) {
        toast.success('Série criada com sucesso!');
        backToReloadedList();
      } else {
        toast.error(result.error);
      }
    };

    return (
      <div className="w-full">
        <PageSectionHeader badge="Extrato Mensal" title="Nova série de transações" />
        {options.error ? <FormErrorMessage size="sm">{options.error}</FormErrorMessage> : null}
        <TransactionSeriesFormComponent
          options={options}
          isLoadingOptions={options.isLoading}
          isSubmitting={isSubmittingSeries}
          onSubmit={handleSubmitSeries}
          onCancel={backToList}
        />
      </div>
    );
  }

  if (mode.kind === 'form') {
    const editingTransaction = mode.transaction;

    const handleSubmit = async (input: SaveTransactionInput) => {
      const result = await save(input, editingTransaction?.id);
      if (result.ok) {
        toast.success(editingTransaction ? 'Transação atualizada com sucesso!' : 'Transação criada com sucesso!');
        backToReloadedList();
      } else {
        toast.error(result.error);
      }
    };

    const handleConfirmDelete = async () => {
      if (!editingTransaction) return;

      const result = await remove(editingTransaction.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success('Transação excluída com sucesso!');
      backToReloadedList();
    };

    return (
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{editingTransaction ? 'Editar transação' : 'Nova transação'}</h1>
          {editingTransaction ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
              Excluir
            </Button>
          ) : null}
        </div>
        {options.error ? <FormErrorMessage size="sm">{options.error}</FormErrorMessage> : null}
        <TransactionFormComponent
          key={editingTransaction?.id ?? 'new'}
          transaction={editingTransaction}
          options={options}
          isLoadingOptions={options.isLoading}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={backToList}
        />

        {editingTransaction ? (
          <DeleteConfirmationDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleConfirmDelete}
            title="Excluir transação"
            description="Esta ação irá excluir a transação, que deixará de aparecer no extrato."
            itemLabel="Transação"
            itemValue={editingTransaction.name}
            isConfirming={isDeleting}
          />
        ) : null}
      </div>
    );
  }

  const monthInSentence = formatMonthInSentence(selectedMonth);

  function renderContent() {
    if (isLoading) {
      return <p className="text-sm text-muted-foreground">Carregando transações...</p>;
    }
    if (error) {
      return <p className="text-destructive">{error}</p>;
    }
    if (groups.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4">
          <EmptyListState
            title={`Nenhuma transação em ${monthInSentence}`}
            subtitle={
              hasFilters
                ? 'Nenhuma transação do mês atende aos filtros aplicados. Ajuste ou limpe os filtros para ver mais lançamentos.'
                : `Registre a primeira transação de ${monthInSentence} para começar a acompanhar o mês.`
            }
          />
          {hasFilters ? (
            <Button type="button" variant="outline" onClick={handleClearFilters}>
              <X className="size-4" />
              Limpar filtros
            </Button>
          ) : (
            <Button type="button" onClick={handleNewTransaction}>
              <Plus className="size-4" />
              Nova transação
            </Button>
          )}
        </div>
      );
    }
    if (preferences.view === 'table') {
      return (
        <StatementTableComponent
          groups={groups}
          grouping={preferences.grouping}
          togglingId={togglingId}
          onToggleSettled={handleToggleSettled}
          onOpen={handleOpen}
        />
      );
    }
    return (
      <StatementCardsComponent
        groups={groups}
        togglingId={togglingId}
        onToggleSettled={handleToggleSettled}
        onOpen={handleOpen}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
        <PageSectionHeader badge="Extrato Mensal" title={monthLabel} />

        <StatementToolbarComponent
          search={search}
          onSearchChange={setSearch}
          filtersOpen={preferences.filtersOpen}
          filtersPanelId={filtersPanelId}
          activeFilterCount={activeFilterCount}
          onToggleFilters={toggleFilters}
          grouping={preferences.grouping}
          onGroupingChange={setGrouping}
          view={preferences.view}
          onViewChange={setView}
          total={isLoading || error ? null : total}
          onCreateSingle={handleNewTransaction}
          onCreateSeries={handleNewSeries}
        />

        {preferences.filtersOpen ? (
          <StatementFiltersPanelComponent
            id={filtersPanelId}
            filters={statementFilters}
            accounts={options.accounts}
            creditCards={options.creditCards}
            hasActiveFilters={hasFilters}
            onFilterChange={setFilter}
            onClearFilters={handleClearFilters}
          />
        ) : null}

        {renderContent()}
      </div>
    </TooltipProvider>
  );
}

/** Read-only block with the series an occurrence comes from, rendered before the first form section. */
function SeriesOriginSection({ occurrence }: { occurrence: ScheduledTransactionDTO }) {
  const seriesNameId = useId();
  const seriesKindId = useId();
  const installmentId = useId();
  const occurrenceOnId = useId();

  const isInstallmentPlan = occurrence.seriesKind === SeriesKind.CLOSED && occurrence.installments !== null;
  const wasMoved = occurrence.expectedOn !== occurrence.occurrenceOn;

  return (
    <FormSectionLayout title="Série" description="Série de origem desta transação.">
      <div className="space-y-2">
        <Label htmlFor={seriesNameId}>Nome da série</Label>
        <ReadonlyTextField id={seriesNameId} value={occurrence.seriesName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={seriesKindId}>Tipo</Label>
        <ReadonlyTextField id={seriesKindId} value={SERIES_KIND_LABELS[occurrence.seriesKind]} />
      </div>

      {isInstallmentPlan ? (
        <div className="space-y-2">
          <Label htmlFor={installmentId}>Ocorrência</Label>
          <ReadonlyTextField
            id={installmentId}
            value={`Parcela ${occurrence.occurrenceIndex + 1} de ${occurrence.installments}`}
          />
        </div>
      ) : null}

      {wasMoved ? (
        <div className="space-y-2">
          <Label htmlFor={occurrenceOnId}>Data original</Label>
          <ReadonlyTextField id={occurrenceOnId} value={formatDateOnly(occurrence.occurrenceOn)} />
        </div>
      ) : null}
    </FormSectionLayout>
  );
}

type ScheduledTransactionFormViewProps = OccurrenceAddress & {
  options: TransactionOptions;
  onNotFound: (message: string) => void;
  onCancel: () => void;
  onDone: () => void;
  onEditSeries: () => void;
};

/** Always an edit form: the occurrence comes from the API, stored or generated from the series. */
function ScheduledTransactionFormView({
  seriesId,
  occurrenceIndex,
  options,
  onNotFound,
  onCancel,
  onDone,
  onEditSeries,
}: ScheduledTransactionFormViewProps) {
  const { scheduledTransaction, isLoading, isMaterialized, isNotFound, error } = useScheduledTransaction(
    seriesId,
    occurrenceIndex,
    { onNotFound },
  );
  const { save, isSubmitting } = useSaveScheduledTransaction();
  const { reset, isResetting } = useResetScheduledTransaction();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  async function handleSubmit(input: SaveTransactionInput) {
    if (!scheduledTransaction) return;

    const result = await save(seriesId, occurrenceIndex, { id: scheduledTransaction.id, ...input });
    if (result.ok) {
      toast.success('Transação da série salva com sucesso!');
      onDone();
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmReset() {
    const result = await reset(seriesId, occurrenceIndex);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setIsResetDialogOpen(false);
    toast.success('Transação revertida para a série com sucesso!');
    onDone();
  }

  function renderBody() {
    if (isLoading) return <FormSkeleton sections={3} className="py-6" />;
    // The page has already been told and is going back to the list.
    if (isNotFound) return null;
    if (!scheduledTransaction) return error ? <FormErrorMessage size="sm">{error}</FormErrorMessage> : null;

    return (
      <TransactionFormComponent
        key={scheduledTransaction.id}
        transaction={scheduledTransaction}
        leadingSection={<SeriesOriginSection occurrence={scheduledTransaction} />}
        options={options}
        isLoadingOptions={options.isLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="w-full">
      <PageSectionHeader
        badge="Extrato Mensal"
        title="Transação da série"
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onEditSeries}>
              <Repeat className="size-4" />
              Editar série
            </Button>
            {isMaterialized ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => setIsResetDialogOpen(true)}
              >
                <RotateCcw className="size-4" />
                Reverter para a série
              </Button>
            ) : null}
          </div>
        }
      />
      {options.error ? <FormErrorMessage size="sm">{options.error}</FormErrorMessage> : null}
      {renderBody()}

      {scheduledTransaction && isMaterialized ? (
        <DeleteConfirmationDialog
          open={isResetDialogOpen}
          onOpenChange={setIsResetDialogOpen}
          onConfirm={handleConfirmReset}
          title="Reverter para a série"
          description="As alterações desta ocorrência serão descartadas e ela voltará a seguir a série."
          itemLabel="Transação"
          itemValue={scheduledTransaction.name}
          confirmWord="reverter"
          confirmLabel="Reverter"
          isConfirming={isResetting}
        />
      ) : null}
    </div>
  );
}

type SeriesEditViewProps = {
  seriesId: string;
  options: TransactionOptions;
  onNotFound: (message: string) => void;
  onCancel: () => void;
  onDone: () => void;
};

/** The same form of the creation, filled with the stored series; the only entry point is an occurrence. */
function SeriesEditView({ seriesId, options, onNotFound, onCancel, onDone }: SeriesEditViewProps) {
  const { series, isLoading, isNotFound, error } = useTransactionSeries(seriesId, { onNotFound });
  const { update, isSubmitting } = useUpdateTransactionSeries();
  const { remove, isDeleting } = useDeleteTransactionSeries();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  async function handleSubmit(input: SaveTransactionSeriesInput) {
    const result = await update(seriesId, input);
    if (result.ok) {
      toast.success('Série atualizada com sucesso!');
      onDone();
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmDelete() {
    const result = await remove(seriesId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setIsDeleteDialogOpen(false);
    toast.success('Série excluída com sucesso!');
    onDone();
  }

  function renderBody() {
    if (isLoading) return <FormSkeleton sections={4} className="py-6" />;
    // The page has already been told and is going back to the list.
    if (isNotFound) return null;
    if (!series) return error ? <FormErrorMessage size="sm">{error}</FormErrorMessage> : null;

    return (
      // Remounted per series: the stored values apply as `defaultValues`, never through a reset in an effect.
      <TransactionSeriesFormComponent
        key={series.id}
        series={series}
        options={options}
        isLoadingOptions={options.isLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="w-full">
      <PageSectionHeader
        badge="Extrato Mensal"
        title="Editar série"
        subtitle={series ? SERIES_KIND_LABELS[series.kind] : undefined}
        aside={
          series ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
              Excluir série
            </Button>
          ) : undefined
        }
      />
      {options.error ? <FormErrorMessage size="sm">{options.error}</FormErrorMessage> : null}
      {renderBody()}

      {series ? (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Excluir série"
          description="A série deixará de gerar ocorrências e as ocorrências dela já alteradas ou efetivadas deixarão de aparecer no extrato e nos relatórios."
          itemLabel="Série"
          itemValue={series.name}
          isConfirming={isDeleting}
        />
      ) : null}
    </div>
  );
}
