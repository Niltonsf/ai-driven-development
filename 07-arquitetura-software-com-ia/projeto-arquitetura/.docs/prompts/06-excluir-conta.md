/module-use-case

Implementar o caso de uso "Excluir Conta" na pasta:
modules/contas/src/conta/use-case

Comportamento do caso de uso:

1. Receber o id da conta a ser excluída.
2. Verificar, pela consulta por id (conta.repository.ts), se a conta existe no banco de dados:
   - Se NÃO existir → retornar falha indicando que a conta não foi encontrada.
   - Se existir → remover a conta usando o método "delete".

Interface de acesso ao banco de dados (injetada no construtor do caso de uso):

- conta.repository.ts → operações de persistência (findById, delete).
