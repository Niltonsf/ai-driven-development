import { Id } from '@poupig/shared';
import {
  Direction,
  FrequencyUnit,
  SeriesKind,
  TransactionSeries,
  TransactionSeriesDTO,
  TransactionSeriesProps,
} from '@poupig/transaction';

export interface SeriesDTOOverrides extends Partial<TransactionSeriesProps> {
  accountName?: string;
  subcategoryName?: string | null;
  categoryName?: string | null;
}

/**
 * A `TransactionSeriesDTO` built from a valid `TransactionSeries`, so `endDate`
 * and `installments` are the ones the entity normalizes. The fixture of the
 * `transaction` module is not exported by the package, hence this local copy.
 *
 * Default: the open outflow series "Aluguel" of R$ 1.500,00, monthly on day 5,
 * starting on 2026-01-01, in a fresh subcategory — so index 8 is 2026-09-05.
 * Pass `subcategoryId: null` for a series without subcategory.
 */
export function seriesDTO(overrides: SeriesDTOOverrides = {}): TransactionSeriesDTO {
  const { accountName, subcategoryName, categoryName, ...props } = overrides;
  const series = TransactionSeries.create({
    userId: Id.createUUID(),
    name: 'Aluguel',
    value: 1500,
    direction: Direction.OUT,
    accountId: Id.createUUID(),
    subcategoryId: Id.createUUID(),
    kind: SeriesKind.OPEN,
    recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 5 },
    startDate: '2026-01-01',
    ...props,
  });

  return {
    id: series.id,
    userId: series.userId,
    name: series.name,
    note: series.note,
    value: series.value,
    direction: series.direction,
    accountId: series.accountId,
    accountName: accountName ?? 'Nubank',
    creditCardId: series.creditCardId,
    creditCardName: null,
    subcategoryId: series.subcategoryId,
    subcategoryName: series.subcategoryId ? (subcategoryName ?? 'Aluguel') : null,
    categoryName: series.subcategoryId ? (categoryName ?? 'Moradia') : null,
    kind: series.kind,
    recurrence: series.recurrence,
    startDate: series.startDate,
    endDate: series.endDate,
    installments: series.installments,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  };
}
