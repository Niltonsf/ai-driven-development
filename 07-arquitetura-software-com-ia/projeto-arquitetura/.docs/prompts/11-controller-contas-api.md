/backend-controller

Criar o controller NestJS do cadastro de Contas, seguindo rigorosamente os
padrões da skill backend-controller.

## Escopo (rotas)

- POST /contas → Salvar (criação e alteração no mesmo endpoint)
- DELETE /contas/:id → Excluir
- GET /contas/:id → Consultar por id
- GET /contas → Consulta paginada (com filtros/paginação via @Query)

## Injeção de dependência

- Injetar APENAS `contas.prisma.ts` (a implementação concreta do adapter Prisma),
  diretamente via DI do Nest — sem registrar/abstrair por interface/token.

## Comandos de escrita (Salvar / Excluir)

- Instanciar os casos de uso de comando MANUALMENTE dentro de cada método do
  controller (new UseCase(...)), passando o adapter Prisma injetado como
  dependência.

## Consultas (por id e paginada)

- NÃO possuem caso de uso.
- Resolver diretamente no controller, chamando o adapter Prisma injetado.
- Limitar as consultas paginadas para no máximo páginas de 50 registros

## Requisitos gerais

- Binding de @Body / @Param / @Query conforme o padrão da skill.
- Mapear falhas (Result/erros de domínio) para exceções HTTP apropriadas
  (BadRequestException, NotFoundException etc.).
- Aplicar guards/permissões e tipagem de DTOs no padrão da skill.

## Importante

- Temporariamente todas os endpoints serão públicos (ainda não temos autenticação implementada no projeto)
