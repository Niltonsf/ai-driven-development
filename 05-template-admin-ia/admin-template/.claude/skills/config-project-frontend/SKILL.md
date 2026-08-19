---
name: config-project-frontend
description: Bootstrap a standalone Next.js (App Router) project inside the current working directory using a deterministic Node.js script. Scaffolds with TypeScript, Tailwind CSS, ESLint, the `src/` directory, the `@/*` import alias, and an opinionated baseline (Prettier, EditorConfig, standard `src/` subfolders). Trigger when the user asks to create / bootstrap / initialize / scaffold / set up a new Next.js frontend project.
---

# config-project-frontend

Deterministic scaffolder for a new standalone **Next.js** project, placed as a subfolder of the current working directory. All work is performed by a single Node.js script (`scripts/setup.js`) so the result is reproducible and not dependent on the LLM's tool-by-tool execution.

## When to use

- The user asks to create / bootstrap / scaffold / initialize a **new** Next.js project.
- The user wants the project placed inside the current folder (e.g. as `./<project-name>`), independent from the surrounding repo.
- The user wants a standardized baseline (TypeScript, Tailwind, ESLint, `src/`, alias `@/*`, Prettier).

## When NOT to use

- The user wants to modify an **existing** Next.js project — edit it directly instead.
- The target stack is not Next.js (Vite, Remix, plain React, etc.).
- The user wants an interactive `create-next-app` wizard — this skill is non-interactive on purpose.

## Inputs

- `projectName` (string, optional) — folder name to create under the current working directory. Must be a valid npm package name (lowercase, no spaces). The script validates this. **Default: `frontend`.**
- `--no-install` (optional flag) — skip `npm install` (useful in offline / sandboxed environments). Default: install.
- `--pm <npm|pnpm|yarn>` (optional) — package manager. **Default: `npm`. Always use `npm` unless the user EXPLICITLY requests a different manager in their prompt.**

## Default behavior — no questions

This skill is fully non-interactive. **Never ask the user for clarification before running.** Apply defaults silently:

| Input | Default | Override |
|-------|---------|----------|
| `projectName` | `frontend` | Only when user explicitly names the project in the prompt. |
| Package manager | `npm` | Only when user explicitly says `pnpm` or `yarn` in the prompt. |
| Install dependencies | yes | Only when user explicitly says "skip install" / "no install". |

If the user invokes the skill with no arguments, run with all defaults immediately. Do not ask for the project name, do not ask for the package manager, do not ask whether to install. Just execute.

## Outputs

A new folder `./<projectName>/` containing:

```
<projectName>/
├── src/
│   ├── app/                 # App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/          # Shared React components
│   ├── lib/                 # Utilities, helpers, clients
│   ├── hooks/               # Custom React hooks
│   ├── types/               # Shared TypeScript types
│   └── styles/              # Extra global styles (optional)
├── public/
├── .editorconfig
├── .prettierrc
├── .prettierignore
├── .gitignore               # produced by create-next-app
├── eslint.config.mjs        # produced by create-next-app
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json            # `@/*` → `./src/*`
├── package.json
└── README.md
```

## How to run

The skill's deterministic logic lives in [scripts/setup.js](scripts/setup.js). Invoke it from the directory where the new project should be created:

```bash
node .claude/skills/config-project-frontend/scripts/setup.js <projectName> [--no-install] [--pm npm|pnpm|yarn]
```

When invoking this skill from Claude Code:

1. Resolve the absolute path to `setup.js` inside this skill folder.
2. Run it with `Bash` from the directory where the user wants the project created (typically the current working directory).
3. Stream its output back to the user — the script prints each step and exits non-zero on failure.
4. **Do not ask the user any questions.** If the user did not name the project, pass `frontend`. If the user did not specify a package manager, omit `--pm` (defaults to `npm`). If the user did not mention install, install.

**Do not** re-implement the steps with individual tool calls. The whole purpose of the script is to make the scaffold deterministic and idempotent — calling it once should produce the full project.

## What the script does (high level)

1. **Validate inputs** — `projectName` is a valid folder/package name; target folder does not already exist.
2. **Validate environment** — `node --version` ≥ 18.18 (Next.js 15 requirement).
3. **Run `create-next-app`** non-interactively with these flags (locked-in defaults):
   - `--typescript`
   - `--tailwind`
   - `--eslint`
   - `--app` (App Router)
   - `--src-dir`
   - `--import-alias "@/*"`
   - `--turbopack`
   - `--use-<pm>` (matches `--pm`)
   - `--yes` (accept all remaining defaults)
   - `--no-git` (let the user decide; this skill does not commit)
4. **Add baseline tooling** inside the new project:
   - `.prettierrc` (opinionated defaults)
   - `.prettierignore`
   - `.editorconfig`
   - Add `prettier` and `prettier-plugin-tailwindcss` as dev dependencies.
   - Add `format` and `format:check` scripts to `package.json`.
5. **Create empty `src/` subfolders** with `.gitkeep`: `components/`, `lib/`, `hooks/`, `types/`, `styles/`.
6. **Print a final summary** with next steps (`cd <projectName> && npm run dev`).

The script is idempotent on failure: if `create-next-app` succeeds but a later step fails, re-running with the same name will detect the existing folder and abort with a clear message rather than corrupting the state.

## Conventions enforced

- **App Router only.** No Pages Router fallback.
- **`src/` is mandatory.** All app code under `src/`.
- **Alias `@/*` → `./src/*`.** Configured by `create-next-app`; the script does not touch it.
- **TypeScript strict mode.** Inherited from `create-next-app` defaults.
- **No git init.** The user owns version control decisions for the new project.
- **No example pages beyond what `create-next-app` generates.** This skill stops at scaffold + tooling.

## Failure modes

| Problem                                | Script behavior                                           |
| -------------------------------------- | --------------------------------------------------------- |
| `projectName` invalid                  | Exit 1 with message before creating anything.             |
| Target folder already exists           | Exit 1 with message; suggests removing or renaming.       |
| Node version too old                   | Exit 1 with required version.                             |
| `create-next-app` itself fails         | Propagate exit code; stderr already shown to user.        |
| Adding Prettier / writing dotfiles fails | Exit non-zero; partial folder is left for inspection.   |

## Out of scope (future skills)

- Authentication, database, ORM, env files.
- CI configuration.
- Component libraries (shadcn/ui, Radix, etc.).
- Importing a downloaded HTML template — that is the job of the `design-admin-*` skills.
