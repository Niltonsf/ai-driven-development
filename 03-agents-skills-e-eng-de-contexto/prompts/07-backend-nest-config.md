Crie uma skill chamada `backend-nest-config` dentro de `.agents/skills/backend-nest-config` para estruturar a camada compartilhada do backend NestJS, centralizando tratamento de erros, autenticação baseada em JWT e utilitários comuns para controllers e endpoints protegidos.

No `SKILL.md`, defina:

- `name`: `backend-nest-config`
- `description`: `Configura a base compartilhada do backend NestJS com tratamento centralizado de erros, autenticação por JWT, decorators utilitários e infraestrutura comum para endpoints protegidos da aplicação.`

Objetivo da skill:

- Criar uma estrutura compartilhada dentro do backend para evitar repetição de código nos controllers.
- Centralizar o tratamento de erros da API.
- Respeitar e reaproveitar a hierarquia de erros já existente em `packages/shared`.
- Criar uma estratégia segura e reutilizável para autenticação de endpoints com JWT.
- Criar utilitários como guard e decorator do usuário autenticado.
- Ser sensível ao projeto real onde a skill for executada, sem depender de paths rígidos além da estrutura padrão do backend.

Referências obrigatórias que a skill deve ler antes de implementar:

1. `packages/shared/src/error/index.ts`
2. `packages/shared/src/error/domain.error.ts`
3. `packages/shared/src/error/validation.error.ts`
4. `packages/shared/src/error/validation.exception.ts`
5. `apps/backend/src/app.module.ts`
6. `apps/backend/src/main.ts`
7. `apps/backend/src/modules/auth/auth.controller.ts`
8. Qualquer arquivo existente no projeto que já trate autenticação, usuário logado, token, claims ou contexto do request, se existir.

Objetivo arquitetural:

- Criar uma pasta compartilhada do backend, preferencialmente em `apps/backend/src/shared/`, para concentrar:
  - filtros de exceção
  - guards
  - decorators
  - tipos auxiliares
  - utilitários de autenticação
- Evitar espalhar tratamento de erro e lógica de autenticação pelos controllers.
- Permitir que os controllers foquem apenas no fluxo do endpoint.

Escopo da skill:

1. Criar uma estrutura compartilhada no backend, preferencialmente com subpastas como:
   - `apps/backend/src/shared/errors`
   - `apps/backend/src/shared/auth`
   - `apps/backend/src/shared/decorators`
   - `apps/backend/src/shared/types`
2. Criar um filtro global de exceções para o NestJS.
3. Padronizar a resposta HTTP dos erros de domínio vindos de `packages/shared`.
4. Criar uma estrutura de autenticação baseada em JWT para endpoints protegidos.
5. Criar um decorator para acessar o usuário autenticado no request.
6. Integrar essa configuração ao bootstrap da aplicação e ao `AppModule`, quando necessário.
7. Se fizer sentido, criar interfaces ou tipos compartilhados para representar o payload autenticado do request.

Regras do tratamento centralizado de erros:

1. A skill deve remover a necessidade de repetir `try/catch` e conversão manual de erros em controllers.
2. A skill deve criar um filtro global de exceção do NestJS.
3. Esse filtro deve reconhecer ao menos:
   - `ValidationException`
   - `ValidationError`
   - `DomainError`
   - erros HTTP nativos do Nest
   - erros inesperados
4. A resposta HTTP deve ser padronizada e consistente para o frontend.
5. Para `ValidationException`, a resposta deve preservar a lista de erros internos de forma estruturada.
6. Para `DomainError`, a resposta deve respeitar o `statusCode` definido na própria exceção.
7. Para erros inesperados, a resposta deve ser segura, consistente e sem vazar detalhes indevidos.
8. A skill deve usar como base a estrutura já existente em `packages/shared`, sem recriar uma hierarquia paralela de erros no backend.
9. A skill pode criar DTOs ou shapes de resposta de erro do backend se isso ajudar a manter a padronização.

Regras da autenticação JWT:

1. A skill deve criar uma estrutura compartilhada de autenticação para endpoints fechados da aplicação.
2. Essa estrutura deve incluir guard e demais utilitários necessários para validar JWTs.
3. A skill deve ser sensível ao projeto:
   - se já existir alguma configuração de autenticação, ela deve reaproveitar o que for compatível
   - se não existir, ela deve criar uma base mínima, clara e extensível
4. A skill não deve assumir detalhes rígidos do payload além do necessário para funcionar.
5. A skill deve permitir proteger rotas e controllers de forma simples e padronizada.
6. A skill deve criar um decorator para acessar o usuário autenticado no contexto da requisição.
7. Esse decorator deve funcionar bem mesmo se a estrutura concreta do payload variar entre projetos, desde que a skill consiga inferir o formato local.
8. Se necessário, a skill pode criar tipos auxiliares como:
   - usuário autenticado
   - payload JWT
   - request autenticado

Regras para o decorator do usuário autenticado:

1. A skill deve criar um decorator de uso simples, como algo no estilo de `@CurrentUser()`.
2. O decorator deve ler o usuário autenticado do request já validado pelo guard.
3. Se fizer sentido, ele pode permitir ler o objeto inteiro ou propriedades específicas.
4. A implementação deve ser robusta e alinhada ao contexto real do projeto em que a skill estiver sendo usada.

Regras de integração:

1. A skill deve integrar o filtro global ao bootstrap do NestJS, preferencialmente em `apps/backend/src/main.ts`, quando esse for o ponto correto no projeto.
2. A skill deve integrar guard, providers ou módulos necessários ao `AppModule` ou a um módulo compartilhado do backend, conforme a estrutura real encontrada.
3. A skill deve evitar acoplamento desnecessário com um módulo de negócio específico.
4. A skill deve produzir uma base compartilhada do backend que possa ser usada por vários módulos e controllers.

Regras de robustez:

1. A skill deve ser sensível à estrutura real do projeto no qual for executada.
2. Se a localização ideal de algum arquivo variar, a skill deve descobrir isso pelo contexto do backend em vez de depender de suposições frágeis.
3. A skill deve preferir criar uma estrutura compartilhada reutilizável em vez de resolver apenas um caso local.
4. A skill deve evitar duplicar utilitários equivalentes já existentes no projeto.
5. A skill deve manter a implementação simples, mas sólida e pronta para evolução.

Determinismo e estrutura da skill:

1. A skill deve ser determinística na estrutura e nos arquivos-base que cria.
2. Se precisar de templates, exemplos ou few-shots, eles devem ficar dentro de `.agents/skills/backend-nest-config`.
3. Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/backend-nest-config`.
4. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.

Importante:

- A skill não deve espalhar tratamento de erro pelos controllers.
- A skill deve centralizar o comportamento da API no backend.
- A skill deve respeitar a estrutura de erros já existente em `packages/shared`.
- A skill deve criar uma base segura para autenticação JWT.
- A skill deve incluir guard e decorator para usuário autenticado.
- A skill deve produzir uma configuração compartilhada do NestJS, reutilizável pelos módulos atuais e futuros.
