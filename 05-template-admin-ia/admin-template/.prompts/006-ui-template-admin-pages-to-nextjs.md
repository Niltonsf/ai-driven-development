# Prompt para geração de skill: `ui-template-admin-pages-to-nextjs`

## Contexto

Quero que você gere uma skill do Claude Code (formato SKILL.md + arquivos de apoio) chamada **`ui-template-admin-pages-to-nextjs`**. A skill será invocada dentro de um projeto Next.js (App Router) e tem como input uma pasta local contendo um template administrativo em HTML/CSS/JS puro. Seu output são **páginas de demonstração funcionais** dentro de `src/app/`, compondo o shell de layout, a navegação, os primitivos de UI, os composites e os gráficos já gerados pelas skills anteriores. Estas páginas servem três propósitos simultâneos:

1. **Vitrine**: mostram em telas reais o resultado da esteira inteira (shell + sidebar + primitivos + composites + charts).
2. **Teste de integração**: validam que tudo o que foi gerado nas skills anteriores se compõe corretamente em telas reais, sem hydration errors, sem inconsistências de tokens, sem peças faltando.
3. **Ponto de partida**: oferecem um esqueleto navegável que serve como base concreta para projetos novos começarem do zero.

A skill **não** gera shell de layout, **não** gera navegação/menu, **não** gera primitivos, **não** gera composites, **não** gera gráficos — todos esses são pré-requisitos. Ela é estritamente focada em **páginas que compõem o que já existe**, com fidelidade ao layout e ao conteúdo das páginas equivalentes do template original sempre que houver correspondência.

A skill deve funcionar com qualquer template administrativo (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom), independentemente do framework CSS de origem (Bootstrap, Tailwind, custom CSS).

## Princípio central: compor, não reinventar; varrer o template para descobrir páginas; fidelidade ao original

Esta skill tem **três responsabilidades igualmente importantes e inseparáveis**:

1. **Compor a partir do que já existe na aplicação destino**. Cada página gerada importa shell, navegação, primitivos (`Button`, `Input`, `Badge`, `Avatar`, etc.), composites (`PageHeader`, `Card`, `DataTable`, `Modal`, `Stepper`, `FormSection`, etc.) e charts (`BarChart`, `LineChart`, `PieChart`, `Sparkline`, etc.). Nada é recriado, nada é "estilizado de novo do zero" — a página é uma composição declarativa desses blocos.

2. **Varrer o template em profundidade para descobrir todas as páginas relevantes**, e gerar pelo menos uma versão React/Next.js de cada uma das páginas do conjunto mínimo descrito abaixo, mais quaisquer páginas próprias do template que sejam claramente intencionais (kanban próprio do template, perfil de aluno em template educacional, fluxo de checkout em template de e-commerce admin, etc.).

3. **Fidelidade ao template original**. Quando o template tem uma página equivalente (dashboard, login, perfil, settings, lista de usuários, 404, etc.), a página React deve refletir o **layout, a estrutura, o conteúdo de demonstração e o comportamento** dessa página o mais fielmente possível, **mas usando os componentes da aplicação destino, não reescrevendo HTML/CSS**. A correspondência é estrutural e visual, não literal: se o template tem um dashboard com 4 stat cards no topo, um gráfico grande, dois gráficos menores e uma tabela, a página React tem exatamente essa estrutura, usando `<StatCard>`, `<BarChart>`, `<LineChart>`, `<DataTable>` da própria aplicação.

A página de **login** merece destaque: deve ser portada com **alta precisão visual** ao template original (centralização, ilustração lateral, formulário, marca, divisores, links sociais quando houver, links de "esqueci minha senha" e "registrar"), pois é o único cartão de visitas antes do shell aparecer. A página de login e a de registro vivem na **mesma rota com troca de modo** (`/auth?mode=login` vs `/auth?mode=register`, ou rotas paralelas que compartilham layout) — não duplicar layout/ilustração/branding.

## Pré-requisitos obrigatórios (gates de execução)

Esta skill é **independente** das demais — pode ser invocada isoladamente, com seu próprio fluxo. Mas tem pré-requisitos não-negociáveis. A primeira ação obrigatória é verificar a presença de:

- **Shell de layout** gerado por `ui-template-admin-shell-to-nextjs`. Verificável pela presença de `src/app/(admin)/layout.tsx` (ou padrão equivalente que essa skill tenha definido) e dos componentes de shell em `src/shared/components/admin-shell/` (ou onde aquela skill colocou).
- **Navegação/sidebar** gerada por `ui-template-admin-sidebar-to-nextjs`. Verificável pela presença dos componentes de sidebar e pela existência de uma estrutura de navegação consumível (lista de itens de menu).
- **Primitivos** em `src/shared/components/ui/` com pelo menos `Button`, `Input`, `Label`, `Badge`/`Chip`, `Avatar`, `Alert`.
- **Composites** em `src/shared/components/ui/` (mesma pasta dos primitivos, conforme convenção da skill de composites) com pelo menos `PageHeader`, `Card` (com subpartes), `Modal`, `DataTable`, `Pagination`, `EmptyState`, `LoadingSkeleton`, `FormSection`, `FormFooter`.
- **Charts** em `src/shared/components/charts/` com pelo menos `BarChart`, `LineChart`, `AreaChart`, `PieChart` ou `DonutChart`, `Sparkline`, `ChartContainer`, `ChartLoading`, `ChartEmptyState`.

Se algum desses pré-requisitos faltar, a skill **interrompe** com uma mensagem clara orientando qual skill rodar antes, listando exatamente o que está faltando. O detalhamento do protocolo de verificação está na Fase 0.

A skill **lê o `index.ts` de cada um desses diretórios** para descobrir exatamente o que está disponível e mapear os componentes por nome. Não assumir nomes — descobrir.

## Quando a skill deve disparar

A skill deve ser usada SEMPRE que o usuário:

- pedir para "gerar as páginas de demonstração", "criar dashboard de exemplo", "fechar a esteira do template com páginas reais"
- pedir explicitamente "página de dashboard", "página de listagem de usuários", "página de perfil", "página de settings", "página de login/registro", "404", "500" baseadas no template
- mencionar "vitrine" / "showcase" / "ponto de partida" / "boilerplate de páginas" a partir do template admin
- fornecer uma pasta de template e pedir as páginas em `src/app/` compondo o que já existe
- pedir explicitamente "portar a tela de login do template" / "trazer o dashboard do template para o Next.js"

A skill **NÃO** deve ser usada para:

- gerar shell/layout administrativo (skill `ui-template-admin-shell-to-nextjs`)
- gerar navegação/menu lateral (skill `ui-template-admin-sidebar-to-nextjs`)
- gerar primitivos de UI (skill `ui-template-admin-primitives-to-nextjs`)
- gerar componentes compostos (skill `ui-template-admin-composites-to-nextjs`)
- gerar gráficos (skill `ui-template-admin-charts-to-nextjs`)
- implementar autenticação real (a página de login é apresentacional, sem fetch, sem auth)
- implementar persistência, fetch, integração com API, estado global
- implementar regras de negócio reais

## Stack fixa (não negociável)

- **Next.js App Router** com `src/`
- **Estilização: Tailwind CSS**, reutilizando exclusivamente os tokens já existentes nos namespaces `ui`, `adminMenu`, `adminShell` e `charts`. **Esta skill não cria tokens novos** — se a página precisar de algo que não está nos tokens, é sinal de que falta um composite ou um primitivo, não que falta um token.
- **Composição via componentes existentes**: cada página é uma árvore JSX que importa de `src/shared/components/ui/`, `src/shared/components/charts/`, `src/shared/components/admin-shell/` (ou equivalente) e nada mais.
- **Dados de demonstração**: dados estáticos (mock) em arquivos colocalizados (`<page>/_mock-data.ts`). Sem fetch, sem `loading.tsx` real, sem `error.tsx` real (a menos que faça parte da vitrine — ver páginas 404/500 abaixo). Sem MSW, sem mock service worker, sem libs de fake data adicionais — gerar dados manualmente, com volume realista (10-30 usuários numa lista, 7-30 pontos numa série temporal, 4-8 categorias num pie chart).
- **Tipagem: TypeScript estrito**. Tipos dos dados de demonstração explícitos.
- **Sem novas dependências**. Toda lib necessária já foi instalada pelas skills anteriores.
- **Server vs Client**: páginas são server components por padrão. Quando a página tem interatividade (filtros que mudam estado local, modais abertos/fechados, troca de tab, troca de modo login/registro), extrair a parte interativa para um sub-componente cliente (`<page>-content.client.tsx`) e manter a `page.tsx` como server component fino.
- **Internacionalização**: usar pt-BR por padrão para textos novos (títulos, labels, breadcrumbs, mensagens de empty state). Quando o template tem textos visíveis em uma página específica (ex.: textos do dashboard, copy do login), preservar o idioma e o tom do template.

## Entradas esperadas

1. **Caminho da pasta do template** (HTML/CSS/JS estático)
2. **Caminho da aplicação Next.js de destino** (raiz do projeto, com shell, sidebar, primitivos, composites e charts já gerados)

Se algum dos dois não estiver claro no contexto, a skill deve perguntar antes de prosseguir. A skill deve verificar todos os pré-requisitos listados acima antes de qualquer outra ação.

## Saída esperada

Toda saída fica confinada a:

- `src/app/(admin)/...` — páginas que vivem dentro do shell administrativo (dashboard, listas, perfil, settings, etc.). O segmento de grupo `(admin)` reutiliza o `layout.tsx` gerado pela skill de shell.
- `src/app/(auth)/...` — páginas que vivem fora do shell (login/registro, esqueci minha senha). Layout próprio mais leve, geralmente centralizado ou com ilustração lateral, fiel ao template.
- `src/app/not-found.tsx` — página 404 (Next.js convenção)
- `src/app/error.tsx` ou `src/app/global-error.tsx` — página 500 / erro genérico (Next.js convenção)
- Subarquivos colocalizados: `_mock-data.ts`, `<page>-content.client.tsx`, `_components/<sub-piece>.tsx` quando uma página é grande o suficiente para justificar quebrar em peças locais.

**Esta skill não modifica nada fora de `src/app/`.** Não toca em `tailwind.config`, não toca em `globals.css`, não toca em `layout.tsx` raiz, não toca em componentes de `src/shared/`. Se algo precisar mudar nesses lugares, é sinal de bug — interromper e reportar ao usuário em vez de mexer.

Estrutura típica gerada (criar **todas** as do conjunto mínimo, mais as descobertas no template):

```
src/app/
├── (admin)/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── dashboard-content.client.tsx          (se houver interatividade — filtros de período, abas)
│   │   ├── _mock-data.ts
│   │   └── _components/
│   │       ├── revenue-overview-card.tsx
│   │       ├── recent-activity-list.tsx
│   │       └── top-products-table.tsx
│   ├── users/
│   │   ├── page.tsx                              (lista de usuários)
│   │   ├── users-list.client.tsx                 (busca, filtros, paginação local)
│   │   ├── _mock-data.ts
│   │   └── [id]/
│   │       ├── page.tsx                          (detalhe de usuário)
│   │       └── _mock-data.ts
│   ├── profile/
│   │   ├── page.tsx                              (perfil do usuário logado, com abas)
│   │   ├── profile-tabs.client.tsx
│   │   └── _mock-data.ts
│   ├── settings/
│   │   ├── page.tsx                              (settings em abas: account, security, notifications, billing)
│   │   ├── settings-tabs.client.tsx
│   │   └── _mock-data.ts
│   └── (páginas adicionais descobertas no template: kanban, calendário, chat, e-commerce, faturas, etc., conforme aplicável)
│
├── (auth)/
│   ├── layout.tsx                                (layout próprio da auth: ilustração + slot do form, fiel ao template)
│   ├── auth/
│   │   ├── page.tsx                              (server component fino que define o modo via searchParams)
│   │   ├── auth-form.client.tsx                  (alterna entre login/registro/esqueci no client)
│   │   └── _mock-data.ts                         (links sociais do template, se houver)
│   └── (páginas de auth adicionais descobertas: lock-screen, two-step verification, reset password, etc.)
│
├── not-found.tsx                                 (404 fiel ao template)
├── error.tsx                                     (500/erro genérico fiel ao template)
└── (qualquer outra rota raiz que o template trate fora do shell)
```

**Conjunto mínimo obrigatório** (gerar todos, com fidelidade ao template quando houver equivalente, ou com defaults coerentes quando não houver):

- **Dashboard** — a página mais importante da vitrine. Deve ocupar uma parte considerável do esforço total da skill. Composição rica: page header, 4 stat cards, 2-3 gráficos (1 grande, 2 menores), 1-2 listas/tabelas, 1 timeline ou recent activity. Replicar fielmente a estrutura do dashboard principal do template.
- **Lista de usuários** (ou de "registros" do domínio principal do template — pode ser produtos, pedidos, alunos, etc.) — page header com botão de criar, toolbar de tabela com busca e filtros, `DataTable` populada, paginação, ações por linha (editar, excluir via modal de confirmação).
- **Detalhe de usuário** — page header com breadcrumb retornando à lista, abas (overview, atividade, configurações), composição de cards informativos, sidebar lateral com avatar grande e dados resumidos.
- **Perfil** (`/profile`) — perfil do usuário logado, similar ao detalhe mas em primeira pessoa, com abas de edição.
- **Settings** — abas (account, security, notifications, appearance, billing). Cada aba é um conjunto de `FormSection` com inputs, switches, selects. `FormFooter` com salvar/cancelar.
- **Login + Registro** (rota `/auth` com troca de modo) — fidelidade visual máxima ao template. Replicar exatamente: ilustração lateral, posição do logo, hierarquia de títulos, espaçamento, divisores, botões sociais (se houver), link de "esqueci minha senha", link de troca para registro. Formulário usa `Input`, `Button`, `Checkbox`, `Label` da aplicação. Sem auth real — `onSubmit` apenas previne o default e registra um console.log/toast.
- **404** (`not-found.tsx`) — fiel ao template (ilustração, mensagem, botão de voltar). Sem shell.
- **500 / erro** (`error.tsx`) — fiel ao template, ou coerente com a 404 se o template não tiver. Sem shell.

**Conjunto adicional**, gerado **apenas se o template tiver**:

- Lock screen, two-step verification, reset password, "verifique seu email"
- Kanban, calendar, chat, inbox, file manager
- E-commerce: produtos, pedidos, faturas, checkout admin
- Educational: cursos, alunos, aulas, certificados
- Qualquer outra página claramente intencional do template

**Regra de criação**: para cada página do conjunto mínimo, se o template tem equivalente, replicar fielmente a estrutura e o conteúdo. Se o template não tem, gerar com defaults coerentes usando os componentes disponíveis. Para páginas adicionais, gerar somente se o template oferece — não inventar páginas que o template não exemplifica.

**PROIBIDO criar**: novos componentes em `src/shared/components/`, novos tokens em `tailwind.config`, mudanças em `globals.css`, mudanças no shell, mudanças na sidebar. Se uma página precisar de algo que não existe, **interromper** e reportar — provavelmente é uma lacuna nas skills anteriores.

## Fluxo da skill (passos obrigatórios, nesta ordem)

### Fase 0 — Reconhecimento e verificação de pré-requisitos

1. Aceitar (ou perguntar) o caminho da pasta do template e da aplicação Next.js destino.
2. **Verificação obrigatória de todos os pré-requisitos** (gate de execução):
   - Confirmar que o shell foi gerado: ler `src/app/` e identificar a estrutura de layout administrativo (geralmente `(admin)/layout.tsx`). Se não houver, interromper e orientar a rodar `ui-template-admin-shell-to-nextjs`.
   - Confirmar que a sidebar foi gerada: identificar componentes de navegação e a estrutura de itens de menu disponível. Se não houver, interromper e orientar a rodar `ui-template-admin-sidebar-to-nextjs`.
   - Confirmar primitivos em `src/shared/components/ui/` lendo `index.ts`. Mínimo: `Button`, `Input`, `Label`, `Badge` ou `Chip`, `Avatar`, `Alert`. Listar disponíveis.
   - Confirmar composites no mesmo `src/shared/components/ui/` (mesma pasta, conforme convenção). Mínimo: `PageHeader`, `Card`, `Modal`, `DataTable`, `Pagination`, `EmptyState`, `LoadingSkeleton`, `FormSection`, `FormFooter`. Listar disponíveis.
   - Confirmar charts em `src/shared/components/charts/`. Mínimo: `BarChart`, `LineChart`, `AreaChart`, `PieChart`/`DonutChart`, `Sparkline`. Listar disponíveis.
   - Para qualquer pré-requisito faltando, **interromper** com mensagem clara listando o que está ausente e qual skill rodar antes.
3. **Mapear a estrutura de navegação** já definida pela skill da sidebar. Ler a definição de itens de menu (geralmente um arquivo de configuração tipo `src/shared/config/navigation.ts` ou equivalente) para descobrir quais rotas já estão referenciadas no menu — essas rotas ditam quais páginas a skill **precisa** gerar para que a navegação não tenha links quebrados. **Toda rota presente no menu deve ter uma página correspondente após esta skill.**
4. Detectar a biblioteca de ícones em uso (a mesma das skills anteriores).
5. Listar **todos** os HTMLs do template, sem filtro inicial. Inventariar quais arquivos correspondem a quais páginas (ex.: `index.html` ou `dashboard-1.html` → dashboard; `users-list.html` → lista de usuários; `auth-login.html` → login; `pages-misc-error.html` → 404).

### Fase 1 — Inventário e mapeamento de páginas

Para cada página potencial, montar uma tabela de mapeamento:

| página alvo | rota Next.js | arquivo(s) HTML correspondente(s) no template | está no menu da app? | composites usados | charts usados | dados de demonstração necessários | nível de fidelidade exigido (alta/média) | origem (mínimo / descoberta / referenciada por menu) |
| ----------- | ------------ | --------------------------------------------- | -------------------- | ----------------- | ------------- | --------------------------------- | ---------------------------------------- | ---------------------------------------------------- |

Critérios de inclusão:

- **Conjunto mínimo**: sempre incluir, mesmo sem equivalente no template.
- **Páginas descobertas no template**: incluir se a página é claramente intencional (rota nomeada, link no menu do template, conteúdo estruturado e não apenas um placeholder).
- **Páginas referenciadas pelo menu da app destino**: **incluir obrigatoriamente** — o menu não pode ter links quebrados.

Para o **dashboard especificamente**, ler a fundo o HTML correspondente do template e listar **cada bloco** que aparece (cada stat card, cada gráfico, cada tabela, cada widget), com as séries de dados que cada um exibe. Esse é o material que vai dirigir a fidelidade da página mais importante da vitrine.

Para a **página de login** (e registro), ler o HTML correspondente do template e listar: layout (centralizado / com ilustração lateral / com card central / sem card), elementos visuais (logo, ilustração, divisor "ou", botões sociais, links, copy/marketing text), campos do formulário, comportamentos (mostrar/esconder senha, lembrar-me, esqueci minha senha). A fidelidade dessa página é tratada com especial cuidado.

### Fase 2 — Geração de dados de demonstração

Para cada página, definir os dados mock necessários, em arquivos `_mock-data.ts` colocalizados. Princípios:

- **Volume realista**: 15-30 itens em listas, 7-30 pontos em séries temporais, 4-8 categorias em pie/donut, 5-10 itens em activity feeds.
- **Coerência interna**: nomes próprios variados e plausíveis, datas em formato pt-BR, valores monetários em BRL (R$ 1.234,56), percentuais com sinal e formato consistente.
- **Cobrir variações de estado**: na lista de usuários, ter usuários em estados diferentes (ativo, inativo, pendente) para que badges e cores apareçam todas. Em uma tabela de pedidos, ter pedidos em estados diferentes. Em gráficos com múltiplas séries, séries com formas distintas (uma crescente, uma estável, uma com queda).
- **Texto em pt-BR por padrão**, ou no idioma do template quando portando uma página com copy específica.
- **Sem libs de fake data** (`@faker-js/faker`, `chance`, etc.) — gerar manualmente. A vantagem é controle: dados são reproduzíveis, plausíveis e variados intencionalmente.
- **Tipos explícitos**: cada arquivo de mock exporta tipos (`type User = {...}`) e o array tipado, para que a página consuma com type safety.

### Fase 3 — Apresentação do plano

Antes de gerar código, apresentar ao usuário:

1. **Resultado das verificações de pré-requisitos** — o que existe, o que foi descoberto.
2. **Lista de componentes disponíveis** mapeados — primitivos, composites, charts, com nomes exatos.
3. **Lista de páginas que serão geradas**, agrupadas em três seções:
   - (a) conjunto mínimo presente no template (alta fidelidade)
   - (b) conjunto mínimo ausente no template (defaults coerentes)
   - (c) páginas adicionais descobertas no template
   - (d) páginas referenciadas pelo menu da app destino que precisam existir para evitar links quebrados
4. **Plano detalhado da página de dashboard**: lista de blocos identificados no template, mapeados para composites/charts disponíveis. Esta é a página de maior esforço — apresentar ao usuário antes de gerar.
5. **Plano detalhado da página de login**: layout identificado no template, elementos visuais, campos, comportamentos, decisão sobre como tratar registro (mesma rota com `?mode=register`, ou rotas paralelas com layout compartilhado).
6. **Lacunas identificadas**: composites ou primitivos que faltam para gerar uma página fielmente. Para cada lacuna, propor: (i) gerar a página com adaptação usando o que está disponível, ou (ii) interromper e pedir ao usuário rodar a skill anterior para preencher a lacuna. **Decisão do usuário, não da skill.**
7. **Ambiguidades**: páginas no template com múltiplas variações (3 dashboards diferentes, 5 layouts de login) — perguntar qual seguir.

Pedir confirmação para prosseguir. Não gerar código antes do "ok".

### Fase 4 — Geração de código

Ordem obrigatória de geração (das menos críticas para as mais críticas, terminando com dashboard e login):

1. Páginas auxiliares: `not-found.tsx`, `error.tsx`
2. Settings (abas com forms — exercita composites de formulário)
3. Perfil (`/profile`)
4. Lista de usuários e detalhe
5. Páginas adicionais descobertas no template (na ordem de complexidade)
6. **Login + registro** (alta fidelidade, atenção máxima)
7. **Dashboard** (esforço máximo, geração mais demorada — gerar por último para garantir que todos os outros componentes e padrões já foram exercitados)

**Padrões obrigatórios para cada página:**

- **Composição estrita**: cada página é uma árvore JSX que importa de `src/shared/components/ui/` e `src/shared/components/charts/`. Não há tags de elementos visuais soltos (sem `<div className="bg-...">` que recriem visualmente um card, sem `<button className="px-4 py-2 bg-blue-500">` que recriem visualmente um botão). Se o JSX está virando CSS Tailwind no nível da página, é sinal de composite faltando.
- **Server component por padrão**: `page.tsx` é server component, importa mocks e renderiza. Quando há interatividade, `page.tsx` continua server component e renderiza `<PageContent />` que é `"use client"`.
- **Sem fetch real**: dados vêm de `_mock-data.ts`. Se uma demonstração quer mostrar "loading", usar Suspense com fallback de `<LoadingSkeleton />`, ou um state interno controlado por timer no client component.
- **Page header consistente**: toda página dentro de `(admin)` começa com `<PageHeader title="..." breadcrumb={...} actions={...} />` (ou padrão equivalente da skill de composites).
- **Responsividade**: cada página é responsiva conforme breakpoints do template original. Não opinar sobre o layout — replicar.
- **Acessibilidade**: títulos hierárquicos corretos (`<h1>` no page header, `<h2>` em seções), labels em todos os inputs (já vem dos primitivos), aria-current na navegação (já vem da sidebar).
- **Comentário no topo de cada página** explicando: qual página do template está sendo replicada (caminho do HTML original), nível de fidelidade (alta/média), e quaisquer adaptações feitas.

**Padrões específicos:**

- **Dashboard**: estrutura idêntica ao do template (grid de stat cards, gráficos posicionados como no original, tabelas/listas no mesmo lugar). Cada stat card consome `<StatCard>` com label, valor, variação percentual, sparkline opcional. Gráficos consomem `<BarChart>`, `<LineChart>`, `<PieChart>` envoltos em `<ChartContainer>` com título e ações. Tabelas consomem `<DataTable>` populada. Sem dashboard "padrão genérico" — é o dashboard do template, replicado.
- **Lista de usuários**: `<PageHeader>` com botão "Novo usuário", `<DataTableToolbar>` com busca + filtros, `<DataTable>` com colunas (avatar+nome, email, role, status badge, criado em, ações), `<Pagination>` no rodapé. Modal de confirmação ao clicar excluir. Estado vazio (`<EmptyState>`) quando filtros não retornam nada — disponibilizar um filtro que demonstra o estado vazio.
- **Detalhe de usuário**: `<PageHeader>` com breadcrumb voltando à lista, layout em duas colunas (sidebar com avatar grande e dados-resumo, área principal com abas — overview, atividade, segurança).
- **Perfil**: estruturalmente similar ao detalhe, mas em primeira pessoa, com abas de edição usando `<FormSection>` e `<FormFooter>`.
- **Settings**: layout com abas verticais ou horizontais (conforme o template), cada aba sendo um agrupamento de `<FormSection>` com campos. Botão de salvar em cada aba ou em `<FormFooter>` global.
- **Login + Registro**: layout próprio em `(auth)/layout.tsx`. Fidelidade pixel-perfect ao template — espaçamentos, ilustração, logo, divisores, botões sociais, copy, links. Formulário em `auth-form.client.tsx` que lê `searchParams.mode` e alterna entre `login` / `register` / `forgot` mantendo layout. Campos usam `<Input>`, `<Label>`, `<Checkbox>`, `<Button>`. Validação e auth reais ficam fora de escopo — `onSubmit` é placeholder com `event.preventDefault()` e `console.log` ou `showToast.info("Apresentacional — sem auth real")`.
- **404 e 500**: replicação fiel da página correspondente do template (ilustração, mensagem, botão de voltar para o dashboard). Sem shell — render direto.

**Não fazer:**

- Sem novos componentes em `src/shared/`
- Sem novos tokens em `tailwind.config`
- Sem mudanças em `globals.css`
- Sem fetch real, auth real, banco de dados, API routes
- Sem libs adicionais (não instalar nada nesta skill)
- Sem "melhorias" sobre o template — fidelidade > opinião
- Sem dados aleatórios via `Math.random()` — dados são determinísticos, escritos manualmente
- Sem inventar páginas que o template não exemplifica e que não estão no conjunto mínimo

### Fase 5 — Verificação

1. Rodar `npm run build` para validar compilação e tipos. Erros devem ser corrigidos antes de encerrar.
2. Rodar `npm run lint` se configurado. Corrigir warnings.
3. **Verificação de integridade da navegação**: para cada item do menu (lido na Fase 0), confirmar que existe uma página correspondente. Sem links quebrados.
4. **Comparação visual** página a página com o template original. Para cada página gerada cuja contraparte existe no template, descrever no relatório o casamento estrutural: blocos no mesmo lugar, mesma hierarquia, mesma densidade visual.
5. Reportar ao usuário:
   - lista de páginas criadas com rotas
   - dados mock criados, com volumes
   - blocos do dashboard mapeados (cada um listado, com componente que o realiza)
   - fidelidade da página de login documentada
   - links de navegação validados (todos os itens do menu têm página)
   - sugestão de próximos passos: rodar a app (`npm run dev`), navegar pelas páginas, validar visualmente

## Critérios de aceitação (auto-verificar antes de finalizar)

- [ ] Todos os pré-requisitos (shell, sidebar, primitivos, composites, charts) foram verificados antes da execução
- [ ] `npm run build` passa sem erros e sem `any` não justificado
- [ ] Toda página do conjunto mínimo foi gerada
- [ ] Toda página descoberta no template foi gerada
- [ ] Toda rota referenciada pelo menu da app tem página correspondente — sem links quebrados
- [ ] Dashboard reflete fielmente a estrutura do dashboard principal do template
- [ ] Login replica fielmente o layout do template, com troca de modo (login/registro/esqueci) na mesma rota
- [ ] 404 e 500 fiéis ao template
- [ ] Todas as páginas compõem componentes existentes — nenhum visual recriado no nível de page
- [ ] Nenhum componente novo criado em `src/shared/`
- [ ] Nenhum token novo em `tailwind.config`
- [ ] `globals.css` não modificado
- [ ] Dados mock colocalizados, tipados, com volume realista e cobertura de estados variados
- [ ] Páginas com interatividade têm sub-componente cliente; `page.tsx` permanece server component
- [ ] Acessibilidade preservada (hierarquia de headings, foco gerenciado pelos composites)
- [ ] Nenhum erro de hydration
- [ ] Comentário no topo de cada página documentando qual HTML do template foi replicado e nível de fidelidade

## Não-escopo (explícito)

- Não criar componentes (primitivos, composites, charts, shell, sidebar) — todos pré-requisitos
- Não criar tokens visuais novos
- Não modificar `globals.css`, `tailwind.config`, `layout.tsx` raiz
- Não implementar autenticação real, validação de formulário, máscaras, fetch, persistência
- Não adicionar libs (form validation, fake data, date pickers, masks, etc.)
- Não criar tema dark / toggle de tema
- Não internacionalizar com i18n libs (next-intl, react-intl) — texto direto em pt-BR ou no idioma do template
- Não criar testes (skill separada)
- Não criar Storybook (skill separada)
- Não opinar sobre o design das páginas — replicar o template
- Não inventar páginas fora do conjunto mínimo e fora do que o template exemplifica
- Não usar dados aleatórios em runtime — mocks determinísticos

## Estrutura de arquivos da própria skill

```
ui-template-admin-pages-to-nextjs/
├── SKILL.md                                    # fluxo principal, < 500 linhas
├── references/
│   ├── prerequisite-check.md                   # protocolo da Fase 0 (verificar shell, sidebar, primitivos, composites, charts)
│   ├── pages-catalog.md                        # taxonomia do conjunto mínimo + páginas adicionais comuns em templates admin
│   ├── template-discovery-protocol.md          # como varrer o template procurando páginas e mapeando para rotas Next.js
│   ├── menu-integrity-protocol.md              # como ler a estrutura de navegação da app e garantir que toda rota tem página
│   ├── dashboard-fidelity-guide.md             # como portar fielmente o dashboard do template, bloco a bloco
│   ├── auth-fidelity-guide.md                  # como portar fielmente login + registro com troca de modo
│   ├── mock-data-patterns.md                   # padrões para dados de demonstração (volume, variação de estados, tipos)
│   ├── page-composition-patterns.md            # padrões de composição: server vs client, page.tsx vs *-content.client.tsx, _components/, _mock-data.ts
│   ├── responsive-patterns.md                  # como replicar comportamento responsivo do template em Tailwind
│   └── page-templates.md                       # snippets de referência para cada tipo de página (dashboard, lista, detalhe, settings, auth)
└── scripts/
    └── extract-pages-inventory.mjs             # varredura HTML para listar páginas do template e mapeá-las
```

**`scripts/extract-pages-inventory.mjs`** (Node, com `node-html-parser` ou similar via npx): recebe a pasta do template e produz um JSON com:

- `pages`: cada HTML do template, com metadata (título da página, presença de sidebar/header/footer, blocos identificados na estrutura).
- `auth_pages`: HTMLs identificados como auth (login, register, lock, forgot password, reset).
- `error_pages`: HTMLs identificados como error (404, 500, 403).
- `dashboard_blocks`: para o(s) HTML(s) de dashboard, lista de blocos detectados (stat cards, gráficos, tabelas, timelines) com posição no grid e tipo identificado.
- `menu_links_in_template`: links presentes no menu lateral do template, para entender quais páginas o template considera principais.

Falha graciosa quando a estrutura é atípica — Claude faz a inspeção lendo HTML diretamente, mas sempre produzindo o mesmo JSON intermediário antes de prosseguir.

**`references/`** seguem progressive disclosure: SKILL.md aponta quando ler cada um (ex.: "no início, antes de qualquer coisa, ler `prerequisite-check.md`"; "antes da Fase 1, ler `template-discovery-protocol.md` e `menu-integrity-protocol.md`"; "antes de gerar o dashboard, ler `dashboard-fidelity-guide.md`"; "antes de gerar login/registro, ler `auth-fidelity-guide.md`"; "antes de criar mocks, ler `mock-data-patterns.md`").

## Formato do output da skill

A skill que você vai gerar deve seguir o formato Claude Code:

- Um arquivo `SKILL.md` na raiz da skill, com frontmatter (`name`, `description`, `when_to_use`) e o corpo dividido nas fases acima.
- Arquivos de apoio (templates, snippets, exemplos) na mesma pasta, referenciados a partir do `SKILL.md`.
- A `description` no frontmatter deve disparar a skill em pedidos como "gerar páginas de demonstração do template", "criar dashboard a partir do template", "portar tela de login do template", "fechar a esteira do template com páginas", "criar vitrine das páginas em Next.js", "gerar boilerplate de páginas baseado no template", e variantes em pt-BR.

## O que eu quero de você agora

Gere a skill completa. Antes do código, me mostre:

1. A estrutura de arquivos da skill que você vai criar.
2. O frontmatter proposto da `SKILL.md`.
3. Quais arquivos de apoio você vai incluir e por quê — em especial, como `dashboard-fidelity-guide.md`, `auth-fidelity-guide.md` e `menu-integrity-protocol.md` serão estruturados para garantir, respectivamente, a fidelidade do dashboard, a fidelidade do login e a integridade da navegação da aplicação.
4. Como essa skill se relaciona com as anteriores (`design-adm-template-structure`, `ui-template-admin-shell-to-nextjs`, `ui-template-admin-sidebar-to-nextjs`, `ui-template-admin-primitives-to-nextjs`, `ui-template-admin-composites-to-nextjs`, `ui-template-admin-charts-to-nextjs`):
   - ordem de execução recomendada na esteira (esta é a **última** das skills de template — pré-requisita todas as outras)
   - namespaces de tokens consumidos (esta skill **não cria** tokens novos; só lê e compõe — citar quais namespaces são consumidos: `ui`, `adminMenu`, `adminShell`, `charts`)
   - o que esta skill **explicitamente** não faz, deixando para skills posteriores ou para o consumidor (autenticação real, fetch, persistência, regras de negócio, scaffolding de feature de domínio).
