import { Result, UseCase } from '@poupig/shared';
import { FindTransactionSeriesByIdQuery } from '../../transaction-series/provider';
import { ScheduledTransactionDTO } from '../dto';
import { ScheduledTransactionGenerator } from '../model';
import { FindScheduledTransactionByOccurrenceQuery } from '../provider';
import { SaveScheduledTransactionErrors } from './save-scheduled-transaction.use-case';

export interface FindScheduledTransactionInput {
  seriesId: string;
  occurrenceIndex: number;
  userId: string;
}

/**
 * Opens an occurrence of a series: the stored one (`materialized: true`) when
 * it exists, otherwise the occurrence generated in memory from the series
 * (`materialized: false`), without storing anything.
 */
export class FindScheduledTransaction implements UseCase<FindScheduledTransactionInput, ScheduledTransactionDTO> {
  constructor(
    private readonly findScheduledTransactionByOccurrence: FindScheduledTransactionByOccurrenceQuery,
    private readonly findTransactionSeriesById: FindTransactionSeriesByIdQuery,
  ) {}

  async execute(input: FindScheduledTransactionInput): Promise<Result<ScheduledTransactionDTO>> {
    const storedResult = await this.findScheduledTransactionByOccurrence.execute(
      input.seriesId,
      input.occurrenceIndex,
      input.userId,
    );
    if (storedResult.isFailure) return Result.fail(storedResult.errors!);
    if (storedResult.instance) return Result.ok(storedResult.instance);

    const seriesResult = await this.findTransactionSeriesById.execute(input.seriesId, input.userId);
    if (seriesResult.isFailure) return Result.fail(seriesResult.errors!);

    const series = seriesResult.instance;
    if (!series) {
      return Result.fail(SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND);
    }

    const occurrenceOn = ScheduledTransactionGenerator.occurrenceDate(series, input.occurrenceIndex);
    if (occurrenceOn === null) {
      return Result.fail(SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND);
    }

    // The generation of the single-day period keeps the copy of the series fields in one place.
    const generated = ScheduledTransactionGenerator.generateForPeriod(
      series,
      { from: occurrenceOn, to: occurrenceOn },
      () => false,
    ).find((occurrence) => occurrence.occurrenceIndex === input.occurrenceIndex);
    if (!generated) {
      return Result.fail(SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND);
    }

    return Result.ok(ScheduledTransactionGenerator.toGeneratedDTO(generated, series));
  }
}
