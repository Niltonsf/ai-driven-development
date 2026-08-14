Pasta: modules/auth/src/user/model
Entidade Base: packages/shared/src/model/entity.ts
Exemplo de Entidade: packages/shared/test/model/entity.test.ts

Eu quero que seja criado a entidade de usuário com o ID, o nome do usuário, com o e-mail do usuário, a senha do usuário e a data de criação e a data de alteração do usuário, que na verdade, essas três datas: criação (createdAt), alteração (updatedAt) e de exclusão (deletedAt), podem ser modificadas lá na entidade base.

Essas três datas são datas que fazem parte ali da entidade base, que podem ser persistidas no banco de dados. E sempre que houver uma alteração através do método clone, o atributo updatedAt, ele pode ser alterado lá a partir do clone, porque é um momento onde uma entidade será alterada.

Mas o foco dessa demanda, desse prompt, é criar a classe usuário user.entity.ts, vai ser o nome, sempre com letras minúsculas, com os atributos que falei.

O nome tem que ter no mínimo 3 letras, no máximo 80 letras e não pode ter caracteres que não façam parte ali de nome, tem que ter a validação de caracteres especiais.

O e-mail tem que ter a validação de e-mail. A senha tem que ser uma senha forte e as datas vão ser recebidas por herança através da entidade base.

Então implementar a entidade e fazer os ajustes que precisam ser feitos lá na entidade base no módulo shared.