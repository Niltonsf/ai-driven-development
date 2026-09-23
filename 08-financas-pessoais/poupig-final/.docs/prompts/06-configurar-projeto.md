- Confirmar e exibir todos os passos que serão executados
- Limpar o projeto usar o script em scripts/limpar-projeto.js e passar a flag de execução automática
- Criar os arquivos .env (frontend como no backend)
- Subir o banco de dados via docker
- Instalar as dependencias do Node JS
- Build inicial
- Resetar e executar as migrations de banco de dados (pode limpar o banco totalmente)
- Executar o build final do projeto

Estamos usando as seguintes libs/frameworks para facilitar o processo de configuração do projeto.

1. Typescript
2. NestJS no backend
3. Prisma como framework ORM
4. NextJS no frontend
5. Turborepo como biblioteca de build

> O script deve funcionar em Linux, Windows e MacOS.

Implementar o script sem dependecias externas, use apenas a API oficial do Node JS.

IMPORTANTE! Confirmar a execução do script para ter certeza que o usuário quer fazer essa operação. A resposta padrão deve ser não executar.

IMPORTANTE! Cada passo deve ser executado de forma independente e robusta, mesma diante de erros o fluxo completo deve ser executado até o final.

Permitir a execução direta via flag

Adicionar no package.json o script `npm run setup`
