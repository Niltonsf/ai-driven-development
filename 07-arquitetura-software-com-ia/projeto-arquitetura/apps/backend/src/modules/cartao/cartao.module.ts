import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { CartaoController } from './cartao.controller';
import { CartaoPrisma } from './cartao.prisma';

@Module({
  imports: [DbModule],
  controllers: [CartaoController],
  providers: [CartaoPrisma],
  exports: [CartaoPrisma],
})
export class CartaoModule {}
