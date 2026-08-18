Crie uma skill chamada `module-use-case` dentro de `.agents/skills/module-use-case` para criar casos de uso em módulos de negócio dentro de `modules/`, seguindo o padrão estrutural já adotado no projeto, e gerando também os testes unitários necessários para garantir cobertura de 100% do caso de uso criado.

No `SKILL.md`, defina:

- `name`: `module-use-case`
- `description`: `Cria casos de uso padronizados para agregados dos módulos de negócio, com contratos de entrada e saída consistentes, implementação inicial simples, testes unitários completos e estrutura pronta para evolução pelo time.`

Objetivo da skill:

- Criar a estrutura base de um caso de uso.
- Seguir o padrão do projeto para nomes, arquivos, contratos e exports.
- Produzir implementações simples, legíveis e fáceis de evoluir.
- Não inventar fluxos complexos sem necessidade.
- Adaptar a estrutura ao pedido do usuário, mas mantendo a implementação inicial enxuta.
- Criar também os testes unitários do caso de uso.
- Garantir cobertura de 100% do caso de uso criado ou atualizado.
- Reaproveitar implementações fake/in-memory já existentes para apoiar os testes.

Referências obrigatórias que a skill deve ler antes de gerar o caso de uso:

1. `modules/auth/src/user/usecase/register-user.usecase.ts`
2. `modules/auth/src/user/usecase/index.ts`
3. `modules/auth/test/user/usecase/register-user.usecase.test.ts`
4. `modules/auth/test/mock/fake-user.repository.ts`
5. `modules/auth/test/mock/fake-crypto.provider.ts`
6. `modules/auth/test/mock/index.ts`
7. `packages/shared/src/usecase/use-case.ts`
8. `packages/shared/src/usecase/index.ts`

Entradas obrigatórias da skill:

1. O nome do módulo, ou um path inequívoco dentro de `modules/`.
2. O nome do agregado, ou diretamente o path do agregado.
3. O nome do caso de uso.
4. O tipo de cenário:
   - `crud`, para casos simples como criar, atualizar, excluir, consultar por id ou consultar página
   - `custom`, para qualquer outro caso de uso
5. A indicação se o caso de uso devolve saída ou não.

Entradas opcionais: 6. Dependências esperadas do caso de uso, como repositórios, providers ou outros contratos. 7. Campos da entrada. 8. Campos da saída, quando houver retorno. 9. Regras explícitas de comportamento, quando o usuário quiser orientar a implementação inicial.

Comportamento obrigatório da skill:

1. A skill não pode prosseguir se o usuário não informar claramente:
   - o módulo ou path
   - o agregado ou path
   - o nome do caso de uso
   - o tipo de cenário
2. Se essas informações estiverem vagas, a skill deve parar e pedir os dados faltantes de forma objetiva.
3. A skill deve aceitar dois modos de resolução de destino:
   - modo por convenção: `modules/<modulo>/src/<aggregate>/usecase/<use-case>.usecase.ts`
   - modo por path explícito informado pelo usuário
4. O nome do arquivo deve ser sempre em `kebab-case`, com o sufixo:
   - `.usecase.ts`
5. O nome da classe não deve terminar com `UseCase`.
6. O nome da classe deve ser apenas o nome do caso de uso em PascalCase.
   - Exemplo: arquivo `register-user.usecase.ts`
   - Classe: `RegisterUser`

Regras da implementação do caso de uso:

1. A skill deve criar ou atualizar o arquivo do caso de uso dentro de `usecase/`.
2. A skill deve criar uma interface de entrada com o nome do caso de uso e sufixo `In`.
   - Exemplo: `RegisterUserIn`
3. Se o caso de uso retornar algo, a skill deve criar também uma interface de saída com o nome do caso de uso e sufixo `Out`.
   - Exemplo: `RegisterUserOut`
4. Se o caso de uso não retornar nada relevante, a skill pode usar `void` e omitir a interface `Out`.
5. A classe do caso de uso deve implementar o contrato compartilhado `UseCase<In, Out>`, quando isso fizer sentido com base no padrão atual do projeto.
6. A skill deve gerar uma implementação inicial simples e coerente.
7. A skill não deve criar estruturas excessivamente sofisticadas, nem fluxos desnecessariamente complexos.
8. Quando o caso de uso for simples, a implementação pode ser mais direta.
9. Quando o caso de uso for mais complexo, a skill deve continuar simples, deixando espaço para o usuário refinar depois.
10. A skill deve considerar o que o usuário descreveu no prompt para ajustar dependências, entrada, saída e passos básicos da execução.
11. A skill não deve inventar regras de negócio não pedidas.
12. A skill não deve acoplar o caso de uso ao backend, controller, Prisma ou HTTP.
13. A skill deve focar no contrato e na orquestração básica de domínio.

Regras para o modo `crud`: 14. Se o cenário for `crud`, a skill deve seguir uma estrutura base compatível com operações simples como:

- criar
- atualizar
- excluir
- buscar por id
- buscar página

15. Nesses casos, a implementação pode ser padronizada e mínima, com dependências simples e fluxo previsível.
16. A skill pode usar exemplos internos para esses cenários mais comuns.

Regras para o modo `custom`: 17. Se o cenário for `custom`, a skill deve montar o caso de uso com base no que o usuário descreveu. 18. Mesmo em casos customizados, a skill deve manter a implementação inicial simples, clara e pouco opinativa. 19. Quando houver lacunas na descrição do usuário, a skill deve preferir placeholders úteis e contratos mínimos em vez de inventar comportamento detalhado.

Regras para os testes unitários: 20. Além de criar o caso de uso, a skill deve criar ou atualizar os testes unitários correspondentes. 21. O teste deve ser criado no padrão do projeto, preferencialmente em:

- `modules/<modulo>/test/<aggregate>/usecase/<use-case>.usecase.test.ts`

22. O nome do arquivo de teste deve seguir o mesmo padrão do arquivo principal, com o sufixo:

- `.usecase.test.ts`

23. Os testes devem cobrir 100% do caso de uso criado ou alterado.
24. A skill deve garantir cobertura completa dos fluxos observáveis do caso de uso, incluindo:

- caminho feliz
- falhas de validação
- dependências chamadas ou não chamadas conforme o fluxo
- branches e condicionais existentes
- retorno esperado quando houver saída
- comportamento quando houver erro propagado ou tratado

25. Os testes devem ser reais e úteis, não superficiais.
26. Sempre que o caso de uso depender de interfaces como repositórios ou providers, a skill deve procurar primeiro se já existem implementações fake/in-memory no módulo para essas interfaces.
27. Se existir uma implementação fake apropriada, a skill deve reutilizá-la nos testes.
28. Exemplos típicos de busca:

- `modules/<modulo>/test/mock/fake-<aggregate>.repository.ts`
- outros arquivos exportados por `modules/<modulo>/test/mock/index.ts`

29. Se já houver uma fake adequada para a dependência, a skill não deve duplicá-la desnecessariamente.
30. Se não houver fake adequada para uma dependência essencial do caso de uso, a skill pode criar uma implementação fake simples e reutilizável na pasta de testes do módulo.
31. Essas implementações fake não devem usar framework de mock.
32. Elas devem ser classes concretas, simples e previsíveis, voltadas para testes de domínio.
33. A skill deve também atualizar os exports da pasta `test/mock` quando necessário.
34. O teste deve usar essas implementações fake para exercitar o caso de uso da forma mais próxima possível de um uso real em memória.
35. Ao final, a skill deve rodar os testes relevantes e verificar a cobertura.
36. Se a cobertura não atingir 100% para o caso de uso criado ou alterado, a skill deve complementar os testes até atingir esse objetivo.

Exports e integração: 37. A skill deve criar ou atualizar:

- `modules/<modulo>/src/<aggregate>/usecase/<use-case>.usecase.ts`
- `modules/<modulo>/src/<aggregate>/usecase/index.ts`

38. A skill deve garantir os exports corretos no `index.ts` do agregado quando necessário, preservando exports existentes.
39. A skill deve manter a convenção de nomes do projeto para arquivos, interfaces e classes.

Determinismo e estrutura da skill: 40. A skill deve ser determinística na estrutura, nos nomes e no posicionamento dos arquivos. 41. A skill pode incluir few-shots e exemplos internos para orientar a geração correta de casos de uso simples, customizados e seus testes. 42. Esses exemplos devem ficar dentro da própria pasta `.agents/skills/module-use-case`. 43. Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/module-use-case`. 44. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.

Importante:

- A skill não cria controller.
- A skill não cria Prisma.
- A skill não cria adapter de backend.
- A skill não deve adicionar complexidade desnecessária.
- A skill deve gerar uma base boa, simples e consistente.
- O nome da classe do caso de uso não deve terminar com `UseCase`.
- O arquivo deve seguir o padrão `<nome>.usecase.ts`.
- A entrada deve usar o sufixo `In`.
- A saída, quando existir, deve usar o sufixo `Out`.
- Os testes fazem parte obrigatória da entrega.
- A skill deve priorizar reutilização de fakes existentes antes de criar novas implementações de teste.
- A cobertura esperada para o caso de uso criado ou alterado deve ser 100%.
