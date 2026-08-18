Crie uma skill chamada `module-aggregate` dentro de `.agents/skills/module-aggregate` para criar de forma determinística a estrutura base de um agregado dentro de um módulo existente em `modules/<modulo>`.

No `SKILL.md`, defina:

- `name`: `module-aggregate`
- `description`: `Cria a estrutura padronizada de um agregado dentro de um módulo de negócio, organizando pastas, arquivos-base e nomenclaturas de model, provider e usecase para acelerar a evolução consistente do projeto.`

Objetivo da skill:

- Criar a estrutura inicial de arquivos de um agregado.
- Padronizar nomes e organização.
- Não implementar regras de negócio reais.
- Não ser opinativa sobre DDD.
- Não inventar conteúdo específico da entidade.
- Focar em estrutura, convenções e placeholders mínimos para o time continuar a implementação depois.

Entradas obrigatórias da skill:

1. O nome do módulo em `modules/<modulo>`.
2. O nome do agregado.

Entrada opcional, mas recomendada: 3. O tipo de estrutura inicial dos casos de uso:

- `crud`, para criar uma base padronizada de casos de uso de CRUD
- `example`, para criar apenas um caso de uso de exemplo
  Se essa terceira informação não vier no pedido, a skill deve perguntar de forma objetiva qual cenário o usuário deseja antes de seguir.

Regras da implementação:

1. A skill deve validar que o módulo informado já existe dentro de `modules/`.
2. A skill deve criar a estrutura do agregado dentro de `modules/<modulo>/src/<aggregate>/`.
3. O nome do agregado deve ser normalizado em `kebab-case` para nomes de arquivos e pastas.
4. A skill deve criar, no mínimo, as pastas:
   - `model`
   - `provider`
   - `usecase`
5. A skill deve criar o arquivo da entidade em:
   - `modules/<modulo>/src/<aggregate>/model/<aggregate>.entity.ts`
6. A skill deve criar o arquivo de repositório em:
   - `modules/<modulo>/src/<aggregate>/provider/<aggregate>.repository.ts`
7. A skill deve criar também os arquivos `index.ts` necessários para exportar corretamente:
   - `modules/<modulo>/src/<aggregate>/model/index.ts`
   - `modules/<modulo>/src/<aggregate>/provider/index.ts`
   - `modules/<modulo>/src/<aggregate>/usecase/index.ts`
   - `modules/<modulo>/src/<aggregate>/index.ts`
8. A skill deve atualizar o `modules/<modulo>/src/index.ts` para exportar o novo agregado, preservando exports existentes.
9. O conteúdo dos arquivos deve ser mínimo, útil e didático, com placeholders simples, sem implementar lógica real de negócio.
10. A entidade deve ter apenas uma estrutura base coerente com o padrão atual do projeto, sem assumir atributos específicos do agregado além do mínimo necessário para compilar ou servir de referência.
11. O repositório deve ser apenas um contrato inicial, sem implementação concreta.
12. Para `usecase`, a skill deve seguir um dos dois comportamentos:

- Se o cenário for `crud`, criar uma estrutura base com nomes padronizados e arquivos vazios ou mínimos para casos como:
  - `create-<aggregate>.usecase.ts`
  - `update-<aggregate>.usecase.ts`
  - `delete-<aggregate>.usecase.ts`
  - `find-<aggregate>-by-id.usecase.ts`
  - `find-<aggregate>-page.usecase.ts`
- Se o cenário for `example`, criar apenas um caso de uso de exemplo com nome coerente e genérico, sem lógica real, apenas para demonstrar a estrutura.

13. A skill não deve criar controller, adapter de backend, implementação Prisma, migration ou qualquer detalhe de infraestrutura.
14. A skill deve ser determinística: os templates e arquivos-base necessários para essa estrutura devem ficar dentro da própria pasta `.agents/skills/module-aggregate`.
15. A skill não pode depender de pastas, templates ou scripts externos fora dela para funcionar.
16. Se fizer sentido, a skill pode usar `assets/` e `scripts/` próprios para materializar essa estrutura de forma reproduzível.
17. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.

Importante:

- A skill é sobre estrutura, não sobre implementação do domínio.
- A skill não deve ser opinativa sobre o conteúdo real da entidade ou dos casos de uso.
- A skill deve deixar o projeto pronto para o desenvolvedor continuar a implementação manualmente.
- A skill deve seguir o padrão já usado no projeto para organização por agregado.
- Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/module-aggregate`.
