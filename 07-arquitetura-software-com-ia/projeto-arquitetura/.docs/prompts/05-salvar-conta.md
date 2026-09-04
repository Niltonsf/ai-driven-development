/module-use-case

Implementar o caso de uso de salvar conta (incluir e alterar) detectando se a conta está no banco de dados usando a consulta por id e persistindo a conta nova usando o create e em caso de alteração chamar o update.

Criar uma uma interface de consulta para verificar se o nome da conta já está em uso dentro do banco de dados. Criar uma inteface de nome nome-conta-em-uso.query.ts (dentro de provider) que deve retornar true/false.

Ao criar o caso de uso deve ser passado as duas interfaces de acesso a banco de dados quais sejam: conta.repository.ts e nome-conta-em-uso.query.ts.

Pasta de destino: modules/contas/src/conta/use-case
