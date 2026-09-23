import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { ScheduledTransactionController } from './scheduled-transaction.controller';
import { ScheduledTransactionPrisma } from './scheduled-transaction.prisma';
import { StatementController } from './statement.controller';
import { TransactionController } from './transaction.controller';
import { TransactionReportController } from './transaction-report.controller';
import { TransactionReportPrisma } from './transaction-report.prisma';
import { TransactionPrisma } from './transaction.prisma';
import { TransactionSeriesController } from './transaction-series.controller';
import { TransactionSeriesPrisma } from './transaction-series.prisma';

@Module({
  imports: [DbModule],
  controllers: [
    TransactionController,
    TransactionSeriesController,
    ScheduledTransactionController,
    StatementController,
    TransactionReportController,
  ],
  providers: [
    TransactionPrisma,
    TransactionSeriesPrisma,
    ScheduledTransactionPrisma,
    TransactionReportPrisma,
  ],
  exports: [
    TransactionPrisma,
    TransactionSeriesPrisma,
    ScheduledTransactionPrisma,
  ],
})
export class TransactionModule {}
