Nome da Skill: config-new-module
Língua: Escrever em português do Brasil
Pasta: Dentro do projeto (.agents/skills) (.claude/skills)

Objetivo: criar um novo módulo de negócio dentro da pasta modules e baseado no nome do módulo, ele vai criar um módulo com estrutura pré-definida de arquivos.

Descrição detalhada:

- Não executar essa skill se o namespace não for informado
- Criar a pasta modules caso ela não exista
- Criar pasta do modules/<nome-do-modulo> (ex.: auth)

- Copiar os seguintes arquivos que devem ser criados a partir da skill de forma determinística. Dentro da skill esses arquivos podem ser colocados literalmente dentro da pasta assets:
  -- @jest.config.ts
  -- @tsconfig.json
  -- @package.json (mudar o namespace selecionado)
  -- @index.ts
  -- @index.test.ts

- Depois de criar a pasta do módulo adicionar a dependência dentro dos projetos frontend e backend da seguinte forma:
  "dependencies": {
  ...
  "@meu-projeto/<nome-do-modulo>": "\*",
  }

- Garantir que o ts-node esteja instalado no raiz do projeto (package.json):
  "devDependencies":{
  "ts-node":"^10.9.2",
  ...
  }

- Garantir que a pasta modules esteja em:
  "workspaces": [
  "apps/*",
  "modules/*",
  "packages/*",
  ]

- Executar a instalação das dependências do projeto
- Executar o build do projeto
- Executar os testes do módulo criado
