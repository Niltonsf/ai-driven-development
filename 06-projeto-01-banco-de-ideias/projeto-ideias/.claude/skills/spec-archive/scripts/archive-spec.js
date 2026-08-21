#!/usr/bin/env node

// Arquiva uma especificacao concluida: move a pasta da spec de
// `<specs-root>/changes/<NNN-slug>` para `<specs-root>/archive/<timestamp>-slug`,
// substituindo o numero sequencial inicial pelo timestamp do arquivamento.
//
// O script NUNCA altera o conteudo de nenhum arquivo da spec. Ele apenas
// inspeciona evidencias de execucao e move a pasta inteira.
//
// Modos:
//   (sem --apply)  inspecao: imprime JSON com destino previsto e analise de
//                  evidencias. Nao move nada.
//   --apply        executa o arquivamento. Se a spec nao tiver evidencia de
//                  execucao e --force nao for passado, retorna
//                  status "needs_confirmation" e NAO move (a confirmacao do
//                  usuario e responsabilidade de quem chama a skill).
//   --force        autoriza arquivar uma spec sem evidencia (usar apenas
//                  apos confirmacao explicita do usuario).
//
// Flags:
//   --spec <nome-ou-path>   (obrigatorio) nome da pasta da spec (ex.:
//                           006-carregar-tipos-padrao) ou caminho ate a pasta
//                           / ate o spec.md.
//   --specs-root <path>     raiz das specs (default: .specs)
//   --timestamp <YYYYMMDDHHMMSS>  sobrescreve o timestamp (uso em testes /
//                           para arquivamentos deterministicos)
//   --apply --force         ver acima

const fs = require("node:fs");
const path = require("node:path");

function parseArgs(argv) {
  const args = { apply: false, force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") args.apply = true;
    else if (a === "--force") args.force = true;
    else if (a === "--spec") args.spec = argv[++i];
    else if (a === "--specs-root") args.specsRoot = argv[++i];
    else if (a === "--timestamp") args.timestamp = argv[++i];
    else {
      fail(`Argumento desconhecido: ${a}`);
    }
  }
  return args;
}

function fail(reason) {
  process.stdout.write(
    JSON.stringify({ status: "error", reason }, null, 2) + "\n",
  );
  process.exit(1);
}

function buildTimestamp(override) {
  if (override) {
    if (!/^\d{14}$/.test(override)) {
      fail(`--timestamp deve ter o formato YYYYMMDDHHMMSS (recebido: ${override})`);
    }
    return override;
  }
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return (
    `${d.getFullYear()}` +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

// Substitui apenas o numero sequencial inicial pelo timestamp.
// 006-carregar-tipos-padrao  -> <ts>-carregar-tipos-padrao
// 12_minha-spec              -> <ts>_minha-spec
// 042                        -> <ts>
// sem-numero                 -> <ts>-sem-numero
function rename(oldName, ts) {
  const m = oldName.match(/^(\d+)(.*)$/);
  if (m) return ts + m[2];
  return `${ts}-${oldName}`;
}

function resolveSource(specArg, specsRoot) {
  if (!specArg) fail("--spec e obrigatorio");

  const candidates = [];
  if (specArg.includes("/") || specArg.includes(path.sep)) {
    candidates.push(path.resolve(specArg));
  }
  candidates.push(path.resolve(specsRoot, "changes", specArg));
  candidates.push(path.resolve(specArg));

  for (let c of candidates) {
    if (!fs.existsSync(c)) continue;
    const st = fs.statSync(c);
    // Se apontaram para o spec.md (ou qualquer arquivo), normaliza para a pasta.
    if (st.isFile()) c = path.dirname(c);
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return c;
  }
  fail(
    `Spec nao encontrada. Procurei por "${specArg}" em ${path.resolve(specsRoot, "changes")} e nos caminhos informados.`,
  );
}

function analyzeEvidence(sourceDir) {
  const specFile = path.join(sourceDir, "spec.md");
  if (!fs.existsSync(specFile)) {
    return { specFileFound: false, checkedTasks: 0, uncheckedTasks: 0, evidenceLines: 0, hasEvidence: false, complete: false };
  }
  const lines = fs.readFileSync(specFile, "utf8").split(/\r?\n/);
  let checked = 0;
  let unchecked = 0;
  let evidence = 0;
  for (const line of lines) {
    if (/^\s*[-*]\s*\[[xX]\]/.test(line)) checked++;
    else if (/^\s*[-*]\s*\[ \]/.test(line)) unchecked++;
    if (/✅/.test(line)) evidence++;
  }
  const hasEvidence = checked > 0 || evidence > 0;
  const complete = (checked > 0 || evidence > 0) && unchecked === 0;
  return {
    specFileFound: true,
    checkedTasks: checked,
    uncheckedTasks: unchecked,
    evidenceLines: evidence,
    hasEvidence,
    complete,
  };
}

function moveDir(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try {
    fs.renameSync(from, to);
  } catch (err) {
    if (err.code === "EXDEV") {
      // Volumes diferentes: copia recursiva (conteudo identico) e remove origem.
      fs.cpSync(from, to, { recursive: true });
      fs.rmSync(from, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  const specsRoot = args.specsRoot || ".specs";
  const ts = buildTimestamp(args.timestamp);

  const sourceDir = resolveSource(args.spec, specsRoot);
  const oldName = path.basename(sourceDir);
  const newName = rename(oldName, ts);
  const archiveRoot = path.resolve(specsRoot, "archive");
  const destDir = path.join(archiveRoot, newName);

  const evidence = analyzeEvidence(sourceDir);

  const base = {
    sourceName: oldName,
    sourceDir,
    destName: newName,
    destDir,
    timestamp: ts,
    evidence,
  };

  if (!args.apply) {
    process.stdout.write(
      JSON.stringify({ status: "inspect", ...base }, null, 2) + "\n",
    );
    return;
  }

  if (fs.existsSync(destDir)) {
    process.stdout.write(
      JSON.stringify(
        { status: "error", reason: "destination_exists", ...base },
        null,
        2,
      ) + "\n",
    );
    process.exit(3);
  }

  if (!evidence.hasEvidence && !args.force) {
    process.stdout.write(
      JSON.stringify(
        {
          status: "needs_confirmation",
          message:
            "Esta spec nao possui evidencia de execucao (nenhuma task marcada [x] e nenhuma linha de evidencia ✅). Confirme com o usuario antes de arquivar e reexecute com --force.",
          ...base,
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(2);
  }

  moveDir(sourceDir, destDir);

  process.stdout.write(
    JSON.stringify(
      { status: "archived", from: sourceDir, to: destDir, ...base },
      null,
      2,
    ) + "\n",
  );
}

main();
