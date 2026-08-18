import { CryptoProvider } from "../../src/user/provider/crypto.provider";

const FAKE_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";

export class FakeCryptoProvider implements CryptoProvider {
  readonly hashedPasswords: string[] = [];

  async hashPassword(password: string): Promise<string> {
    this.hashedPasswords.push(password);
    return FAKE_HASH;
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return hash === FAKE_HASH && password.length > 0;
  }
}
