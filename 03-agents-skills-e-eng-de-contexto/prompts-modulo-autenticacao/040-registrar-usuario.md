Pasta dos casos de uso: modules/auth/src/user/usecase
Padrão de nomenclatura: *.usecase.ts (kebab-case e em inglês)
Pasta dos providers: modules/auth/src/user/provider

Obs.: Receber no construtor as duas interfaces que está em provider

Dados de entrada: name, email e password
Dados de saída: void

Fluxo do caso de uso de registrar usuário:
1) Usar o validador para validar a senha como forte (já existe uma rule para isso)
2) Converter a senha limpa para uma senha hash usando o provider fornecido
3) Criar novo usuário com name, email e hashPassword (criado no passo 2)
4) Validar o usuário chamando o validate()
5) Persistir o usuário usando a interface do repositório