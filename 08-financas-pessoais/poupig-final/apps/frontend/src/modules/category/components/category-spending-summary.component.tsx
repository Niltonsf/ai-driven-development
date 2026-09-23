import { CircleHelp, TrendingDown, Trophy } from 'lucide-react';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { formatSpendingShare, shareOf, type SpendingTotals } from '../data/category-spending-slices';

export type CategorySpendingSummaryProps = {
  totals: SpendingTotals;
};

/** Minimum height of each total card; the loading skeleton of the page uses the same `h-32`. */
export const CATEGORY_SPENDING_SUMMARY_CARD_MIN_HEIGHT = 'min-h-32';

/** Shown instead of a value when there is nothing to show, so an empty card is not read as `R$ 0,00`. */
const EMPTY_VALUE = '—';

const NO_OUTFLOW_TEXT = 'nenhuma saída no mês';

/**
 * Totals of the month. `Total gasto no mês` ignores hidden slices; `Maior gasto`
 * follows what is visible; `Sem classificação` is shown over the month total. It
 * only formats the totals it receives.
 */
export function CategorySpendingSummaryComponent({ totals }: CategorySpendingSummaryProps) {
  const { total, largest, unclassified } = totals;

  return (
    <section aria-label="Totais do mês" className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title="Total gasto no mês"
        subtitle="saídas pendentes e efetivadas"
        value={formatCurrency(total)}
        icon={<TrendingDown />}
        iconColorClassName="text-rose-400"
        className={CATEGORY_SPENDING_SUMMARY_CARD_MIN_HEIGHT}
      />
      <MetricCard
        title="Maior gasto"
        subtitle={largest ? largest.label : total > 0 ? 'todas as fatias estão ocultas' : NO_OUTFLOW_TEXT}
        value={largest ? formatCurrency(largest.total) : EMPTY_VALUE}
        icon={<Trophy />}
        iconColorClassName="text-amber-400"
        className={CATEGORY_SPENDING_SUMMARY_CARD_MIN_HEIGHT}
      />
      <MetricCard
        title="Sem classificação"
        subtitle={
          unclassified
            ? `${formatSpendingShare(shareOf(unclassified.total, total))} do total do mês`
            : total > 0
              ? 'todas as saídas têm subcategoria'
              : NO_OUTFLOW_TEXT
        }
        value={unclassified ? formatCurrency(unclassified.total) : EMPTY_VALUE}
        icon={<CircleHelp />}
        iconColorClassName="text-slate-400"
        className={CATEGORY_SPENDING_SUMMARY_CARD_MIN_HEIGHT}
      />
    </section>
  );
}
