# @arquitetura/shared-v02

Evolução do [`shared-v01`](../shared-v06/README.md). Mantém `Result<T>` e `ResultError` sem alterações e introduz o `ResultValidator`: uma API fluente de guard clauses que serve de ponte entre o mundo "retornar `Result`" e o mundo "lançar exceção".

---

## O que há de novo: `ResultValidator`

### O problema que ele resolve

Em casos de uso e adaptadores é comum precisar interromper o fluxo com uma exceção quando um `Result` falhou, ou quando um valor é nulo, ou quando uma expressão é verdadeira. A abordagem imperativa repete sempre o mesmo padrão:

```typescript
if (result.isFailure) throw new ResultError(result.errors);
if (usuario == null) throw new ResultError('USER_NOT_FOUND');
if (emailExiste === true) throw new ResultError('USER_EMAIL_ALREADY_EXISTS');
```

O `ResultValidator` encapsula esse padrão em uma API encadeável, eliminando o `if/throw` explícito e tornando as guard clauses declarativas.

---

## `ResultValidator<T, TSource>`

Classe de validação fluente. Recebe uma fonte (`TSource`) que expõe `instance`, `isFailure` e `errors`, e fornece métodos que lançam exceção se a condição for satisfeita.

### Acesso via `Result.validator`

O getter `validator` em `Result<T>` é o ponto de entrada natural:

```typescript
const result = await buscarUsuario(id);

result.validator
  .throwsIfFailed()   // lança se result.isFailure
  .throwsIfNull()     // lança se result.instance == null
  .result;            // devolve o Result original após as guards
```

### Métodos disponíveis

| Método | Lança quando | Erro padrão |
|---|---|---|
| `throwsIfFailed(error?)` | `source.isFailure === true` | os próprios `source.errors` |
| `throwsIfNull(error?)` | `source.instance == null` | `'RESULT_INSTANCE_NULL'` |
| `throwsIfNotNull(error?)` | `source.instance != null` | `'RESULT_INSTANCE_NOT_NULL'` |
| `throwsIfTrue(error?)` | `source.instance === true` | `'RESULT_EXPRESSION_TRUE'` |
| `throwsIfFalse(error?)` | `source.instance === false` | `'RESULT_EXPRESSION_FALSE'` |

Todos os métodos retornam `this`, permitindo encadeamento, e aceitam um `error` opcional do tipo `ResultValidationError` (`string | string[] | Error`).

### Encadeamento fluente

```typescript
const usuario = await repo.findById(id);

new ResultValidator({ instance: usuario, isFailure: false })
  .throwsIfNull('USER_NOT_FOUND')
  .result.instance; // acesso seguro após a guard
```

### Recuperar o `Result` após as guards com `.result`

O getter `.result` devolve a fonte original (`TSource`), permitindo continuar trabalhando com o `Result` depois de validar:

```typescript
const result = await criarUsuario(dto);

const usuarioCriado = result.validator
  .throwsIfFailed()
  .result           // Result<Usuario> — sem falha garantida aqui
  .instance;        // acesso ao valor
```

---

## Fábrica de exceções customizada (`exceptionFactory`)

Por padrão, todos os métodos lançam `ResultError`. Quando a camada receptora espera um tipo específico de exceção (ex.: exceções HTTP do NestJS), o segundo parâmetro aceita uma fábrica:

```typescript
import { NotFoundException } from '@nestjs/common';

result.validator.throwsIfFailed(
  result.errors,
  (error) => new NotFoundException(String(error)),
);
```

A fábrica recebe o `ResultValidationError` e retorna qualquer `unknown` — o `ResultValidator` lança o que ela retornar. Isso desacopla a regra de disparo (domínio) do tipo de exceção (infraestrutura).

---

## Uso direto sem `Result`

`ResultValidator` aceita qualquer objeto que satisfaça a interface `ResultValidationSource<T>`, não apenas instâncias de `Result`. Útil para validar valores avulsos:

```typescript
const emailExiste = await repo.emailExists(dto.email);

new ResultValidator({ instance: emailExiste, isFailure: false })
  .throwsIfTrue('USER_EMAIL_ALREADY_EXISTS');
```

---

## Estrutura do pacote

```
src/
  base/
    result.ts            # Result<T> — agora com getter .validator
    result-validator.ts  # ResultValidator<T, TSource>  ← novo
    result-error.ts      # ResultError (sem alterações)
    index.ts

test/
  base/
    result.test.ts
    result-validator.test.ts  ← novo
    domain-errors.test.ts
```

---

## Scripts

```bash
npm run build        # Compila TypeScript para dist/
npm run dev          # Compila em modo watch
npm test             # Executa testes com cobertura
npm run test:watch   # Testes em modo watch
```
