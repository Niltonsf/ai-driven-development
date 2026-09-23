import { Password } from '../../../src/password'

/**
 * `Password` é a entidade que carrega o invariante de senha do domínio de auth.
 * Estes testes exercitam as regras reais da entidade:
 *  - `tryCreate` valida o plaintext como StrongPassword e o id como UUID,
 *    combinando os erros quando qualquer um falha;
 *  - `create` promove a falha de validação para exceção;
 *  - `toEncrypted` troca o valor pela forma bcrypt persistida, preservando a
 *    identidade/timestamps e rejeitando hashes fora do formato.
 */

const VALID_ID = '11111111-1111-1111-1111-111111111111'
const STRONG_PLAINTEXT = '#Senha123'
// Hash no formato bcrypt aceito por EncryptedPassword.REGEX.
const VALID_BCRYPT = '$2b$10$' + 'a'.repeat(53)

describe('Password.tryCreate', () => {
  it('cria a entidade quando id e senha forte são válidos', () => {
    const result = Password.tryCreate({ id: VALID_ID, value: STRONG_PLAINTEXT })

    expect(result.isOk).toBe(true)
    expect(result.instance).toBeInstanceOf(Password)
    expect(result.instance.id).toBe(VALID_ID)
    expect(result.instance.value).toBe(STRONG_PLAINTEXT)
  })

  it('gera um id quando nenhum é fornecido, preservando o invariante de identidade', () => {
    const result = Password.tryCreate({ value: STRONG_PLAINTEXT })

    expect(result.isOk).toBe(true)
    // Id.tryCreate gera um UUID quando o valor está ausente.
    expect(result.instance.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('falha quando a senha plaintext é fraca', () => {
    const result = Password.tryCreate({ id: VALID_ID, value: 'weak' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain('WEAK_PASSWORD')
  })

  it('falha quando o id não é um UUID válido', () => {
    const result = Password.tryCreate({ id: 'not-a-uuid', value: STRONG_PLAINTEXT })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain('INVALID_ID')
  })

  it('acumula os erros de id e senha quando ambos são inválidos', () => {
    const result = Password.tryCreate({ id: 'not-a-uuid', value: 'weak' })

    expect(result.isFailure).toBe(true)
    // Result.combine achata os erros de todos os atributos que falharam.
    expect(result.errors).toEqual(
      expect.arrayContaining(['INVALID_ID', 'WEAK_PASSWORD']),
    )
  })
})

describe('Password.create', () => {
  it('retorna a instância quando os props são válidos', () => {
    const password = Password.create({ id: VALID_ID, value: STRONG_PLAINTEXT })

    expect(password).toBeInstanceOf(Password)
    expect(password.value).toBe(STRONG_PLAINTEXT)
  })

  it('lança quando a validação falha (throwsIfFailed)', () => {
    expect(() => Password.create({ id: VALID_ID, value: 'weak' })).toThrow()
  })
})

describe('Password#toEncrypted', () => {
  it('troca o valor pela forma bcrypt preservando identidade e timestamps', () => {
    const password = Password.create({ id: VALID_ID, value: STRONG_PLAINTEXT })

    const result = password.toEncrypted(VALID_BCRYPT)

    expect(result.isOk).toBe(true)
    const encrypted = result.instance
    expect(encrypted.value).toBe(VALID_BCRYPT)
    // A identidade e os timestamps do agregado original são mantidos.
    expect(encrypted.id).toBe(password.id)
    expect(encrypted.createdAt).toEqual(password.createdAt)
    expect(encrypted.updatedAt).toEqual(password.updatedAt)
    // A instância original permanece com o plaintext (imutabilidade).
    expect(password.value).toBe(STRONG_PLAINTEXT)
  })

  it('falha quando o hash está fora do formato bcrypt esperado', () => {
    const password = Password.create({ id: VALID_ID, value: STRONG_PLAINTEXT })

    const result = password.toEncrypted('not-a-bcrypt-hash')

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain('encrypted-password.invalid')
  })
})
