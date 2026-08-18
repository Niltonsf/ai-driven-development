Crie uma skill chamada `spec-backend-auth-basic` dentro de `.agents/skills/spec-backend-auth-basic` para orquestrar a criação da estrutura básica de autenticação do projeto no backend e no banco de dados, reaproveitando as skills já existentes no repositório e as novas skills que farão parte do catálogo.

No `SKILL.md`, defina:

- `name`: `spec-backend-auth-basic`
- `description`: `Orquestra a criação da base de autenticação do backend, incluindo módulo de domínio, agregados, entidades, repositórios, casos de uso, persistência, autenticação JWT e integração com o NestJS, reaproveitando as skills especializadas do projeto.`

Objetivo da skill:

- Construir a base de autenticação do backend da aplicação de forma orientada por especificação.
- Orquestrar várias skills menores em uma sequência previsível.
- Criar o módulo de autenticação com cadastro de usuário, login, persistência e autenticação JWT.
- Integrar domínio, backend NestJS, banco de dados e proteção de rotas.
- Focar somente no backend e no banco de dados nesta primeira versão.
- Não incluir frontend por padrão.

Natureza da skill:

- Esta é uma skill orquestradora.
- Ela não deve reimplementar internamente o trabalho detalhado das outras skills.
- Ela deve coordenar a execução das skills especializadas, na ordem correta.
- Ela deve usar as skills já existentes em `.agents/skills` e as novas skills que já tiverem sido criadas a partir dos prompts deste projeto.
- Se alguma skill necessária ainda não existir, ela deve parar e reportar claramente a dependência faltante.

Escopo funcional da autenticação básica que esta skill deve cobrir:

1. Criação ou evolução do módulo `auth`.
2. Criação de um agregado de usuário.
3. Criação da entidade de usuário.
4. Criação do contrato de repositório de usuário.
5. Criação dos casos de uso principais, no mínimo:
   - registro de usuário
   - login de usuário
6. Criação da persistência de usuário no backend.
7. Sincronização do módulo com Prisma e banco de dados.
8. Criação da implementação de providers técnicos necessários, como:
   - criptografia
   - geração e validação de JWT
9. Criação da infraestrutura compartilhada do backend para:
   - tratamento centralizado de erro
   - autenticação JWT
   - guard
   - decorator de usuário autenticado
10. Criação dos controllers necessários para expor os endpoints principais da autenticação.
11. Deixar a aplicação pronta para proteger endpoints fechados com usuário autenticado.

Entradas obrigatórias da skill:

1. O nome do módulo de autenticação, quando não for simplesmente `auth`.
2. O nome do agregado principal de usuário.
3. O nome da entidade principal.
4. A especificação mínima dos atributos do usuário.
5. A indicação de que o fluxo deve incluir, no mínimo:
   - cadastro
   - login
6. Se o usuário quiser, pode também informar:
   - nome dos casos de uso
   - nome dos endpoints
   - estrutura do payload JWT
   - campos de login
   - regras adicionais de autenticação

Entradas opcionais: 7. Se deve usar e-mail como login. 8. Se deve usar username, telefone ou outro identificador. 9. Campos obrigatórios de cadastro. 10. Regras específicas de senha. 11. Claims desejadas no JWT. 12. Tempo de expiração do token. 13. Se deve haver refresh token nesta primeira versão. 14. Se o usuário quiser forçar nomes específicos de arquivos, classes ou rotas.

Comportamento obrigatório:

1. A skill deve começar validando se as skills necessárias existem no catálogo local.
2. Ela deve verificar a presença das skills orquestradas antes de iniciar o fluxo.
3. Se alguma skill obrigatória estiver ausente, ela deve parar e informar exatamente qual skill falta.
4. Ela não deve improvisar a ausência de uma skill crítica quando a intenção era explicitamente usar o catálogo do projeto.
5. A skill deve executar o fluxo de forma incremental, verificando o resultado de cada etapa antes de avançar.

Skills que esta skill deve tentar orquestrar, quando estiverem disponíveis:

1. `config-new-module`
2. `config-package-shared`
3. `module-aggregate`
4. `config-module-entity`
5. `module-repository`
6. `module-use-case`
7. `shared-validation-rule`, quando necessário
8. `backend-provider-implementation`
9. `backend-prisma-sync-module`
10. `backend-prisma-repository`
11. `backend-nest-config`
12. `backend-nest-controller`

Sequência sugerida de orquestração:

1. Garantir a base do projeto e do módulo.
2. Garantir o pacote shared, quando necessário para a autenticação.
3. Criar ou preparar o módulo `auth`.
4. Criar o agregado principal do usuário.
5. Criar a entidade de usuário com validações adequadas.
6. Criar o contrato de repositório do usuário.
7. Criar os casos de uso de registro e login.
8. Criar ou reutilizar regras compartilhadas necessárias.
9. Sincronizar o domínio com Prisma.
10. Criar a implementação Prisma do repositório.
11. Criar implementações concretas de providers técnicos:

- provider de criptografia
- provider de JWT

12. Configurar a base compartilhada do NestJS:

- filtro global de erros
- auth guard
- decorator de usuário autenticado

13. Criar os controllers do NestJS para os fluxos de autenticação.
14. Validar integração final do backend.

Regras de orquestração:

1. A skill deve delegar para as skills específicas em vez de repetir suas instruções detalhadas.
2. Cada etapa deve aproveitar ao máximo o resultado da etapa anterior.
3. A skill deve manter a coerência de nomes entre módulo, agregado, entidade, repositório, casos de uso, providers e controllers.
4. A skill deve preferir estruturas simples e fáceis de manter.
5. A skill deve respeitar o padrão do projeto atual e não impor uma arquitetura paralela.
6. A skill deve ser sensível ao contexto real do repositório em que estiver executando.
7. Quando houver algo já implementado parcialmente, a skill deve evoluir a estrutura existente em vez de recriar do zero sem necessidade.

Escopo mínimo da autenticação:

1. Endpoint de registro de usuário.
2. Endpoint de login.
3. Persistência do usuário.
4. Senha protegida por provider técnico apropriado.
5. Geração de JWT.
6. Estrutura para proteger endpoints autenticados.
7. Acesso ao usuário autenticado via decorator compartilhado.
8. Tratamento centralizado de erro respeitando `packages/shared`.

Regras de testes:

1. A skill deve garantir que as skills filhas responsáveis por entidade, repositório, caso de uso e providers criem seus testes conforme seus próprios contratos.
2. A skill deve validar, ao final, que os testes relevantes do módulo e do backend estejam passando.
3. A skill deve reportar claramente o que foi testado e o que ainda depende de evolução futura.
4. Quando uma etapa criar cobertura obrigatória de 100%, a skill deve respeitar essa exigência da skill especializada correspondente.
5. A skill orquestradora não precisa duplicar toda a lógica de teste das skills filhas, mas precisa garantir que a cadeia final esteja consistente.

Limites da skill:

1. Esta skill não deve incluir frontend nesta versão.
2. Esta skill não deve tentar resolver refresh token, autorização por perfil, recuperação de senha ou confirmação por e-mail, a menos que o usuário peça explicitamente.
3. O objetivo é entregar uma autenticação básica, sólida e extensível.
4. Se alguma dessas extensões for solicitada, a skill pode evoluir o fluxo, mas deve manter a simplicidade como padrão.

Saída esperada:

1. Módulo de autenticação funcional no backend.
2. Estrutura de domínio criada ou atualizada.
3. Persistência integrada ao Prisma.
4. Providers técnicos implementados.
5. Configuração Nest compartilhada aplicada.
6. Controllers principais da autenticação criados.
7. JWT integrado.
8. Base pronta para proteger endpoints autenticados de outros módulos.
9. Relatório final resumindo:
   - skills utilizadas
   - arquivos principais criados ou alterados
   - testes executados
   - pendências ou próximos passos

Determinismo e estrutura da skill:

1. A skill deve ser determinística no fluxo e na ordem das etapas.
2. Se precisar de few-shots, exemplos ou checklists, eles devem ficar dentro de `.agents/skills/spec-backend-auth-basic`.
3. Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/spec-backend-auth-basic`.
4. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.

Importante:

- Esta skill é uma orquestradora.
- Ela deve coordenar outras skills em vez de duplicá-las.
- Ela deve focar na autenticação básica do backend e do banco.
- Ela deve ser robusta o suficiente para montar o fluxo principal de autenticação ponta a ponta.
- Ela deve deixar o projeto preparado para evolução futura, inclusive integração com frontend em uma etapa posterior.
