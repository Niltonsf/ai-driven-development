# Négocio

- Criar o agregado de `user` sem nenhum caso de uso. (skill: module-aggregate)
- Alterar a entidade `user` para possuir os seguintes atributos: id, name, email, avatarUrl (opcional). Usar os objetos de valor para validar os atributos. (skill: module-entity)
- Criar a interface de `user.repository` para persistir a entidade `user` e adicionar a consulta por email seguindo o padrão de nomenclatura do projeto. (skill: module-repository)

- Criar o agregado de `password` sem nenhum caso de uso. (skill: module-aggregate)
- Alterar a entidade `password` para possuir os seguintes atributos: id, value. Usar os objetos de valor para validar os atributos (ex. validar senha forte). (skill: module-entity)
- Criar a interface de `password.repository` para persistir a entidade `password`. (skill: module-repository)
- Criar a interface de `password-crypto.provider` para criptografar e comparar senhas.

- Criar o caso de uso de `create-user.usecase` dentro da pasta `modules/auth/src/app/usecase` (trabalha com múltiplos agregados) que recebe por parametro os repositórios (`user` e `password`) e a interface de criptografia de senha. O fluxo do caso é o seguinte: verificar se o email não existe (pode gerar erro aqui), validar nome, validar email, validar senha forte, criptografar a senha, criar a entidade `password`, criar a entidade `user` e persistir as entidades dentro de uma transação. (skill: module-use-case)
  > Os passos do caso de uso podem gerar erros e parar o processo.

# Backend

- Mapear a entidade `user` com o prisma. (skill: backend-prisma-data)
- Mapear a entidade `password` com o prisma. Tem uma relação com `user`. (skill: backend-prisma-data)
- Criar uma implementação do repositório de `user` usando o prisma (`apps/backend/src/modules/auth/user.prisma`).
- Criar uma implementação do repositório de `password` usando o prisma (`apps/backend/src/modules/auth/password.prisma`).
- Executar as migrations do prisma para criar as tabelas

- Criar uma implementação do provedor de `password-crypto.provider` usando o bcrypt

- Atualizar o `auth.controller` para receber as implementações dos repositórios diretamente (`*.prisma`) no controller (não precisa usar interface).
- Criar dentro de `auth.controller` o método (público) para registrar usuário instanciando diretamente dentro do método o caso de uso `create-user.usecase`.

- Criar o seed de banco de dados dentro de `apps/backend/prisma/seed/data/users.json` para inserir usuarios e senhas (sempre: '#Senha123') para ter uma base de dados com 80 usuário. O primeiro tem o email `usuario@formacao.dev`.
- Executar o seed preenchendo o banco de dados
- Criar os testes de integração (usando o padrão do Rest Client - Plugin do VS Code) para o método de registrar o usuário

# Frontend

- Criar o componente `auth-form.component` dentro de `apps/frontend/src/modules/auth/components` que deve suportar os fluxos de registrar e login. Separe as chamadas de API e gerenciamento de estado na pasta `apps/frontend/src/modules/auth/data`. Crie hooks do react caso seja necessário.
- Aplicar todas as validações necessárias no formulário de autenticação e em caso de sucesso, mostrar o toaster de sucesso.
- Referenciar o formuário criado (`auth-form.component`) na rota `/join` e no caso de login correto, redirecionar a aplicação para rota `/dashboard`.
- NÃO criar nada de proteção de rotas (component guard) no frontend. Essa atividade ficará para uma funcionalidade futura.

> Obs: IMPORTANTE!!! Executar as três partes (Negócio, Backend e Frontend) em subagentes separados com contexto limpo em cada um deles
