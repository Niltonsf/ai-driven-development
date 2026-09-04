## Tela de consulta paginada de Contas

**Objetivo:** Implementar a tela de consulta paginada de contas. Este é o **primeiro CRUD da aplicação** e servirá de **referência/padrão** para todos os módulos seguintes — portanto, priorize clareza, organização e reuso em vez de soluções pontuais.

**Contexto da API:**

- Os endpoints disponíveis estão documentados em `apps/backend/src/modules/contas/contas.integration.http`. **Leia esse arquivo primeiro** para extrair: rota de listagem, parâmetros de paginação/filtro (page, limit, etc.), formato do payload de resposta (itens + metadados de paginação) e o shape de uma conta.
- Não altere backend nem regras de negócio — eles já estão prontos.

**Antes de codar:**

1. Inspecione a estrutura já existente em `apps/web/src` (camada compartilhada, cliente HTTP, componentes de UI, padrões de import com escopo `@arquitetura/*`) e siga as convenções já estabelecidas. Reutilize o que já existe; não recrie infraestrutura.
2. Verifique como o tipo/contrato de Conta é exposto pelos packages compartilhados e reutilize-o (não duplique tipos).

**Entregáveis:**

1. **Gerenciamento de estado** em `apps/web/src/modules/contas/data/`
   - Hook(s) de dados para a consulta paginada (busca, estados de loading/erro, paginação e filtros).
   - Context apenas se for realmente necessário para compartilhar estado entre componentes — não adicione complexidade prematura.
   - Centralize a chamada à API aqui (a UI não deve fazer fetch direto).

2. **Componente** `apps/web/src/modules/contas/components/contas.component.tsx`
   - Tabela/listagem das contas com controles de paginação.
   - Tratamento explícito de estados: carregando, vazio e erro.
   - Componente "burro" o suficiente: consome dados do hook/context, não conhece detalhes de transporte.
   - Adicionar os botões de ação dentro da tabela usando ícones apropriados para edição e exclusão (ainda não implementar nenhum comportamento nesses botões)
   - Adicionar antes da tabela um botão alinhado a direita para cadastrar novas contas (ainda sem comportamento implementado)

3. **Página** `apps/web/src/modules/contas/pages/contas.page.tsx`
   - Compõe o componente acima dentro do layout/rota padrão da aplicação.

4. **Item de menu** para acessar o cadastro de contas
   - Adicione no menu de navegação existente, seguindo o padrão já usado para outros itens.

**Padrões a respeitar:**

- Use o escopo de import `@arquitetura/*` (não `@namespace/*`).
- Tipagem forte ponta a ponta; sem `any`.
- Separação de responsabilidades: `data/` (estado + API) → `components/` (UI) → `pages/` (composição/rota).
- Nomenclatura e estilo consistentes com o restante do `apps/web`.
- Utilizar os componentes da pasta apps/web/src/shared, especialmente na pasta apps/web/src/shared/components/ui

**Ao finalizar:** explique brevemente as decisões de arquitetura tomadas (especialmente o uso ou não de context) para que sirvam de guia aos próximos CRUDs.
