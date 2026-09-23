import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { CreditCardController } from './credit-card.controller';
import { CreditCardPrisma } from './credit-card.prisma';

@Module({
  imports: [DbModule],
  controllers: [CreditCardController],
  providers: [CreditCardPrisma],
  exports: [CreditCardPrisma],
})
export class CreditCardModule {}
