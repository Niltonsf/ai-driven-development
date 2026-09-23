import { Id, Result } from '@poupig/shared';
import {
  Direction,
  FindTransactionSeriesByIdQuery,
  FrequencyUnit,
  SeriesKind,
  TransactionSeries,
  TransactionSeriesDTO,
  TransactionSeriesProps,
} from '../../src';

export interface SeriesDTOOverrides extends Partial<TransactionSeriesProps> {
  accountName?: string;
  creditCardName?: string | null;
  subcategoryName?: string | null;
  categoryName?: string | null;
}

/**
 * A `TransactionSeriesDTO` built from a valid `TransactionSeries`, so `endDate`
 * is the one the entity calculates. Default: the installment plan "Notebook" of
 * 12 × R$ 250,00, monthly on day 10, starting on 2026-09-15, in the account "Nubank".
 */
export function seriesDTO(overrides: SeriesDTOOverrides = {}): TransactionSeriesDTO {
  const { accountName, creditCardName, subcategoryName, categoryName, ...props } = overrides;
  const series = TransactionSeries.create({
    userId: Id.createUUID(),
    name: 'Notebook',
    value: 250,
    direction: Direction.OUT,
    accountId: Id.createUUID(),
    kind: SeriesKind.CLOSED,
    recurrence: { unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 10 },
    startDate: '2026-09-15',
    installments: 12,
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
    creditCardName: series.creditCardId ? (creditCardName ?? 'Cartão Nubank') : null,
    subcategoryId: series.subcategoryId,
    subcategoryName: series.subcategoryId ? (subcategoryName ?? 'Mercado') : null,
    categoryName: series.subcategoryId ? (categoryName ?? 'Alimentação') : null,
    kind: series.kind,
    recurrence: series.recurrence,
    startDate: series.startDate,
    endDate: series.endDate,
    installments: series.installments,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  };
}

/** Double of `FindTransactionSeriesByIdQuery`: a soft deleted series is modeled by `softDelete`. */
export class InMemoryFindTransactionSeriesByIdQuery implements FindTransactionSeriesByIdQuery {
  private readonly items = new Map<string, TransactionSeriesDTO>();
  private readonly deleted = new Set<string>();

  add(series: TransactionSeriesDTO): this {
    this.items.set(series.id, series);
    return this;
  }

  softDelete(id: string): this {
    this.deleted.add(id);
    return this;
  }

  async execute(id: string, userId: string): Promise<Result<TransactionSeriesDTO | null>> {
    const series = this.items.get(id);
    if (!series || series.userId !== userId || this.deleted.has(id)) return Result.ok(null);
    return Result.ok(series);
  }
}
