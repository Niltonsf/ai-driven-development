# Fase 0 — Reconhecimento

## Goal

Saber, antes de tocar em qualquer arquivo: (a) onde está o template de origem; (b) qual stack de estilização o projeto Next.js usa; (c) qual biblioteca de ícones o template usa; (d) qual é o tema padrão do template.

## Inputs

- Argumento da invocação OU pergunta direta ao usuário: caminho da pasta do template (ex.: `./templates/acme-admin/`).
- CWD: raiz de um projeto Next.js (App Router) com `package.json` e `src/app/`.

## Procedure

1. **Caminho do template.** Se o usuário não informou, perguntar. Validar que o diretório existe e contém ao menos um `.html`. Se não existir, parar.

2. **Detectar stack de estilização** (ler do CWD):
   - Tailwind v4: `package.json` tem `tailwindcss@^4` E existe um `@import "tailwindcss"` em `src/app/globals.css` (ou similar).
   - Tailwind v3: `tailwindcss@^3` E existe `tailwind.config.{js,ts,mjs,cjs}`.
   - CSS Modules: ausência de Tailwind + presença de qualquer `*.module.css` em `src/`.
   - styled-components: dependência `styled-components` em `package.json`.
   - Default: Tailwind v4. Se nada bater, perguntar antes de prosseguir.

3. **Inventariar arquivos do template.** Listar com `find <template>/ -type f`. Identificar:
   - HTML principal: o de menor profundidade na árvore que contenha `<aside>` ou `<nav>` lateral. Se ambíguo, pegar `index.html`.
   - Folhas de estilo: todos os `.css` referenciados pelo HTML principal.
   - JS: todos os `.js` referenciados.

4. **Detectar biblioteca de ícones.** Procurar nos HTMLs e CSSs:
   - `font-awesome` / classes `fa-*` / `fas`/`far`/`fab`
   - Bootstrap Icons / classes `bi-*`
   - Material Design Icons / classes `mdi-*`
   - Lucide / classes `lucide-*` ou `<i data-lucide="...">`
   - Heroicons / Phosphor / Tabler — checar nomes
   - Sprites SVG inline (`<symbol id="...">`) ou `<use href="#...">`
   - Imagens individuais em pasta `icons/` ou `svg/`
   Anotar a primeira evidência forte; se nenhuma for encontrada, marcar como `none`.

5. **Detectar tema padrão.** Verificar no HTML principal:
   - Atributo `class="dark"` ou `data-theme="dark"` no `<html>` ou `<body>`.
   - Cor de fundo computada do `body` no CSS principal — se for escura (luminância < 0.3), tema é `dark`; senão `light`.
   - Em caso de empate, **light**.

6. **Detectar evidência de logo (CRÍTICO — não adiar para a Fase 1).** Localizar todos os "wrappers de brand" no HTML principal: elementos `<a>`/`<div>`/`<span>` cuja classe contém `logo`, `brand`, `navbar-brand`, `sidebar-brand`, ou que estejam dentro de `sidebar-header`, `app-brand`, `header-brand`, `site-logo`. Para cada wrapper, listar:

   - Cada `<img>` filho direto ou indireto: `src`, `alt`, classes (incluindo `dark:hidden`/`hidden dark:block`/`hidden xl:block` etc.).
   - Cada `<svg>` inline filho cujo viewBox/proporção sugira logo (não ícone de menu).
   - Cada `background-image: url(...)` aplicado por classe nesse wrapper.

   Computar:
   - `logoImageCount`: número total de `<img>` distintos nos wrappers de brand (somando todos os wrappers se houver mais de um).
   - `logoAssetPaths[]`: lista de `src` originais (paths relativos à raiz do template), **deduplicada**.
   - `logoHasInlineSvg`: boolean — algum `<svg>` inline foi encontrado em wrapper de brand.
   - `logoIsTextOnly`: `true` apenas se `logoImageCount === 0 && !logoHasInlineSvg && existe texto visível no wrapper`. Em qualquer outro caso, `false`.

   Esses fatos são **fonte da verdade** para a classificação de `kind` na Fase 1.4.1 — a Fase 1 não pode classificar `text-only` quando `logoImageCount > 0` ou `logoHasInlineSvg === true`. Ver Fase 1.4.1 para a regra dura.

7. **Registrar tudo** num bloco mental para as próximas fases. Não criar arquivo de relatório nesta fase.

## Acceptance criteria

- [ ] Caminho do template existe e contém HTML principal identificado.
- [ ] Stack de estilização do projeto identificada (uma de: tailwind-v4, tailwind-v3, css-modules, styled-components).
- [ ] Biblioteca de ícones identificada ou explicitamente marcada como `none`.
- [ ] Tema padrão definido (`light` ou `dark`).
- [ ] **Evidência de logo registrada**: `logoImageCount`, `logoAssetPaths[]` (com paths literais), `logoHasInlineSvg`, `logoIsTextOnly`. Sem este passo, a classificação de `kind` na Fase 1 fica sem âncora e o gerador tende a escolher `text-only` por inércia.

## Verification gate

Reportar ao usuário, em uma única mensagem curta, os 5 fatos acima (incluindo a evidência de logo: contagem de imagens + lista de paths). Só prosseguir para a Fase 1.

## Failure handling

- Template não encontrado → parar e pedir caminho correto.
- Múltiplos HTMLs candidatos sem critério para desempatar → listar e pedir escolha.
- Stack de estilização ambígua → perguntar antes de prosseguir; **não inventar**.
