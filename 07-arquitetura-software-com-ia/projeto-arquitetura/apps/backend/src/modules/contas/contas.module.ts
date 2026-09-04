import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { ContasController } from './contas.controller';
import { ContasPrisma } from './contas.prisma';

@Module({
  imports: [DbModule],
  controllers: [ContasController],
  providers: [ContasPrisma],
  exports: [ContasPrisma],
})
export class ContasModule {}
