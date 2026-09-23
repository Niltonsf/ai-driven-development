import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import {
  SummarizeMonthlyCashFlow,
  SummarizeRecurrences,
} from '@poupig/transaction';
import { CurrentUser } from '../../shared/decorators';
import { ScheduledTransactionPrisma } from './scheduled-transaction.prisma';
import { TransactionReportPrisma } from './transaction-report.prisma';
import { TransactionSeriesPrisma } from './transaction-series.prisma';

type AuthUser = { id: string; name: string; email: string };

@Controller('reports')
export class TransactionReportController {
  constructor(
    private readonly transactionReportPrisma: TransactionReportPrisma,
    private readonly scheduledTransactionPrisma: ScheduledTransactionPrisma,
    private readonly transactionSeriesPrisma: TransactionSeriesPrisma,
  ) {}

  /**
   * The whole window in one response, as a plain array without pagination.
   * `reference` and `months` travel raw, without defaults: the domain answers
   * `INVALID_REPORT_REFERENCE` or `INVALID_REPORT_WINDOW` (a missing `months`
   * becomes `NaN` and an empty one `0`, both rejected).
   */
  @Get('cash-flow')
  async cashFlow(
    @CurrentUser() user: AuthUser,
    @Query('reference') reference?: string,
    @Query('months') months?: string,
  ) {
    const useCase = new SummarizeMonthlyCashFlow(
      this.transactionReportPrisma.summarizeStoredCashFlow,
      this.scheduledTransactionPrisma.listMaterializedOccurrenceKeys,
      this.transactionSeriesPrisma.listActiveTransactionSeries,
    );
    const result = await useCase.execute({
      userId: user.id,
      reference: reference as string,
      months: Number(months),
    });
    if (result.isFailure) throw new BadRequestException(result.errors);
    return result.instance;
  }

  /**
   * One line per recurrence (an `OPEN` series) with every month of the window,
   * as a plain array without pagination: its size is bounded by the
   * recurrences of the user. `reference` and `months` travel raw, without
   * defaults: the domain answers `INVALID_REPORT_REFERENCE` or
   * `INVALID_REPORT_WINDOW` (a missing `months` becomes `NaN` and an empty one
   * `0`, both rejected).
   */
  @Get('recurrences')
  async recurrences(
    @CurrentUser() user: AuthUser,
    @Query('reference') reference?: string,
    @Query('months') months?: string,
  ) {
    const useCase = new SummarizeRecurrences(
      this.transactionReportPrisma.summarizeStoredRecurrenceOccurrences,
      this.scheduledTransactionPrisma.listMaterializedOccurrenceKeys,
      this.transactionSeriesPrisma.listActiveTransactionSeries,
      this.transactionSeriesPrisma.findTransactionSeriesById,
    );
    const result = await useCase.execute({
      userId: user.id,
      reference: reference as string,
      months: Number(months),
    });
    if (result.isFailure) throw new BadRequestException(result.errors);
    return result.instance;
  }
}
