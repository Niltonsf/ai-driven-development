#!/usr/bin/env node
/**
 * config-project-frontend / setup.js
 *
 * Deterministic bootstrapper for a standalone Next.js project.
 * Invoked by the `config-project-frontend` skill. See ../SKILL.md.
 *
 * Usage:
 *   node setup.js [projectName] [--no-install] [--pm npm|pnpm|yarn]
 *
 * Defaults: projectName="frontend", pm="npm", install=true.
 */

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// ---------- helpers ----------

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(msg) {
  process.stdout.write(`${COLORS.cyan}›${COLORS.reset} ${msg}\n`);
}
function ok(msg) {
  process.stdout.write(`${COLORS.green}✓${COLORS.reset} ${msg}\n`);
}
function warn(msg) {
  process.stdout.write(`${COLORS.yellow}!${COLORS.reset} ${msg}\n`);
}
function fail(msg, code = 1) {
  process.stderr.write(`${COLORS.red}✗ ${msg}${COLORS.reset}\n`);
  process.exit(code);
}

function run(cmd, args, opts = {}) {
  log(`${COLORS.gray}$ ${cmd} ${args.join(' ')}${COLORS.reset}`);
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  });
  if (res.status !== 0) {
    fail(`Command failed: ${cmd} ${args.join(' ')} (exit ${res.status})`, res.status || 1);
  }
}

// ---------- argument parsing ----------

const DEFAULT_PROJECT_NAME = 'frontend';

function parseArgs(argv) {
  const args = { projectName: null, install: true, pm: 'npm' };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--no-install') {
      args.install = false;
    } else if (a === '--pm') {
      args.pm = rest[++i];
    } else if (a.startsWith('--pm=')) {
      args.pm = a.slice('--pm='.length);
    } else if (a === '-h' || a === '--help') {
      printHelpAndExit(0);
    } else if (a.startsWith('--')) {
      fail(`Unknown flag: ${a}`);
    } else if (!args.projectName) {
      args.projectName = a;
    } else {
      fail(`Unexpected positional argument: ${a}`);
    }
  }
  if (!args.projectName) args.projectName = DEFAULT_PROJECT_NAME;
  return args;
}

function printHelpAndExit(code) {
  process.stdout.write(
    [
      'Usage: node setup.js [projectName] [--no-install] [--pm npm|pnpm|yarn]',
      '       (projectName defaults to "frontend"; pm defaults to "npm")',
      '',
      'Creates a standalone Next.js project (App Router, TypeScript, Tailwind,',
      'ESLint, src/, alias @/*) inside the current working directory.',
    ].join('\n') + '\n',
  );
  process.exit(code);
}

// ---------- validation ----------

const VALID_PM = new Set(['npm', 'pnpm', 'yarn']);

// npm package name: lowercase, may contain - _ . and digits, no leading dot/underscore.
const PROJECT_NAME_RE = /^(?!\.)(?!_)[a-z0-9._-]+$/;

function validateProjectName(name) {
  if (!name) fail('Missing <projectName>. See --help.');
  if (name.length > 214) fail('projectName must be ≤ 214 chars.');
  // (When invoked with no positional arg, parseArgs defaults to "frontend".)
  if (!PROJECT_NAME_RE.test(name)) {
    fail(
      'Invalid projectName. Use lowercase letters, digits, "-", "_" or "." (no spaces, no leading "." or "_").',
    );
  }
}

function validatePackageManager(pm) {
  if (!VALID_PM.has(pm)) fail(`Invalid --pm "${pm}". Use one of: ${[...VALID_PM].join(', ')}.`);
}

function validateNodeVersion() {
  const [maj, min] = process.versions.node.split('.').map(Number);
  if (maj < 18 || (maj === 18 && min < 18)) {
    fail(`Node.js ≥ 18.18 is required (found ${process.versions.node}). Next.js 15 needs it.`);
  }
}

function ensureTargetFolderFree(targetDir) {
  if (fs.existsSync(targetDir)) {
    fail(`Target folder already exists: ${targetDir}\nRemove or rename it, then re-run.`);
  }
}

// ---------- step: create-next-app ----------

function runCreateNextApp({ projectName, pm, install }) {
  log(`Scaffolding Next.js app via create-next-app (pm=${pm}, install=${install})`);

  const args = [
    'create-next-app@latest',
    projectName,
    '--typescript',
    '--tailwind',
    '--eslint',
    '--app',
    '--src-dir',
    '--turbopack',
    '--import-alias',
    '@/*',
    `--use-${pm}`,
    '--no-git',
    '--yes',
  ];
  if (!install) args.push('--skip-install');

  run('npx', ['--yes', ...args]);
  ok('create-next-app finished');
}

// ---------- step: baseline tooling ----------

const PRETTIERRC = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
};

const PRETTIERIGNORE = `# build artifacts
.next
out
dist
build
coverage

# deps
node_modules

# env / lockfiles
.env*
package-lock.json
pnpm-lock.yaml
yarn.lock
`;

const EDITORCONFIG = `root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
`;

function writeFileSync(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  ok(`wrote ${path.relative(process.cwd(), filePath)}`);
}

function writeBaselineDotfiles(projectDir) {
  log('Writing baseline dotfiles (.prettierrc, .prettierignore, .editorconfig)');
  writeFileSync(path.join(projectDir, '.prettierrc'), JSON.stringify(PRETTIERRC, null, 2) + '\n');
  writeFileSync(path.join(projectDir, '.prettierignore'), PRETTIERIGNORE);
  writeFileSync(path.join(projectDir, '.editorconfig'), EDITORCONFIG);
}

function addPrettierToPackageJson(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) fail(`Expected package.json at ${pkgPath}`);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  pkg.scripts = pkg.scripts || {};
  pkg.scripts.format = 'prettier --write .';
  pkg.scripts['format:check'] = 'prettier --check .';

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  ok('added format / format:check scripts to package.json');
}

function installPrettierDevDeps({ projectDir, pm, install }) {
  if (!install) {
    warn('--no-install: skipping prettier devDependency install');
    return;
  }
  log('Installing prettier + prettier-plugin-tailwindcss');
  const cmds = {
    npm: ['npm', ['install', '-D', 'prettier', 'prettier-plugin-tailwindcss']],
    pnpm: ['pnpm', ['add', '-D', 'prettier', 'prettier-plugin-tailwindcss']],
    yarn: ['yarn', ['add', '-D', 'prettier', 'prettier-plugin-tailwindcss']],
  };
  const [cmd, args] = cmds[pm];
  run(cmd, args, { cwd: projectDir });
  ok('prettier installed');
}

// ---------- step: src/ subfolders ----------

const SRC_SUBFOLDERS = ['components', 'lib', 'hooks', 'types', 'styles'];

function createSrcSubfolders(projectDir) {
  log('Creating src/ subfolders (components, lib, hooks, types, styles)');
  const srcDir = path.join(projectDir, 'src');
  if (!fs.existsSync(srcDir)) {
    fail(`Expected src/ directory at ${srcDir} (create-next-app should have made it).`);
  }
  for (const sub of SRC_SUBFOLDERS) {
    const dir = path.join(srcDir, sub);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '.gitkeep'), '');
    ok(`created src/${sub}/`);
  }
}

// ---------- main ----------

function main() {
  const args = parseArgs(process.argv);

  validateProjectName(args.projectName);
  validatePackageManager(args.pm);
  validateNodeVersion();

  const cwd = process.cwd();
  const projectDir = path.resolve(cwd, args.projectName);
  ensureTargetFolderFree(projectDir);

  process.stdout.write(
    `\n${COLORS.bold}config-project-frontend${COLORS.reset}\n` +
      `  project:  ${args.projectName}\n` +
      `  target:   ${projectDir}\n` +
      `  pm:       ${args.pm}\n` +
      `  install:  ${args.install}\n\n`,
  );

  // Step 1: create-next-app
  runCreateNextApp(args);

  // Step 2: baseline dotfiles
  writeBaselineDotfiles(projectDir);

  // Step 3: prettier deps + scripts
  addPrettierToPackageJson(projectDir);
  installPrettierDevDeps({ projectDir, pm: args.pm, install: args.install });

  // Step 4: src/ subfolders
  createSrcSubfolders(projectDir);

  // Done.
  process.stdout.write(
    `\n${COLORS.green}${COLORS.bold}✔ Project ready${COLORS.reset}\n` +
      `\nNext steps:\n` +
      `  cd ${args.projectName}\n` +
      (args.install ? '' : `  ${args.pm} install\n`) +
      `  ${args.pm} run dev\n\n`,
  );
}

try {
  main();
} catch (err) {
  fail(err && err.stack ? err.stack : String(err));
}
