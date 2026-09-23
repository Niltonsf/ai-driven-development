import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SummarizeCategorySpending } from '@poupig/category';
import { CurrentUser } from '../../shared/decorators';
import { ScheduledTransactionPrisma } from '../transaction/scheduled-transaction.prisma';
import { TransactionSeriesPrisma } from '../transaction/transaction-series.prisma';
import { CategoryReportPrisma } from './category-report.prisma';

type AuthUser = { id: string; name: string; email: string };

@Controller('reports')
export class CategoryReportController {
  constructor(
    private readonly categoryReportPrisma: CategoryReportPrisma,
    private readonly scheduledTransactionPrisma: ScheduledTransactionPrisma,
    private readonly transactionSeriesPrisma: TransactionSeriesPrisma,
  ) {}

  /**
   * The whole period in one response, as a plain array without pagination:
   * the rows are bounded by the subcategories of the user, so an envelope
   * would pretend a pagination that does not exist. `from` and `to` travel
   * raw, without defaults: the domain answers `INVALID_CATEGORY_REPORT_PERIOD`
   * when they are missing, malformed, inverted or longer than allowed.
   */
  @Get('categories')
  async categories(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const useCase = new SummarizeCategorySpending(
      this.categoryReportPrisma.summarizeStoredCategorySpending,
      this.scheduledTransactionPrisma.listMaterializedOccurrenceKeys,
      this.transactionSeriesPrisma.listActiveTransactionSeries,
      this.categoryReportPrisma.findSubcategoryAppearances,
    );
    const result = await useCase.execute({
      userId: user.id,
      from: from as string,
      to: to as string,
    });
    if (result.isFailure) throw new BadRequestException(result.errors);
    return result.instance;
  }
}
