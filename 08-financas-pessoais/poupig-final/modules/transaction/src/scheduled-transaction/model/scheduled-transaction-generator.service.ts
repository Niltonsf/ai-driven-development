import { TransactionStatus } from '../../movement';
import { RecurrenceScheduleCalculator } from '../../transaction-series/model';
import { TransactionSeriesDTO } from '../../transaction-series/dto';
import { ScheduledTransactionDTO } from '../dto';
import { ScheduledTransaction } from './scheduled-transaction.entity';

/** Inclusive period, with both dates in the `YYYY-MM-DD` format. */
export interface ScheduledTransactionPeriod {
  from: string;
  to: string;
}

/** Tells whether the occurrence `(seriesId, occurrenceIndex)` is already stored. */
export type IsOccurrenceMaterialized = (seriesId: string, occurrenceIndex: number) => boolean;

/**
 * Generates in memory the occurrences of a transaction series. Pure: no
 * storage access, and every date comes from the `RecurrenceScheduleCalculator`.
 */
export class ScheduledTransactionGenerator {
  /**
   * The date of the occurrence `occurrenceIndex` of the series, or `null` when
   * the index does not belong to it: not a non-negative integer, `>= installments`
   * in an installment plan, or a date after `endDate`. This is the only rule of
   * the module that decides whether an occurrence exists.
   */
  static occurrenceDate(series: TransactionSeriesDTO, occurrenceIndex: number): string | null {
    if (!Number.isInteger(occurrenceIndex) || occurrenceIndex < 0) return null;
    if (series.installments !== null && occurrenceIndex >= series.installments) return null;

    const date = RecurrenceScheduleCalculator.occurrenceAt(series.startDate, series.recurrence, occurrenceIndex);
    if (series.endDate !== null && date > series.endDate) return null;

    return date;
  }

  /**
   * The occurrences of the series inside the period that are not stored yet, as
   * valid entities with a freshly generated (ephemeral) `id`, `PENDING` status,
   * no settlement date, `occurrenceOn` equal to `expectedOn` and the fields of
   * the series copied.
   *
   * A valid series always produces valid occurrences, so a validation failure
   * here is a programming defect: `ScheduledTransaction.create` throws instead
   * of silently dropping the occurrence.
   */
  static generateForPeriod(
    series: TransactionSeriesDTO,
    period: ScheduledTransactionPeriod,
    isMaterialized: IsOccurrenceMaterialized,
  ): ScheduledTransaction[] {
    const occurrences = RecurrenceScheduleCalculator.occurrencesBetween(series.startDate, series.recurrence, {
      from: period.from,
      to: period.to,
      endDate: series.endDate,
      installments: series.installments,
    });

    return occurrences
      .filter((occurrence) => !isMaterialized(series.id, occurrence.index))
      .map((occurrence) =>
        ScheduledTransaction.create({
          userId: series.userId,
          seriesId: series.id,
          occurrenceIndex: occurrence.index,
          occurrenceOn: occurrence.date,
          name: series.name,
          note: series.note,
          value: series.value,
          direction: series.direction,
          accountId: series.accountId,
          creditCardId: series.creditCardId,
          subcategoryId: series.subcategoryId,
          status: TransactionStatus.PENDING,
          expectedOn: occurrence.date,
          settledOn: null,
        }),
      );
  }

  /**
   * Projects a generated occurrence with `materialized: false`, adding the
   * reference names and the context of the series that only the projection knows.
   */
  static toGeneratedDTO(entity: ScheduledTransaction, series: TransactionSeriesDTO): ScheduledTransactionDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      seriesId: entity.seriesId,
      occurrenceIndex: entity.occurrenceIndex,
      occurrenceOn: entity.occurrenceOn,
      name: entity.name,
      note: entity.note,
      value: entity.value,
      direction: entity.direction,
      accountId: entity.accountId,
      accountName: series.accountName,
      creditCardId: entity.creditCardId,
      creditCardName: series.creditCardName,
      subcategoryId: entity.subcategoryId,
      subcategoryName: series.subcategoryName,
      categoryName: series.categoryName,
      status: entity.status,
      expectedOn: entity.expectedOn,
      settledOn: entity.settledOn,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      materialized: false,
      seriesName: series.name,
      seriesKind: series.kind,
      installments: series.installments,
    };
  }
}
