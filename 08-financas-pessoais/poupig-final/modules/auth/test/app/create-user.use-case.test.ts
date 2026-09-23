import { Result, TransactionContext, TransactionManager } from '@poupig/shared'
import { CreateUser, CreateUserErrors } from '../../src/app'
import { Password, PasswordCryptoProvider } from '../../src/password'
import { User } from '../../src/user'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { InMemoryPasswordRepository } from '../mock/in-memory-password.repository'

class FakeTransactionManager implements TransactionManager {
  async runInTransaction<T>(
    operation: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return operation({})
  }
}

class FakePasswordCryptoProvider implements PasswordCryptoProvider {
  async encrypt(_plain: string): Promise<string> {
    // Deterministic bcrypt-shaped hash (matches EncryptedPassword.REGEX).
    return '$2b$10$' + 'a'.repeat(53)
  }

  async compare(_plain: string, _encrypted: string): Promise<boolean> {
    return true
  }
}

function buildUseCase() {
  const userRepository = new InMemoryUserRepository()
  const passwordRepository = new InMemoryPasswordRepository()
  const crypto = new FakePasswordCryptoProvider()
  const tx = new FakeTransactionManager()
  const useCase = new CreateUser(userRepository, passwordRepository, crypto, tx)
  return { useCase, userRepository, passwordRepository }
}

const validInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatarUrl: 'https://example.com/avatar.png',
  password: '#Senha123',
}

describe('CreateUser', () => {
  test('persists user and password within a transaction', async () => {
    const { useCase, userRepository } = buildUseCase()

    const result = await useCase.execute(validInput)

    expect(result.isOk).toBe(true)

    const saved = await userRepository.findByEmail(validInput.email)
    expect(saved.isOk).toBe(true)
    expect(saved.instance.email).toBe(validInput.email)
  })

  test('fails when the email already exists', async () => {
    const { useCase } = buildUseCase()

    await useCase.execute(validInput)
    const result = await useCase.execute(validInput)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CreateUserErrors.EMAIL_ALREADY_IN_USE)
  })

  test('fails on weak password', async () => {
    const { useCase } = buildUseCase()

    const result = await useCase.execute({ ...validInput, password: 'weak' })

    expect(result.isFailure).toBe(true)
  })

  test('fails on invalid email', async () => {
    const { useCase } = buildUseCase()

    const result = await useCase.execute({ ...validInput, email: 'not-an-email' })

    expect(result.isFailure).toBe(true)
  })

  test('fails when the crypto provider returns a non-bcrypt hash', async () => {
    // The encrypted value persisted at rest must be a valid bcrypt hash. If the
    // provider yields a malformed string, `Password.toEncrypted` rejects it and
    // the use case must surface the failure instead of persisting garbage.
    const userRepository = new InMemoryUserRepository()
    const passwordRepository = new InMemoryPasswordRepository()
    const brokenCrypto: PasswordCryptoProvider = {
      async encrypt() {
        return 'not-a-bcrypt-hash'
      },
      async compare() {
        return false
      },
    }
    const useCase = new CreateUser(
      userRepository,
      passwordRepository,
      brokenCrypto,
      new FakeTransactionManager(),
    )

    const result = await useCase.execute(validInput)

    expect(result.isFailure).toBe(true)
    // The failure happens before the transaction runs, so nothing is persisted.
    const saved = await userRepository.findByEmail(validInput.email)
    expect(saved.isFailure).toBe(true)
  })

  test('propagates the failure when the User entity cannot be built', async () => {
    const { useCase } = buildUseCase()
    const spy = jest
      .spyOn(User, 'tryCreate')
      .mockReturnValue(Result.fail('INVALID_USER') as ReturnType<typeof User.tryCreate>)

    const result = await useCase.execute(validInput)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain('INVALID_USER')
    spy.mockRestore()
  })

  test('propagates the failure when the Password entity cannot be built', async () => {
    const { useCase } = buildUseCase()
    const spy = jest
      .spyOn(Password, 'tryCreate')
      .mockReturnValue(Result.fail('INVALID_PASSWORD') as ReturnType<typeof Password.tryCreate>)

    const result = await useCase.execute(validInput)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain('INVALID_PASSWORD')
    spy.mockRestore()
  })

  test('fails when persisting the user inside the transaction fails', async () => {
    const passwordRepository = new InMemoryPasswordRepository()
    const failingUserRepository = new InMemoryUserRepository()
    jest
      .spyOn(failingUserRepository, 'create')
      .mockResolvedValue(Result.fail('PERSISTENCE_ERROR'))
    const useCase = new CreateUser(
      failingUserRepository,
      passwordRepository,
      new FakePasswordCryptoProvider(),
      new FakeTransactionManager(),
    )

    const result = await useCase.execute(validInput)

    expect(result.isFailure).toBe(true)
  })

  test('fails when persisting the password inside the transaction fails', async () => {
    const userRepository = new InMemoryUserRepository()
    const failingPasswordRepository = new InMemoryPasswordRepository()
    jest
      .spyOn(failingPasswordRepository, 'create')
      .mockResolvedValue(Result.fail('PERSISTENCE_ERROR'))
    const useCase = new CreateUser(
      userRepository,
      failingPasswordRepository,
      new FakePasswordCryptoProvider(),
      new FakeTransactionManager(),
    )

    const result = await useCase.execute(validInput)

    expect(result.isFailure).toBe(true)
  })
})
