import * as userDtoBarrel from '../../../src/user/dto'
import type { UserDTO } from '../../../src/user/dto'

/**
 * `user/dto/index.ts` é um barrel que reexporta apenas o type `UserDTO`.
 * Não há lógica de runtime, condicional ou caminho de erro para exercitar — a
 * única coisa real que o arquivo faz é manter o contrato público do DTO
 * importável a partir do barrel. Estes testes validam esse contrato (formato e
 * disponibilidade), e não um comportamento fabricado.
 */
describe('user/dto barrel', () => {
  it('é importável como módulo sem quebrar o wiring de reexport', () => {
    // O import namespace executa o `__exportStar` do barrel; se a cadeia de
    // reexport estivesse quebrada, o require lançaria aqui.
    expect(userDtoBarrel).toBeDefined()
    expect(typeof userDtoBarrel).toBe('object')
  })

  it('não expõe símbolos de runtime (UserDTO é type-only e some no build)', () => {
    // Garante que o barrel continua sendo puramente de tipos: se alguém
    // acidentalmente exportar um valor daqui, este teste falha e força revisão.
    expect(Object.keys(userDtoBarrel)).toHaveLength(0)
  })

  it('mantém o contrato { id, name, email, avatarUrl: string } acessível pelo barrel', () => {
    // Checagem de tipo em tempo de compilação: um objeto com os quatro campos
    // string deve satisfazer UserDTO. Se algum campo mudar de nome/tipo, o
    // teste não compila.
    const dto: UserDTO = {
      id: 'user-123',
      name: 'Ada Lovelace',
      email: 'ada@poupig.com.br',
      avatarUrl: 'https://poupig.com.br/avatar/ada.png',
    }
    expect(dto.id).toBe('user-123')
    expect(dto.name).toBe('Ada Lovelace')
    expect(dto.email).toBe('ada@poupig.com.br')
    expect(dto.avatarUrl).toBe('https://poupig.com.br/avatar/ada.png')

    // @ts-expect-error — todos os campos são obrigatórios; faltar `avatarUrl`
    // viola o contrato.
    const missingField: UserDTO = {
      id: 'user-123',
      name: 'Ada Lovelace',
      email: 'ada@poupig.com.br',
    }
    expect(missingField).toBeDefined()

    // @ts-expect-error — os campos devem ser string; outros tipos violam o
    // contrato.
    const wrongType: UserDTO = {
      id: 42,
      name: 'Ada Lovelace',
      email: 'ada@poupig.com.br',
      avatarUrl: 'https://poupig.com.br/avatar/ada.png',
    }
    expect(wrongType).toBeDefined()
  })
})
