import { AuthenticateUser, AuthenticateUserErrors } from '../../src/app'
import { PasswordCryptoProvider, Password } from '../../src/password'
import { User } from '../../src/user'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { InMemoryPasswordRepository } from '../mock/in-memory-password.repository'

/**
 * Compares by treating the stored `encrypted` value as the plaintext it was
 * built from. This lets the "wrong password" case be driven by a genuine
 * credential mismatch instead of a hardcoded boolean.
 */
class FakePasswordCryptoProvider implements PasswordCryptoProvider {
  async encrypt(_plain: string): Promise<string> {
    return '$2b$10$' + 'a'.repeat(53)
  }

  async compare(plain: string, encrypted: string): Promise<boolean> {
    return plain === encrypted
  }
}

const password = '#Senha123'

const userInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatarUrl: 'https://example.com/avatar.png',
}

function buildUseCase() {
  const userRepository = new InMemoryUserRepository()
  const passwordRepository = new InMemoryPasswordRepository()
  const crypto = new FakePasswordCryptoProvider()
  const useCase = new AuthenticateUser(userRepository, passwordRepository, crypto)
  return { useCase, userRepository, passwordRepository }
}

async function seedUser(
  userRepository: InMemoryUserRepository,
  passwordRepository: InMemoryPasswordRepository,
  overrides: Partial<typeof userInput> = {},
) {
  const user = User.create({ ...userInput, ...overrides })
  await userRepository.create(user)
  const stored = Password.create({ id: user.id, value: password })
  await passwordRepository.create(stored)
  return user
}

describe('AuthenticateUser', () => {
  test('authenticates a user with valid credentials', async () => {
    const { useCase, userRepository, passwordRepository } = buildUseCase()
    const user = await seedUser(userRepository, passwordRepository)

    const result = await useCase.execute({ email: userInput.email, password })

    expect(result.isOk).toBe(true)
    expect(result.instance).toEqual({
      id: user.id,
      name: userInput.name,
      email: userInput.email,
      avatarUrl: userInput.avatarUrl,
    })
  })

  test('returns the avatarUrl as null when the user has none', async () => {
    const { useCase, userRepository, passwordRepository } = buildUseCase()
    await seedUser(userRepository, passwordRepository, { avatarUrl: null as unknown as string })

    const result = await useCase.execute({ email: userInput.email, password })

    expect(result.isOk).toBe(true)
    expect(result.instance.avatarUrl).toBeNull()
  })

  test('fails with USER_NOT_FOUND when the email has no matching user', async () => {
    const { useCase } = buildUseCase()

    const result = await useCase.execute({ email: 'missing@example.com', password })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(AuthenticateUserErrors.USER_NOT_FOUND)
  })

  test('fails with INVALID_CREDENTIALS when the user has no stored password', async () => {
    const { useCase, userRepository } = buildUseCase()
    // Seed the user only — no password record for its id.
    const user = User.create(userInput)
    await userRepository.create(user)

    const result = await useCase.execute({ email: userInput.email, password })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(AuthenticateUserErrors.INVALID_CREDENTIALS)
  })

  test('fails with INVALID_CREDENTIALS when the password does not match', async () => {
    const { useCase, userRepository, passwordRepository } = buildUseCase()
    await seedUser(userRepository, passwordRepository)

    const result = await useCase.execute({ email: userInput.email, password: '#Outra999' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(AuthenticateUserErrors.INVALID_CREDENTIALS)
  })
})
