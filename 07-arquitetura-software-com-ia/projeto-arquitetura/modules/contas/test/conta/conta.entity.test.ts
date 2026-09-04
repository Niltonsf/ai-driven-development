import { Conta } from '../../src'

const validProps = {
  name: 'Conta Corrente',
  description: 'Conta corrente principal',
  agency: '0001',
  accountNumber: '12345-6',
  institutionName: 'Banco do Brasil',
  color: '#FF8800',
  icon: 'wallet',
}

describe('Conta entity', () => {
  test('should create a valid conta with tryCreate', () => {
    const result = Conta.tryCreate(validProps)

    expect(result.isOk).toBe(true)
    expect(result.instance.name).toBe('Conta Corrente')
    expect(result.instance.active).toBe(true)
    expect(result.instance.id).toBeDefined()
  })

  test('should default active to true when not provided', () => {
    const conta = Conta.create(validProps)
    expect(conta.active).toBe(true)
  })

  test('should respect active when explicitly set to false', () => {
    const conta = Conta.create({ ...validProps, active: false })
    expect(conta.active).toBe(false)
  })

  test('should normalize values through value objects', () => {
    const conta = Conta.create({ ...validProps, name: '  Conta Poupanca  ', color: 'ff8800' })

    expect(conta.name).toBe('Conta Poupanca')
    expect(conta.color).toBe('#FF8800')
  })

  test('should expose all props through getters', () => {
    const conta = Conta.create(validProps)

    expect(conta.name).toBe('Conta Corrente')
    expect(conta.description).toBe('Conta corrente principal')
    expect(conta.agency).toBe('0001')
    expect(conta.accountNumber).toBe('12345-6')
    expect(conta.institutionName).toBe('Banco do Brasil')
    expect(conta.color).toBe('#FF8800')
    expect(conta.icon).toBe('wallet')
    expect(conta.active).toBe(true)
  })

  test('should create with only required fields', () => {
    const result = Conta.tryCreate({ name: 'Carteira' })

    expect(result.isOk).toBe(true)
    expect(result.instance.description).toBeUndefined()
    expect(result.instance.agency).toBeUndefined()
  })

  test('should fail when name is too short', () => {
    const result = Conta.tryCreate({ ...validProps, name: 'ab' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain('NOME_CONTA_TOO_SHORT')
  })

  test('should fail when color is not a valid hex', () => {
    const result = Conta.tryCreate({ ...validProps, color: 'not-a-color' })

    expect(result.isFailure).toBe(true)
  })

  test('should throw when create receives invalid props', () => {
    expect(() => Conta.create({ ...validProps, name: 'ab' })).toThrow()
  })

  test('should be equal to another conta with the same id', () => {
    const conta = Conta.create(validProps)
    const same = Conta.create({ ...validProps, id: conta.id, name: 'Outro Nome' })
    const other = Conta.create(validProps)

    expect(conta.equals(same)).toBe(true)
    expect(conta.notEquals(other)).toBe(true)
  })

  test('cloneWith should apply valid updates keeping the same id', () => {
    const conta = Conta.create(validProps)
    const result = conta.cloneWith({ name: 'Conta Atualizada' })

    expect(result.isOk).toBe(true)
    expect(result.instance.name).toBe('Conta Atualizada')
    expect(result.instance.id).toBe(conta.id)
  })

  test('cloneWith should fail on invalid updates', () => {
    const conta = Conta.create(validProps)
    const result = conta.cloneWith({ name: 'ab' })

    expect(result.isFailure).toBe(true)
  })

  test('deactivate should return an inactive conta', () => {
    const conta = Conta.create(validProps)
    const result = conta.deactivate()

    expect(result.isOk).toBe(true)
    expect(result.instance.active).toBe(false)
    expect(conta.active).toBe(true)
  })

  test('activate should return an active conta', () => {
    const conta = Conta.create({ ...validProps, active: false })
    const result = conta.activate()

    expect(result.isOk).toBe(true)
    expect(result.instance.active).toBe(true)
  })
})
