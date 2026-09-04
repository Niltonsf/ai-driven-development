Implementar o repositório de contas usando as melhores prática o ORM prisma em apps/backend/src/modules/contas/contas.prisma.ts implementando as interfaces abaixo:

- modules/contas/src/conta/provider/conta.repository.ts
- modules/contas/src/conta/provider/nome-conta-em-uso.query.ts

No caso da interface `nome-conta-em-uso.query.ts` crie uma constante para implementar de forma inline a interface, permitindo assim a implementação de multiplas interface que possuem o mesmo método `execute`.
