import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { FindMonthlyStatement } from '@poupig/transaction';
import { CurrentUser } from '../../shared/decorators';
import { ScheduledTransactionPrisma } from './scheduled-transaction.prisma';
import { parseBooleanFlag } from './transaction-query.util';
import { TransactionPrisma } from './transaction.prisma';
import { TransactionSeriesPrisma } from './transaction-series.prisma';

type AuthUser = { id: string; name: string; email: string };

@Controller('statement')
export class StatementController {
  constructor(
    private readonly transactionPrisma: TransactionPrisma,
    private readonly scheduledTransactionPrisma: ScheduledTransactionPrisma,
    private readonly transactionSeriesPrisma: TransactionSeriesPrisma,
  ) {}

  /**
   * The whole period in one response, without pagination. `from` and `to` are
   * validated by the domain (`INVALID_STATEMENT_PERIOD`); the filters travel
   * raw, with `onlyCreditCard` read exactly as in `GET /transactions`.
   */
  @Get()
  async find(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
    @Query('creditCardId') creditCardId?: string,
    @Query('onlyCreditCard') onlyCreditCard?: string,
  ) {
    const useCase = new FindMonthlyStatement(
      this.transactionPrisma.listTransactions,
      this.scheduledTransactionPrisma.listScheduledTransactionsInPeriod,
      this.transactionSeriesPrisma.listActiveTransactionSeries,
    );
    const result = await useCase.execute({
      userId: user.id,
      from: from as string,
      to: to as string,
      search,
      direction,
      status,
      accountId,
      creditCardId: creditCardId?.trim() || undefined,
      onlyCreditCard: parseBooleanFlag(onlyCreditCard),
    });
    if (result.isFailure) throw new BadRequestException(result.errors);
    return result.instance;
  }
}
