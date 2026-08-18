## Ordem Sugerida

1. `config-project-fullstack`  
   Cria a base do monorepo fullstack com `apps/frontend`, `apps/backend`, workspaces e configuração inicial do projeto.

2. `config-prisma`  
   Configura a infraestrutura do Prisma no backend, banco, `DbModule`, `PrismaService` e base de persistência compartilhada.

3. `config-package-shared`  
   Reconstrói o pacote `packages/shared`, que concentra entidades base, erros, contratos, validações e utilitários usados por todo o projeto.

4. `config-new-module`  
   Cria um novo módulo de negócio no monorepo, com estrutura base em `modules/`, integração no backend e base inicial no frontend.

5. `module-aggregate`  
   Cria a estrutura padronizada de um agregado dentro do módulo, organizando `model`, `provider`, `usecase` e exports.

6. `module-entity`  
   Cria a entidade do agregado com validação lazy, estrutura de estado tipada e testes unitários com cobertura forte.

7. `shared-validation-rule`  
   Cria novas regras reutilizáveis de validação no `packages/shared`, com testes e exports corretos, quando a entidade precisar de uma regra nova.

8. `module-repository`  
   Cria o contrato do repositório do agregado e também uma implementação fake/in-memory para uso em testes de casos de uso.

9. `module-use-case`  
   Cria os casos de uso do agregado, com contratos `In` e `Out`, testes unitários e reaproveitamento das fakes já existentes.

10. `backend-prisma-sync-module`  
    Sincroniza o módulo de domínio com o Prisma, criando ou atualizando os models e migrations do backend.

11. `backend-prisma-repository`  
    Implementa no backend a versão Prisma dos repositórios definidos no domínio e registra isso no módulo Nest.

12. `backend-provider-implementation`  
    Implementa providers técnicos no backend, como criptografia, JWT, e-mail ou outros contratos definidos no domínio.

13. `backend-nest-config`  
    Cria a infraestrutura compartilhada do Nest no backend, como tratamento centralizado de erro, auth guard, decorator de usuário autenticado e base de segurança.

14. `backend-nest-controller`  
    Cria os controllers do Nest para expor os casos de uso via HTTP, reaproveitando autenticação e tratamento de erro já centralizados.

15. `spec-backend-auth-basic`  
    Skill de mais alto nível, usada por último, para orquestrar várias das skills anteriores e montar a base completa de autenticação do backend.

## Resumo de Uso Para o Dev

A sequência natural é:

1. criar o projeto
2. configurar banco e shared
3. criar o módulo
4. estruturar o agregado
5. criar entidade, regras, repositório e casos de uso
6. integrar persistência e providers no backend
7. configurar Nest compartilhado
8. expor via controller
9. por fim, usar a skill `spec-*` para acelerar a montagem de um fluxo completo como autenticação

## Regra Prática

- Skills `config-*`: criam fundação e estrutura macro.
- Skills `module-*`: constroem o domínio.
- Skills `backend-*`: conectam domínio, persistência e HTTP.
- Skills `spec-*`: orquestram tudo para um cenário maior.
