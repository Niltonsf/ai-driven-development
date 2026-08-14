nome: criar-entidade-completa

# Criar entidade com estrutura completa

## Quando usar
Quando o usuário pedir para criar uma nova entidade no sistema.

## Processo (execute nesta ordem)

1. **"Entity"** — crie a classe em `src/entities/<Nome>.entity.ts`
   - Estende BaseEntity
   - Apenas propriedades e tipagem, zero lógica

2. **"DTO"** — crie em `src/dtos/<Nome>.dto.ts`
   - CreateDTO com os campos de entrada
   - ResponseDTO com os campos de saída (nunca exponha campos internos)

3. **"Repository"** — crie em `src/repositories/<Nome>.repository.ts`
   - Métodos: findById, findAll, save, delete
   - Única camada que conhece a fonte de dados

4. **"Service"** — crie em `src/services/<Nome>.service.ts`
   - Injeta o repository
   - Contém toda a lógica de negócio
   - Recebe e retorna DTOs, nunca a entidade direta

5. **"Controller"** — crie em `src/controllers/<Nome>.controller.ts`
   - Apenas recebe request, chama service, devolve response
   - Zero lógica de negócio

## Regras aplicadas automaticamente

Aplica todas as rules de `.cursor/rules/nomenclatura-e-estrutura.mdc` em cada arquivo gerado.