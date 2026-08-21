import { CryptoProvider } from "../../src";

const BCRYPT_FAKE_HASH = "$2b$10$" + "z".repeat(53);

export class FakeCryptoProvider implements CryptoProvider {
  public encryptedPasswords: string[] = [];

  async encrypt(password: string): Promise<string> {
    this.encryptedPasswords.push(password);
    return BCRYPT_FAKE_HASH;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return password === hash;
  }
}
