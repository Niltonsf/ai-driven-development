import { CryptoProvider } from "../../src/user";

export class FakeCryptoProvider implements CryptoProvider {
  readonly hashedPasswords: string[] = [];

  async hash(plain: string): Promise<string> {
    this.hashedPasswords.push(plain);
    return `$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return Boolean(plain) && Boolean(hash);
  }
}
