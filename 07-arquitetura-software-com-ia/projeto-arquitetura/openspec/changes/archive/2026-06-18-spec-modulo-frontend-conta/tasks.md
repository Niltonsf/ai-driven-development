> Cada tarefa deve ser executada usando a skill indicada em `.claude/skills`, que descreve em detalhe o padrão do projeto. A spec define o **quê** (contratos da camada de frontend de Conta); a skill define o **como**. As camadas de negócio (`@arquitetura/contas`) e backend já existem e são apenas consumidas. Onde não há skill dedicada, seguir o padrão de módulo CRUD do web já estabelecido (`apps/web/src/modules/contas` como referência).

## 1. Estrutura do módulo e rotas

- [ ] 1.1 Garantir a estrutura `data/`/`components/`/`pages/` do módulo e as rotas do grupo privado (listar/criar/editar) com a skill **config-shared-frontend**, mantendo a navegação no layout/páginas (não em `shared/`)

## 2. Camada de dados (`data/`)

- [ ] 2.1 Criar o cliente de API do módulo (`contas.client.ts`) sobre o `apiRequest` compartilhado: listar, consultar por id, salvar e excluir — seguindo o padrão de módulo CRUD do web (sem recriar `fetch`)
- [ ] 2.2 Criar o schema do formulário (`conta-form.schema.ts`) reusando os Value Objects do domínio, com opcionais e helpers de `defaults`/payload, usando a skill **frontend-form-schema**
- [ ] 2.3 Criar os hooks de dados (lista paginada, registro único, exclusão) com `AbortController`, `loading`/`error`/`refetch` e tradução de erro — seguindo o padrão de módulo CRUD do web
- [ ] 2.4 Criar o hook do formulário (RHF + `resolver` do schema + chamada de salvar + status de submissão), decidindo create/edit pela presença do DTO, com a skill **frontend-form-schema**

## 3. Componentes de apresentação (`components/`)

- [ ] 3.1 Criar o componente de lista paginada (estados loading/erro/vazio/dados + ações criar/editar/excluir com diálogo de confirmação) consumindo os hooks — padrão de módulo CRUD do web
- [ ] 3.2 Criar o componente de formulário agnóstico de operação (recebe `ContaDTO?`, modo criação/edição) consumindo o hook do formulário, com a skill **frontend-form-schema**

## 4. Páginas (`pages/`)

- [ ] 4.1 Criar as páginas de listar, criar e editar (composição + navegação via callbacks), com a página de edição montando o formulário só após a conta carregar, usando a skill **config-shared-frontend**

## 5. Verificação

- [ ] 5.1 Conferir que cada cenário da spec é satisfeito (form create/edit pelo DTO, schema reusando VOs, paginação/exclusão, edição pré-preenchida)
- [ ] 5.2 Conferir que a UI nunca chama `fetch` direto, que tipos do domínio não são duplicados e que a navegação vive nas páginas
