Crie uma skill chamada `backend-nest-controller` dentro de `.agents/skills/backend-nest-controller` para criar controllers do NestJS no backend da aplicação, com foco em orquestrar casos de uso dos módulos de negócio, reaproveitar contratos já existentes, respeitar a infraestrutura compartilhada de autenticação e tratamento de erros do projeto e também gerar testes de integração no padrão do REST Client do Visual Studio Code.

No `SKILL.md`, defina:

- `name`: `backend-nest-controller`
- `description`: `Cria controllers padronizados no backend NestJS para expor casos de uso dos módulos de negócio, reaproveitando contratos existentes, integrando autenticação quando necessário e respeitando o tratamento centralizado de erros da aplicação.`

Objetivo da skill:

- Criar controllers do NestJS para expor casos de uso da aplicação.
- Priorizar o reaproveitamento das interfaces de entrada e saída já existentes no caso de uso.
- Evitar criar DTOs ou contratos redundantes quando o payload HTTP puder mapear diretamente para o caso de uso.
- Integrar autenticação e proteção de rotas quando o caso de uso exigir contexto autenticado.
- Respeitar a infraestrutura centralizada de tratamento de erros do backend.
- Manter os controllers simples, finos e focados apenas na adaptação entre HTTP e caso de uso.
- Criar junto com o controller um arquivo de testes de integração no padrão `*.integration.http`, compatível com o plugin REST Client do Visual Studio Code.
- Garantir que esses testes de integração sejam executáveis mesmo em APIs fechadas, descobrindo e reutilizando o fluxo real de autenticação do projeto.
- Ensinar no próprio artefato gerado a melhor forma de usar o REST Client, com variáveis, encadeamento entre requests e reaproveitamento de valores retornados pelas respostas.

Referências obrigatórias que a skill deve ler antes de gerar o controller e os testes de integração:

1. `apps/backend/src/modules/auth/auth.controller.ts`
2. `apps/backend/src/modules/auth/auth.module.ts`
3. O caso de uso alvo dentro de `modules/<modulo>/src/**/usecase/*.usecase.ts`
4. O `index.ts` do agregado e do módulo correspondente
5. A infraestrutura compartilhada do backend relacionada a autenticação e tratamento de erros, se existir, como por exemplo:
   - `apps/backend/src/shared/**`
   - filtros globais
   - guards
   - decorators
   - utilitários de autenticação
6. `apps/backend/src/app.module.ts`
7. Se existir, o arquivo `apps/backend/src/modules/<modulo>/<modulo>.integration.http` para preservar o padrão já usado no módulo

Entradas obrigatórias da skill:

1. O nome do módulo, ou um path inequívoco dentro de `modules/`.
2. O nome do agregado, ou um path inequívoco do agregado.
3. O nome do caso de uso que será exposto.
4. O método HTTP desejado:
   - `get`
   - `post`
   - `put`
   - `patch`
   - `delete`
5. O path da rota, quando o usuário quiser defini-lo explicitamente.

Entradas opcionais:

6. Se a rota deve ser autenticada ou pública.
7. Se a entrada HTTP pode reutilizar diretamente a interface `In` do caso de uso.
8. Se o caso de uso depende do usuário autenticado.
9. Regras específicas de binding, como uso de `@Body`, `@Param`, `@Query` ou combinações entre eles.

Comportamento obrigatório da skill:

1. A skill não pode prosseguir se o caso de uso alvo não estiver claramente identificado.
2. A skill deve localizar o caso de uso real no módulo e ler sua entrada, saída e dependências.
3. A skill deve criar ou atualizar o controller do módulo backend correspondente em:
   - `apps/backend/src/modules/<modulo>/<modulo>.controller.ts`
4. A skill deve também atualizar o módulo Nest correspondente quando necessário:
   - `apps/backend/src/modules/<modulo>/<modulo>.module.ts`
5. A skill deve preservar endpoints já existentes no controller, adicionando o novo endpoint sem sobrescrever os demais.
6. A skill deve preferir reutilizar a interface de entrada do caso de uso diretamente no controller sempre que o payload HTTP for compatível.
7. A skill só deve criar um DTO específico de controller se houver necessidade real de adaptação entre HTTP e o contrato do caso de uso.
8. A skill deve evitar duplicar contratos já existentes no domínio.
9. A skill deve criar ou atualizar junto com o controller um arquivo de integração com o mesmo nome-base do módulo:
   - `apps/backend/src/modules/<modulo>/<modulo>.integration.http`
10. A skill deve preservar requests já existentes nesse arquivo, acrescentando apenas os cenários necessários para o novo endpoint.
11. A skill deve garantir que os testes de integração gerados sejam suficientes para uso manual pelo time via REST Client, sem depender de passos implícitos fora do arquivo.
12. Se a rota for protegida, a skill deve descobrir como o login/autenticação funciona no projeto e incluir esse fluxo no arquivo de integração para obtenção do token antes de chamar a rota fechada.
13. Quando necessário para testar a rota, a skill pode criar no próprio arquivo requests auxiliares para preparar massa de dados, como criar usuário, autenticar, capturar id retornado e reutilizar esse valor em requests seguintes.
14. A skill deve usar variáveis do REST Client para facilitar a execução repetida dos testes pelo usuário.

Regras da implementação do controller:

1. O controller deve ser fino e simples.
2. O controller deve apenas:
   - receber a requisição
   - montar ou repassar a entrada do caso de uso
   - instanciar ou injetar as dependências necessárias no padrão já usado pelo projeto
   - executar o caso de uso
   - devolver a resposta HTTP apropriada
3. A skill deve preferir um fluxo em que a entrada do controller seja a mesma `In` do caso de uso quando isso for possível.
4. A skill deve evitar criar lógica de negócio no controller.
5. A skill deve evitar tratamento manual repetitivo de erro dentro dos endpoints.
6. Se já existir tratamento centralizado de erro no backend, a skill deve confiar nessa estrutura e não duplicar `try/catch` desnecessário.
7. Se não existir estrutura centralizada ainda, a skill pode usar o padrão atual do projeto, mas deve preferir integração com a abordagem compartilhada quando ela estiver presente.

Regras para autenticação:

1. A skill deve verificar se o caso de uso precisa de autenticação com base:
   - no pedido do usuário
   - no contexto do caso de uso
   - na infraestrutura de autenticação existente no backend
2. Se a rota for autenticada, a skill deve integrar o endpoint com a estrutura existente de guard/decorator do backend.
3. Se o projeto já tiver guard JWT e decorator de usuário autenticado, a skill deve reutilizá-los.
4. Se o caso de uso precisar do usuário autenticado, a skill deve obter esse dado do request pela estrutura compartilhada do backend, e não por parsing manual no controller.
5. A skill deve ser sensível ao projeto real: se a infraestrutura de autenticação já existir, ela deve ser seguida; se não existir, a skill deve deixar a integração preparada da forma mais coerente possível com o contexto local, sem reinventar arquitetura desnecessariamente.
6. Para os testes de integração, se a API for fechada, a skill deve incluir no início do arquivo um fluxo funcional de autenticação, usando a rota real de login do sistema.
7. Quando o login depender de um usuário pré-existente, a skill deve avaliar se precisa criar esse usuário no próprio arquivo de integração para tornar o fluxo executável.
8. O token obtido no login deve ser salvo em variável e reaproveitado nos requests protegidos subsequentes.
9. Se outros dados da resposta forem necessários em requests seguintes, como `id`, `refreshToken`, `userId` ou similares, a skill deve armazená-los em variáveis temporárias do REST Client.

Regras de binding HTTP:

1. A skill deve mapear a entrada do endpoint de forma simples e previsível, usando o binding mais adequado:
   - `@Body()` para payload de escrita
   - `@Param()` para identificadores de rota
   - `@Query()` para filtros e paginação
2. Quando for possível montar o objeto de entrada do caso de uso sem criar estruturas extras, a skill deve fazer isso.
3. Quando houver retorno, a skill deve devolver a saída do caso de uso de forma direta, salvo quando o contexto HTTP exigir ajuste simples de shape ou status.
4. Quando não houver retorno relevante, a skill pode devolver uma resposta enxuta e coerente com o método HTTP utilizado.

Regras para os testes de integração `*.integration.http`:

1. O arquivo deve seguir o formato entendido pelo plugin REST Client do Visual Studio Code.
2. O arquivo deve usar `###` para separar requests.
3. O arquivo deve declarar variáveis no topo quando isso facilitar o uso, como:
   - `@baseUrl`
   - `@token`
   - `@userId`
   - `@entityVersion`
4. Quando houver criação de entidades para suporte ao teste, a skill deve preferir uma estratégia de versionamento simples da massa, para evitar colisões entre execuções, por exemplo usando uma variável como `@entityVersion`.
5. Quando um request depender do resultado de outro, a skill deve mostrar no próprio arquivo como capturar e reutilizar valores da resposta do REST Client.
6. Quando fizer sentido, a skill deve nomear requests para facilitar referência posterior no arquivo.
7. O arquivo deve ser organizado para uso manual confortável por desenvolvedores, com fluxo previsível e fácil de executar.
8. O arquivo deve conter payloads coerentes com o contrato real do caso de uso e com a autenticação real do projeto.
9. A skill deve evitar gerar exemplos fictícios que não batam com a estrutura real da API.
10. Se a rota for pública, o arquivo deve ser simples e direto.
11. Se a rota for protegida, o arquivo deve conter o fluxo mínimo necessário para:

- preparar usuário se necessário
- efetuar login
- capturar token
- chamar a rota protegida

12. Se a rota criada depender de dados vindos de outras entidades, a skill deve incluir requests preparatórios mínimos para tornar o teste executável.
13. O arquivo deve ajudar o usuário a entender a melhor forma de uso do REST Client, inclusive com reaproveitamento de variáveis e encadeamento entre respostas.

Regras de integração com o módulo Nest:

1. A skill deve garantir que o controller esteja registrado no módulo Nest correspondente.
2. Se o controller depender de providers concretos do backend, a skill deve verificar se eles já estão registrados no módulo.
3. Se faltarem implementações concretas necessárias para o caso de uso funcionar no backend, a skill deve integrar o que já existir e reportar claramente o que ainda depende de outra skill, como repositório Prisma ou provider concreto.
4. A skill não deve inventar infraestrutura de persistência ou autenticação fora do escopo do controller.

Determinismo e estrutura da skill:

1. A skill deve ser determinística na estrutura, nos nomes e no posicionamento dos arquivos.
2. A skill pode incluir few-shots e exemplos internos para orientar a criação de endpoints públicos e autenticados.
3. Esses exemplos devem ficar dentro da própria pasta `.agents/skills/backend-nest-controller`.
4. Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/backend-nest-controller`.
5. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.
6. A skill deve considerar como saída padrão:
   - `apps/backend/src/modules/<modulo>/<modulo>.controller.ts`
   - `apps/backend/src/modules/<modulo>/<modulo>.module.ts`
   - `apps/backend/src/modules/<modulo>/<modulo>.integration.http`

Importante:

- A skill cria controller do NestJS, não caso de uso.
- A skill deve priorizar reaproveitar a interface `In` e a saída do caso de uso.
- A skill não deve duplicar tratamento de erro se ele já for centralizado.
- A skill deve integrar autenticação apenas quando fizer sentido para a rota.
- A skill deve manter o controller fino, simples e orientado a adaptação HTTP.
- A skill deve seguir a infraestrutura real do projeto em vez de impor uma arquitetura artificial.
- A skill deve criar os testes de integração junto com o controller, e não como passo opcional posterior.
- A skill deve usar o REST Client como ferramenta principal para esses testes manuais de integração.
- A skill deve gerar testes que realmente ajudem o usuário a executar e validar o endpoint no projeto real.
