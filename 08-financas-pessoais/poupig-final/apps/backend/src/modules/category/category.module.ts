import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TransactionModule } from '../transaction/transaction.module';
import { CategoryController } from './category.controller';
import { CategoryPrisma } from './category.prisma';
import { CategoryReportController } from './category-report.controller';
import { CategoryReportPrisma } from './category-report.prisma';

@Module({
  imports: [DbModule, TransactionModule],
  controllers: [CategoryController, CategoryReportController],
  providers: [CategoryPrisma, CategoryReportPrisma],
  exports: [CategoryPrisma],
})
export class CategoryModule {}
