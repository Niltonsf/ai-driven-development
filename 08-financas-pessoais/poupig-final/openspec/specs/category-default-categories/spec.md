# category-default-categories Specification

## Purpose
TBD - created by archiving change cadastro-categorias-padrao. Update Purpose after archive.
## Requirements
### Requirement: Catálogo de categorias e subcategorias padrão
O sistema SHALL disponibilizar, em `modules/category/src/category/constants`, um catálogo de constantes com as categorias e subcategorias padrão do sistema. Cada categoria do catálogo SHALL possuir `name`, `icon` e `color`; cada subcategoria SHALL possuir `name`, `icon`, `color` e `order`. O catálogo SHALL cobrir, de forma generosa, categorias e subcategorias comuns ao orçamento de uma família média brasileira (incluindo, no mínimo, moradia, alimentação, transporte, saúde, educação e lazer), cada uma com múltiplas subcategorias relevantes.

#### Scenario: Catálogo expõe estrutura completa por categoria
- **WHEN** o catálogo de categorias padrão é lido
- **THEN** cada categoria possui `name`, `icon` e `color` preenchidos, e uma lista não vazia de subcategorias, cada uma com `name`, `icon`, `color` e `order` únicos dentro da própria categoria

#### Scenario: Catálogo cobre domínios essenciais do orçamento familiar
- **WHEN** o catálogo de categorias padrão é lido
- **THEN** ele inclui ao menos as categorias de moradia, alimentação, transporte, saúde, educação e lazer, cada uma com subcategorias específicas do domínio

---

### Requirement: Caso de uso aplica o catálogo padrão para o usuário autenticado, reutilizando save-category
O sistema SHALL implementar um caso de uso (`ApplyDefaultCategories`, em `modules/category/src/category/use-case/`) que recebe o `userId` do usuário autenticado, itera o catálogo de categorias padrão e, para cada item, reutiliza as regras já existentes de criação de categoria (`SaveCategory`), incluindo a verificação de nome duplicado por usuário. Categorias do catálogo cujo nome já exista para o `userId` SHALL ser ignoradas, sem gerar erro; apenas as ainda inexistentes para aquele usuário SHALL ser inseridas, com suas respectivas subcategorias. Por ser um caso de uso de comando, `ApplyDefaultCategories.execute` SHALL retornar `Result<void>`, sem devolver dados de leitura (ex.: listas de nomes criados/ignorados), seguindo o mesmo padrão dos demais casos de uso de comando do sistema (`SaveCategory`, `DeleteCategory`).

#### Scenario: Aplicação do catálogo para usuário sem nenhuma categoria cadastrada
- **WHEN** `ApplyDefaultCategories.execute` é chamado com o `userId` de um usuário que não possui nenhuma categoria cadastrada
- **THEN** todas as categorias do catálogo padrão são criadas para esse usuário, cada uma com suas subcategorias, e o caso de uso retorna sucesso (`void`)

#### Scenario: Reaplicação do catálogo é idempotente
- **WHEN** `ApplyDefaultCategories.execute` é chamado novamente para um `userId` que já possui todas as categorias do catálogo padrão (por terem sido aplicadas anteriormente)
- **THEN** nenhuma categoria nova é criada, nenhuma categoria existente é alterada, e o caso de uso retorna sucesso (`void`), sem nenhum erro

#### Scenario: Aplicação parcial quando o usuário já possui algumas categorias do catálogo
- **WHEN** `ApplyDefaultCategories.execute` é chamado para um `userId` que já possui, cadastrada manualmente ou por aplicação anterior, uma categoria com o mesmo `name` de um item do catálogo
- **THEN** essa categoria do catálogo é ignorada (não é recriada nem alterada), as demais categorias do catálogo ainda inexistentes para o usuário são criadas normalmente, e o caso de uso retorna sucesso (`void`)

---

### Requirement: Endpoint protegido por JWT dispara o cadastro do catálogo padrão
O sistema SHALL expor um endpoint HTTP, protegido por autenticação JWT, para que o usuário autenticado dispare o caso de uso de cadastro do catálogo de categorias padrão. O `userId` usado pelo caso de uso SHALL ser sempre extraído do token de autenticação (usuário autenticado da requisição), nunca de qualquer campo do corpo da requisição.

#### Scenario: Usuário autenticado dispara o cadastro do catálogo padrão
- **WHEN** um usuário autenticado chama o endpoint de cadastro de categorias padrão
- **THEN** o caso de uso `ApplyDefaultCategories` é executado com o `userId` do usuário autenticado, e a resposta indica sucesso da operação

#### Scenario: Requisição sem autenticação é rejeitada
- **WHEN** o endpoint de cadastro de categorias padrão é chamado sem um token JWT válido
- **THEN** a requisição é rejeitada antes de qualquer execução do caso de uso, sem cadastrar nenhuma categoria

#### Scenario: Corpo da requisição não influencia o userId utilizado
- **WHEN** o endpoint de cadastro de categorias padrão é chamado com um corpo de requisição contendo um `userId` diferente do usuário autenticado
- **THEN** o caso de uso é executado com o `userId` do token autenticado, ignorando qualquer `userId` presente no corpo da requisição

