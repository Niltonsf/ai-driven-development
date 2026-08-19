# Não-escopo

A skill **não** faz nada do que está abaixo. Se o usuário pedir uma destas coisas no meio da execução, parar e dizer que está fora do escopo desta skill.

## Conteúdo

- Itens de menu (links, ícones, agrupadores, sub-menus).
- Breadcrumbs.
- Avatar / dropdown de usuário.
- Notificações, mensagens, search global.
- Widgets do topbar (idioma, atalhos, status).
- Logo de produção (manter o do template ou um placeholder textual).

## Design system

- Botões reutilizáveis fora do `<MenuToggle>`.
- Inputs, modais, tabelas, cards.
- Tokens de tipografia além do `font-family` e tamanho base do body.
- Paleta de cores além das estruturais (aside-bg, topbar-bg, border, text, shell-bg).

## Tema

- Toggle dark/light.
- Múltiplos temas, persistência, FOUC prevention.
- Detecção de `prefers-color-scheme` para alternar tema. (Detectar `prefers-color-scheme` apenas para escolher o tema padrão na Fase 0 é permitido — alternar em runtime, não.)

## Páginas

- Replicar páginas exemplo do template (dashboard, tabelas, formulários).
- Páginas de auth (login/register/recovery).
- Páginas de erro (404/500).
- Qualquer rota fora de `src/app/(private)/`.

## Infra

- Configurar Tailwind do zero.
- Configurar TypeScript, ESLint, Prettier.
- Configurar middleware do Next.
- Adicionar testes (unitários, e2e, visuais).
- CI/CD, deploy, scripts de build customizados.

## Estrutura de pastas e arquivos placeholder

- **Não** criar pastas convencionais "para uso futuro" como `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`, `src/styles/`, `src/features/`, `src/utils/`. Esta skill só toca o que está na [allowlist](allowlist.md) e nada além.
- **Não** emitir arquivos marcadores: `.gitkeep`, `.keep`, `index.ts` vazio, `README.md` placeholder. Pastas vazias não devem existir.
- Scaffolding de árvore de diretórios genérica é trabalho da skill `config-project-frontend` (uma vez, na criação do projeto) — esta skill assume que o projeto Next.js **já está pronto** e apenas adiciona o shell.

## Quando o usuário insistir

Resposta padrão: "Isso está fora do escopo desta skill. Sugestão: [skill apropriada do mesmo repo, se existir, p.ex. `design-admin-design-system-extractor` para tokens completos, `design-admin-primitives-generator` para botões/inputs, `design-admin-page-templates-generator` para páginas exemplo]."
