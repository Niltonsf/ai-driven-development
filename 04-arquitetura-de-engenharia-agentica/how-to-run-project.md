## 1. Segue a lista de arquivos gerados

- Especificações geradas, mas sem nenhuma das evidências cadastradas
- Pasta com as skills usadas dentro do projeto
- Projeto final com todas as especificações e o código gerado durante o capítulo

## 2. Como executar o projeto

### 2.1. Instalar as dependências

```
npm install
```

### 2.2. Subir o banco de dados com Docker

```
cd apps/backend && docker compose up -d && cd ../..
```

### 2.3. Configurar o .env

Verifique se o arquivo .env está configurado corretamente.

O banco de dados deve estar rodando na porta definida na variável DATABASE_URL.

```
DATABASE_URL="postgresql://sdd_sdd:docker@localhost:6321/sdd_sdd_db?schema=public"
```

### 2.4. Gerar o Prisma Client & Migrations

```
cd apps/backend
npx prisma generate
npx prisma migrate dev
cd ../..
```

### 2.5. Rodar o build do projeto

```
npm run build
```

### 2.6. Executar o projeto em modo desenvolvimento

```
npm run dev
```
