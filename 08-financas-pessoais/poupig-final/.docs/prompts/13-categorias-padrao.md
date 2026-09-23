Criar um arquivo de constantes (JSON ou TS) em `modules/category/src/category/constants` com as categorias padrão do sistema.

Não é um simples seed de banco de dados para teste, mas uma funcionalidade completa (negócio e backend) do projeto, que pode ser chamada pelo usuário autenticado para cadastrar de uma só vez um conjunto de categorias e subcategorias padronizadas.

Criar uma especificação para:

- Criar o arquivo de constantes com todas as categorias e subcategorias padrão, cada categoria com `name`, `icon` e `color`, e cada subcategoria com `name`, `icon`, `color` e `order`. Cobrir categorias e subcategorias comuns ao orçamento de uma família média brasileira (ex.: moradia, alimentação, transporte, saúde, educação, lazer etc.), sendo generoso na cobertura dos cenários.
- Criar o caso de uso para ler o arquivo de constantes e, para o usuário autenticado, cadastrar cada categoria padrão reutilizando as regras já existentes de criação de categoria (`save-category.use-case`), incluindo a verificação de nome duplicado por usuário. Categorias já existentes para o usuário devem ser ignoradas (sem gerar erro), inserindo apenas as que ainda não existem.
- Expor um endpoint de API, protegido por JWT, para que o usuário autenticado possa disparar esse caso de uso, extraindo o `userId` do token (nunca do body da requisição).
