import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordCryptoProvider } from '@poupig/auth';

const SALT_ROUNDS = 10;

@Injectable()
export class PasswordCryptoBcrypt implements PasswordCryptoProvider {
  async encrypt(plain: string): Promise<string> {
    // 10 rounds → "$2b$10$..." 60-char hash matching EncryptedPassword.REGEX.
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async compare(plain: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(plain, encrypted);
  }
}
