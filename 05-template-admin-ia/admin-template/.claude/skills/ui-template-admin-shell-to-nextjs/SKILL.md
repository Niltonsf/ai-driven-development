---
name: ui-template-admin-shell-to-nextjs
description: Transforma um template administrativo HTML/CSS/JS local na estrutura visual e responsiva (shell) de uma aplicação Next.js (App Router) — somente o esqueleto: header, aside (menu), main, footer, com tamanhos, breakpoints e toggle de menu fiéis ao original. NÃO popula conteúdo (itens de menu, widgets, breadcrumbs, avatar), NÃO cria design system, NÃO implementa toggle de tema, NÃO replica páginas de exemplo. Escreve apenas em `src/shared/template/admin/` e `src/app/(private)/`. Detecta a stack de estilização do projeto (Tailwind v3/v4, CSS Modules, styled-components) e adapta a saída. Usa um pipeline de 6 fases sequenciais (recon → mapeamento de áreas → extração de tokens → geração de componentes → wiring no App Router → verificação) com gate de aceite em cada fase. Dispara em pedidos como "transformar template admin em Next.js", "criar shell do admin a partir do template HTML", "extrair estrutura do template", "scaffold do layout administrativo", "estrutura visual do template em Next".
when_to_use: O usuário tem uma pasta local com um template admin em HTML/CSS/JS puro e um projeto Next.js (App Router) já inicializado, e quer apenas a ESTRUTURA VISUAL (áreas vazias + responsividade + toggle de menu) replicada como componentes React, sem conteúdo interno e sem design system completo.
---

# ui-template-admin-shell-to-nextjs

**Camada:** Geração estrutural — escreve componentes React/TypeScript reais, instala apenas a biblioteca de ícones do template (quando houver botão de toggle), patcha o App Router e verifica que o build passa.

**Escopo único:** o **shell** — áreas vazias + responsividade + toggle de menu. Tudo o que vai *dentro* das áreas é responsabilidade de outras skills/etapas.

## Como esta skill está organizada

A skill é **spec-driven**: 6 fases sequenciais, cada uma em seu próprio arquivo dentro de `steps/`, com goal, procedure, acceptance criteria e verification gate. Não avance para a fase *N+1* sem o gate da fase *N* ter passado. Em qualquer falha de gate, pare e reporte.

```
.claude/skills/ui-template-admin-shell-to-nextjs/
├── SKILL.md                            ← este arquivo (orquestrador)
├── steps/
│   ├── 00-recon.md                     ← Fase 0: detectar stack, ler template, identificar ícones e tema padrão
│   ├── 01-map-areas.md                 ← Fase 1: tabela de áreas + lista preliminar de componentes
│   ├── 02-extract-tokens.md            ← Fase 2: extrair medidas/cores estruturais → CSS vars ou tailwind.config
│   ├── 03-generate-components.md       ← Fase 3: criar admin-shell + áreas vazias + hook + context
│   ├── 04-wire-app-router.md           ← Fase 4: criar (private)/layout.tsx e (private)/page.tsx
│   └── 05-verify-and-report.md         ← Fase 5: build + checklist de aceite + relatório
├── references/
│   ├── component-contracts.md          ← contratos (props, children, slots) de cada componente
│   ├── menu-state-machine.md           ← estados expanded | mini | mobile-open | mobile-closed
│   ├── responsive-strategy.md          ← breakpoints do template → Tailwind / media queries
│   ├── allowlist.md                    ← caminhos que a skill PODE escrever
│   └── non-scope.md                    ← o que a skill NÃO faz
└── templates/                          ← esqueletos com placeholders {{TOKEN}}
    ├── admin-shell.component.tsx.tmpl
    ├── menu.component.tsx.tmpl
    ├── logo.component.tsx.tmpl                       ← deprecado: router-doc apontando para os 3 sub-templates abaixo
    ├── logo.text-only.component.tsx.tmpl             ← kind=text-only (com suporte opcional a inline-svg)
    ├── logo.image-single.component.tsx.tmpl          ← kind=image-single (1 asset)
    ├── logo.image-variants.component.tsx.tmpl        ← kind=image-variants (full/icon/mobile)
    ├── top-bar.component.tsx.tmpl
    ├── footer.component.tsx.tmpl
    ├── menu-toggle.component.tsx.tmpl
    ├── use-menu-state.hook.ts.tmpl
    ├── menu-state.context.tsx.tmpl
    ├── admin-shell.tokens.css.tmpl
    ├── private-layout.tsx.tmpl
    └── private-page.tsx.tmpl
```

## Inputs

- **Obrigatório:** caminho da pasta do template admin (HTML/CSS/JS puro). Pode ser passado como argumento ou perguntado na Fase 0.
- **Implícito:** o CWD é a raiz de um projeto Next.js (App Router) já inicializado, com `package.json` e `src/app/` existentes.

## Outputs

Arquivos criados, **estritamente** dentro dos diretórios listados em [`references/allowlist.md`](references/allowlist.md):

- `src/shared/template/admin/*` — componentes do shell, hook, context e tokens
- `src/app/(private)/layout.tsx` e `src/app/(private)/dashboard/page.tsx` (rota efetiva: `/dashboard`)
- A `src/app/page.tsx` raiz **não é tocada** — a rota `/` continua intocada, sob responsabilidade do projeto.

Dependência opcional instalada: a biblioteca de ícones do template (apenas se houver botão de toggle ou se o `logo.component.tsx` precisar de um glifo).

## Stack alvo

- Next.js 14+ App Router
- TypeScript
- Tailwind CSS por padrão (v3 ou v4 — detectado na Fase 0). Se o projeto usar CSS Modules ou styled-components, a Fase 0 detecta e a Fase 2 emite tokens no formato compatível.
- Componentes em `kebab-case.component.tsx`, hooks em `kebab-case.hook.ts`, contexts em `kebab-case.context.tsx`.

## Pipeline (resumo)

| Fase | Arquivo | Gate de saída |
| ---- | ------- | ------------- |
| 0 | [steps/00-recon.md](steps/00-recon.md) | Caminho do template confirmado, stack detectada, ícones e tema padrão identificados. |
| 1 | [steps/01-map-areas.md](steps/01-map-areas.md) | Tabela de áreas preenchida + lista de componentes a criar fechada. |
| 2 | [steps/02-extract-tokens.md](steps/02-extract-tokens.md) | `admin-shell.tokens.css` (ou tailwind.config) escrito; sem hardcode de cor/medida nos componentes. |
| 3 | [steps/03-generate-components.md](steps/03-generate-components.md) | Componentes condicionais corretamente criados/omitidos; áreas vazias; `tsc` passa em `src/shared/template/admin/`. |
| 4 | [steps/04-wire-app-router.md](steps/04-wire-app-router.md) | `(private)/layout.tsx` envolve `{children}` com `<AdminShell>` dentro de `<MenuStateProvider>`; `(private)/dashboard/page.tsx` renderiza `<div>Conteúdo</div>`. `src/app/page.tsx` e `src/app/layout.tsx` raiz inalterados. |
| 5 | [steps/05-verify-and-report.md](steps/05-verify-and-report.md) | `npm run build` passa; checklist de aceite verde; relatório emitido. |

## Critérios de aceite (verificados na Fase 5)

1. `npm run build` passa sem erros.
2. `/dashboard` renderiza o shell com `<div>Conteúdo</div>` no slot principal.
3. `src/app/page.tsx` e `src/app/layout.tsx` raiz **inalterados** — a rota `/` permanece como o projeto a definiu antes da skill rodar.
4. Cada breakpoint do template original tem comportamento visível e fiel.
5. O botão de toggle (se existir no template) alterna entre os estados de menu, fiel ao original.
6. Nenhum arquivo criado fora de [`references/allowlist.md`](references/allowlist.md).
7. Nenhum item de conteúdo nas áreas (menu vazio; header vazio exceto logo + toggle; footer vazio).

## Não-escopo

Ver [`references/non-scope.md`](references/non-scope.md). Resumindo: nada de itens de menu, breadcrumbs, avatar, notificações, theme toggle, design system, páginas de exemplo, rotas fora de `(private)`, ou testes.

## Regra mestra

> Leia este arquivo por inteiro, depois execute as fases na ordem. Para cada fase, abra e siga o arquivo correspondente em `steps/`. Não avance enquanto o gate de verificação da fase atual não tiver passado. Em qualquer falha de gate, pare e reporte ao usuário.
