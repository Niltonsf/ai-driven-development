# Sistema de Validação

## Contexto

Implementar um sistema de validação reutilizável, com suporte à internacionalização de mensagens de erro e coleta agregada de todos os erros de uma entidade antes de lançar exceção.

## Interface `ValidationRule<T>`

Contrato comum a todas as regras de validação.

```ts
interface ValidationRule<T = unknown> {
  validate(value: T): boolean;
  readonly errorCode: string; // ex: "required", "invalid.email", "min.length"
}
```

## Classe 'Validator'

Recebe o nome/código do campo e uma lista de regras. Executa todas as regras e acumula os erros — nunca para no primeiro.

```ts
class Validator {
  constructor(
    readonly fieldCode: string,     // ex: "user.email", "product.name"
    readonly rules: ValidationRule[]
  ) {}

validate(value: unknown): ValidationError[]
// Retorna lista de ValidationError; vazia se tudo válido
}
```

## Classe 'ValidationError' já foi criado no projeto

## Exemplos de regras concretas esperadas

Cada uma implementa `ValidationRule`:

- `RequiredRule` — valida obrigatoriedade
- `EmailRule` — valida formato de e-mail
- `MinLengthRule(min: number)` — valida tamanho mínimo
- `MaxLengthRule(max: number)` — valida tamanho máximo
- `RangeLengthRule(min: number, max: number)` — valida tamanho mínimo e máximo
- `DateRule` — valida se é uma data válida
- `AgeRule(min: number, max: number)` — valida faixa etária

## Comportamento esperado do fluxo

1. Instanciar `Validator` para cada campo, com suas regras.
2. Executar todos os validadores de uma entidade.
3. Coletar todos os `ValidationError` retornados.
4. Se houver qualquer erro, lançar **uma única** `ValidationException` com a lista completa.
5. O consumidor usa `error.fullCode` como chave de i18n para resolver a mensagem no idioma desejado (ex: `"user.email.invalid.email"` → `"E-mail inválido"` / `"Invalid email"`).

## O que NÃO deve ser implementado agora

- O dicionário/catálogo de mensagens i18n
- Nenhuma lógica de UI ou formatação de mensagem
- Persistência ou integração com back-end