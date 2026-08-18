Crie uma skill chamada `module-repository` dentro de `.agents/skills/module-repository` para criar interfaces de repositório em módulos de negócio dentro de `modules/`, seguindo o padrão estrutural do projeto, reaproveitando os contratos compartilhados já existentes em `packages/shared` e gerando também uma implementação em memória para uso em testes futuros de casos de uso.

No `SKILL.md`, defina:

- `name`: `module-repository`
- `description`: `Cria contratos de repositório padronizados para agregados dos módulos de negócio, reaproveitando interfaces compartilhadas de persistência e gerando também uma implementação em memória para apoiar testes dos casos de uso.`

Objetivo da skill:

- Criar a interface de repositório de um agregado.
- Seguir o padrão do projeto para pastas, nomes e exports.
- Reaproveitar os contratos genéricos já existentes no pacote shared.
- Permitir tanto um repositório completo quanto um repositório com métodos específicos.
- Criar também uma implementação simples em memória desse repositório para uso em testes.
- Não implementar infraestrutura real.
- Não criar adapter Prisma, controller, migration ou backend.
- Focar no contrato de domínio do repositório e em sua versão fake/in-memory para testes.

Referências obrigatórias que a skill deve ler antes de gerar o repositório:

1. `packages/shared/src/db/create.repository.ts`
2. `packages/shared/src/db/update.repository.ts`
3. `packages/shared/src/db/delete.repository.ts`
4. `packages/shared/src/db/find-by-id.repository.ts`
5. `packages/shared/src/db/find-page.repository.ts`
6. `packages/shared/src/db/crud.repository.ts`
7. `packages/shared/src/db/index.ts`
8. Um exemplo real de agregado no projeto, como:
   - `modules/auth/src/user/provider/user.repository.ts`
   - `modules/auth/src/user/model/user.entity.ts`
9. Um exemplo de implementação fake/in-memory já usada em testes, como:
   - `modules/auth/test/mock/fake-user.repository.ts`

Entradas obrigatórias da skill:

1. O nome do módulo, ou um path inequívoco dentro de `modules/`.
2. O nome do agregado, ou diretamente o path do arquivo de destino do repositório.
3. O tipo de repositório que o usuário quer criar:
   - `crud`, para um repositório completo
   - `custom`, para um repositório com métodos específicos
4. A entidade principal que o repositório irá manipular.

Entradas obrigatórias quando o tipo for `custom`: 5. A lista de métodos que o repositório deve ter. 6. Para cada método customizado, a assinatura esperada ou a intenção do método, quando isso for necessário para evitar ambiguidade.

Comportamento obrigatório da skill:

1. A skill não pode prosseguir se o usuário não informar claramente:
   - o módulo ou path
   - o agregado ou path
   - o tipo de repositório
2. Se essas informações estiverem vagas, a skill deve parar e pedir os dados faltantes de forma objetiva.
3. A skill deve aceitar dois modos de resolução de destino:
   - modo por convenção: `modules/<modulo>/src/<aggregate>/provider/<aggregate>.repository.ts`
   - modo por path explícito informado pelo usuário
4. Se o destino for por convenção, o nome do arquivo deve ser sempre em `kebab-case`, no formato:
   - `<aggregate>.repository.ts`

Regras da implementação da interface:

1. A skill deve validar que o módulo informado existe.
2. Se o agregado for informado por nome, a skill deve validar que a pasta do agregado existe ou que a estrutura mínima esperada já foi criada.
3. O repositório deve ser criado dentro da pasta `provider`.
4. A interface deve seguir o padrão:
   - `export interface <EntityName>Repository ...`
5. Quando o tipo for `crud`, a skill deve preferir herdar do contrato compartilhado `CrudRepository<...>`, usando os tipos adequados da entidade, entrada de criação, entrada de atualização e paginação.
6. Quando o tipo for `custom`, a skill deve montar a interface com base nos métodos solicitados pelo usuário.
7. Quando fizer sentido, e houver encaixe claro com os contratos compartilhados, a skill deve compor a interface usando os contratos granulares de `create`, `update`, `delete`, `findById` e `findPage`, em vez de reescrever assinaturas manualmente.
8. A skill deve evitar duplicar contratos que já existem no pacote shared.
9. A skill deve usar os tipos da própria entidade e dos parâmetros relacionados ao agregado.
10. Se forem necessários tipos auxiliares, como paginação ou filtros, a skill pode criá-los no mesmo arquivo do repositório quando isso for o padrão mais simples e claro.
11. A skill deve gerar conteúdo mínimo, consistente e útil, sem inventar regras de negócio.
12. A skill deve ser estrutural: ela define o contrato, não a implementação.
13. A skill deve criar ou atualizar:

- `modules/<modulo>/src/<aggregate>/provider/<aggregate>.repository.ts`
- `modules/<modulo>/src/<aggregate>/provider/index.ts`

14. A skill deve também garantir os exports corretos no `index.ts` do agregado quando necessário, preservando exports existentes.
15. A skill deve seguir o padrão de nomenclatura já usado no projeto para interfaces, tipos auxiliares e exports.

Regras para o modo `crud`: 16. A skill deve pedir ou inferir com segurança os tipos necessários para o contrato:

- entidade principal
- tipo de entrada de criação
- tipo de entrada de atualização
- tipo de parâmetros de paginação, quando houver `findPage`

17. Se o usuário não informar esses tipos e não for possível inferi-los com segurança, a skill deve criar placeholders tipados e didáticos, sem inventar estrutura de domínio detalhada.
18. A skill deve preferir um contrato enxuto, coerente e fácil de evoluir.

Regras para o modo `custom`: 19. A skill deve exigir a lista de métodos desejados. 20. Cada método deve ser criado com nome, parâmetros e retorno coerentes com a intenção informada pelo usuário. 21. Se houver ambiguidade relevante sobre os tipos de entrada ou saída, a skill deve pedir esclarecimento antes de criar uma assinatura arbitrária. 22. A skill pode sugerir reaproveitar contratos compartilhados quando detectar que o usuário descreveu algo equivalente a `create`, `update`, `delete`, `findById` ou `findPage`.

Regras da implementação em memória para testes: 23. Além da interface, a skill deve criar uma implementação fake/in-memory para apoiar testes futuros dos casos de uso. 24. Essa implementação não deve usar nenhum framework de mock. 25. Essa implementação deve ser uma classe simples, concreta e funcional, baseada em armazenamento em memória. 26. O objetivo dessa classe é permitir testes reais de casos de uso sem depender da implementação de backend. 27. A implementação em memória deve ser criada na pasta de testes do módulo, em um local previsível e padronizado, preferencialmente:

- `modules/<modulo>/test/mock/fake-<aggregate>.repository.ts`

28. Se já existir uma convenção mais específica no módulo, a skill deve preservá-la.
29. A classe fake deve implementar a interface do repositório recém-criada.
30. Quando o repositório for do tipo `crud`, a implementação fake deve fornecer comportamento funcional para os métodos esperados, usando uma estrutura simples em memória, como `Map`, `Array` ou equivalente.
31. Quando o repositório for do tipo `custom`, a implementação fake deve incluir versões simples e coerentes dos métodos definidos, com comportamento suficiente para suportar testes de casos de uso.
32. A fake deve priorizar clareza, previsibilidade e utilidade em testes, não realismo de infraestrutura.
33. A skill deve também criar ou atualizar os exports necessários dentro de:

- `modules/<modulo>/test/mock/index.ts`

34. Se necessário, a skill pode criar um arquivo de teste básico ou apenas deixar a fake pronta para ser consumida por futuras skills de casos de uso.

Determinismo e estrutura da skill: 35. A skill deve ser determinística na estrutura, nos nomes e no posicionamento dos arquivos. 36. A skill pode incluir few-shots e exemplos internos para orientar a geração correta. 37. Esses exemplos devem ficar dentro da própria pasta `.agents/skills/module-repository`. 38. Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/module-repository`. 39. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.

Importante:

- A skill não implementa persistência real.
- A skill não cria Prisma.
- A skill não cria backend.
- A skill não deve assumir que todo repositório será CRUD.
- A skill deve ser orientada pelas necessidades informadas pelo usuário.
- Quando houver contratos compartilhados adequados no `packages/shared`, eles devem ser reaproveitados em vez de duplicados.
- A fake em memória faz parte da entrega da skill, porque ela será usada pelos testes dos casos de uso.
- Essa fake não é mock de framework; é uma implementação simples, concreta e reutilizável dentro do módulo.
