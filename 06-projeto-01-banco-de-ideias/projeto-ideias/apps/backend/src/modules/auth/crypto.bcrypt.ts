import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CryptoProvider } from '@ideias/auth';

const SALT_ROUNDS = 10;

@Injectable()
export class CryptoBcryptProvider implements CryptoProvider {
  async encrypt(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
