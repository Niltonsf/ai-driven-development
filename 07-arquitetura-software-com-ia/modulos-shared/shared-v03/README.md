# @arquitetura/shared-v03

Evolução do [`shared-v02`](../shared-v02/README.md). Mantém `Result<T>`, `ResultError` e `ResultValidator` (com nomenclatura atualizada dos métodos estáticos — ver abaixo) e introduz os blocos de construção do **Domain-Driven Design**: `Entity`, `ValueObject` e `UseCase`, além dos Value Objects concretos `Id` e `Email`.

---

## O que há de novo

### Visão geral das adições

| Artefato | Tipo | Finalidade |
|---|---|---|
| `ValueObject<T, Config>` | classe abstrata | Base para objetos sem identidade própria |
| `Entity<Type, Props>` | classe abstrata | Base para objetos com identidade por ID |
| `UseCase<IN, OUT>` | interface | Contrato padrão para casos de uso |
| `Id` | Value Object concreto | UUID validado, auto-gerado quando ausente |
| `Email` | Value Object concreto | E-mail normalizado e validado |

---

## `Result<T>` — métodos estáticos utilitários

Além de `ok`, `fail`, `empty`, `combine` e `combineAsync`, a classe `Result` expõe dois helpers para capturar exceções e convertê-las em falhas:

| Método | Assinatura | Descrição |
|---|---|---|
| `Result.try` | `(fn: () => T \| Result<T>) => Result<T>` | Executa uma função **síncrona** e captura qualquer exceção como `Result.fail` |
| `Result.tryAsync` | `(fn: () => Promise<T \| Result<T>>) => Promise<Result<T>>` | Executa uma função **assíncrona** e captura qualquer exceção como `Result.fail` |

```typescript
// Síncrono — ex.: usado internamente pelos tryCreate de VOs e entidades
const result = Result.try(() => new Cpf(value));

// Assíncrono — ex.: chamadas a repositórios ou serviços externos
const result = await Result.tryAsync(async () => {
  const user = await userRepository.findById(id);
  return Result.ok(user);
});
```

> **Convenção de nomenclatura:** `try` é sempre síncrono; `tryAsync` é sempre assíncrono. O mesmo par se repete nas factories de VOs e entidades: `tryCreate` (síncrono, retorna `Result<T>`) e — quando necessária uma variante assíncrona — `tryCreateAsync`.

---

## `ValueObject<T, Config>`

Representa um conceito do domínio cujo significado está no **valor**, não em uma identidade. Dois Value Objects com o mesmo valor são iguais — não importa se são instâncias diferentes.

```typescript
const a = new TestVo('abc');
const b = new TestVo('abc');
a.equals(b); // true — igualdade estrutural, não referencial
```

### Propriedades

| Propriedade | Descrição |
|---|---|
| `value` | O valor encapsulado |
| `config` | Metadados opcionais de contexto (ex.: nome do atributo para mensagens de erro) |
| `equals(vo)` | Compara por valor |
| `notEquals(vo)` | Inverso de `equals` |

O parâmetro `Config` (estende `ValueObjectConfig`) permite carregar contexto junto com o valor sem poluir o domínio com concerns de apresentação.

---

## `Entity<Type, Props>`

Representa um conceito do domínio cuja identidade persiste ao longo do tempo — dois objetos com o mesmo ID são a mesma entidade, independente dos outros atributos.

```typescript
entity1.equals(entity2);    // true se mesmo id
entity1.notEquals(entity2); // true se ids diferentes
```

### `EntityProps` — props base

Toda entidade recebe automaticamente estes campos se não forem fornecidos:

| Campo | Padrão | Descrição |
|---|---|---|
| `id` | UUID gerado | Identificador único (UUID v4) |
| `createdAt` | `new Date()` | Data de criação |
| `updatedAt` | `new Date()` | Data da última atualização |
| `deletedAt` | `null` | Data de exclusão lógica (soft delete) |

### `toJSON()`

Retorna o objeto `props` completo, incluindo todos os campos base. Útil para serialização sem expor getters um a um.

### Padrão de criação: `create` vs `tryCreate`

Todas as entidades e VOs concretos seguem o mesmo contrato de fábricas estáticas:

| Método | Retorno | Comportamento ao falhar |
|---|---|---|
| `tryCreate(props)` | `Result<T>` | Retorna `Result.fail(...)` — nunca lança; usa `Result.try` internamente |
| `create(props)` | `T` | Lança via `validator.throwsIfFailed()` |

`tryCreate` é a peça fundamental: concentra a validação usando `Result.try` e retorna um `Result`. `create` é um atalho conveniente para contextos onde falhar é de fato excepcional.

```typescript
// Quando a falha deve ser tratada (ex.: validação de input do usuário)
const result = TestEntity.tryCreate({ number: -1 });
if (result.isFailure) return result.withFail;

// Quando a falha é um bug (ex.: dados já validados anteriormente)
const entity = TestEntity.create({ number: 42 });
```

---

## `UseCase<IN, OUT>`

Interface que formaliza o contrato dos casos de uso na camada de aplicação:

```typescript
export interface UseCase<IN, OUT> {
  execute(data: IN): Promise<Result<OUT>>;
}
```

```typescript
class CriarUsuarioUseCase implements UseCase<CriarUsuarioDto, Usuario> {
  async execute(dto: CriarUsuarioDto): Promise<Result<Usuario>> {
    // ...
  }
}
```

A interface não impõe como o caso de uso é construído (injeção de dependência, construtor, etc.) — apenas garante que o método `execute` existe e retorna `Promise<Result<OUT>>`.

---

## Value Objects concretos

### `Id`

UUID v4 normalizado (lowercase). Auto-gera um novo UUID quando nenhum valor é fornecido.

```typescript
// Gera novo UUID
const id = Id.create();

// Valida um UUID existente — retorna Result
const result = Id.tryCreate('550e8400-e29b-41d4-a716-446655440000');

// Exige que o valor seja não-vazio e válido — retorna Result
const result = Id.required(valor);

// Gera string UUID sem criar instância
const uuid = Id.createUUID();
```

`Entity` usa `Id.create` internamente no construtor — cada entidade sempre nasce com um ID válido.

### `Email`

E-mail normalizado: trim + lowercase aplicados automaticamente.

```typescript
// Retorna Result — nunca lança
const result = Email.tryCreate('  Test@Example.COM  ');
result.instance.value;    // 'test@example.com'
result.instance.local;    // 'test'
result.instance.domain;   // 'example.com'
result.instance.username; // alias para local

// Lança se inválido
const email = Email.create('test@example.com');

// Verificação estática
Email.isValid('test@example.com'); // true
```

---

## Estrutura do pacote

```
src/
  base/
    entity.ts            # Entity<Type, Props> + EntityProps  ← novo
    vo.ts                # ValueObject<T, Config>              ← novo
    use-case.ts          # UseCase                             ← novo
    result.ts            # sem alterações
    result-validator.ts  # sem alterações
    result-error.ts      # sem alterações
    index.ts

  vo/
    id.vo.ts             # Id (UUID)    ← novo
    email.vo.ts          # Email        ← novo
    index.ts

  index.ts               # re-exporta base/ e vo/

test/
  base/
    entity.test.ts
    vo.test.ts
    use-case.test.ts
    result.test.ts
    result-validator.test.ts
    domain-errors.test.ts
  vo/
    id.vo.test.ts
    email.vo.test.ts
  data/
    test.entity.ts       # entidade auxiliar usada nos testes
```

---

## Dependências

| Pacote | Uso |
|---|---|
| `uuid` | Geração e validação de UUID v4 em `Id` |

---

## Scripts

```bash
npm run build        # Compila TypeScript para dist/
npm run dev          # Compila em modo watch
npm test             # Executa testes com cobertura
npm run test:watch   # Testes em modo watch
```
