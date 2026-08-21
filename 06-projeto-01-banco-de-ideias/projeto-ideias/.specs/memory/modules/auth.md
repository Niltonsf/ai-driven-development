# Módulo: Autenticação

## Para que serve

Garantir que cada pessoa que usa o produto tenha uma conta própria e consiga provar que é
ela no momento de acessar. É a porta de entrada da aplicação e a base do isolamento de
dados: tudo o que existe no produto pertence a um usuário específico.

## Conceitos principais

- **Usuário**: a identidade de quem usa o produto (nome, e-mail e senha). É a âncora de
  propriedade de todo dado de negócio — Ideias, Tipos e Processamentos sempre pertencem a
  um usuário.

## Regras de negócio relevantes

- **Cadastro** cria uma conta nova com a senha protegida (nunca armazenada em texto
  legível).
- **Login** confere as credenciais informadas. Quando estão corretas, devolve apenas a
  identificação básica do usuário (quem ele é); quando estão erradas, recusa o acesso sem
  revelar qual parte falhou.
- O módulo **não decide como a sessão se mantém depois do login**. Ele responde "estas
  credenciais conferem ou não" — a forma de manter o usuário logado entre requisições é
  uma decisão de infraestrutura da aplicação, fora do escopo de negócio.

## Fronteiras

Não cuida de recuperação de senha, verificação de e-mail, papéis/permissões ou múltiplos
níveis de acesso. O modelo é simples: um usuário individual, dono dos próprios dados.
