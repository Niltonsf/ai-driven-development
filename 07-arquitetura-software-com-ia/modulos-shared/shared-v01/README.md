# @arquitetura/shared-v01

Módulo compartilhado que introduz o padrão **Result** para tratamento explícito de erros de domínio sem uso de exceções no fluxo normal da aplicação.

---

## Base teórica

### Origem: o tipo Either da programação funcional

O padrão Result é uma adaptação orientada a objetos do tipo `Either<L, R>` da programação funcional, presente em linguagens como Haskell e Scala. `Either` representa um valor que pode ser uma de duas coisas: o caminho do erro (`Left`) ou o caminho do sucesso (`Right`). O nome **Result** vem de linguagens como Rust (`Result<T, E>`) e Swift (`Result<Success, Failure>`), que popularizaram a mesma ideia com semântica mais explícita.

A ideia central é tratar erros como **valores de primeira classe** — retornados, inspecionados e propagados como qualquer outro dado — em vez de como eventos excepcionais que interrompem o fluxo de execução.

### O problema das exceções no domínio

Exceções foram projetadas para erros imprevisíveis e irrecuperáveis: falha de rede, disco cheio, bug de programa. Quando usadas para modelar regras de negócio (`UsuarioNaoEncontrado`, `EmailJaCadastrado`), criam dois problemas estruturais:

**1. Contrato invisível.** O tipo de retorno de uma função não diz o que pode falhar. O chamador é forçado a ler a implementação — ou a documentação, se existir — para descobrir quais exceções tratar. Em TypeScript isso é agravado pela ausência de `checked exceptions`.

```typescript
// O que pode lançar aqui? O tipo não diz nada.
async function criarUsuario(dto: CriarUsuarioDto): Promise<Usuario> { ... }

// Com Result, o contrato é explícito:
async function criarUsuario(dto: CriarUsuarioDto): Promise<Result<Usuario>> { ... }
```

**2. Fluxo de controle por exceção.** Usar `throw/catch` para controle de fluxo previsível é um desvio de responsabilidade do mecanismo de exceções, além de dificultar raciocínio sobre o código — o leitor precisa mentalmente acompanhar quais blocos `try/catch` capturam qual erro em qual nível da pilha.

### Railway Oriented Programming

O conceito de **Railway Oriented Programming** (ROP), descrito por Scott Wlaschin, visualiza o fluxo de uma operação como dois trilhos paralelos: o trilho do sucesso e o trilho da falha. Uma vez que o resultado entra no trilho de falha, ele segue por aí até o fim — sem executar as etapas seguintes.

```
Entrada → [Validar] → [Criar] → [Persistir] → Saída
             ↓            ↓           ↓
          falha -----→ falha ----→ falha ----→ Erro
```

O `Result` implementa esse modelo de forma explícita: cada etapa verifica `isFailure` e propaga com `withFail` se necessário, sem precisar de exceções para sair do fluxo.

### Relação com Domain-Driven Design (DDD)

No DDD, erros de domínio são parte do modelo — não são acidentes, são estados válidos do negócio. Uma busca sem resultado, uma regra violada, uma invariante quebrada: todos são desfechos previstos. Modelar esses desfechos com `Result` mantém o **Ubiquitous Language** intacto: o código expressa o que o domínio diz, e o domínio diz que certas operações podem não ter sucesso.

Isso também respeita o princípio de que a **camada de domínio não deve conhecer detalhes de infraestrutura** — e lançar exceções HTTP ou de banco a partir de entidades e casos de uso seria exatamente essa violação.

### Erros como códigos, não mensagens

Erros de domínio são representados como **strings de código** (`'USER_NOT_FOUND'`), não como mensagens em linguagem natural. Isso separa responsabilidades:

- O domínio define **o que** aconteceu (código semântico, estável, testável).
- A camada de apresentação decide **como comunicar** ao usuário (tradução, formatação, localização).

Mensagens em linguagem natural no domínio criam acoplamento com a camada de apresentação e dificultam internacionalização.

---

## Conceitos centrais

### Por que evitar exceções no domínio?

Exceções em TypeScript/JavaScript são não-tipadas: o contrato de uma função que lança um erro não é visível no tipo de retorno, o que força o chamador a consultar a implementação para saber o que pode falhar. O padrão Result torna o sucesso e a falha parte da assinatura da função, tornando os erros tratáveis em tempo de compilação.

---

## `Result<T>`

Classe genérica que encapsula o retorno de uma operação que pode suceder ou falhar.

```typescript
// Sucesso com valor
const result = Result.ok(usuario);

// Sucesso sem valor (operações void)
const result = Result.ok();

// Resultado vazio explícito (ex.: busca sem registros)
const result = Result.empty<Usuario>();

// Falha com um único erro
const result = Result.fail('USER_NOT_FOUND');

// Falha com múltiplos erros (ex.: validação)
const result = Result.fail(['CAMPO_NOME_OBRIGATORIO', 'CAMPO_EMAIL_INVALIDO']);
```

### Propriedades

| Propriedade    | Tipo          | Descrição                                                              |
|----------------|---------------|------------------------------------------------------------------------|
| `isOk`         | `boolean`     | `true` quando a operação teve sucesso (sem erros)                      |
| `isFailure`    | `boolean`     | `true` quando há erros                                                 |
| `instance`     | `T`           | O valor encapsulado; acessar em uma falha retorna `undefined`          |
| `errors`       | `string[]`    | Lista de erros; `undefined` em casos de sucesso                        |
| `withFail`     | `Result<any>` | Propaga os erros do resultado atual para um novo `Result` sem tipo     |

### Comportamento especial: `RESULT_UNDEFINED`

Se um `Result` for construído sem instância e sem erros explícitos (estado inválido), `errors` retorna `['RESULT_UNDEFINED']` como sinal de bug, evitando silêncio em estados inconsistentes.

### Uso típico em casos de uso

```typescript
async function buscarUsuario(id: string): Promise<Result<Usuario>> {
  const usuario = await repo.findById(id);
  if (!usuario) return Result.fail('USER_NOT_FOUND');
  return Result.ok(usuario);
}

// Chamador
const result = await buscarUsuario('123');
if (result.isFailure) {
  // trata result.errors
}
const usuario = result.instance;
```

### Propagação de erros com `withFail`

Quando um resultado falho precisa ser retornado em um contexto com tipo diferente:

```typescript
const userResult = await buscarUsuario(id);
if (userResult.isFailure) {
  return userResult.withFail; // Result<any> com os mesmos erros
}
```

---

## `ResultError`

Classe que estende `Error` para quando é necessário lançar uma exceção carregando os erros do domínio — por exemplo, em adaptadores de infraestrutura que precisam interromper o fluxo.

```typescript
throw new ResultError('USER_NOT_FOUND');
throw new ResultError(['ERR_1', 'ERR_2']);

// Captura
try { ... } catch (e) {
  if (e instanceof ResultError) {
    console.log(e.errors); // string[]
  }
}
```

### Quando usar `ResultError` vs `Result.fail`

| Situação                                          | Usar          |
|---------------------------------------------------|---------------|
| Retorno de caso de uso ou entidade de domínio     | `Result.fail` |
| Fluxo de controle precisa ser interrompido (throw)| `ResultError` |

---

## Erros de domínio como constantes

A convenção recomendada é centralizar os códigos de erro por agregado:

```typescript
export const UserErrors = {
  NOT_FOUND:     'USER_NOT_FOUND',
  EMAIL_EXISTS:  'USER_EMAIL_ALREADY_EXISTS',
} as const;

// Uso
return Result.fail(UserErrors.NOT_FOUND);
```

Isso elimina strings mágicas espalhadas pelo código e facilita rastrear todos os casos de erro de um agregado em um único lugar.

---

## Estrutura do pacote

```
src/
  base/
    result.ts          # Classe Result<T>
    result-error.ts    # Classe ResultError
    index.ts           # Re-exporta base/
  index.ts             # Ponto de entrada público

test/
  base/
    result.test.ts          # Testes unitários de Result
    domain-errors.test.ts   # Testes de integração Result + ResultError
```

---

## Scripts

```bash
npm run build        # Compila TypeScript para dist/
npm run dev          # Compila em modo watch
npm test             # Executa testes com cobertura
npm run test:watch   # Testes em modo watch
```

---

## Dependências

Este pacote não possui dependências de produção — apenas `jest` e `ts-jest` como devDependencies, mantendo o módulo leve e sem acoplamentos externos.
