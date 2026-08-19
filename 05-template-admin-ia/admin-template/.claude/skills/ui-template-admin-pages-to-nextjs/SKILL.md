---
name: ui-template-admin-pages-to-nextjs
description: Gera as páginas de demonstração funcionais (dashboard, listas, detalhes, perfil, settings, login/registro, 404, 500, mais páginas próprias do template) de uma aplicação admin Next.js (App Router) compondo o shell, sidebar, primitivos, composites e charts já gerados pelas skills anteriores. Última etapa da esteira de template admin — não cria nenhum componente novo, nenhum token, nenhuma config; apenas escreve em src/app/. Replica fielmente layout e conteúdo do template original quando há equivalente, com atenção máxima ao dashboard (página principal da vitrine, replicada bloco a bloco) e à página de login (alta fidelidade visual, login/registro/esqueci na mesma rota com troca de modo). Garante integridade da navegação — toda rota referenciada pelo menu da app tem página correspondente. Stack fixa Next.js App Router + Tailwind + TypeScript estrito + server components com client components extraídos para interatividade. Mocks colocalizados, determinísticos, com volume realista. Sem fetch, sem auth real, sem libs adicionais, sem alterar src/shared/. Dispara em pedidos como "gerar páginas de demonstração do template", "criar dashboard a partir do template", "portar tela de login", "fechar a esteira do template com páginas reais", "criar vitrine", "boilerplate de páginas baseado no template admin".
when_to_use: O usuário tem um projeto Next.js (App Router) onde shell + sidebar + primitivos + composites + charts já foram gerados pelas skills anteriores e quer fechar a esteira gerando as páginas de demonstração que compõem tudo isso. Pré-requisita TODAS as skills anteriores e ABORTA se faltar pré-requisito.
---

# ui-template-admin-pages-to-nextjs

Gera páginas de demonstração em `src/app/` que **compõem** o shell, sidebar, primitivos, composites e charts já gerados pelas skills anteriores. **Não cria** componentes, tokens ou config — apenas páginas. Replica fielmente o template quando há equivalente.

## Princípios não-negociáveis

1. **Compor, nunca recriar.** Cada página é uma árvore JSX que importa de `src/shared/components/ui/`, `src/shared/components/charts/`, do shell e de `src/modules/examples/`. Nenhuma `<div className="bg-…">` recriando visualmente um card. Se o JSX da página vira CSS Tailwind para reproduzir aparência, falta um composite — interromper.
2. **Fidelidade ao template.** Quando há HTML equivalente no template, a página React replica estrutura, conteúdo de demo e comportamento. A correspondência é estrutural e visual, não literal.
3. **Dashboard e login têm prioridade máxima de fidelidade.** Dashboard é gerado por último, com mais cuidado. Login é replicado pixel-a-pixel ao layout do template.
4. **Integridade da navegação.** Toda rota referenciada pelo menu da app destino tem página correspondente. Sem links quebrados.
5. **Esta é a ÚNICA skill da esteira que pode gravar estado da aplicação.** Estado vive em `src/modules/examples/<feature>/` (mocks, componentes específicos, hooks, contexts, constantes da feature de demonstração). `src/app/.../page.tsx` é fino: apenas importa do módulo e renderiza. **PROIBIDO gravar estado em `src/shared/`** (já validado no protocolo: `src/shared/` só tem máquina de UI reutilizável). Se algo precisar mudar em `src/shared/`, `tailwind.config` ou `globals.css`, é bug — interromper e reportar.

## Stack fixa

- Next.js App Router, `src/`, TypeScript estrito.
- Tailwind apenas com tokens já existentes (`ui`, `ui.*`, `adminMenu`, `adminShell`, `charts`). **Esta skill não cria tokens.**
- Server components por padrão em `src/app/`. Interatividade vai para client components dentro do módulo (`src/modules/examples/<feature>/<piece>.client.tsx`).
- **Estado/mocks/peças de feature em `src/modules/examples/<feature>/`** — `mock-data.ts`, `components/`, `hooks/`, `context/`, `constants.ts`. Tipados, determinísticos, sem libs.
- `src/app/.../page.tsx` é apenas o entry-point de rota: importa do módulo e renderiza. Idealmente ≤10 linhas.
- Sem fetch, sem auth real, sem novas dependências, sem i18n libs.
- pt-BR por padrão; preservar idioma do template em páginas com copy específica.

## Pré-requisitos (gate de execução)

ANTES de qualquer coisa, ler `references/prerequisite-check.md` e executar o protocolo. Se faltar shell, sidebar, primitivos, composites OU charts: **ABORTAR** com mensagem listando o que falta e qual skill rodar antes.

## Fluxo

### Fase 0 — Reconhecimento e verificação

1. Receber/perguntar caminho do template e da app Next.js destino.
2. Executar `references/prerequisite-check.md` — abortar se algo faltar.
3. Mapear primitivos disponíveis lendo `src/shared/components/ui/index.ts`.
4. Mapear charts disponíveis lendo `src/shared/components/charts/index.ts`.
5. Ler `references/menu-integrity-protocol.md` e localizar a config de navegação. Extrair toda lista de `href` referenciada pelo menu — esses são **must-have**.
6. Listar todos os HTMLs do template, sem filtro inicial.
7. **Confirmar o `activeTheme` da app (single-theme)**. As páginas devem replicar o template no MESMO tema único em que primitivos/composites/charts foram gerados. Procedimento:
   - Reutilizar `activeTheme` registrado pelas skills anteriores (comentário no `tailwind.config`, namespace `ui.*`/`charts.*`).
   - Se ausente, inferir do template (atributo padrão em `<html>`/`<body>` das páginas alvo, JS de toggle, background dominante) — light como fallback.
   - Quando o template tem variantes light **e** dark de uma mesma página (ex.: `dashboard.html` + `dashboard-dark.html`), **escolher exclusivamente a variante do `activeTheme`** como referência de fidelidade. Ignorar a outra.

### Fase 1 — Inventário e mapeamento

1. Ler `references/template-discovery-protocol.md`.
2. Rodar `scripts/extract-pages-inventory.mjs` apontando para a pasta do template, gerando `<template>/.pages-inventory.json`.
3. Ler `references/pages-catalog.md` para o conjunto mínimo + adicionais comuns.
4. Construir tabela de mapeamento (uma linha por página alvo):

| página | rota | HTML(s) do template | está no menu? | composites usados | charts usados | mocks necessários | fidelidade exigida | origem |
|--------|------|--------------------|--------------|--------------------|---------------|-------------------|---------------------|--------|

Critérios de inclusão:
- Conjunto mínimo: SEMPRE.
- Páginas descobertas no template: incluir se intencionais.
- Rotas referenciadas pelo menu da app: **obrigatórias**.

5. Para o **dashboard**: ler `references/dashboard-fidelity-guide.md` e fazer inventário bloco-a-bloco do(s) HTML(s) de dashboard.
6. Para o **login/registro**: ler `references/auth-fidelity-guide.md` e extrair layout, ilustração, copy, campos, links.

### Fase 2 — Plano de mocks

Ler `references/mock-data-patterns.md`. Para cada página, definir tipo + volume + cobertura de estados. Texto pt-BR ou idioma do template.

### Fase 3 — Apresentação ao usuário

Apresentar e pedir confirmação ANTES de gerar código:

1. Resultado das verificações de pré-requisitos.
2. Componentes mapeados (primitivos / composites / charts disponíveis com nomes exatos).
3. Lista agrupada de páginas a gerar:
   - (a) mínimo presente no template (alta fidelidade)
   - (b) mínimo ausente no template (defaults coerentes)
   - (c) adicionais descobertas no template
   - (d) rotas obrigatórias por estarem no menu
4. Plano detalhado do dashboard (lista de blocos identificados → composite/chart que realiza).
5. Plano detalhado de login/registro (layout + decisão de roteamento).
6. Lacunas: composites/primitivos faltando para fidelidade. Para cada uma: (i) adaptar com o que existe, ou (ii) abortar e pedir skill anterior. **Decisão do usuário.**
7. Ambiguidades: múltiplas variantes (3 dashboards, 5 logins) — perguntar qual seguir.

### Fase 4 — Geração

Ler `references/page-composition-patterns.md` e `references/page-templates.md`. Ordem **obrigatória** (das menos críticas para as mais):

1. `not-found.tsx`, `error.tsx`
2. Settings (forms exercitam composites de form)
3. Profile
4. Lista de usuários + detalhe
5. Adicionais descobertas no template
6. **Login + registro** (alta fidelidade)
7. **Dashboard** (esforço máximo, último)

Padrões obrigatórios em cada página:
- Comentário-cabeçalho: HTML original replicado, fidelidade (alta/média), adaptações.
- `page.tsx` server component; interatividade em `*-content.client.tsx`.
- Toda página dentro de `(admin)` começa com `<PageHeader>` (ou equivalente do composites catalog).
- Responsividade replicada do template (ler `references/responsive-patterns.md`).
- Headings hierárquicos corretos.
- Sem `<div>` recriando visuais — só composição.
- Sem `Math.random()`; mocks determinísticos.
- **Sem variantes `dark:`/`light:` no JSX, sem theme toggle, sem leitura de `prefers-color-scheme`** — usar exclusivamente os tokens já gerados para o `activeTheme`. Se uma página do template original existe em duas versões, replicar somente a do tema ativo.

Padrões específicos por página: ver `references/page-templates.md`.

**Proibido**: criar/modificar em `src/shared/` (estado da app NUNCA mora em shared), mexer em `tailwind.config`/`globals.css`/`layout.tsx` raiz (exceto, se necessário, montar `<MenuConfigProvider>` herdado da skill `sidebar` no layout privado consumindo `src/modules/examples/admin-menu/menu.config.ts`), instalar libs, "melhorar" o template, inventar páginas fora do mínimo+template.

**Adicionalmente, esta skill cria** (estado da aplicação obrigatório fora de `src/shared/`):
- `src/modules/examples/admin-menu/menu.config.ts` — árvore real de itens herdada do JSON entregue pela skill `sidebar`. Wiring no layout privado para alimentar o `<MenuConfigProvider>`.
- `src/modules/examples/<feature>/` para cada página/feature gerada (dashboard, users, profile, settings, auth, etc.) — todo o conteúdo específico da demonstração.

### Fase 5 — Verificação

1. `npm run build` deve passar sem erros nem `any` injustificado.
2. `npm run lint` se configurado.
3. **Verificar integridade de navegação**: para cada `href` do menu (capturado na Fase 0), confirmar página correspondente. Sem links quebrados.
4. Comparação visual página-a-página com o template: para cada página com contraparte, descrever no relatório o casamento estrutural.
5. Reportar:
   - Páginas criadas (rota + arquivo + fidelidade).
   - Mocks criados com volumes.
   - Blocos do dashboard mapeados (cada um, com componente que o realiza).
   - Fidelidade da página de login documentada.
   - Links do menu validados.
   - Próximos passos: `npm run dev`, navegar, validar visualmente.

## Critérios de aceitação

- [ ] Todos os pré-requisitos verificados ANTES de qualquer geração
- [ ] `npm run build` passa
- [ ] Conjunto mínimo gerado integralmente
- [ ] Páginas descobertas no template geradas
- [ ] Toda rota do menu da app tem página correspondente
- [ ] Dashboard reflete fielmente o dashboard do template
- [ ] Login replica fielmente o template, com troca de modo na mesma rota
- [ ] 404/500 fiéis ao template
- [ ] Toda página é composição — nenhum visual recriado em `<div>`/Tailwind no nível de page
- [ ] **Nada criado/modificado em `src/shared/`** (incluindo `menu.config.ts` — esse vive em `src/modules/examples/admin-menu/`)
- [ ] **Todo estado da app em `src/modules/examples/<feature>/`** — mocks, components, hooks, contexts, constants
- [ ] **`src/app/.../page.tsx` fino** (≤10 linhas) — apenas entry-point que importa do módulo
- [ ] Nada em `tailwind.config`, nada em `globals.css`
- [ ] Mocks tipados, determinísticos, com cobertura de estados variados
- [ ] Páginas interativas têm client component **dentro do módulo** (`src/modules/examples/<feature>/...client.tsx`); `page.tsx` segue server component
- [ ] `menu.config.ts` materializado em `src/modules/examples/admin-menu/` a partir do JSON da skill `sidebar`; `MenuConfigProvider` wired no layout privado
- [ ] Acessibilidade preservada
- [ ] Páginas geradas apenas no `activeTheme` herdado das skills anteriores; nenhuma classe `dark:`/`light:`; quando o template oferece variantes light+dark da mesma página, somente a do tema ativo foi replicada
- [ ] Comentário-cabeçalho em cada página/módulo

## Não-escopo

- Componentes (todos pré-requisitos)
- Tokens novos
- Modificar `globals.css`, `tailwind.config`, `layout.tsx` raiz
- Auth real, validação, máscaras, fetch, persistência
- Libs adicionais
- Tema dark / toggle
- i18n com libs
- Testes, Storybook
- Opinar sobre design — replicar
- Inventar páginas fora do mínimo+template
- Dados aleatórios runtime

## Referências (progressive disclosure)

- Início — sempre: `references/prerequisite-check.md`
- Fase 0/1: `references/menu-integrity-protocol.md`, `references/template-discovery-protocol.md`, `references/pages-catalog.md`
- Antes do dashboard: `references/dashboard-fidelity-guide.md`
- Antes do login: `references/auth-fidelity-guide.md`
- Fase 2: `references/mock-data-patterns.md`
- Fase 4: `references/page-composition-patterns.md`, `references/responsive-patterns.md`, `references/page-templates.md`
