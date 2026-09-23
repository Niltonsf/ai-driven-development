import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { CategoryModule } from '../category/category.module';
import { CreditCardModule } from '../credit-card/credit-card.module';
import { TransactionModule } from '../transaction/transaction.module';
import { DataGeneratorWriter } from './data-generator.writer';
import { DevConfig } from './dev.config';
import { DevController } from './dev.controller';

/**
 * Development tools. No adapter of its own: the data generator writes through
 * the adapters exported by the owning modules.
 */
@Module({
  imports: [AccountModule, CreditCardModule, CategoryModule, TransactionModule],
  controllers: [DevController],
  providers: [DataGeneratorWriter, DevConfig],
})
export class DevModule {}
