#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

// Diretórios e arquivos a remover (relativos à raiz do projeto)
const TARGETS = [
  // Dependências Node
  'node_modules',
  'apps/backend/node_modules',
  'apps/frontend/node_modules',
  'packages/shared/node_modules',
  'packages/eslint-config/node_modules',
  'packages/typescript-config/node_modules',

  // Lock files (opcional: remover apenas node_modules e manter locks por padrão)
  // 'package-lock.json',

  // Build NestJS (backend)
  'apps/backend/dist',
  'apps/backend/build',

  // Build Next.js (frontend)
  'apps/frontend/.next',
  'apps/frontend/out',
  'apps/frontend/build',

  // Turbo cache
  '.turbo',
  'apps/backend/.turbo',
  'apps/frontend/.turbo',

  // TypeScript incremental build info
  'apps/backend/tsconfig.tsbuildinfo',
  'apps/frontend/tsconfig.tsbuildinfo',
  'tsconfig.tsbuildinfo',

  // Cobertura de testes
  'coverage',
  'apps/backend/coverage',
  'apps/frontend/coverage',

  // Cache Jest
  'apps/backend/.jest-cache',
  'apps/frontend/.jest-cache',

  // Cache geral
  '.cache',
  'apps/backend/.cache',
  'apps/frontend/.cache',

  // Logs npm/yarn/pnpm
  'npm-debug.log',
  'yarn-debug.log',
  'yarn-error.log',
  '.pnpm-debug.log',
]

// Padrões glob simples para busca recursiva de arquivos/dirs
const RECURSIVE_PATTERNS = [
  { name: 'node_modules', type: 'dir' },
  { name: '.turbo', type: 'dir' },
  { name: 'dist', type: 'dir', onlyIn: ['apps', 'packages', 'modules'] },
  { name: '.next', type: 'dir', onlyIn: ['apps'] },
  { name: 'out', type: 'dir', onlyIn: ['apps'] },
  { name: 'coverage', type: 'dir' },
  { name: '.jest-cache', type: 'dir' },
  { name: '*.tsbuildinfo', type: 'file' },
]

// ──────────────────────────────────────────────
// Utilitários
// ──────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function getDirSize(dirPath) {
  let total = 0
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        total += getDirSize(full)
      } else {
        try {
          total += fs.statSync(full).size
        } catch {}
      }
    }
  } catch {}
  return total
}

function removeTarget(targetPath) {
  try {
    const stat = fs.statSync(targetPath)
    const size = stat.isDirectory() ? getDirSize(targetPath) : stat.size
    fs.rmSync(targetPath, { recursive: true, force: true })
    return { removed: true, size }
  } catch (err) {
    if (err.code === 'ENOENT') return { removed: false, size: 0, notFound: true }
    return { removed: false, size: 0, error: err.message }
  }
}

function matchesGlob(name, pattern) {
  if (!pattern.includes('*')) return name === pattern
  const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$')
  return regex.test(name)
}

function findRecursive(baseDir, pattern, maxDepth = 6, currentDepth = 0) {
  if (currentDepth > maxDepth) return []
  const results = []
  let entries
  try {
    entries = fs.readdirSync(baseDir, { withFileTypes: true })
  } catch {
    return results
  }
  for (const entry of entries) {
    const full = path.join(baseDir, entry.name)
    if (matchesGlob(entry.name, pattern.name)) {
      if (pattern.type === 'dir' && entry.isDirectory()) results.push(full)
      if (pattern.type === 'file' && entry.isFile()) results.push(full)
    }
    // Não desce dentro de node_modules para evitar lentidão
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      results.push(...findRecursive(full, pattern, maxDepth, currentDepth + 1))
    }
  }
  return results
}

// ──────────────────────────────────────────────
// Execução principal
// ──────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('-n')
  const verbose = args.includes('--verbose') || args.includes('-v')
  const yes = args.includes('--yes') || args.includes('-y')

  console.log('\n🧹 Limpeza do projeto Poupig')
  console.log('═'.repeat(45))
  if (dryRun) console.log('⚠️  Modo simulação (--dry-run): nenhum arquivo será removido\n')

  // Confirmação interativa (ignorada no modo dry-run e quando --yes é passado)
  if (!dryRun && !yes) {
    const readline = require('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

    const confirmed = await new Promise(resolve => {
      rl.question(
        'Tem certeza que deseja remover todos os arquivos temporários? [s/N] ',
        answer => {
          rl.close()
          resolve(answer.trim().toLowerCase() === 's')
        }
      )
    })

    if (!confirmed) {
      console.log('\nOperação cancelada.\n')
      process.exit(0)
    }
    console.log()
  }

  let totalRemoved = 0
  let totalSize = 0
  let totalSkipped = 0

  // 1. Remove targets fixos
  for (const target of TARGETS) {
    const full = path.join(ROOT, target)
    let stat
    try {
      stat = fs.statSync(full)
    } catch {
      if (verbose) console.log(`  ○ ${target} (não encontrado)`)
      totalSkipped++
      continue
    }

    const size = stat.isDirectory() ? getDirSize(full) : stat.size
    const label = path.relative(ROOT, full)

    if (dryRun) {
      console.log(`  ✓ ${label} [${formatBytes(size)}] (simulado)`)
      totalRemoved++
      totalSize += size
      continue
    }

    const result = removeTarget(full)
    if (result.removed) {
      console.log(`  ✓ ${label} [${formatBytes(result.size)}]`)
      totalRemoved++
      totalSize += result.size
    } else if (result.notFound) {
      if (verbose) console.log(`  ○ ${label} (não encontrado)`)
      totalSkipped++
    } else {
      console.log(`  ✗ ${label} — erro: ${result.error}`)
    }
  }

  // 2. Busca recursiva por padrões em subdirectórios de workspace
  const workspaceDirs = ['apps', 'packages', 'modules'].map(d => path.join(ROOT, d))

  for (const pattern of RECURSIVE_PATTERNS) {
    const searchRoots = pattern.onlyIn
      ? pattern.onlyIn.map(d => path.join(ROOT, d)).filter(d => {
          try { return fs.statSync(d).isDirectory() } catch { return false }
        })
      : workspaceDirs

    for (const searchRoot of searchRoots) {
      const found = findRecursive(searchRoot, pattern)
      for (const full of found) {
        const label = path.relative(ROOT, full)
        // Evita duplicatas (já processado nos targets fixos)
        const alreadyDone = TARGETS.some(t => path.join(ROOT, t) === full)
        if (alreadyDone) continue

        let size
        try {
          const stat = fs.statSync(full)
          size = stat.isDirectory() ? getDirSize(full) : stat.size
        } catch {
          continue
        }

        if (dryRun) {
          console.log(`  ✓ ${label} [${formatBytes(size)}] (simulado)`)
          totalRemoved++
          totalSize += size
          continue
        }

        const result = removeTarget(full)
        if (result.removed) {
          console.log(`  ✓ ${label} [${formatBytes(result.size)}]`)
          totalRemoved++
          totalSize += result.size
        } else if (!result.notFound) {
          console.log(`  ✗ ${label} — erro: ${result.error}`)
        }
      }
    }
  }

  // ──────────────────────────────────────────────
  // Resumo
  // ──────────────────────────────────────────────
  console.log('\n' + '═'.repeat(45))
  console.log(`Itens removidos : ${totalRemoved}`)
  console.log(`Itens ausentes  : ${totalSkipped}`)
  console.log(`Espaço liberado : ${formatBytes(totalSize)}`)
  if (dryRun) console.log('\n(simulação — execute sem --dry-run para remover de verdade)')
  console.log()
}

main().catch(err => {
  console.error('Erro inesperado:', err.message)
  process.exit(1)
})
