# Configuração

- [x] Configurar o Backend (shared) - Nest
- [x] Configurar o Prisma (DB) - Nest
- [x] Configurar o Banco de Dados - Docker
- [x] Configurar o Frontend (shared) - Next/React

# Módulo Auth

- [x] Criar o módulo com namespace @arquitetura/auth
- [ ] (tarefa de casa)

# Módulo de Contas

## Configuração

- [x] Criar o módulo com namespace @arquitetura/contas

## Negócio

- [x] Criar o agregado de conta
- [x] Criar objeto de valor para o nome da conta
- [x] Criar objeto de valor para o descrição da conta
- [x] Alterar a entidade para o padrão create/tryCreate
- [x] (EXTRA) Criar a função utilitária opcional
- [x] Caso de Uso de salvar a conta (Create/Update)
- [x] Caso de Uso de excluir a conta

## Backend

- [x] Criar mapeamento da entidade Conta para o modelo do prisma
- [x] Criar uma seed (preenchimento) para cadastrar contas de exemplo
- [x] Implementar as interface de acesso a banco de dados em contas.prisma.ts
- [x] Criar uma interface de consulta paginada
- [x] Implementar a API de contas (pública - TEMP)
- [x] Criar os testes de integração da API (Rest Client)

## Frontend

- [x] Criar o componente de tabela com paginação para centralizar as chamadas para os outros casos de uso. Implementar apenas a leitura paginada.
- [x] Criar o componente de formulario que suporte as operação de criação e alteração, ou seja, o componente de formulário deve receber como parâmetro o DTO de conta e se comportar de forma distinta de acordo com o DTO passado. Focar apenas no fluxo de criação de nova conta.
- [x] Implementar o fluxo de alteração de conta usando o formulário criado no passo anterior
- [x] Implementar o fluxo de exclusão de conta
