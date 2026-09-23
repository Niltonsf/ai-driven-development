import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AccountController } from './account.controller';
import { AccountPrisma } from './account.prisma';

@Module({
  imports: [DbModule],
  controllers: [AccountController],
  providers: [AccountPrisma],
  exports: [AccountPrisma],
})
export class AccountModule {}
