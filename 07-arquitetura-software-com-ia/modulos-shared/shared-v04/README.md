# @arquitetura/shared-v04

Evolução do [`shared-v03`](../shared-v03/README.md). Esta versão expande `Result<T>` com novos métodos estáticos, introduz um sistema de erros estruturados (`Metadata` + `ValidationError`), adiciona contratos de repositório e gerenciamento de transações, e amplia a biblioteca de Value Objects.

---

## 1. Expansão de `Result<T>`

### `Result.trySync` e `Result.try`

Eliminam o bloco `try/catch` manual dentro dos métodos `tryCreate`. Em vez de capturar exceções explicitamente, basta envolver a função:

```typescript
// Antes (v03)
static tryCreate(value: string): Result<Email> {
  try {
    return Result.ok(new Email(value));
  } catch (error: any) {
    return Result.fail(error.message);
  }
}

// Agora (v04)
static tryCreate(value: string): Result<Cpf> {
  return Result.trySync(() => new Cpf(value));
}
```

| Método               | Assinatura                          | Uso                           |
| -------------------- | ----------------------------------- | ----------------------------- |
| `Result.trySync(fn)` | `fn: () => T \| Result<T>`          | Captura exceções síncronas    |
| `Result.try(fn)`     | `fn: () => Promise<T \| Result<T>>` | Captura rejeições assíncronas |

Ambos detectam automaticamente se o retorno da função já é um `Result` e evitam o aninhamento `Result<Result<T>>`.

### `Result.combine` e `Result.combineAsync`

Agregam múltiplos `Result` em um só. Se qualquer um falhar, todos os erros são consolidados na falha resultante.

```typescript
// Síncrono — preserva tipos via tuple
const result = Result.combine([Result.ok('a'), Result.ok(2)] as const);
result.instance; // ['a', 2]

// Assíncrono
const result = await Result.combineAsync([buscarUsuario(id), buscarPerfil(id)]);

if (result.isFailure) {
  result.errors; // todos os erros de todos os Results que falharam
}
```

Útil para validações paralelas onde se quer acumular todos os erros antes de retornar, em vez de parar no primeiro.

---

## 2. Sistema de erros estruturados

### `Metadata`

Transporta contexto diagnóstico junto com um erro — sem acoplamento com a camada de apresentação. Imutável: cada `with*` retorna uma nova instância.

```typescript
const meta = new Metadata({ module: 'auth', object: 'user' });

// Derivar metadados para atributos específicos
const emailMeta = meta.to('email', 'joao#invalido');
// { module: 'auth', object: 'user', attribute: 'email', value: 'joao#invalido' }
```

| Campo       | Descrição                                       |
| ----------- | ----------------------------------------------- |
| `module`    | Módulo/contexto (ex.: `'auth'`, `'billing'`)    |
| `object`    | Entidade ou agregado (ex.: `'user'`, `'order'`) |
| `attribute` | Campo específico (ex.: `'email'`, `'cpf'`)      |
| `value`     | Valor que causou o erro                         |
| `id`        | ID da entidade envolvida                        |

Métodos fluentes: `withModule`, `withObject`, `withAttribute`, `withValue`, `withId`, `to(attribute, value?)`.

### `Message`

Interface mínima que associa um código de erro a metadados:

```typescript
interface Message {
  code?: string;
  meta?: MetadataProps;
}
```

### `ValidationError`

Substitui o `throw new Error(code)` simples em VOs que precisam carregar contexto rico. Estende `Error` e carrega uma lista de `Message` com status HTTP opcional.

```typescript
throw new ValidationError(
  { code: 'cpf.invalid', meta: { module: 'auth', attribute: 'cpf', value: '000.000.000-00' } },
  422,
);

// Múltiplas falhas em uma operação
throw new ValidationError([
  { code: 'email.not-valid', meta: { attribute: 'email' } },
  { code: 'password.not-valid', meta: { attribute: 'password' } },
]);
```

| Propriedade | Tipo        | Descrição                                 |
| ----------- | ----------- | ----------------------------------------- |
| `messages`  | `Message[]` | Lista de erros estruturados               |
| `status`    | `number`    | Código HTTP sugerido (padrão: `400`)      |
| `codes`     | `string`    | Códigos concatenados para `error.message` |

**`ValidationError` vs `ResultError`:** `ResultError` carrega strings simples — adequado para erros de domínio sem contexto adicional. `ValidationError` carrega `Message[]` com metadados — adequado para erros de validação que precisam indicar exatamente qual campo falhou e com qual valor.

---

## 3. Contratos de repositório

Interfaces genéricas que definem o contrato de acesso a dados sem acoplar ao ORM ou banco.

### Interfaces atômicas

```typescript
interface CreateRepository<T> {
  create(entity: T, tx?): Promise<Result<void>>;
}
interface UpdateRepository<T> {
  update(entity: T, tx?): Promise<Result<void>>;
}
interface FindByIdRepository<T> {
  findById(id: string): Promise<Result<T>>;
}
interface DeleteRepository {
  delete(id: string, tx?): Promise<Result<void>>;
}
```

### `CrudRepository<T>`

Compõe as quatro interfaces acima em um único contrato:

```typescript
interface CrudRepository<T extends Entity<any, any>>
  extends CreateRepository<T>, UpdateRepository<T>, FindByIdRepository<T>, DeleteRepository {}
```

A composição por interfaces atômicas permite que repositórios implementem apenas o subconjunto necessário — um repositório somente-leitura implementa só `FindByIdRepository`, sem precisar de stubs para os demais métodos.

### `TransactionManager` e `TransactionContext`

Abstração para operações transacionais sem expor detalhes do ORM:

```typescript
interface TransactionManager<CTX extends TransactionContext> {
  runInTransaction<T>(operation: (context: CTX) => Promise<T>): Promise<T>;
}
```

`TransactionContext` é uma interface vazia que cada adaptador de infraestrutura estende com seu tipo concreto (ex.: `EntityManager` do TypeORM). O domínio e a camada de aplicação usam apenas `TransactionContext`, mantendo o desacoplamento.

---

## 4. DTOs de paginação

Contratos reutilizáveis para queries paginadas:

```typescript
interface PaginatedInputDTO {
  page: number;
  pageSize: number;
}
interface PaginationMetaDTO {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
interface PaginatedResultDTO<T> {
  data: T[];
  meta: PaginationMetaDTO;
}
```

---

## 5. Novos Value Objects

### `Cpf`

CPF com validação aritmética completa dos dígitos verificadores e formatação automática.

```typescript
const result = Cpf.tryCreate('123.456.789-09');
result.instance.formatted; // '123.456.789-09'
result.instance.unformatted; // '12345678909'
result.instance.value; // alias para formatted

Cpf.isValid('12345678909'); // true/false
```

Usa `ValidationError` ao lançar (não `Error`), carregando o valor inválido no `meta`.

### `HexColor`

Cor hexadecimal com normalização para maiúsculas e prefixo `#` automático. Aceita formatos de 3, 4, 6 e 8 dígitos (`#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`).

```typescript
const color = HexColor.create('ff5733');
color.value; // '#FF5733'
```

### `PersonName`

Nome completo com regras: mínimo 3 caracteres, máximo 50, obrigatoriamente primeiro e último nome (cada um com ao menos 2 caracteres). Suporta acentos e caracteres especiais comuns em nomes.

```typescript
const name = PersonName.create('João Silva');
name.firstName; // 'João'
name.lastName; // 'Silva'
name.lastNames; // ['Silva']
name.initials; // 'JS'
```

### `Url`

URL HTTP/HTTPS validada via API nativa `URL` do ambiente. Expõe partes decompostas.

```typescript
const url = Url.create('https://api.example.com/v1/users?page=1');
url.domain; // 'api.example.com'
url.protocol; // 'https:'
url.pathname; // '/v1/users'
url.parameters; // { page: '1' }
```

`URL` é um alias exportado para `Url`, para evitar conflito com o global `URL` do ambiente.

---

## Estrutura do pacote

```
src/
  base/
    message.ts           # interface Message                    ← novo
    metadata.ts          # classe Metadata                      ← novo
    validation-error.ts  # classe ValidationError               ← novo
    result.ts            # + trySync, try, combine, combineAsync ← expandido
    entity.ts            # sem alterações
    vo.ts                # sem alterações
    use-case.ts          # sem alterações
    result-validator.ts  # sem alterações
    result-error.ts      # sem alterações
    index.ts

  db/
    create.repository.ts      # ← novo
    update.repository.ts      # ← novo
    find-by-id.repository.ts  # ← novo
    delete.repository.ts      # ← novo
    crud.repository.ts        # ← novo
    transaction.manager.ts    # ← novo
    index.ts

  query/
    pagination.dto.ts    # ← novo
    index.ts

  vo/
    cpf.vo.ts            # ← novo
    hex-color.vo.ts      # ← novo
    person-name.vo.ts    # ← novo
    url.vo.ts            # ← novo
    email.vo.ts          # sem alterações
    id.vo.ts             # sem alterações
    index.ts

  index.ts

test/
  base/
    metadata.test.ts
    validation-error.test.ts
    result.test.ts       # + testes de trySync, try, combine
    ...
  db/
    crud-repository.test.ts
  vo/
    cpf.vo.test.ts
    hex-color.vo.test.ts
    person-name.vo.test.ts
    url.vo.test.ts
    ...
```

---

## Scripts

```bash
npm run build        # Compila TypeScript para dist/
npm run dev          # Compila em modo watch
npm test             # Executa testes com cobertura
npm run test:watch   # Testes em modo watch
```
