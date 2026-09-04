import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { DbModule } from './db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContasModule } from './modules/contas/contas.module';
import { CartaoModule } from './modules/cartao/cartao.module';

@Module({
  imports: [
    CartaoModule,
    ContasModule,
    AuthModule,DbModule, SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
