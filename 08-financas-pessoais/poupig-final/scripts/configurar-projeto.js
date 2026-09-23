#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const IS_WINDOWS = process.platform === 'win32';

// ──────────────────────────────────────────────
// Cores (sem dependências externas)
// ──────────────────────────────────────────────

const NO_COLOR = !process.stdout.isTTY || process.env.NO_COLOR;
const c = {
  reset: (s) => (NO_COLOR ? s : `\x1b[0m${s}\x1b[0m`),
  bold: (s) => (NO_COLOR ? s : `\x1b[1m${s}\x1b[0m`),
  dim: (s) => (NO_COLOR ? s : `\x1b[2m${s}\x1b[0m`),
  green: (s) => (NO_COLOR ? s : `\x1b[32m${s}\x1b[0m`),
  yellow: (s) => (NO_COLOR ? s : `\x1b[33m${s}\x1b[0m`),
  red: (s) => (NO_COLOR ? s : `\x1b[31m${s}\x1b[0m`),
  cyan: (s) => (NO_COLOR ? s : `\x1b[36m${s}\x1b[0m`),
  blue: (s) => (NO_COLOR ? s : `\x1b[34m${s}\x1b[0m`),
};

// ──────────────────────────────────────────────
// Passos do setup
// ──────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    label: 'Limpar o projeto',
    desc: 'Remove node_modules, dist, .next, .turbo e caches',
    required: true,
  },
  {
    id: 2,
    label: 'Criar arquivos .env',
    desc: 'Copia .env.example → .env no backend e no frontend',
    required: true,
  },
  {
    id: 3,
    label: 'Subir banco de dados (Docker)',
    desc: 'docker compose up -d no diretório do backend',
    required: true,
  },
  {
    id: 4,
    label: 'Instalar dependências Node.js',
    desc: 'npm install na raiz do monorepo',
    required: true,
  },
  {
    id: 5,
    label: 'Gerar cliente Prisma',
    desc: 'prisma generate (necessário antes do build)',
    required: true,
  },
  {
    id: 6,
    label: 'Build inicial',
    desc: 'turbo run build (gera código antes das migrations)',
    required: false,
  },
  {
    id: 7,
    label: 'Resetar e executar migrations Prisma',
    desc: 'prisma migrate reset --force (apaga e recria o banco)',
    required: true,
  },
  {
    id: 8,
    label: 'Popular banco de dados (seed)',
    desc: 'prisma db seed (insere dados iniciais no banco)',
    required: false,
  },
  {
    id: 9,
    label: 'Build final',
    desc: 'turbo run build (build limpo pós-migrations)',
    required: false,
  },
];

// ──────────────────────────────────────────────
// Utilitários
// ──────────────────────────────────────────────

function line(char = '─', len = 52) {
  return char.repeat(len);
}

/**
 * Executa um comando e retorna { ok, status, error }.
 * Nunca lança exceção — sempre retorna um objeto de resultado.
 */
function run(cmd, opts = {}) {
  const defaults = {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    encoding: 'utf8',
  };
  try {
    const result = spawnSync(cmd, { ...defaults, ...opts });
    if (result.error) {
      return { ok: false, status: -1, error: result.error.message };
    }
    if (result.status !== 0) {
      return { ok: false, status: result.status, error: `exit ${result.status}` };
    }
    return { ok: true, status: 0 };
  } catch (err) {
    return { ok: false, status: -1, error: err.message };
  }
}

/**
 * Igual ao run(), mas lança exceção em caso de falha.
 * Usar apenas para passos marcados como required: true.
 */
function runRequired(cmd, opts = {}) {
  const result = run(cmd, opts);
  if (!result.ok) {
    throw new Error(`Comando falhou (${result.error}): ${cmd}`);
  }
  return result;
}

function copyEnvIfMissing(srcPath, destPath) {
  const rel = path.relative(ROOT, destPath);
  if (fs.existsSync(destPath)) {
    console.log(`  ${c.dim('○')} ${rel} ${c.dim('(já existe — mantido)')}`);
    return false;
  }
  if (!fs.existsSync(srcPath)) {
    console.log(`  ${c.yellow('!')} ${path.relative(ROOT, srcPath)} não encontrado — pulando`);
    return false;
  }
  fs.copyFileSync(srcPath, destPath);
  console.log(`  ${c.green('✓')} ${rel} criado a partir de ${path.basename(srcPath)}`);
  return true;
}

function waitForPostgres(maxWaitMs = 60_000, intervalMs = 3_000) {
  const deadline = Date.now() + maxWaitMs;
  console.log(`  ${c.cyan('…')} Aguardando PostgreSQL ficar pronto...`);
  while (Date.now() < deadline) {
    const r = spawnSync('docker', ['exec', 'poupig-db-postgres', 'pg_isready', '-U', 'poupig'], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    if (r.status === 0) {
      console.log(`  ${c.green('✓')} PostgreSQL pronto!`);
      return;
    }
    const now = Date.now();
    while (Date.now() - now < intervalMs) {
      /* busy-wait leve */
    }
  }
  throw new Error('PostgreSQL não ficou pronto no tempo esperado (60s).');
}

function getPrismaCmd(backendDir) {
  return IS_WINDOWS
    ? path.join(backendDir, 'node_modules', '.bin', 'prisma.cmd')
    : path.join(backendDir, 'node_modules', '.bin', 'prisma');
}

// ──────────────────────────────────────────────
// Execução de cada passo
// ──────────────────────────────────────────────

function executeStep(step) {
  const backendDir = path.join(ROOT, 'apps', 'backend');

  switch (step.id) {
    case 1: {
      runRequired(`node ${JSON.stringify(path.join('scripts', 'limpar-projeto.js'))} --yes`);
      break;
    }

    case 2: {
      copyEnvIfMissing(
        path.join(ROOT, 'apps', 'backend', '.env.example'),
        path.join(ROOT, 'apps', 'backend', '.env'),
      );
      copyEnvIfMissing(
        path.join(ROOT, 'apps', 'frontend', '.env.example'),
        path.join(ROOT, 'apps', 'frontend', '.env'),
      );
      break;
    }

    case 3: {
      const composeCmd = (() => {
        const v2 = spawnSync('docker', ['compose', 'version'], { stdio: 'pipe' });
        if (v2.status === 0) return 'docker compose';
        const v1 = spawnSync('docker-compose', ['version'], { stdio: 'pipe' });
        if (v1.status === 0) return 'docker-compose';
        throw new Error('Docker Compose não encontrado. Instale o Docker Desktop ou docker-compose.');
      })();
      runRequired(`${composeCmd} up -d`, { cwd: backendDir });
      waitForPostgres();
      break;
    }

    case 4: {
      runRequired('npm install');
      break;
    }

    case 5: {
      // Tenta prisma do backend primeiro, depois do monorepo raiz
      const prismaBin = getPrismaCmd(backendDir);
      const prismaBinExists = fs.existsSync(prismaBin);

      if (prismaBinExists) {
        console.log(`  ${c.cyan('…')} Executando prisma generate no backend...`);
        runRequired(`${JSON.stringify(prismaBin)} generate`, { cwd: backendDir });
      } else {
        // Fallback: npx prisma generate
        console.log(`  ${c.yellow('!')} Binário local não encontrado, usando npx...`);
        runRequired('npx prisma generate', { cwd: backendDir });
      }
      break;
    }

    case 6: {
      // Build inicial — não fatal; ignora erros e continua
      console.log(`  ${c.cyan('…')} Executando build (erros não interrompem o setup)...`);
      const result = run('npm run build');
      if (!result.ok) {
        console.log(
          `  ${c.yellow('!')} Build com falhas (${result.error}) — continuando o setup...`,
        );
        return; // retorna sem lançar
      }
      break;
    }

    case 7: {
      const prismaBin = getPrismaCmd(backendDir);
      const prismaBinExists = fs.existsSync(prismaBin);
      const cmd = prismaBinExists
        ? `${JSON.stringify(prismaBin)} migrate reset --force`
        : 'npx prisma migrate reset --force';

      runRequired(cmd, { cwd: backendDir });
      break;
    }

    case 8: {
      const prismaBin = getPrismaCmd(backendDir);
      const prismaBinExists = fs.existsSync(prismaBin);
      const cmd = prismaBinExists
        ? `${JSON.stringify(prismaBin)} db seed`
        : 'npx prisma db seed';

      console.log(`  ${c.cyan('…')} Executando seed (erros não interrompem o setup)...`);
      const result = run(cmd, { cwd: backendDir });
      if (!result.ok) {
        console.log(
          `  ${c.yellow('!')} Seed com falhas (${result.error}) — continuando o setup...`,
        );
        return;
      }
      break;
    }

    case 9: {
      // Build final — não fatal; reporta mas não aborta
      console.log(`  ${c.cyan('…')} Executando build final...`);
      const result = run('npm run build');
      if (!result.ok) {
        console.log(
          `  ${c.yellow('!')} Build final com falhas (${result.error}) — setup concluído com avisos.`,
        );
        return;
      }
      break;
    }
  }
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const autoYes = args.includes('--yes') || args.includes('-y');

  console.log();
  console.log(c.bold('╔' + '═'.repeat(50) + '╗'));
  console.log(c.bold('║') + c.bold(c.cyan('         Setup do projeto Poupig               ')) + c.bold('   ║'));
  console.log(c.bold('╚' + '═'.repeat(50) + '╝'));

  console.log();
  console.log(c.bold('Passos que serão executados:'));
  console.log(c.dim(line('─', 52)));
  for (const step of STEPS) {
    const tag = step.required ? '' : c.dim(' [opcional]');
    console.log(`  ${c.cyan(`${step.id}.`)} ${c.bold(step.label)}${tag}`);
    console.log(`     ${c.dim(step.desc)}`);
  }
  console.log(c.dim(line('─', 52)));
  console.log();
  console.log(c.yellow('  ⚠  ATENÇÃO:') + ' O passo 7 apaga e recria o banco de dados inteiro.');
  console.log(c.yellow('  ⚠  ATENÇÃO:') + ' O passo 1 remove todas as dependências instaladas.');
  console.log();

  if (!autoYes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const confirmed = await new Promise((resolve) => {
      rl.question(c.bold('  Deseja executar o setup completo? [s/N] '), (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 's');
      });
    });

    if (!confirmed) {
      console.log();
      console.log(c.dim('  Setup cancelado. Execute com --yes para pular a confirmação.'));
      console.log();
      process.exit(0);
    }
    console.log();
  } else {
    console.log(c.dim('  Execução automática ativada (--yes)'));
    console.log();
  }

  const startTime = Date.now();
  const failures = [];

  for (const step of STEPS) {
    console.log(`\n${c.bold(c.blue(`[${step.id}/${STEPS.length}]`))} ${c.bold(step.label)}`);
    console.log(c.dim(`     ${step.desc}`));
    console.log(c.dim('  ' + line()));

    try {
      executeStep(step);
      console.log(`  ${c.green('✓')} Concluído`);
    } catch (err) {
      console.log();
      console.log(c.red(`  ✗ Falha no passo ${step.id} — ${step.label}`));
      console.log(c.red(`    ${err.message}`));

      if (step.required) {
        // Passo obrigatório falhou — registra e aborta
        failures.push({ step, err });
        console.log();
        console.log(c.red('  Este passo é obrigatório. Abortando setup.'));
        break;
      } else {
        // Passo opcional — registra aviso e continua
        failures.push({ step, err });
        console.log(c.yellow('  (passo opcional — continuando...)'));
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const requiredFailures = failures.filter((f) => f.step.required);

  console.log();
  if (requiredFailures.length > 0) {
    console.log(c.bold('╔' + '═'.repeat(50) + '╗'));
    console.log(c.bold('║') + c.red(c.bold('   ✗ Setup finalizado com erros              ')) + c.bold('     ║'));
    console.log(c.bold('║') + c.dim(`     Tempo total: ${elapsed}s`.padEnd(50)) + c.bold('║'));
    console.log(c.bold('╚' + '═'.repeat(50) + '╝'));
    console.log();
    console.log(c.red('  Passos com falha:'));
    for (const { step, err } of failures) {
      const tag = step.required ? c.red('[obrigatório]') : c.yellow('[opcional]');
      console.log(`    ${tag} Passo ${step.id} — ${step.label}: ${err.message}`);
    }
    console.log();
    process.exit(1);
  } else if (failures.length > 0) {
    console.log(c.bold('╔' + '═'.repeat(50) + '╗'));
    console.log(c.bold('║') + c.yellow(c.bold('   ⚠ Setup concluído com avisos              ')) + c.bold('    ║'));
    console.log(c.bold('║') + c.dim(`     Tempo total: ${elapsed}s`.padEnd(50)) + c.bold('║'));
    console.log(c.bold('╚' + '═'.repeat(50) + '╝'));
    console.log();
    console.log(c.yellow('  Passos opcionais com falha:'));
    for (const { step, err } of failures) {
      console.log(`    Passo ${step.id} — ${step.label}: ${err.message}`);
    }
  } else {
    console.log(c.bold('╔' + '═'.repeat(50) + '╗'));
    console.log(c.bold('║') + c.green(c.bold('   ✓ Setup concluído com sucesso!              ')) + c.bold('   ║'));
    console.log(c.bold('║') + c.dim(`     Tempo total: ${elapsed}s`.padEnd(50)) + c.bold('║'));
    console.log(c.bold('╚' + '═'.repeat(50) + '╝'));
  }

  console.log();
  console.log('  Para iniciar o projeto:');
  console.log(c.cyan('    npm run dev'));
  console.log();
}

main().catch((err) => {
  console.error(c.red('\nErro inesperado: ' + err.message));
  process.exit(1);
});
