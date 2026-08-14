Pasta: packages/shared/src/model

Eu quero que você crie um arquivo chamado entity.ts que vai representar a nossa entidade base e o nome pode ser Entity, entidade.

Essa classe vai ser uma classe abstrata que vai receber propriedades, vai receber os dados ali básicos através de uma interface e essa interface vai ser estendida posteriormente por outras entidades na nossa aplicação.

Ela vai ter o ID usando UUID.

Você precisa instalar uma biblioteca dentro do nosso módulo compartilhado, que é a biblioteca UUID. Ele vai usar o UUID versão 4 para gerar os IDs, então caso o ID não tenha sido fornecido, a própria entidade vai gerar o ID.

Essa entidade vai ter um método abstrato chamado validate, que vai usar exatamente a estrutura que a gente já criou de validação para ela implementar a validação interna em cada entidade concreta usando o validator.

E essa entidade precisa comparar a igualdade utilizando o ID, que será um ID do tipo string.

Então eu quero que você crie a entidade base, que vai ser exatamente essa classe concreta usada para criar as nossas entidades na aplicação.

Eu quero que você crie um teste específico para testar essa classe e, no teste, você cria uma entidade concreta. Pode usar um exemplo que seria um exemplo comum da aplicação, tipo uma classe User que vai ter nome, e-mail, ID, senha, por exemplo.

E você pode criar os testes para validar essa classe que vai representar a entidade da nossa aplicação.