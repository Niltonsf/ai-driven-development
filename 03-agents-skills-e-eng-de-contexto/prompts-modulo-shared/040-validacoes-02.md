- Eu quero que o validador seja capaz de validar vários atributos simultaneamente, imaginando, por exemplo, uma entidade que tem sete atributos diferentes, o ID, o nome, o e-mail, a descrição e outros atributos.

Eu quero que o validador tenha a capacidade de receber objetos. Esse objeto vai receber o código do campo mais todas as validações daquele campo e o validador vai ser responsável não apenas de capturar todos os erros de validação de um campo específico, mas também de juntar todas as validações de todos os campos de um determinado conjunto de campos que vai ser passado para o validador.

Então essa é a primeira mudança que precisa ser feita dentro do validador.

- packages/shared/src/validation/validation-rule.interface.ts

Eu quero que você altere essa interface para o código de erro ser retornado sempre que a validação for gerada.

Caso não tenha sido capturado nenhum erro de validação, esse método retornará um valor nulo, nulo ou undefined. Mas eu acho que provavelmente nulo vai ser melhor nesse cenário.

Então, alterar, substituir o retorno boolean pelo retorno do código de erro sempre que o erro acontecer e caso não aconteça, ele retorna nulo.

- Alterar os testes impactados.