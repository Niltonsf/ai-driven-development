Dentro do usuário, ele atualmente está fazendo uma verificação de senha forte, mas eu não quero que dentro do usuário tenha a senha limpa do usuário.

Então vai ser necessário criar uma nova regra, uma nova rule dentro da pasta que foi mencionada no prompt anterior para você criar uma validação de senha criptografada no estilo bcrypting, uma senha hash.

Então você tem que ter agora uma regra para fazer a validação ali de uma Regex para garantir que você tenha dentro do usuário uma senha criptografada e, com essa mudança, você precisa também atualizar os testes do usuário e garantir que os testes estão cobrindo 100% dos cenários.

Então, criar uma regra para validar uma senha criptografada no estilo hash bcrypt e alterar a validação na classe usuário para que ele tenha a validação não de uma senha forte, mas de uma senha criptografada.