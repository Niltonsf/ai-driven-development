import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import {
  Direction,
  FindScheduledTransaction,
  ResetScheduledTransaction,
  SaveScheduledTransaction,
  SaveScheduledTransactionErrors,
  SaveScheduledTransactionInput,
  ScheduledTransactionErrors,
  TransactionStatus,
} from '@poupig/transaction';
import { CurrentUser } from '../../shared/decorators';
import { ScheduledTransactionPrisma } from './scheduled-transaction.prisma';
import { TransactionPrisma } from './transaction.prisma';
import { TransactionSeriesPrisma } from './transaction-series.prisma';

type AuthUser = { id: string; name: string; email: string };

/**
 * Accepted body of the `PUT`: the id of the opened occurrence (generated or
 * stored) and the editable fields. `seriesId` and `occurrenceIndex` come only
 * from the route; `occurrenceOn` and `userId` are never read from the body.
 */
interface SaveScheduledTransactionBody {
  id: string;
  name: string;
  note?: string | null;
  value: number | string;
  direction: Direction;
  accountId: string;
  creditCardId?: string | null;
  subcategoryId?: string | null;
  status?: TransactionStatus;
  expectedOn: string;
  settledOn?: string | null;
}

/** Failures about the address of the occurrence: the resource does not exist. */
const NOT_FOUND_ERRORS: string[] = [
  ScheduledTransactionErrors.SCHEDULED_TRANSACTION_NOT_FOUND,
  SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND,
  SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND,
];

@Controller('scheduled-transactions')
export class ScheduledTransactionController {
  constructor(
    private readonly scheduledTransactionPrisma: ScheduledTransactionPrisma,
    private readonly transactionSeriesPrisma: TransactionSeriesPrisma,
    private readonly transactionPrisma: TransactionPrisma,
  ) {}

  @Get(':seriesId/:occurrenceIndex')
  async find(
    @Param('seriesId') seriesId: string,
    @Param('occurrenceIndex') occurrenceIndex: string,
    @CurrentUser() user: AuthUser,
  ) {
    const useCase = new FindScheduledTransaction(
      this.scheduledTransactionPrisma.findScheduledTransactionByOccurrence,
      this.transactionSeriesPrisma.findTransactionSeriesById,
    );
    const result = await useCase.execute({
      seriesId,
      occurrenceIndex: this.parseNumber(occurrenceIndex) as number,
      userId: user.id,
    });
    if (result.isFailure) throw this.toHttpException(result.errors);
    return result.instance;
  }

  @Put(':seriesId/:occurrenceIndex')
  async save(
    @Param('seriesId') seriesId: string,
    @Param('occurrenceIndex') occurrenceIndex: string,
    @Body() body: SaveScheduledTransactionBody,
    @CurrentUser() user: AuthUser,
  ) {
    const useCase = new SaveScheduledTransaction(
      this.scheduledTransactionPrisma,
      this.scheduledTransactionPrisma.findScheduledTransactionByOccurrence,
      this.transactionSeriesPrisma.findTransactionSeriesById,
      this.transactionPrisma.movementReferences,
    );
    const result = await useCase.execute(
      this.toSaveInput(body, seriesId, occurrenceIndex, user.id),
    );
    if (result.isFailure) throw this.toHttpException(result.errors);
    return result.instance;
  }

  @Delete(':seriesId/:occurrenceIndex')
  async reset(
    @Param('seriesId') seriesId: string,
    @Param('occurrenceIndex') occurrenceIndex: string,
    @CurrentUser() user: AuthUser,
  ) {
    const useCase = new ResetScheduledTransaction(
      this.scheduledTransactionPrisma,
      this.scheduledTransactionPrisma.findScheduledTransactionByOccurrence,
    );
    const result = await useCase.execute({
      seriesId,
      occurrenceIndex: this.parseNumber(occurrenceIndex) as number,
      userId: user.id,
    });
    if (result.isFailure) throw this.toHttpException(result.errors);
    return { success: true };
  }

  /**
   * Picks only the accepted fields. The address comes from the route and the
   * owner from the token; `direction` and `status` travel as they came, for the
   * domain to judge.
   */
  private toSaveInput(
    body: SaveScheduledTransactionBody | undefined,
    seriesId: string,
    occurrenceIndex: string,
    userId: string,
  ): SaveScheduledTransactionInput {
    const data = body ?? ({} as SaveScheduledTransactionBody);
    return {
      seriesId,
      occurrenceIndex: this.parseNumber(occurrenceIndex) as number,
      userId,
      id: data.id,
      name: data.name,
      note: data.note,
      value: this.parseNumber(data.value) as number,
      direction: data.direction,
      accountId: data.accountId,
      creditCardId: data.creditCardId,
      subcategoryId: data.subcategoryId,
      status: data.status,
      expectedOn: data.expectedOn,
      settledOn: data.settledOn,
    };
  }

  /**
   * Numbers may arrive as strings: an empty value becomes `undefined` and a
   * non-numeric one becomes `NaN`, both rejected by the domain with the code of
   * the attribute (`INVALID_MONEY_AMOUNT`, or an index that does not belong to
   * the series), so `NaN` is never persisted nor silently converted.
   */
  private parseNumber(value?: number | string | null): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    // A blank string would become `0` through `Number`, so it is treated as absent.
    const trimmed = value.trim();
    return trimmed === '' ? undefined : Number(trimmed);
  }

  private toHttpException(errors: string[]) {
    const notFound = NOT_FOUND_ERRORS.find((code) => errors.includes(code));
    if (notFound) return new NotFoundException(notFound);
    return new BadRequestException(errors);
  }
}
