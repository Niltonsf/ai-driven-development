export interface PasswordCryptoProvider {
  encrypt(plain: string): Promise<string>
  compare(plain: string, encrypted: string): Promise<boolean>
}
