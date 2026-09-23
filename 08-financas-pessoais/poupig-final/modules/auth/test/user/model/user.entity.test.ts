import { Email, Id, PersonName, Url } from '@poupig/shared'
import { User, UserProps } from '../../../src/user/model'

/**
 * Testes da entidade `User`. O foco é exercitar as regras reais de negócio da
 * fábrica (`create`/`tryCreate`) — validação e normalização dos value objects,
 * agregação de erros e o tratamento do avatar opcional — além dos getters
 * derivados (`$name`/`$email`/`$avatarUrl`), que reconstroem VOs a partir do
 * estado persistido.
 */

const validId = Id.createUUID()

function buildProps(overrides: Partial<UserProps> = {}): UserProps {
  return {
    id: overrides.id ?? validId,
    name: overrides.name ?? 'John Doe',
    email: overrides.email ?? 'john.doe@example.com',
    avatarUrl: overrides.avatarUrl !== undefined ? overrides.avatarUrl : 'https://example.com/avatar.png',
  } as UserProps
}

describe('User.tryCreate', () => {
  test('cria usuário válido normalizando os value objects', () => {
    // Email deve ser normalizado para minúsculas pelo Email VO; a entidade
    // guarda o valor normalizado, não o valor bruto de entrada.
    const result = User.tryCreate(buildProps({ email: 'John.Doe@Example.COM' }))

    expect(result.isOk).toBe(true)
    expect(result.instance.id).toBe(validId)
    expect(result.instance.name).toBe('John Doe')
    expect(result.instance.email).toBe('john.doe@example.com')
    expect(result.instance.avatarUrl).toBe('https://example.com/avatar.png')
  })

  test('aceita avatarUrl nulo mantendo o campo como null', () => {
    // Quando avatarUrl é null, o Url VO não é acionado e o valor persistido
    // permanece null (branch do operador ternário na fábrica).
    const result = User.tryCreate(buildProps({ avatarUrl: null }))

    expect(result.isOk).toBe(true)
    expect(result.instance.avatarUrl).toBeNull()
  })

  test('falha quando o nome não tem sobrenome', () => {
    const result = User.tryCreate(buildProps({ name: 'Madonna' }))

    expect(result.isFailure).toBe(true)
  })

  test('falha quando o email é inválido', () => {
    const result = User.tryCreate(buildProps({ email: 'not-an-email' }))

    expect(result.isFailure).toBe(true)
  })

  test('falha quando o id não é um UUID válido', () => {
    const result = User.tryCreate(buildProps({ id: 'nope' }))

    expect(result.isFailure).toBe(true)
  })

  test('falha quando o avatarUrl é uma URL inválida', () => {
    const result = User.tryCreate(buildProps({ avatarUrl: 'ftp://not-http' }))

    expect(result.isFailure).toBe(true)
  })

  test('agrega os erros de múltiplos value objects inválidos', () => {
    // Nome, email e avatar inválidos ao mesmo tempo: Result.combine deve reunir
    // os erros e a fábrica precisa devolver falha sem construir a entidade.
    const result = User.tryCreate(buildProps({ name: 'x', email: 'bad', avatarUrl: 'bad' }))

    expect(result.isFailure).toBe(true)
    expect(result.errors!.length).toBeGreaterThan(1)
  })
})

describe('User.create', () => {
  test('retorna a instância quando os dados são válidos', () => {
    const user = User.create(buildProps())

    expect(user).toBeInstanceOf(User)
    expect(user.email).toBe('john.doe@example.com')
  })

  test('lança quando a validação falha (throwsIfFailed)', () => {
    expect(() => User.create(buildProps({ email: 'invalid' }))).toThrow()
  })
})

describe('User getters derivados', () => {
  test('$name reconstrói um PersonName a partir do estado', () => {
    const user = User.create(buildProps({ name: 'John Doe' }))

    const personName = user.$name
    expect(personName).toBeInstanceOf(PersonName)
    expect(personName.firstName).toBe('John')
    expect(personName.lastName).toBe('Doe')
  })

  test('$email reconstrói um Email a partir do estado', () => {
    const user = User.create(buildProps({ email: 'john.doe@example.com' }))

    const email = user.$email
    expect(email).toBeInstanceOf(Email)
    expect(email.domain).toBe('example.com')
  })

  test('$avatarUrl reconstrói um Url quando há avatar', () => {
    const user = User.create(buildProps({ avatarUrl: 'https://example.com/avatar.png' }))

    const url = user.$avatarUrl
    expect(url).toBeInstanceOf(Url)
    expect(url!.value).toBe('https://example.com/avatar.png')
  })

  test('$avatarUrl é null quando não há avatar', () => {
    const user = User.create(buildProps({ avatarUrl: null }))

    expect(user.$avatarUrl).toBeNull()
  })
})
