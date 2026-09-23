import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { DbModule } from './db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { JwtGuard } from './shared/auth/jwt.guard';
import { CreditCardModule } from './modules/credit-card/credit-card.module';
import { CategoryModule } from './modules/category/category.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { DevModule } from './modules/dev/dev.module';

@Module({
  imports: [
    DevModule,
    TransactionModule,
    CategoryModule,
    CreditCardModule,AccountModule, AuthModule, DbModule, SharedModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtGuard },
  ],
})
export class AppModule {}
