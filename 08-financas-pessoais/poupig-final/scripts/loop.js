#!/usr/bin/env node

/**
 * loop.js — Orquestrador externo (Loop Engineering) para projetos OpenSpec + Claude Code.
 *
 * O QUE ELE FAZ (quatro etapas, na mesma execução):
 *
 * ETAPA 1 — Baseline (ANTES de qualquer mudança)
 *   Garante que o projeto já começa são: suíte de testes passando e
 *   módulos de negócio (ver CONFIG.modulosDeNegocio) com 100% de cobertura.
 *   Se isso falhar e não puder ser corrigido, o script ABORTA antes de
 *   tocar em qualquer especificação — para nunca aplicar mudanças novas em
 *   cima de uma base já quebrada, e para que qualquer falha futura possa
 *   ser atribuída com confiança à mudança nova, não a dívida técnica antiga.
 *
 * ETAPA 2 — Executar especificações pendentes (OpenSpec)
 *   1. Lista as "changes" pendentes (openspec list).
 *   2. Para cada uma, primeiro verifica se já está completa (implementada
 *      manualmente, por exemplo): valida + roda testes + checa tasks.
 *      Se sim, marca como pronta para arquivar, SEM chamar o Claude.
 *   3. Se não estiver completa, invoca o Claude Code para implementar,
 *      valida objetivamente, e repete com o erro como contexto até passar
 *      ou esgotar tentativas. NÃO arquiva nada nesta etapa — isso é
 *      responsabilidade só da Etapa 4, e só depois da Etapa 3 confirmar
 *      que tudo (inclusive cobertura) está correto.
 *
 * ETAPA 3 — Confirmação final (DEPOIS das mudanças)
 *   Reconfirma a mesma checagem da Etapa 1 — porque as mudanças aplicadas
 *   na Etapa 2 podem ter introduzido código de negócio novo, que só existe
 *   a partir de agora e ainda não foi auditado. Sem essa etapa aqui, a
 *   garantia de 100% de cobertura valeria só pro código antigo. Importante:
 *   a checagem "completa" por especificação, na Etapa 2, NÃO confere
 *   cobertura de negócio (só validate + testes + tasks) — é só aqui, na
 *   Etapa 3, que a cobertura agregada do projeto inteiro é auditada.
 *
 * ETAPA 4 — Arquivamento
 *   Só roda, e só arquiva algo, SE a Etapa 3 tiver confirmado sucesso.
 *   Arquiva, de uma só vez, todas as especificações que a Etapa 2 marcou
 *   como completas. Se a Etapa 3 falhar, NADA é arquivado nesta execução —
 *   as especificações executadas permanecem pendentes para uma próxima
 *   rodada do loop, depois de correção manual. Isso garante que "arquivada"
 *   signifique de fato "verificada de ponta a ponta, cobertura incluída",
 *   e não apenas "os testes gerais passaram no momento em que essa
 *   especificação terminou".
 *
 * Em nenhum momento o script decide sucesso com base na "opinião" do
 * agente — só com base em exit codes e dados de cobertura verificáveis.
 * A saída do Claude Code (incluindo qualquer subagente que ele invoque) é
 * sempre herdada diretamente pelo terminal (stdio "inherit") — nada do que
 * ele faz fica escondido ou é resumido pelo script.
 *
 * COMO RODAR:
 *   npm run loop                        (as quatro etapas: baseline, executar, confirmação, arquivar)
 *   node scripts/loop.js
 *   node loop.js --only add-dark-mode   (etapas 2/4 só para uma change específica)
 *   node loop.js --skip-tests-phase     (só a etapa 2, pula baseline e confirmação —
 *                                         nesse caso o arquivamento não fica condicionado
 *                                         à confirmação, já que ela nem roda)
 *   node loop.js --only-tests           (só testes/cobertura, pula as especificações do OpenSpec)
 *   node loop.js --dry-run              (mostra o plano/estado atual das etapas,
 *                                         sem chamar o Claude nem arquivar nada)
 *
 * SEGURANÇA:
 *   - Preflight: checa se os comandos `claude` e `openspec` existem no PATH
 *     antes de começar, para falhar rápido e com uma mensagem clara em vez
 *     de tentar e reportar "estagnação" sem explicar o motivo real.
 *   - Lock file (.loop-engineering.lock na raiz) impede duas execuções
 *     concorrentes do loop no mesmo projeto.
 *   - Toda chamada ao Claude tem timeout (CONFIG.timeoutClaudeMs) — se
 *     travar, o processo é encerrado em vez de ficar pendurado para sempre.
 *   - Detecção de falha na própria invocação do Claude: se o comando
 *     `claude` sair com código de erro (ou der timeout) em tentativas
 *     consecutivas, o script para e avisa que o problema é o CLI (não
 *     encontrado, não autenticado, flag inválida etc.), em vez de mascarar
 *     isso como "mesmo erro de teste se repetiu".
 *   - Detecção de estagnação: se o mesmo erro de teste/validação se repetir
 *     em duas tentativas seguidas, a fase correspondente para e sinaliza
 *     intervenção humana, em vez de queimar todas as tentativas do mesmo jeito.
 *   - Tudo é registrado em loop-engineering.log, com timestamp por linha.
 *
 * PRÉ-REQUISITOS:
 *   - Claude Code CLI e OpenSpec CLI no PATH.
 *   - Um comando de cobertura configurado em CONFIG.comandoCobertura que
 *     gere coverage-summary.json (padrão Istanbul — Jest e Vitest suportam
 *     isso nativamente com o reporter "json-summary"). Em monorepos, o
 *     script procura recursivamente por QUALQUER coverage-summary.json
 *     dentro do projeto (ex: um por pacote/workspace) e agrega todos.
 *
 * AJUSTES QUASE CERTAMENTE NECESSÁRIOS PRO SEU PROJETO:
 *   - CONFIG.modulosDeNegocio: padrões de caminho que identificam código de
 *     regra de negócio (ex: bounded contexts DDD). Só esses são exigidos a
 *     100% de cobertura. Ajuste para bater com a estrutura real do seu
 *     monorepo (ex: pastas de domínio/core dos seus módulos).
 *   - CONFIG.comandoTeste / CONFIG.comandoCobertura: troque pelos scripts
 *     reais do seu package.json.
 *   - CONFIG.flagsClaude: confira se as flags são válidas para a versão do
 *     Claude Code CLI instalada — flags inválidas fazem o comando falhar
 *     instantaneamente, o que o script agora detecta e avisa.
 *   - O formato de "openspec list --json" pode variar por versão do CLI —
 *     o parser tenta reconhecer os formatos mais comuns automaticamente e
 *     avisa no log se não conseguir.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Raiz do projeto — calculada a partir da localização do script, não do cwd,
// para que o loop funcione tanto rodado da raiz quanto de dentro de scripts/.
const ROOT = path.resolve(__dirname, '..');

// ───────────────────────────── CONFIGURAÇÃO ─────────────────────────────

const CONFIG = {
  // Etapa 2 — especificações do OpenSpec
  maxTentativasPorChange: 6,
  pararNaPrimeiraChangeComFalha: false,

  // Etapas 1 e 3 — saúde de testes e cobertura
  maxTentativasTestes: 5,
  // Cobertura é corrigida UM ARQUIVO POR VEZ (não a lista inteira numa
  // chamada só) — assim cada correção é verificada isoladamente, com
  // feedback incremental, em vez de uma chamada longa e opaca ao Claude.
  maxTentativasPorArquivoCobertura: 3,
  maxCiclosCobertura: 60, // teto de segurança total do laço (evita loop infinito em cenários patológicos)
  // Neste projeto o comando de teste já roda com --coverage (via turbo →
  // "jest --coverage" em cada módulo), então cobertura é o mesmo comando
  // de teste — não existe um "test:coverage" separado no package.json raiz.
  comandoCobertura: ['npm', ['test']], // deve gerar coverage-summary.json (reporter "json-summary" no jest.config.ts de cada módulo)
  coberturaMinimaModulosDeNegocio: 100, // percentual exigido só nos módulos de negócio
  modulosDeNegocio: [
    // Substrings de caminho (case-insensitive) que identificam código de
    // regra de negócio neste monorepo. Ajustado à estrutura real do
    // projeto: cada módulo de domínio vive em modules/<nome>/src/**
    // (entities, VOs, use-cases, repositories, dto), e packages/shared
    // contém as classes base (Entity, Result) usadas por todo o domínio.
    '/modules/',
    '/packages/shared/',
  ],

  // Comandos compartilhados por todas as etapas
  comandoTeste: ['npm', ['test']], // TROQUE pelo seu comando real de teste
  comandoClaude: 'claude',
  flagsClaude: ['--dangerously-skip-permissions'],
  timeoutClaudeMs: 20 * 60 * 1000, // 20 min — ajuste conforme a complexidade típica das tasks

  // Se o próprio comando do Claude falhar ao rodar (exit code != 0 ou
  // timeout) esse número de vezes seguidas, o script para e aponta o CLI
  // como causa provável, em vez de continuar retentando às cegas.
  maxFalhasConsecutivasInvocacaoClaude: 2,

  arquivoDeLog: path.join(ROOT, 'loop-engineering.log'),
  arquivoDeLock: path.join(ROOT, '.loop-engineering.lock'),
};

// ───────────────────────────── UTILITÁRIOS ─────────────────────────────

function log(msg) {
  const linha = `[${new Date().toISOString()}] ${msg}`;
  console.log(linha);
  fs.appendFileSync(CONFIG.arquivoDeLog, linha + '\n');
}

function logEtapa(titulo) {
  log(`\n=== ${titulo} ===`);
}

function rodar(cmd, args, { capturarSaida = false, timeoutMs = 0 } = {}) {
  const resultado = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: capturarSaida ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf-8',
    timeout: timeoutMs > 0 ? timeoutMs : undefined,
  });

  if (resultado.error && resultado.error.code === 'ETIMEDOUT') {
    log(`⏱️ Comando "${cmd} ${args.join(' ')}" excedeu o timeout de ${timeoutMs}ms e foi encerrado.`);
  }

  return {
    codigo: resultado.status,
    stdout: resultado.stdout || '',
    stderr: resultado.stderr || '',
    erro: resultado.error || null,
  };
}

// ───────────────────────────── PREFLIGHT ────────────────────────────────

function comandoExiste(cmd) {
  const r = spawnSync(cmd, ['--version'], { encoding: 'utf-8' });
  return !(r.error && r.error.code === 'ENOENT');
}

// Alguns comandos (ex: "claude" instalado via alguns instaladores) são só um
// ALIAS de shell, não um binário no PATH — spawnSync não resolve aliases
// (isso não passa pelo shell). Detectamos esse caso e resolvemos o caminho
// real UMA VEZ aqui no preflight (não a cada invocação, pra não depender de
// abrir um shell interativo em toda chamada ao Claude).
function resolverCaminhoReal(cmd) {
  const shell = process.env.SHELL || '/bin/zsh';
  const r = spawnSync(shell, ['-i', '-c', `type ${cmd}`], { encoding: 'utf-8', timeout: 10000 });
  const saida = `${r.stdout || ''}${r.stderr || ''}`;

  const match = saida.match(/(?:is an alias for|is)\s+(\/\S+)/);
  if (match && fs.existsSync(match[1])) {
    return match[1];
  }
  return null;
}

function verificarPreRequisitos() {
  if (!comandoExiste(CONFIG.comandoClaude)) {
    const resolvido = resolverCaminhoReal(CONFIG.comandoClaude);
    if (resolvido) {
      log(
        `ℹ️ "${CONFIG.comandoClaude}" não é um binário direto no PATH (é um alias do seu shell) — resolvido para: ${resolvido}`,
      );
      CONFIG.comandoClaude = resolvido;
    } else {
      log(
        `❌ Comando "${CONFIG.comandoClaude}" não encontrado no PATH nem resolvível como alias pelo shell (${process.env.SHELL || '/bin/zsh'}). ` +
          'Se for uma função de shell (não alias/binário), ajuste CONFIG.comandoClaude em scripts/loop.js para o caminho real do executável.',
      );
      process.exit(1);
    }
  }

  if (!comandoExiste('openspec')) {
    log('❌ Comando "openspec" não encontrado no PATH. Instale/configure antes de rodar o loop.');
    process.exit(1);
  }
}

// ───────────────────────────── LOCK DE EXECUÇÃO ─────────────────────────

function adquirirLock() {
  if (fs.existsSync(CONFIG.arquivoDeLock)) {
    const criadoEm = fs.readFileSync(CONFIG.arquivoDeLock, 'utf-8');
    log(
      `⚠️ Já existe uma execução em andamento (lock criado em ${criadoEm}). Abortando para evitar execução concorrente.`,
    );
    log(
      `Se tiver certeza de que não há outra execução ativa (ex: processo anterior travou), apague manualmente: ${CONFIG.arquivoDeLock}`,
    );
    process.exit(1);
  }
  fs.writeFileSync(CONFIG.arquivoDeLock, new Date().toISOString());
}

function liberarLock() {
  try {
    fs.unlinkSync(CONFIG.arquivoDeLock);
  } catch {
    // já não existia — sem problema
  }
}

// ───────────────────────── INTEGRAÇÃO COM OPENSPEC ─────────────────────

function listarChangesPendentes() {
  const r = rodar('openspec', ['list', '--json'], { capturarSaida: true });
  if (r.codigo !== 0) {
    log(`ERRO ao listar changes do OpenSpec: ${r.stderr}`);
    process.exit(1);
  }
  return parsePendingChanges(r.stdout);
}

// Só changes já ARQUIVADAS somem da lista de trabalho. "complete" aqui
// significa "todas as tasks concluídas", NÃO "já arquivada" — essas changes
// ainda precisam passar pelo loop (que vai só arquivá-las, na Etapa 3, sem
// chamar o Claude, já que já estão prontas). Ver verificarSeJaEstaCompleta().
const STATUS_QUE_SIGNIFICAM_JA_ARQUIVADA = ['archived'];

function parsePendingChanges(jsonStr) {
  let dados;
  try {
    dados = JSON.parse(jsonStr);
  } catch (e) {
    log(`ERRO ao parsear JSON de 'openspec list --json': ${e.message}`);
    log(`Saída bruta recebida:\n${jsonStr}`);
    process.exit(1);
  }

  const possiveisChaves = ['changes', 'items', 'data', 'results', 'pending'];
  let lista = Array.isArray(dados) ? dados : null;
  if (!lista) {
    for (const chave of possiveisChaves) {
      if (Array.isArray(dados[chave])) {
        lista = dados[chave];
        break;
      }
    }
  }

  if (!lista) {
    log('AVISO: não consegui identificar o array de changes no JSON retornado por "openspec list --json".');
    log(`Estrutura recebida (chaves de nível superior): ${Object.keys(dados).join(', ') || '(objeto vazio)'}`);
    log(`JSON bruto para depuração:\n${JSON.stringify(dados, null, 2)}`);
    log('Ajuste manualmente "parsePendingChanges()" com o formato acima.');
    return [];
  }

  return lista
    .filter((c) => {
      const statusBruto = (c.status ?? c.state ?? c.phase ?? '').toString().toLowerCase();
      return !STATUS_QUE_SIGNIFICAM_JA_ARQUIVADA.includes(statusBruto);
    })
    .map((c) => {
      const name = c.name ?? c.id ?? c.slug;
      let tasksComplete;
      if (typeof c.completedTasks === 'number' && typeof c.totalTasks === 'number') {
        tasksComplete = c.totalTasks > 0 && c.completedTasks === c.totalTasks;
      } else {
        tasksComplete = (c.status ?? '').toString().toLowerCase() === 'complete';
      }
      return { name, tasksComplete };
    })
    .filter((c) => Boolean(c.name));
}

function tasksCompletas(changeName) {
  const r = rodar('openspec', ['list', '--json'], { capturarSaida: true });
  if (r.codigo !== 0) return false;
  const lista = parsePendingChanges(r.stdout);
  const encontrada = lista.find((c) => c.name === changeName);
  return encontrada ? encontrada.tasksComplete : false;
}

function validar(changeName) {
  const r = rodar('openspec', ['validate', changeName, '--strict'], { capturarSaida: true });
  return { ok: r.codigo === 0, saida: r.stderr || r.stdout };
}

function rodarTestes() {
  const r = rodar(...CONFIG.comandoTeste, { capturarSaida: true });
  return { ok: r.codigo === 0, saida: r.stderr || r.stdout };
}

function arquivar(changeName) {
  const r = rodar('openspec', ['archive', changeName, '--yes'], { capturarSaida: true });
  return r.codigo === 0;
}

// ───────────────────── VERIFICAÇÃO DE ESTADO (sem chamar o Claude) ──────

function verificarSeJaEstaCompleta(changeName) {
  const resultadoValidate = validar(changeName);
  const resultadoTestes = rodarTestes();
  const tasksComplete = tasksCompletas(changeName);

  const completa = resultadoValidate.ok && resultadoTestes.ok && tasksComplete;

  return {
    completa,
    detalhes: {
      validou: resultadoValidate.ok,
      testesPassaram: resultadoTestes.ok,
      tasksComplete,
      erroTestes: resultadoTestes.ok ? null : resultadoTestes.saida,
      erroValidate: resultadoValidate.ok ? null : resultadoValidate.saida,
    },
  };
}

// ───────────────────────── INTEGRAÇÃO COM CLAUDE ────────────────────────

// A saída do processo do Claude é sempre herdada ("inherit") pelo terminal
// atual — tudo que ele (ou qualquer subagente que ele invoque) imprimir
// aparece aqui ao vivo, sem passar pelo nosso log(). Só o resultado final
// (ok/código de saída) é o que reportamos explicitamente depois.
function invocarClaude(prompt) {
  log(`→ Invocando Claude Code (timeout: ${Math.round(CONFIG.timeoutClaudeMs / 60000)} min)...`);
  const r = rodar(CONFIG.comandoClaude, ['-p', prompt, ...CONFIG.flagsClaude], {
    timeoutMs: CONFIG.timeoutClaudeMs,
  });

  const timedOut = Boolean(r.erro && r.erro.code === 'ETIMEDOUT');
  const ok = r.codigo === 0;

  if (!ok) {
    log(
      `⚠️ Claude Code encerrou com código ${r.codigo}${timedOut ? ' (timeout)' : ''} — esta tentativa pode não ter aplicado nenhuma mudança real.`,
    );
  }

  return { ok, codigo: r.codigo, timedOut };
}

function aplicarComClaude(changeName, contextoDeErroAnterior) {
  let prompt = `/opsx:apply ${changeName}`;
  if (contextoDeErroAnterior) {
    prompt =
      `A tentativa anterior de aplicar a change "${changeName}" falhou na validação ou nos testes. ` +
      `Aqui está o erro:\n\n${contextoDeErroAnterior}\n\n` +
      `Corrija o problema e continue a implementação a partir de onde está. ` +
      `Depois de corrigir, rode a suíte de testes local antes de finalizar.`;
  }
  return invocarClaude(prompt);
}

function corrigirTestesComClaude(saidaDeErro) {
  const prompt =
    'A suíte de testes do projeto está falhando. Aqui está a saída do comando de teste:\n\n' +
    `${saidaDeErro}\n\n` +
    'Analise a causa raiz e corrija o código ou os testes para que a suíte volte a passar completamente. ' +
    'Não desabilite, pule (skip) nem apague testes para "fazer passar" — corrija a causa real da falha.';
  return invocarClaude(prompt);
}

// Foca em UM arquivo por vez de propósito — ver comentário em
// garantirCoberturaDosModulosDeNegocio() sobre por que a fase de cobertura
// não manda a lista inteira de incompletos numa chamada só.
function aumentarCoberturaComClaude(arquivoIncompleto) {
  const prompt =
    `O arquivo abaixo é um módulo de regra de negócio e precisa atingir 100% de cobertura de testes ` +
    `(linhas, branches, funções e statements):\n\n` +
    `- ${arquivoIncompleto.arquivo} (cobertura atual: ${arquivoIncompleto.cobertura.toFixed(1)}%)\n\n` +
    'Escreva os testes unitários necessários para cobrir os caminhos, condicionais e casos de erro que ainda ' +
    'não estão cobertos. Não infle a cobertura com testes triviais que não verificam comportamento real — ' +
    'cada teste novo deve validar uma regra de negócio de verdade. Foque só neste arquivo — não mexa em outros ' +
    'arquivos com cobertura incompleta agora, eles serão tratados em chamadas separadas.';
  return invocarClaude(prompt);
}

// ───────────────────── COBERTURA DE TESTES (Etapas 1 e 3) ───────────────

function ehModuloDeNegocio(caminhoArquivo) {
  const alvo = caminhoArquivo.replace(/\\/g, '/').toLowerCase();
  return CONFIG.modulosDeNegocio.some((padrao) => alvo.includes(padrao.toLowerCase()));
}

function encontrarArquivosCoverageSummary(dir = ROOT, encontrados = []) {
  let entradas;
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return encontrados;
  }
  for (const entrada of entradas) {
    if (entrada.name === 'node_modules' || entrada.name === '.git') continue;
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      encontrarArquivosCoverageSummary(caminho, encontrados);
    } else if (entrada.name === 'coverage-summary.json') {
      encontrados.push(caminho);
    }
  }
  return encontrados;
}

function lerResumoDeCobertura() {
  const arquivos = encontrarArquivosCoverageSummary();
  if (arquivos.length === 0) {
    log(
      'AVISO: nenhum coverage-summary.json encontrado no projeto. Verifique se CONFIG.comandoCobertura gera esse arquivo (reporter "json-summary" no Jest/Vitest/nyc).',
    );
    return null;
  }

  const porArquivo = {};
  for (const caminhoResumo of arquivos) {
    let dados;
    try {
      dados = JSON.parse(fs.readFileSync(caminhoResumo, 'utf-8'));
    } catch (e) {
      log(`AVISO: falha ao ler/parsear ${caminhoResumo}: ${e.message}`);
      continue;
    }
    for (const [arquivo, metricas] of Object.entries(dados)) {
      if (arquivo === 'total') continue;
      porArquivo[arquivo] = metricas;
    }
  }
  return porArquivo;
}

function rodarComandoCobertura() {
  const r = rodar(...CONFIG.comandoCobertura, { capturarSaida: true });
  return { ok: r.codigo === 0, saida: r.stderr || r.stdout };
}

function analisarCoberturaDeNegocio() {
  const porArquivo = lerResumoDeCobertura();
  if (!porArquivo) {
    return { ok: false, motivo: 'sem-dados', incompletos: [] };
  }

  const incompletos = [];
  for (const [arquivo, metricas] of Object.entries(porArquivo)) {
    if (!ehModuloDeNegocio(arquivo)) continue;
    const pcts = ['lines', 'statements', 'functions', 'branches']
      .map((chave) => metricas[chave]?.pct)
      .filter((v) => typeof v === 'number');
    const minimo = pcts.length ? Math.min(...pcts) : 0;
    if (minimo < CONFIG.coberturaMinimaModulosDeNegocio) {
      incompletos.push({ arquivo, cobertura: minimo });
    }
  }

  return { ok: incompletos.length === 0, motivo: null, incompletos };
}

// ─────────────────── ETAPA 2: EXECUTAR 1 ESPECIFICAÇÃO ──────────────────
// Só aplica/valida — NUNCA arquiva. Arquivamento é responsabilidade
// exclusiva de arquivarChangesConcluidas() (Etapa 4), e só roda depois da
// confirmação final (Etapa 3) ter passado.

function executarChange(changeName) {
  log(`\n— Especificação: ${changeName} —`);

  const estadoInicial = verificarSeJaEstaCompleta(changeName);
  if (estadoInicial.completa) {
    log(`ℹ️ "${changeName}" já está pronta (validate ok, testes ok, tasks completas) — nenhuma execução necessária.`);
    return { name: changeName, completa: true };
  }

  let erroAnterior = null;
  let falhasConsecutivasClaude = 0;

  for (let tentativa = 1; tentativa <= CONFIG.maxTentativasPorChange; tentativa++) {
    log(`Tentativa ${tentativa}/${CONFIG.maxTentativasPorChange} para "${changeName}"`);

    const resultadoClaude = aplicarComClaude(changeName, erroAnterior);
    falhasConsecutivasClaude = resultadoClaude.ok ? 0 : falhasConsecutivasClaude + 1;

    if (falhasConsecutivasClaude >= CONFIG.maxFalhasConsecutivasInvocacaoClaude) {
      log(
        `⚠️ Claude Code falhou ao ser invocado ${falhasConsecutivasClaude} vezes seguidas para "${changeName}". ` +
          `Verifique se o CLI está instalado, autenticado e se CONFIG.flagsClaude é válido para a versão instalada. Abortando esta especificação.`,
      );
      return { name: changeName, completa: false };
    }

    const resultado = verificarSeJaEstaCompleta(changeName);

    if (resultado.completa) {
      log(`✅ "${changeName}" validada, testada e com tasks completas.`);
      return { name: changeName, completa: true };
    }

    const novoErro = [
      !resultado.detalhes.validou ? `openspec validate falhou:\n${resultado.detalhes.erroValidate}` : null,
      !resultado.detalhes.testesPassaram ? `Testes falharam:\n${resultado.detalhes.erroTestes}` : null,
      !resultado.detalhes.tasksComplete ? 'tasks.md ainda não está 100% completo.' : null,
    ]
      .filter(Boolean)
      .join('\n');

    if (erroAnterior && erroAnterior === novoErro) {
      log(
        `⚠️ Mesmo erro se repetiu na tentativa anterior para "${changeName}" — sem progresso. Abortando esta especificação.`,
      );
      return { name: changeName, completa: false };
    }
    erroAnterior = novoErro;

    log(`❌ Tentativa ${tentativa} incompleta para "${changeName}". Repetindo com contexto do erro.`);
  }

  log(`⚠️ Esgotadas as tentativas para "${changeName}". Requer intervenção humana.`);
  return { name: changeName, completa: false };
}

// ───────────────────────── ETAPA 4: ARQUIVAMENTO ────────────────────────
// Só é chamada pelo main() quando a confirmação final (Etapa 3) passou —
// ver comentário no topo do arquivo sobre por que "arquivada" precisa
// significar "verificada de ponta a ponta, cobertura incluída".

function arquivarChangesConcluidas(resultadosExecucao) {
  logEtapa('Etapa 4: arquivar especificações concluídas');

  const prontas = resultadosExecucao.filter((r) => r.completa);
  const naoProntas = resultadosExecucao.filter((r) => !r.completa);

  if (naoProntas.length > 0) {
    log(
      `ℹ️ ${naoProntas.length} especificação(ões) permanecem pendentes e não serão arquivadas: ${naoProntas
        .map((r) => r.name)
        .join(', ')}`,
    );
  }

  if (prontas.length === 0) {
    log('Nenhuma especificação pronta para arquivar nesta execução.');
    return [];
  }

  const resumo = [];
  for (const r of prontas) {
    if (arquivar(r.name)) {
      log(`📦 "${r.name}" arquivada com sucesso.`);
      resumo.push({ name: r.name, arquivada: true });
    } else {
      log(`⚠️ Falha ao arquivar "${r.name}".`);
      resumo.push({ name: r.name, arquivada: false });
    }
  }
  return resumo;
}

// ──────────────────── ETAPAS 1/3: SAÚDE DE TESTES E COBERTURA ───────────

function garantirSuiteDeTestesPassando() {
  let erroAnterior = null;
  let falhasConsecutivasClaude = 0;

  for (let tentativa = 1; tentativa <= CONFIG.maxTentativasTestes; tentativa++) {
    const resultado = rodarTestes();
    if (resultado.ok) {
      log(`✅ Suíte de testes passando (tentativa ${tentativa}).`);
      return true;
    }

    log(`❌ Suíte de testes falhando (tentativa ${tentativa}/${CONFIG.maxTentativasTestes}).`);

    if (erroAnterior && erroAnterior === resultado.saida) {
      log('⚠️ Mesmo erro de teste se repetiu na tentativa anterior — sem progresso. Abortando fase de testes.');
      return false;
    }
    erroAnterior = resultado.saida;

    const resultadoClaude = corrigirTestesComClaude(resultado.saida);
    falhasConsecutivasClaude = resultadoClaude.ok ? 0 : falhasConsecutivasClaude + 1;

    if (falhasConsecutivasClaude >= CONFIG.maxFalhasConsecutivasInvocacaoClaude) {
      log(
        `⚠️ Claude Code falhou ao ser invocado ${falhasConsecutivasClaude} vezes seguidas. ` +
          'Verifique se o CLI está instalado, autenticado e se CONFIG.flagsClaude é válido para a versão instalada. Abortando fase de testes.',
      );
      return false;
    }
  }

  log('⚠️ Esgotadas as tentativas de corrigir a suíte de testes. Requer intervenção humana.');
  return false;
}

// Processa a cobertura de negócio UM ARQUIVO POR VEZ: mede, ataca só o pior
// arquivo incompleto, remede, loga o resultado, e só então passa pro
// próximo. Mandar a lista inteira de arquivos incompletos numa chamada só
// ao Claude deixava a execução opaca por até 20 minutos sem nenhum sinal de
// progresso — aqui cada correção é isolada e verificada individualmente.
function garantirCoberturaDosModulosDeNegocio() {
  let falhasConsecutivasClaude = 0;
  let arquivoAnterior = null;
  let tentativasArquivoAtual = 0;

  for (let ciclo = 1; ciclo <= CONFIG.maxCiclosCobertura; ciclo++) {
    rodarComandoCobertura();
    const analise = analisarCoberturaDeNegocio();

    if (analise.motivo === 'sem-dados') {
      log(
        '⚠️ Não foi possível ler dados de cobertura. Verifique CONFIG.comandoCobertura e o reporter "json-summary". Abortando fase de cobertura.',
      );
      return false;
    }

    if (analise.incompletos.length === 0) {
      log('✅ Todos os módulos de negócio estão com 100% de cobertura.');
      return true;
    }

    const ordenados = [...analise.incompletos].sort((a, b) => a.cobertura - b.cobertura);
    const alvo = ordenados[0];

    if (alvo.arquivo === arquivoAnterior) {
      tentativasArquivoAtual++;
    } else {
      arquivoAnterior = alvo.arquivo;
      tentativasArquivoAtual = 1;
    }

    log(
      `❌ ${analise.incompletos.length} arquivo(s) de módulos de negócio abaixo de ${CONFIG.coberturaMinimaModulosDeNegocio}%. ` +
        `Corrigindo agora (${tentativasArquivoAtual}/${CONFIG.maxTentativasPorArquivoCobertura}): ${alvo.arquivo} (${alvo.cobertura.toFixed(1)}%)`,
    );

    if (tentativasArquivoAtual > CONFIG.maxTentativasPorArquivoCobertura) {
      log(`⚠️ Esgotadas as tentativas para "${alvo.arquivo}" — sem progresso. Requer intervenção humana.`);
      return false;
    }

    const resultadoClaude = aumentarCoberturaComClaude(alvo);
    falhasConsecutivasClaude = resultadoClaude.ok ? 0 : falhasConsecutivasClaude + 1;

    if (falhasConsecutivasClaude >= CONFIG.maxFalhasConsecutivasInvocacaoClaude) {
      log(
        `⚠️ Claude Code falhou ao ser invocado ${falhasConsecutivasClaude} vezes seguidas. ` +
          'Verifique se o CLI está instalado, autenticado e se CONFIG.flagsClaude é válido para a versão instalada. Abortando fase de cobertura.',
      );
      return false;
    }

    // Escrever testes novos pode quebrar a suíte — garante que ela ainda passa
    // antes de medir cobertura de novo.
    const resultadoTestes = rodarTestes();
    if (!resultadoTestes.ok) {
      log('❌ A suíte quebrou depois da tentativa de aumentar cobertura. Corrigindo antes de medir de novo.');
      corrigirTestesComClaude(resultadoTestes.saida);
    } else {
      log(`✅ Suíte segue passando depois da correção em "${alvo.arquivo}". Remedindo cobertura...`);
    }
  }

  log(
    `⚠️ Atingido o teto de segurança de ${CONFIG.maxCiclosCobertura} ciclos sem concluir a cobertura de negócio. Requer intervenção humana.`,
  );
  return false;
}

function garantirSaudeDosTestes() {
  const suiteOk = garantirSuiteDeTestesPassando();
  if (!suiteOk) {
    log('Fase de cobertura não será executada enquanto a suíte estiver quebrada.');
    return false;
  }

  return garantirCoberturaDosModulosDeNegocio();
}

// ───────────────────────────────── DRY RUN ──────────────────────────────

function imprimirPlanoDryRun(changeName) {
  log(`\n[dry-run] Verificando estado atual de "${changeName}" (validate + testes + tasks completas)...`);
  const resultado = verificarSeJaEstaCompleta(changeName);

  if (resultado.completa) {
    log(`[dry-run] "${changeName}" JÁ ESTÁ COMPLETA (validate ok, testes ok, tasks completas).`);
    log(
      `  → ação prevista na Etapa 4: SÓ ARQUIVAR (se a confirmação final da Etapa 3 passar), sem chamar o Claude:  openspec archive ${changeName} --yes`,
    );
    return;
  }

  log(`[dry-run] "${changeName}" ainda NÃO está completa. Motivo(s):`);
  if (!resultado.detalhes.validou) log(`  - openspec validate falharia`);
  if (!resultado.detalhes.testesPassaram) log(`  - testes falhariam`);
  if (!resultado.detalhes.tasksComplete) log(`  - tasks.md incompleto`);

  log(`  → plano de execução previsto:`);
  log(`  1. invocaria Claude Code:  claude -p "/opsx:apply ${changeName}" ${CONFIG.flagsClaude.join(' ')}`);
  log(`  2. rodaria:                openspec validate ${changeName} --strict`);
  log(`  3. rodaria:                ${CONFIG.comandoTeste[0]} ${CONFIG.comandoTeste[1].join(' ')}`);
  log(`  4. checaria:               completedTasks === totalTasks (via openspec list --json)`);
  log(
    `  5. se 1-4 passarem:        marcada para arquivar na Etapa 4 (após a confirmação final da Etapa 3 passar)`,
  );
  log(`  6. se falhar:              repete com erro como contexto (até ${CONFIG.maxTentativasPorChange} tentativas)`);
}

function imprimirPlanoDryRunTestes() {
  const resultadoTestes = rodarTestes();
  if (resultadoTestes.ok) {
    log('[dry-run] Suíte de testes: PASSANDO atualmente. Nenhuma correção necessária.');
  } else {
    log('[dry-run] Suíte de testes: FALHANDO atualmente.');
    log(
      `  → ação prevista: invocar Claude Code com a saída do erro, até passar (máx. ${CONFIG.maxTentativasTestes} tentativas).`,
    );
    log('[dry-run] Cobertura não será avaliada enquanto a suíte estiver quebrada (mesma regra da execução real).');
    return;
  }

  rodarComandoCobertura();
  const analise = analisarCoberturaDeNegocio();

  if (analise.motivo === 'sem-dados') {
    log('[dry-run] Cobertura: não foi possível ler coverage-summary.json. Verifique CONFIG.comandoCobertura.');
    return;
  }

  if (analise.incompletos.length === 0) {
    log('[dry-run] Cobertura dos módulos de negócio: 100% — nenhuma ação necessária.');
    return;
  }

  log(
    `[dry-run] Cobertura dos módulos de negócio: ${analise.incompletos.length} arquivo(s) abaixo de ${CONFIG.coberturaMinimaModulosDeNegocio}%:`,
  );
  for (const item of analise.incompletos) {
    log(`   - ${item.arquivo}: ${item.cobertura.toFixed(1)}%`);
  }
  log(
    `  → ação prevista: corrigir um arquivo por vez, começando pelo de pior cobertura ` +
      `(máx. ${CONFIG.maxTentativasPorArquivoCobertura} tentativas por arquivo, remedindo cobertura a cada correção).`,
  );
}

// ───────────────────────────────── MAIN ─────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const onlyIdx = args.indexOf('--only');
  const apenasChange = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
  const pularFaseDeTestes = args.includes('--skip-tests-phase');
  const somenteFaseDeTestes = args.includes('--only-tests');

  verificarPreRequisitos();

  if (!dryRun) adquirirLock();

  try {
    log('=== Loop Engineering — OpenSpec + Testes/Cobertura iniciado ===');

    let baselineOk = true;

    // ── ETAPA 1 — Baseline: garantir testes passando + 100% de cobertura de
    // negócio ANTES de tocar em qualquer especificação. Se isso falhar,
    // abortamos antes da Etapa 2 — não faz sentido aplicar mudanças novas
    // em cima de uma base que já está quebrada, e assim, se algo falhar
    // depois, temos certeza de que foi a mudança nova, não dívida técnica
    // pré-existente.
    if (!pularFaseDeTestes && !somenteFaseDeTestes) {
      logEtapa('Etapa 1: baseline — testes + cobertura ANTES das especificações');
      if (dryRun) {
        imprimirPlanoDryRunTestes();
      } else {
        baselineOk = garantirSaudeDosTestes();
        if (!baselineOk) {
          log('⚠️ Baseline não atingida (testes falhando ou cobertura de negócio incompleta).');
          log(
            'Abortando ANTES de executar qualquer especificação, para não misturar dívida técnica pré-existente com o trabalho novo.',
          );
          return;
        }
        log('✅ Baseline confirmada: testes passando e cobertura de negócio em 100%.');
      }
    }

    let resultadosExecucao = [];

    // ── ETAPA 2 — Executar especificações do OpenSpec (só roda se a
    // baseline estiver ok, ou se a checagem de baseline nem tiver rodado
    // por causa de --skip-tests-phase).
    if (!somenteFaseDeTestes && baselineOk) {
      let pendentes = listarChangesPendentes();
      if (apenasChange) {
        pendentes = pendentes.filter((c) => c.name === apenasChange);
      }

      logEtapa('Etapa 2: executar especificações pendentes');

      if (pendentes.length === 0) {
        log('Nenhuma especificação pendente encontrada (ou não reconhecida — veja avisos acima).');
      } else {
        const nomes = pendentes.map((c) => c.name);
        log(`Especificações pendentes (${nomes.length}): ${nomes.join(', ')}`);

        if (dryRun) {
          for (const change of pendentes) {
            imprimirPlanoDryRun(change.name);
          }
        } else {
          for (const change of pendentes) {
            const resultado = executarChange(change.name);
            resultadosExecucao.push(resultado);

            if (!resultado.completa && CONFIG.pararNaPrimeiraChangeComFalha) {
              log('Configurado para parar na primeira falha. Encerrando a Etapa 2.');
              break;
            }
          }
          log('\n--- Resumo da Etapa 2 (execução) ---');
          for (const r of resultadosExecucao) {
            log(`${r.completa ? '✅' : '⚠️'} ${r.name}`);
          }
        }
      }
    }

    // ── ETAPA 3 — Confirmação final: reconfirma testes + cobertura DEPOIS
    // das mudanças, já que a Etapa 2 pode ter introduzido código de negócio
    // novo que ainda não foi auditado pela Etapa 1 (a checagem "completa"
    // por especificação, na Etapa 2, não confere cobertura). Em
    // --only-tests, isso é a única etapa que roda; em --dry-run, não
    // repetimos (o plano já foi mostrado na Etapa 1, e nada foi de fato
    // alterado). Se --skip-tests-phase foi usado, esta etapa não roda e o
    // arquivamento (Etapa 4) segue sem esse gate, baseado só na conclusão
    // individual de cada especificação — o usuário optou explicitamente
    // por pular as checagens de teste/cobertura.
    let confirmacaoOk = true;
    const rodarConfirmacaoFinal = !pularFaseDeTestes && !dryRun && !somenteFaseDeTestes && baselineOk;

    if (!pularFaseDeTestes && !dryRun && somenteFaseDeTestes) {
      const ok = garantirSaudeDosTestes();
      log('\n=== Resumo (--only-tests) ===');
      log(ok ? '✅ Testes passando e cobertura de negócio em 100%.' : '⚠️ Incompleto — veja o log acima.');
    } else if (rodarConfirmacaoFinal) {
      logEtapa('Etapa 3: confirmação final — testes + cobertura DEPOIS das especificações');
      confirmacaoOk = garantirSaudeDosTestes();
      log('\n--- Resumo da Etapa 3 ---');
      log(
        confirmacaoOk
          ? '✅ Testes passando e cobertura de negócio em 100% após as especificações.'
          : '⚠️ Etapa 3 incompleta — veja o log acima.',
      );
    }

    // ── ETAPA 4 — Arquivamento: só roda de fato (não dry-run, não
    // --only-tests) e só se alguma especificação foi processada na Etapa 2.
    // Se a Etapa 3 rodou e falhou, NADA é arquivado aqui — "arquivada" só
    // deve significar "verificada de ponta a ponta, cobertura incluída".
    if (!somenteFaseDeTestes && baselineOk && !dryRun && resultadosExecucao.length > 0) {
      if (!confirmacaoOk) {
        log(
          '\n⚠️ Arquivamento adiado: a confirmação final (Etapa 3) falhou. As especificações executadas ' +
            'permanecem pendentes para uma próxima execução do loop, após correção manual.',
        );
      } else {
        const resumoArquivamento = arquivarChangesConcluidas(resultadosExecucao);
        log('\n--- Resumo da Etapa 4 (arquivamento) ---');
        if (resumoArquivamento.length === 0) {
          log('Nada foi arquivado nesta execução.');
        } else {
          for (const r of resumoArquivamento) {
            log(`${r.arquivada ? '📦' : '⚠️'} ${r.name}`);
          }
        }
      }
    }
  } finally {
    if (!dryRun) liberarLock();
  }
}

main();
