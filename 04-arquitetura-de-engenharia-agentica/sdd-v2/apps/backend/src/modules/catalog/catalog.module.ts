import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { ProductController } from './product.controller';
import { PrismaProductRepository } from './product.prisma';

@Module({
  imports: [DbModule],
  controllers: [ProductController],
  providers: [PrismaProductRepository],
  exports: [PrismaProductRepository],
})
export class CatalogModule {}
