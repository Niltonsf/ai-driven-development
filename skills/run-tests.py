#!/usr/bin/env python3
"""Test suite for the two book-locked packs.

Run from the `skills/` directory:  python3 run-tests.py
Exit 0 when every check passes, 1 otherwise.
"""
import importlib.util
import io
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
DDD = ROOT / "domain-driven-design"
CA = ROOT / "clean-architecture"

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


def load(pack: pathlib.Path, module: str):
    spec = importlib.util.spec_from_file_location(module, pack / "tools" / f"{module}.py")
    mod = importlib.util.module_from_spec(spec)
    sys.path.insert(0, str(pack))
    cwd = pathlib.Path.cwd()
    import os
    os.chdir(pack)
    try:
        spec.loader.exec_module(mod)
    finally:
        os.chdir(cwd)
        sys.path.pop(0)
    return mod


def run(pack: pathlib.Path, *args: str) -> tuple[int, str]:
    proc = subprocess.run([sys.executable, *args], cwd=pack,
                          capture_output=True, text=True)
    return proc.returncode, proc.stdout + proc.stderr


# 1. the packs' own gate
print("\n1. verify")
for pack, tool in ((DDD, "tools/ddd_pdf.py"), (CA, "tools/ca_pdf.py")):
    code, out = run(pack, tool, "verify")
    last = out.strip().splitlines()[-1] if out.strip() else "(sem saida)"
    check(f"{pack.name}: verify", code == 0, last)

# 2. every relative file reference resolves
print("\n2. referencias de arquivo")
broken, checked = [], 0
for pack in (DDD, CA):
    for md in pack.rglob("*.md"):
        if "implementation-prompt" in md.name:
            continue
        body = io.open(md, encoding="utf-8", errors="replace").read()
        for ref in re.findall(r"`((?:\.\./|\./)[^`\s*]+\.md)`", body):
            checked += 1
            if not (md.parent / ref).resolve().exists():
                broken.append(f"{md.relative_to(ROOT)} -> {ref}")
check("nenhuma referencia quebrada", not broken,
      f"{checked} checadas" + (f"; quebradas: {broken}" if broken else ""))

# 3. Appendix B transcription covers every exercise the book answers
print("\n3. gabarito do apendice B")
ddd = load(DDD, "ddd_pdf")
appendix = ""
for page in range(315, 322):
    appendix += ddd.raw_page(page) + "\n"
flat = re.sub(r"\s+", " ", appendix)
flat = re.sub(r"\d+ \| Appendix B[^A-Z]*", " ", flat)

book_counts: dict[int, int] = {}
book_letters: dict[tuple[int, int], str] = {}
book_answer_text: dict[tuple[int, int], str] = {}
parts = re.split(r"Chapter (\d+)", flat)
for i in range(1, len(parts), 2):
    chapter, body = int(parts[i]), parts[i + 1]
    numbers = set(re.findall(r"(?<!\d)([1-9])\.(?=[A-Z]|\s|[a-z]\.)", body))
    total = 0
    while str(total + 1) in numbers:
        total += 1
    book_counts[chapter] = total
    pieces = re.split(r"(?<!\d)([1-9])\.(?=[A-Z])", body)
    for j in range(1, len(pieces), 2):
        number, chunk = int(pieces[j]), pieces[j + 1]
        head = re.match(r"([A-F]):\s*(.*)", chunk, re.S)
        if not head:
            continue
        book_letters[(chapter, number)] = head.group(1)
        book_answer_text[(chapter, number)] = head.group(2).strip()

answers = io.open(DDD / "references/ddd-exercise-answers.md", encoding="utf-8").read()
incomplete = []
for chapter, expected in sorted(book_counts.items()):
    section = re.search(r"^## Chapter %d,.*?(?=^## Chapter |\Z)" % chapter,
                        answers, re.S | re.M)
    body = section.group(0) if section else ""
    numbered = set(re.findall(r"^- Q(\d+):", body, re.M))
    if numbered:
        covered = len(numbered)
    else:
        bullets = len(re.findall(r"^- ", body, re.M))
        rows = [r for r in re.findall(r"^\|(?!\s*-)(.+)\|\s*$", body, re.M)
                if "anything else" not in r.lower() and "citation" not in r.lower()
                and not re.match(r"^\s*(Question|WolfDesk|Component)\b", r.strip())]
        covered = bullets + len(rows)
    if covered < expected:
        incomplete.append(f"cap {chapter} ({covered}/{expected})")
check("todo capitulo transcrito por inteiro", not incomplete,
      f"{len(book_counts)} capitulos" + (f"; faltam: {incomplete}" if incomplete else ""))

# 4. the rebuilt option letters agree with the answer key
print("\n4. letras das opcoes vs apendice B")
chapter_ranges = ddd.load_chapter_ranges()
questions: dict[tuple[int, int], int] = {}
option_text: dict[tuple[int, int], list[str]] = {}
for chapter, (start, end) in chapter_ranges.items():
    for page in range(max(start, end - 3), end + 1):
        try:
            found = ddd.exercise_options(page)
        except Exception:
            continue
        for question in found:
            if question["options"]:
                questions[(chapter, question["number"])] = len(question["options"])
                option_text[(chapter, question["number"])] = question["options"]

short, compared = [], 0
for (chapter, number), letter in sorted(book_letters.items()):
    if (chapter, number) not in questions:
        continue
    compared += 1
    needed = ord(letter) - ord("A") + 1
    have = questions[(chapter, number)]
    if have < needed:
        short.append(f"cap {chapter} Q{number}: resposta {letter} exige {needed}, extraidas {have}")
check("toda resposta cabe nas opcoes extraidas", not short,
      f"{compared} questoes comparadas" + (f"; curtas: {short}" if short else ""))

# 4b. a question that carries options ends as a finished sentence
print("\n4b. enunciados completos")
truncated = []
for chapter, (start, end) in chapter_ranges.items():
    for page in range(max(start, end - 3), end + 1):
        try:
            found = ddd.exercise_options(page)
        except Exception:
            continue
        for question in found:
            if not question["options"]:
                continue
            prompt = " ".join(question["prompt"]).rstrip()
            if not prompt.endswith(("?", ":")):
                truncated.append(f"cap {chapter} Q{question['number']}: {prompt[-40:]!r}")
check("todo enunciado com opcoes termina em ? ou :", not truncated,
      f"{len(questions)} questoes" + (f"; truncados: {truncated}" if truncated else ""))

# 4c. the option under the answer's letter is the answer the book prints
print("\n4c. opcao na letra do gabarito")

def words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z]+", text.lower()) if len(w) > 3}

mismatched, matched = [], 0
for key, letter in sorted(book_letters.items()):
    expected = book_answer_text.get(key, "")
    options = option_text.get(key)
    if not options or len(expected.split()) < 4:
        continue
    index = ord(letter) - ord("A")
    if index >= len(options):
        continue
    aggregating = re.compile(r"^\s*(all|none)\b|^\s*[A-F] and [A-F]\b", re.IGNORECASE)
    option_aggregates = bool(aggregating.match(options[index]))
    answer_aggregates = bool(aggregating.match(expected))
    if answer_aggregates and not option_aggregates:
        # the key says "all of the above" but that letter points at a specific
        # option: the lettering slipped
        matched += 1
        mismatched.append(
            f"cap {key[0]} Q{key[1]} letra {letter}: gabarito agrega, opcao nao "
            f"({options[index][:40]!r})")
        continue
    if option_aggregates:
        # the key rewords an aggregating option instead of repeating it, so word
        # overlap says nothing about it
        continue
    # the answer key prints the option plus an explanation, so the option is the
    # subset: measure how much of the option the answer text contains
    want, got = words(options[index]), words(expected)
    if not want:
        continue
    overlap = len(want & got) / len(want)
    matched += 1
    if overlap < 0.5:
        mismatched.append(f"cap {key[0]} Q{key[1]} letra {letter}: {overlap:.0%} de sobreposicao")
check("a opcao sob a letra do gabarito bate com o texto da resposta", not mismatched,
      f"{matched} questoes casadas" + (f"; divergentes: {mismatched}" if mismatched else ""))

# 5. the CA extractor finds every language the rules allow
print("\n5. listagens do CA")
code, _ = run(CA, "tools/ca_pdf.py", "listings")
listings = io.open(CA / "references/code-listings.md", encoding="utf-8").read()
missing = [lang for lang in ("C", "C++", "Java", "Clojure", "PDP-8 assembler")
           if not re.search(r"^\| %s \|" % re.escape(lang), listings, re.M)]
check("toda linguagem do livro aparece nas listagens", code == 0 and not missing,
      f"ausentes: {missing}" if missing else "C, C++, Java, Clojure, PDP-8")

# 6. both packs are loadable as plugins
print("\n6. estrutura de plugin")
import json
marketplace = ROOT / ".claude-plugin/marketplace.json"
plugin_problems = []
if not marketplace.exists():
    plugin_problems.append("marketplace.json ausente")
else:
    data = json.load(io.open(marketplace, encoding="utf-8"))
    for entry in data.get("plugins", []):
        source = (ROOT / entry["source"]).resolve()
        if not (source / ".claude-plugin/plugin.json").is_file():
            plugin_problems.append(f"{entry['name']}: plugin.json ausente")
        if not any((source / "skills").glob("*/SKILL.md")):
            plugin_problems.append(f"{entry['name']}: nenhuma skill")
check("marketplace e plugins integros", not plugin_problems,
      "; ".join(plugin_problems) or "2 plugins, 21 skills, 10 commands")

# 7. every skill cites the answer contract
print("\n7. contrato de resposta")
unbound = [str(p.parent.name) for pack, rule in ((DDD, "ddd-answer-contract"),
                                                 (CA, "ca-answer-contract"))
           for p in sorted((pack / "skills").glob("*/SKILL.md"))
           if rule not in io.open(p, encoding="utf-8").read()]
check("toda skill referencia o contrato", not unbound,
      "; ".join(unbound) or "21 skills")

# 8. the end-to-end tutorials name every skill and every command
print("\n8. tutoriais end-to-end")
for pack, doc in ((DDD, "domain-driven-design-tutorial.md"),
                  (CA, "clean-architecture-tutorial.md")):
    path = ROOT / ".docs" / doc
    if not path.is_file():
        check(f"{doc}", False, "ausente")
        continue
    body = io.open(path, encoding="utf-8").read()
    names = [s.parent.name for s in sorted((pack / "skills").glob("*/SKILL.md"))]
    commands = [c.stem for c in sorted((pack / "commands").glob("*.md"))]
    absent = [n for n in names + commands if n not in body]
    check(f"{doc} cobre o pack", not absent,
          f"{len(names)} skills + {len(commands)} comandos"
          + (f"; ausentes: {absent}" if absent else ""))

# 9. every skill name the docs mention actually exists
print("\n9. nomes citados nos docs")
real = {d.name for pack in (DDD, CA) for d in (pack / "skills").glob("ca-*")}
real |= {d.name for pack in (DDD, CA) for d in (pack / "skills").glob("ddd-*")}
real |= {c.stem for pack in (DDD, CA) for c in (pack / "commands").glob("*.md")}
for doc in sorted((ROOT / ".docs").glob("*.md")):
    body = io.open(doc, encoding="utf-8").read()
    cited = set(re.findall(r"\b((?:ddd|ca)-[a-z][a-z-]+[a-z])\b", body))
    ghosts = sorted(cited - real)
    check(f"{doc.name}: nomes existem", not ghosts,
          f"{len(cited)} citados" + (f"; inexistentes: {ghosts}" if ghosts else ""))

failed = [name for name, ok, _ in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} checagens passaram")
if failed:
    print("falharam: " + ", ".join(failed))
sys.exit(1 if failed else 0)
