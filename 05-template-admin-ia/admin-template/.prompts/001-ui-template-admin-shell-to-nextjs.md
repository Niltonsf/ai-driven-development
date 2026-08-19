# Geração de skill: `ui-template-admin-shell-to-nextjs`

## Contexto

Quero que você gere uma skill do Claude Code (formato SKILL.md + arquivos de apoio) chamada **`ui-template-admin-shell-to-nextjs`**. A skill será invocada dentro de um projeto Next.js (App Router) e tem como input uma pasta local contendo um template administrativo em HTML/CSS/JS puro. Seu output é a **estrutura visual e responsiva** desse template, traduzida para componentes React, **sem replicar conteúdo interno** — apenas o esqueleto, espaçamentos, áreas e comportamento de layout.

A skill não deve gerar o sistema de design completo da aplicação. Ela gera o **shell**: as áreas (header, aside, main, footer), seus tamanhos, suas regras de responsividade, e o comportamento de toggle do menu. Tudo o que vai _dentro_ dessas áreas (itens de menu, widgets, breadcrumbs, etc.) é responsabilidade de outras skills/etapas.

## Stack alvo (assumir, salvo indicação contrária na invocação)

- Next.js 14+ com App Router
- TypeScript
- Tailwind CSS para estilização (tokens extraídos do template viram `theme.extend` no `tailwind.config.ts` quando fizer sentido; valores muito específicos vão como classes arbitrárias `[width:73px]`)
- Componentes em `.tsx` com nomenclatura `kebab-case.component.tsx`
- Hooks/contexts em `kebab-case.hook.ts` / `kebab-case.context.tsx`

Se o projeto invocador usar outra stack de estilo (CSS Modules, styled-components), a skill deve detectar e adaptar — o protocolo de detecção está no passo 0 abaixo.

## Protocolo de execução da skill

A skill executa em **fases sequenciais**, e cada fase tem um checkpoint visível para o usuário antes de prosseguir. Não pular fases.

### Fase 0 — Reconhecimento

1. Perguntar (ou aceitar como argumento) o caminho da pasta do template.
2. Detectar a stack de estilização do projeto Next.js atual lendo `package.json` e arquivos de config (`tailwind.config.*`, `postcss.config.*`, presença de `.module.css`, `styled-components`, etc.).
3. Listar arquivos do template e identificar:
   - arquivo HTML principal (entrada)
   - folhas de estilo
   - biblioteca de ícones (procurar imports CDN, classes `fa-`, `bi-`, `mdi-`, `lucide-`, sprites SVG, etc.)
   - tema padrão (presença de classes `dark`, `data-theme`, `prefers-color-scheme` no CSS, cor de fundo do `body`)

### Fase 1 — Mapeamento de áreas

A partir do HTML do template, montar uma tabela com cada área estrutural identificada e suas características:

| área | tag/seletor | dimensões (mobile / tablet / desktop) | posição | comportamento responsivo |
| ---- | ----------- | ------------------------------------- | ------- | ------------------------ |

Em paralelo, gerar uma lista preliminar de componentes a criar. A lista canônica é:

- `admin-shell.component.tsx` — sempre obrigatório, é o layout que compõe todas as áreas
- `menu.component.tsx` — sempre obrigatório (área lateral, vazia)
- `logo.component.tsx` — sempre obrigatório
- `top-bar.component.tsx` — só se houver header/topbar no template
- `footer.component.tsx` — só se houver footer no template
- `menu-toggle.component.tsx` — só se houver botão de toggle de menu no template
- componentes adicionais para áreas estruturais que não se encaixem nas acima (ex: `sub-aside.component.tsx`, `notifications-rail.component.tsx`) — criar somente se a área for estruturalmente distinta e responsiva, não para conteúdo.

### Fase 2 — Extração de tokens

Extrair do CSS do template:

- larguras fixas das áreas em cada breakpoint (menu expandido, menu colapsado/mini, mobile)
- alturas fixas (header, footer)
- paddings/margins do conteúdo principal
- cores de fundo, cor de borda, cor de texto **apenas das áreas estruturais** (não do conteúdo interno)
- fontes do template (família, tamanho base)
- breakpoints usados pelo CSS original

Salvar esses tokens como CSS variables em um arquivo `src/shared/template/admin/admin-shell.tokens.css` (ou equivalente Tailwind no `tailwind.config.ts`, conforme a stack detectada na Fase 0). Os componentes consomem essas variáveis — nunca hardcode de cor/medida no JSX.

### Fase 3 — Geração de componentes

Criar os arquivos abaixo em `src/shared/template/admin/`:

```
src/shared/template/admin/
├── admin-shell.component.tsx
├── menu.component.tsx
├── logo.component.tsx
├── top-bar.component.tsx              (condicional)
├── footer.component.tsx                (condicional)
├── menu-toggle.component.tsx           (condicional)
├── admin-shell.tokens.css              (ou tokens no tailwind.config)
├── use-menu-state.hook.ts              (estado do menu: expanded | mini | mobile-open | mobile-closed)
└── menu-state.context.tsx              (provider consumido pelo shell)
```

Regras de geração:

- **Áreas vazias.** Cada componente exporta um wrapper que renderiza apenas o container com suas classes/estilos. Sem conteúdo interno (sem itens de menu, sem texto, sem widgets). Exceções autorizadas: o `logo.component.tsx` renderiza o logo (texto + ícone se houver no template) e o `menu-toggle.component.tsx` renderiza o botão funcional.
- **Children como contrato.** Os componentes que terão conteúdo no futuro devem aceitar `children: ReactNode` para que outras skills/etapas possam preencher.
- **`admin-shell.component.tsx`** é onde a composição acontece. Ele lê o estado do menu via `use-menu-state` e aplica as classes/estilos responsivos corretos a cada slot. É o único lugar onde a coreografia das áreas está descrita.
- **Responsividade.** Cada breakpoint relevante do template original deve estar implementado. Se o template tem 3 breakpoints (mobile / tablet / desktop), o shell tem 3 comportamentos visíveis. Se o menu tem modo "mini" no desktop, o estado precisa cobrir isso.
- **Toggle de menu.** Posição, ícone e tamanho do botão devem ser fiéis ao template. Ícone vem da biblioteca detectada na Fase 0 (instalada via `npm install` se ainda não estiver no projeto).
- **Tema único.** Implementar somente o tema padrão detectado. Em caso de dúvida, light. Não criar toggle de tema.

### Fase 4 — Wiring no App Router

Criar:

```
src/app/(private)/layout.tsx     — usa AdminShell envolvendo {children}
src/app/(private)/page.tsx       — apenas <div>Conteúdo</div>
```

O `MenuStateProvider` mora no `layout.tsx` para que qualquer rota privada compartilhe o estado.

### Fase 5 — Verificação

Rodar `npm run build` (ou `next build`) para validar que tudo compila. Se houver erros de tipo ou lint, corrigir antes de encerrar. Reportar ao usuário:

- arquivos criados (lista)
- dependências instaladas (biblioteca de ícones, etc.)
- breakpoints implementados
- estados do menu suportados
- comando para visualizar (`npm run dev` e abrir `/`)

## Não-escopo (explicitar na SKILL.md)

A skill **não** deve:

- criar nada fora de `src/shared/template/admin/` e `src/app/(private)/`
- popular itens de menu, breadcrumbs, avatar, notificações ou qualquer conteúdo interno
- implementar troca de tema (dark/light toggle)
- replicar páginas de exemplo do template (dashboard, tabelas, formulários)
- criar design system, biblioteca de botões, inputs ou tipografia geral da aplicação
- mexer em rotas fora do grupo `(private)`
- adicionar testes (skill separada)

## Critérios de aceite

A skill é considerada bem-sucedida quando:

1. `npm run build` passa sem erros.
2. Acessar `/` (rota raiz do grupo `(private)`) renderiza o shell com a div "Conteúdo" no slot principal.
3. Redimensionar a janela atravessa todos os breakpoints do template original com a coreografia correta das áreas.
4. O botão de toggle (se existir no template) alterna entre os estados de menu, e os estados são visualmente fiéis ao original.
5. Nenhum arquivo foi criado fora dos diretórios autorizados.
6. Nenhum item de conteúdo aparece nas áreas (menu vazio, header vazio exceto logo+toggle, footer vazio).

## Formato do output da skill

A skill que você vai gerar deve seguir o formato Claude Code:

- Um arquivo `SKILL.md` na raiz da skill, com frontmatter (`name`, `description`, `when_to_use`) e o corpo dividido nas fases acima.
- Arquivos de apoio (templates, snippets, exemplos) na mesma pasta, referenciados a partir do `SKILL.md`.
- A `description` no frontmatter deve disparar a skill em pedidos como "transformar template admin em Next.js", "criar shell do admin", "extrair estrutura do template HTML", e variantes em pt-BR.

## O que eu quero de você agora

Gere a skill completa. Antes do código, me mostre:

1. A estrutura de arquivos da skill que você vai criar.
2. O frontmatter proposto da `SKILL.md`.
3. Quais arquivos de apoio você vai incluir e por quê.

Depois que eu confirmar, gere todos os arquivos.
