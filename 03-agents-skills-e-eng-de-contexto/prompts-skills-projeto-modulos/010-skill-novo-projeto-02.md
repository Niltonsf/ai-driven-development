@Skill Creator

# Configuração do Projeto

- npx create-turbo@latest projeto-exemplo -m npm
- cd projeto-exemplo
- /bin/rm -rf apps/*
- cd apps
- npx create-next-app@latest frontend --yes --src-dir
- npm i -g @nestjs/cli
- nest new backend -g -p npm
- cd backend
- npm install @nestjs/config

- Alterar arquivo (apps/backend/src/app.module.ts):

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
  
@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
```

- Alterar arquivo (apps/backend/src/main.ts):
	- Porta de 3000 para 4000
	- CORS habilitado
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
```
- Alterar o arquivo (apps/backend/package.json) para adicionar o script:
```
"dev": "nest start --watch",
```

- Criar arquivo apps/frontend/.env.example com o conteúdo:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- Copiar arquivo apps/frontend/.env.example para apps/frontend/.env

- Criar arquivo apps/backend/.env.example com o conteúdo:

```env
PORT=4000
```

- Copiar arquivo apps/backend/.env.example para apps/backend/.env

Informações Finais:
- Nome da SKill: config-project-fullstack
- Pasta: .agents/skills
- Orientações finais: Eu quero que você crie uma nova skill baseado em toda a estrutura que eu coloquei acima, que foi o passo a passo usado para configurar o projeto do zero.

Eu quero que você crie essa skill dentro da pasta do próprio projeto e não em outro lugar.

Então pode criar a pasta .agents/skills e colocar a skill lá dentro.

Eu quero que essa skill ela seja determinística.

Eu quero que você crie a skill dentro de um arquivo JavaScript que seja responsável por executar cada um dos passos acima e garantir que o projeto esteja configurado no final com o frontend executando na porta 3000 e o backend executando na porta 4000, e o backend sendo capaz de ler variáveis de ambiente conforme foi feito aí o passo a passo em cima. Seguir uma estrutura determinística, não divagar e fazer todas as verificações de segurança para garantir que ao executar esse comando dentro dessa pasta, o projeto seja criado do absoluto zero. Se eu passar no prompt do comando o namespace do projeto, eu quero que no final de executar todo esse script, você altere tanto o namespace do front-end, do back-end, como de eventuais outros pacotes que possam existir no projeto para o namespace que foi informado. Então se eu colocar um arroba, alguma coisa lá de namespace, você faça esse processo no final de uma forma que não atrapalhe o passo a passo anterior. Então seguir exatamente o passo a passo para criar uma nova skill com o nome que foi mencionado acima.