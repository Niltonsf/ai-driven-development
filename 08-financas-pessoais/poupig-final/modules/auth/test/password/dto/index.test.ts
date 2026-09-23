import * as passwordDtoBarrel from '../../../src/password/dto'
import type { PasswordDTO } from '../../../src/password/dto'

/**
 * `password/dto/index.ts` é um barrel que reexporta apenas o type `PasswordDTO`.
 * Não há lógica de runtime, condicional ou caminho de erro para exercitar — a
 * única coisa real que o arquivo faz é manter o contrato público do DTO
 * importável a partir do barrel. Estes testes validam esse contrato (formato e
 * disponibilidade), e não um comportamento fabricado.
 */
describe('password/dto barrel', () => {
  it('é importável como módulo sem quebrar o wiring de reexport', () => {
    // O import namespace executa o `__exportStar` do barrel; se a cadeia de
    // reexport estivesse quebrada, o require lançaria aqui.
    expect(passwordDtoBarrel).toBeDefined()
    expect(typeof passwordDtoBarrel).toBe('object')
  })

  it('não expõe símbolos de runtime (PasswordDTO é type-only e some no build)', () => {
    // Garante que o barrel continua sendo puramente de tipos: se alguém
    // acidentalmente exportar um valor daqui, este teste falha e força revisão.
    expect(Object.keys(passwordDtoBarrel)).toHaveLength(0)
  })

  it('mantém o contrato de tipo { id: string } acessível pelo barrel', () => {
    // Checagem de tipo em tempo de compilação: um objeto com `id: string` deve
    // satisfazer PasswordDTO. Se o campo mudar de nome/tipo, o teste não compila.
    const dto: PasswordDTO = { id: 'user-123' }
    expect(dto.id).toBe('user-123')

    // @ts-expect-error — `id` é obrigatório; um DTO sem `id` viola o contrato.
    const missingId: PasswordDTO = {}
    expect(missingId).toBeDefined()

    // @ts-expect-error — `id` deve ser string; outros tipos violam o contrato.
    const wrongType: PasswordDTO = { id: 42 }
    expect(wrongType).toBeDefined()
  })
})
