## Formulário de Conta (Criação e Edição)

**Objetivo:** Implementar o **componente de formulário de contas** que suporte tanto a **criação** quanto a **alteração** de uma conta. O comportamento do formulário deve ser determinado pelo **DTO recebido como parâmetro**: ao receber um DTO de conta existente, opera em modo edição (campos pré-preenchidos); sem DTO (ou DTO vazio), opera em modo criação. **Implemente e conecte apenas o fluxo de criação de nova conta agora** — mas a estrutura do formulário já deve dar suporte aos dois fluxos. Este é o segundo passo do **primeiro CRUD da aplicação** (após a tela de consulta paginada já existente) e continua servindo de **referência/padrão** para os módulos seguintes — portanto, priorize clareza, organização e reuso em vez de soluções pontuais.

**Contexto da API:**

- Os endpoints disponíveis estão documentados em `apps/backend/src/modules/contas/contas.integration.http`. **Leia esse arquivo primeiro** para extrair: rota de criação (e a de atualização, mesmo que ainda não seja usada), o shape do payload de entrada (campos obrigatórios/opcionais, tipos), o formato da resposta e quaisquer validações esperadas.
- Não altere backend nem regras de negócio — eles já estão prontos.

**Antes de codar:**

1. Inspecione a estrutura já criada no CRUD de consulta de contas em `apps/web/src/modules/contas` (camada `data/`, hooks, cliente da API, componentes) e siga rigorosamente as convenções já estabelecidas. **Reutilize o api-client compartilhado e o cliente de dados já existentes**; não recrie infraestrutura.
2. Verifique como o tipo/contrato de Conta e seus DTOs (entrada de criação/atualização) são expostos pelos packages compartilhados e **reutilize-os** (não duplique tipos). Use o DTO compartilhado como parâmetro do componente de formulário.
3. Verifique se já existe um padrão de formulário/validação no `apps/web` (biblioteca de form, schema de validação, componentes de input compartilhados) e siga-o.

**Entregáveis:**

1. **Gerenciamento de estado e API** em `apps/web/src/modules/contas/data/`
   - Hook(s) de dados para a operação de criação (e estrutura preparada para atualização): submit, estados de loading/erro/sucesso, e validação.
   - Centralize a chamada à API aqui (a UI não deve fazer fetch direto). Adicione a função de criação ao cliente de dados existente, mantendo o padrão já adotado na consulta.
   - Context apenas se for realmente necessário — não adicione complexidade prematura.

2. **Componente de formulário** `apps/web/src/modules/contas/components/conta-form.component.tsx`
   - Recebe o **DTO de conta como parâmetro** e se comporta de forma distinta conforme o DTO: modo criação (vazio) ou modo edição (pré-preenchido).
   - Campos tipados de acordo com o contrato compartilhado, com validação e exibição explícita de erros de validação e de submissão.
   - Tratamento explícito de estados: ocioso, enviando (loading) e erro.
   - Componente "burro" o suficiente: consome o hook de dados, não conhece detalhes de transporte.
   - Botões de ação (salvar/cancelar) com rótulos coerentes ao modo (ex.: "Cadastrar" vs. "Salvar alterações").
   - Aplicar validação de acordo com a skill /frontend-form-schema
   - Não criar o formulário como modal, quero uma página com o formulário implementado que use os componentes de formulário da pasta shared, por exemplo, apps/web/src/shared/components/ui/form-section-layout.tsx

3. **Página/rota** para o cadastro de nova conta em `apps/web/src/modules/contas/pages/`
   - Compõe o formulário em modo criação dentro do layout/rota padrão da aplicação.
   - Conecte o botão "cadastrar nova conta" da tela de consulta (criado anteriormente) a esta rota.

4. **Item de menu / navegação** (se aplicável)
   - Se houver necessidade de uma entrada de navegação para o cadastro, siga o padrão já usado para os itens existentes. Caso o acesso seja apenas via botão da tela de consulta, mantenha a consistência com o que já existe.

**Padrões a respeitar:**

- Use o escopo de import `@arquitetura/*` (não `@namespace/*`).
- Tipagem forte ponta a ponta; sem `any`. O parâmetro do formulário deve ser o DTO compartilhado de conta.
- Separação de responsabilidades: `data/` (estado + API + validação) → `components/` (UI do formulário) → `pages/` (composição/rota).
- O formulário deve ser **agnóstico de operação**: a decisão criação vs. edição vem do DTO/props, não de lógica duplicada.
- Nomenclatura e estilo consistentes com o restante do `apps/web` e com o CRUD de consulta já implementado.
- Utilizar os componentes da pasta `apps/web/src/shared`, especialmente `apps/web/src/shared/components/ui` (inputs, botões, feedback de erro).

**Ao finalizar:** explique brevemente as decisões de arquitetura tomadas — em especial (a) como o formulário distingue criação de edição a partir do DTO, (b) o uso ou não de Context, e (c) como o estado de submissão/validação foi organizado na camada `data/` — para servir de guia aos próximos CRUDs.
