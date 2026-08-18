nome: nomenclatura-e-estrutura

# Rules: Nomenclatura e Estrutura

## Arquivos

- Entidades:      `src/entities/<Nome>.entity.ts`
- Repositórios:   `src/repositories/<Nome>.repository.ts`
- Services:       `src/services/<Nome>.service.ts`
- Controllers:    `src/controllers/<Nome>.controller.ts`
- DTOs:           `src/dtos/<Nome>.dto.ts`

## Nomenclatura

- Classes sempre em PascalCase
- Arquivos sempre em kebab-case
- Métodos sempre em camelCase
- Nunca abreviar nomes (usar `UserRepository`, nunca `UserRepo`)

## Restrições
- Controller nunca importa diretamente uma entidade de domínio
- Service nunca acessa o banco diretamente (sempre via repository)
- DTO nunca contém lógica de negócio
- Toda classe exporta apenas um export default