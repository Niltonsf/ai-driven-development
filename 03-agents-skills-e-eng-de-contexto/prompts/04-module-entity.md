Crie uma skill chamada `module-entity` dentro de `.agents/skills/module-entity` para criar ou completar entidades de domínio dentro de módulos existentes em `modules/`, seguindo o padrão estrutural já adotado no projeto, e para gerar também os testes unitários dessa entidade com meta explícita de cobertura de 100%.

No `SKILL.md`, defina:

- `name`: `module-entity`
- `description`: `Cria entidades de domínio padronizadas para os módulos da aplicação, com estado tipado, herança da entidade base, validação explícita orientada por regras reutilizáveis do projeto e testes unitários completos para garantir segurança de evolução.`

Objetivo da skill:

- Criar uma entidade de domínio com estrutura consistente.
- Seguir exatamente o padrão já usado no projeto.
- Implementar validação explícita e lazy.
- Inferir o melhor conjunto possível de regras de validação com base nos campos informados.
- Gerar testes unitários robustos para a entidade.
- Garantir cobertura de testes de 100% para a entidade criada ou atualizada.
- Reduzir ao máximo a necessidade de ajustes manuais posteriores.
- Priorizar reaproveitamento das regras compartilhadas já existentes.

Referências obrigatórias que a skill deve ler antes de gerar a entidade:

1. `modules/auth/src/user/model/user.entity.ts`
2. `modules/auth/test/user/model/user.entity.test.ts`
3. `packages/shared/src/validation/rules/`
4. `packages/shared/src/validation/index.ts`
5. `packages/shared/src/validation/validator.ts`
6. `packages/shared/src/model/entity.ts`

Entradas obrigatórias da skill:

1. O nome do módulo.
2. O nome do agregado ou o path do agregado.
3. O nome da entidade.
4. A lista de atributos da entidade com seus tipos.

Entrada opcional: 5. Regras explícitas informadas pelo usuário para campos específicos, quando ele quiser forçar alguma validação.

Regras da implementação:

1. A skill deve validar que o módulo informado existe em `modules/<modulo>`.
2. A skill deve validar que o agregado informado existe ou, se o path for informado diretamente, usar esse path como destino.
3. A skill deve criar ou atualizar a entidade dentro de:
   - `modules/<modulo>/src/<aggregate>/model/<entity>.entity.ts`
4. O nome do arquivo deve ser sempre em `kebab-case`, no formato:
   - `<entity>.entity.ts`
5. O nome da interface de estado deve seguir o padrão:
   - `<EntityName>State`
6. A interface de estado deve estender a estrutura base compatível com `EntityState`, seguindo o padrão real do projeto.
7. A classe da entidade deve seguir o padrão:
   - `export class <EntityName> extends Entity<<EntityName>State>`
8. A entidade não deve fazer validação eager no construtor.
9. O construtor deve apenas receber os dados e repassá-los para a entidade base, sem disparar `validate()` automaticamente.
10. A validação deve acontecer apenas quando alguém chamar explicitamente o método `validate()`.
11. Esse comportamento lazy deve ser tratado como regra central da skill, porque a entidade precisa poder existir temporariamente em estado inválido, inclusive para uso em frontend e formulários.
12. A skill deve gerar getters explícitos para os campos informados, seguindo o padrão atual do projeto.
13. O método `validate()` deve concentrar as regras de negócio e usar `Validator.validate(...)`.
14. A skill deve inferir as melhores regras possíveis para cada campo com base:

- no nome do campo
- no tipo do campo
- no padrão observado nas regras existentes
- no exemplo da entidade já implementada no projeto

15. A skill deve priorizar regras já existentes em `packages/shared/src/validation/rules`.
16. A skill não deve inventar regras locais dentro da entidade se já existir uma regra compartilhada adequada.
17. Se não existir regra compartilhada suficiente para um caso recorrente e genérico, a skill pode criar uma nova regra reutilizável em `packages/shared/src/validation/rules/`, atualizar os exports necessários e usar essa nova regra na entidade.
18. Essa nova regra só deve ser criada se for claramente genérica e reaproveitável por outros módulos.
19. A skill não deve criar regra compartilhada para comportamento excessivamente específico de uma única entidade.
20. Quando houver ambiguidade relevante sobre a validação ideal de um campo, a skill deve fazer a melhor inferência possível com base nas convenções do projeto, em vez de deixar a entidade sem proteção.
21. O conteúdo gerado deve ser robusto, mas não excessivamente opinativo.
22. A skill deve seguir exatamente o padrão estrutural do exemplo de referência:

- interface de estado
- classe concreta
- herança de entidade base
- getters
- método `validate()`

Regras para os testes unitários: 23. A skill deve criar ou atualizar o teste unitário da entidade no local coerente com o padrão do projeto, preferencialmente em:

- `modules/<modulo>/test/<aggregate>/model/<entity>.entity.test.ts`

24. O arquivo de teste deve seguir o nome em `kebab-case`, no formato:

- `<entity>.entity.test.ts`

25. Os testes devem ser criados com foco explícito em atingir 100% de cobertura da entidade.
26. Os testes devem cobrir, no mínimo:

- criação de uma entidade válida
- leitura correta de todos os getters
- comportamento lazy, garantindo que a entidade possa existir inválida antes do `validate()`
- sucesso do `validate()` para dados válidos
- falha do `validate()` para dados inválidos
- mensagens ou códigos de erro esperados quando isso fizer sentido
- cenários limites das regras aplicadas
- comportamento herdado relevante da entidade base, quando impactar a classe criada
- eventuais branches internos do método `validate()`

27. Se a entidade usar timestamps, `clone`, `deletedAt` ou qualquer comportamento herdado relevante, os testes devem cobrir esses fluxos quando fizerem parte da superfície observável da entidade.
28. A skill deve evitar testes superficiais. Os testes devem existir para proteger comportamento real.
29. A skill deve gerar testes especialmente fortes para o método `validate()`, porque ele concentra a maior parte das regras de negócio da entidade.
30. A skill deve usar como referência o padrão de testes já existente no projeto, especialmente o arquivo:

- `modules/auth/test/user/model/user.entity.test.ts`

31. Ao final, a skill deve rodar os testes do módulo afetado e verificar a cobertura.
32. A skill deve buscar explicitamente cobertura de 100% para a entidade criada ou alterada.
33. Se a cobertura não atingir 100%, a skill deve ajustar os testes até cobrir completamente a entidade.
34. A validação final deve incluir, sempre que possível, a execução de testes com coverage do workspace ou do módulo correspondente.

Regras de saída e estrutura da skill: 35. A skill pode incluir dentro de si exemplos few-shot para orientar a reconstrução da entidade e dos testes no padrão correto. 36. Esses exemplos devem ficar dentro da própria pasta da skill e servir apenas como referência estrutural, não como dependência externa. 37. Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/module-entity`. 38. A skill deve ser determinística na estrutura e flexível apenas na composição dos campos e das validações inferidas. 39. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.

Importante:

- A skill não é para criar controller, repositório Prisma, migration ou adaptação de backend.
- A skill é para criar a entidade de domínio no padrão do projeto e seus testes unitários.
- O método `validate()` é explícito e manual.
- A entidade pode existir em estado inválido até que `validate()` seja chamado.
- A skill deve preferir as regras compartilhadas do projeto antes de propor novas regras.
- Se precisar criar uma nova regra, ela deve ser genérica, reutilizável e integrada corretamente ao pacote shared.
- Os testes fazem parte obrigatória da entrega da skill.
- A cobertura esperada para a entidade criada ou alterada deve ser 100%.
