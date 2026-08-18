import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CryptoProvider } from '@sdd/auth';

@Injectable()
export class BcryptCryptoProvider implements CryptoProvider {
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
