import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthController } from './auth.controller';
import { AuthPrisma } from './auth.prisma';
import { UserPrisma } from './user.prisma';
import { PasswordPrisma } from './password.prisma';
import { PasswordCryptoBcrypt } from './password-crypto.bcrypt';

@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [AuthPrisma, UserPrisma, PasswordPrisma, PasswordCryptoBcrypt],
  exports: [AuthPrisma, UserPrisma, PasswordPrisma, PasswordCryptoBcrypt],
})
export class AuthModule {}
