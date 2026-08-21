import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthController } from './auth.controller';
import { CryptoBcryptProvider } from './crypto.bcrypt';
import { UserPrismaRepository } from './user.prisma';

@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [UserPrismaRepository, CryptoBcryptProvider],
})
export class AuthModule {}
