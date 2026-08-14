Eu quero que você crie, dentro do módulo compartilhado, uma pasta chamada "error". Para nós cadastrarmos os erros básicos da nossa aplicação. Os arquivos devem seguir o seguinte padrão de nomenclatura: *.error.ts.

A classe de erro base que vai servir como classe base para todos os erros da minha aplicação é o DomainError e essa classe deve herdar do erro padrão do JavaScript. Nessa classe a gente vai ter um status code que a gente vai usar para, nas subclasses, sobrescrever esses erros de status de acordo com o tipo de erro da nossa aplicação.

Criar subclasses de error com os seguintes códigos de status:
- 422: ValidationError
- 404: NotFoundError
- 401: UnauthorizedError

Remover a função de teste do módulo e exportar os error criados.