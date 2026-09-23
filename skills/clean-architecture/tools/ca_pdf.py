#!/usr/bin/env python3
"""ca_pdf.py - extraction and citation verification for Clean Architecture.

Source of truth:
    clean-architecture-a-craftsmans-guide-to-software-structure-and-design.pdf
    Robert C. Martin, Clean Architecture, Pearson, 2018. 364 PDF pages.

Subcommands:
    index      rebuild references/page-index.md from the PDF
    listings   rebuild references/code-listings.md from the PDF
    pages      dump extracted text for a page or page range
    search     regex search across the PDF, printing PDF page numbers
    verify     validate every [CA ...] citation under clean-architecture/

All page numbers are 1-based PDF pages, as a PDF viewer shows them.
Printed book page numbers are never used.
"""

from __future__ import annotations

import argparse
import re
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", category=DeprecationWarning)
try:  # pragma: no cover - import guard
    from cryptography.utils import CryptographyDeprecationWarning

    warnings.filterwarnings("ignore", category=CryptographyDeprecationWarning)
except Exception:  # pragma: no cover - cryptography may be absent
    warnings.filterwarnings("ignore", message=".*ARC4.*")

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - dependency guard
    sys.exit("ca_pdf.py requires pypdf (python3 -m pip install pypdf)")

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "clean-architecture-a-craftsmans-guide-to-software-structure-and-design.pdf"
INDEX_PATH = ROOT / "references" / "page-index.md"
LISTINGS_PATH = ROOT / "references" / "code-listings.md"
DETERMINISM_PATH = ROOT / "rules" / "ca-determinism.md"

# The implementation spec quotes the banned phrases as data, so it is not a
# deliverable of the scan. Everything else under clean-architecture/ is.
EXCLUDED_FILES = {"2026-09-21-ca-skills-implementation-prompt.md"}

CANONICAL_CHAPTERS = [
    ("I", 1, "What Is Design and Architecture?"),
    ("I", 2, "A Tale of Two Values"),
    ("II", 3, "Paradigm Overview"),
    ("II", 4, "Structured Programming"),
    ("II", 5, "Object-Oriented Programming"),
    ("II", 6, "Functional Programming"),
    ("III", 7, "SRP: The Single Responsibility Principle"),
    ("III", 8, "OCP: The Open-Closed Principle"),
    ("III", 9, "LSP: The Liskov Substitution Principle"),
    ("III", 10, "ISP: The Interface Segregation Principle"),
    ("III", 11, "DIP: The Dependency Inversion Principle"),
    ("IV", 12, "Components"),
    ("IV", 13, "Component Cohesion"),
    ("IV", 14, "Component Coupling"),
    ("V", 15, "What Is Architecture?"),
    ("V", 16, "Independence"),
    ("V", 17, "Boundaries: Drawing Lines"),
    ("V", 18, "Boundary Anatomy"),
    ("V", 19, "Policy and Level"),
    ("V", 20, "Business Rules"),
    ("V", 21, "Screaming Architecture"),
    ("V", 22, "The Clean Architecture"),
    ("V", 23, "Presenters and Humble Objects"),
    ("V", 24, "Partial Boundaries"),
    ("V", 25, "Layers and Boundaries"),
    ("V", 26, "The Main Component"),
    ("V", 27, "Services: Great and Small"),
    ("V", 28, "The Test Boundary"),
    ("V", 29, "Clean Embedded Architecture"),
    ("VI", 30, "The Database Is a Detail"),
    ("VI", 31, "The Web Is a Detail"),
    ("VI", 32, "Frameworks Are Details"),
    ("VI", 33, "Case Study: Video Sales"),
    ("VI", 34, "The Missing Chapter"),
]

ROMAN = ("I", "II", "III", "IV", "V", "VI", "VII")

CITATION_RE = re.compile(r"\[CA ch\.(\d{1,2}) (p{1,2})\.(\d{1,3})(?:-(\d{1,3}))?\]")
MALFORMED_CITATION_RE = re.compile(r"\[CA[^\]]*\]")

# Words with no discriminating power for the term check: English function words
# plus the structural vocabulary of the skill templates themselves.
STOPWORDS = {
    "about", "above", "after", "again", "against", "also", "always", "among",
    "another", "anything", "around", "because", "been", "before", "being",
    "below", "between", "both", "cannot", "does", "doing", "done", "down",
    "during", "each", "either", "else", "even", "ever", "every", "from",
    "have", "having", "here", "how", "however", "into", "itself", "just",
    "like", "made", "make", "makes", "many", "more", "most", "much", "must",
    "neither", "never", "next", "none", "only", "onto", "other", "others",
    "over", "same", "shall", "since", "some", "such", "than", "that", "their",
    "them", "then", "there", "these", "they", "this", "those", "through",
    "thus", "under", "until", "upon", "very", "what", "when", "where",
    "whether", "which", "while", "will", "with", "within", "without", "would",
    "your",
    # Template and protocol vocabulary, not book content.
    "book", "scope", "cite", "cites", "cited", "citation", "citations",
    "chapter", "chapters", "page", "pages", "skill", "skills", "rule",
    "rules", "step", "steps", "halt", "halts", "output", "outputs",
    "template", "templates", "reference", "references", "section",
    "sections", "procedure", "condition", "conditions", "action", "actions",
    "table", "emit", "emits", "report", "reports", "state", "states",
    "answer", "answers", "reader", "note", "notes", "list", "lists", "item",
    "items", "name", "names", "named", "read", "reads", "write", "writes",
    "written", "record", "records", "check", "checks", "verify", "verifies",
    "found", "find", "finds", "given", "says", "said", "call", "calls",
    "ask", "asks", "asked", "request", "requested", "requests",
}

TERM_COVERAGE_THRESHOLD = 0.6

REQUIRED_SKILL_SECTIONS = [
    "Source",
    "Rules",
    "Procedure",
    "Halt conditions",
    "Output template",
    "References",
]

FORBIDDEN_FENCE = "ca-forbidden"


# --------------------------------------------------------------------------
# PDF access
# --------------------------------------------------------------------------

_reader: PdfReader | None = None
_page_cache: dict[int, str] = {}


def reader() -> PdfReader:
    global _reader
    if _reader is None:
        if not PDF_PATH.exists():
            sys.exit(f"PDF not found: {PDF_PATH}")
        _reader = PdfReader(str(PDF_PATH))
    return _reader


def page_count() -> int:
    return len(reader().pages)


def raw_page(number: int) -> str:
    if number not in _page_cache:
        if number < 1 or number > page_count():
            raise ValueError(f"page {number} is outside 1-{page_count()}")
        _page_cache[number] = reader().pages[number - 1].extract_text() or ""
    return _page_cache[number]


def fix_small_caps(text: str) -> str:
    """Rejoin the small-capital artifact: `T HE C LEAN` -> `THE CLEAN`."""
    for _ in range(4):
        text = re.sub(r"(?<![A-Za-z])([A-Z]) ([A-Z]{2,})", r"\1\2", text)
    return text


def norm_page(number: int) -> str:
    text = raw_page(number).replace("­", "")
    text = re.sub(r"-\n(?=[a-z])", "-", text)
    text = re.sub(r"\s+", " ", text)
    return fix_small_caps(text).strip()


def squash(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())


def words_of(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


# --------------------------------------------------------------------------
# index
# --------------------------------------------------------------------------


def detect_chapter_starts() -> dict[int, int]:
    """Map chapter number -> first PDF page, verified against CANONICAL_CHAPTERS."""
    starts: dict[int, int] = {}
    expected = {number: squash(title) for _, number, title in CANONICAL_CHAPTERS}
    for number in range(1, page_count() + 1):
        head = norm_page(number)[:120]
        match = re.match(r"^(\d{1,2})\s+([A-Z][A-Z].*)$", head)
        if not match:
            continue
        chapter = int(match.group(1))
        if chapter not in expected or chapter in starts:
            continue
        if expected[chapter] in squash(head):
            starts[chapter] = number
    return starts


def detect_part_starts() -> dict[str, int]:
    """Map part roman numeral -> divider page."""
    parts: dict[str, int] = {}
    for number in range(1, page_count() + 1):
        for line in raw_page(number).splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            if stripped in ROMAN and stripped not in parts:
                parts[stripped] = number
            break
    return parts


def build_index() -> tuple[list[tuple[str, int, str, int, int]], dict[str, int]]:
    starts = detect_chapter_starts()
    missing = [n for _, n, _ in CANONICAL_CHAPTERS if n not in starts]
    if missing:
        sys.exit(f"chapter start not detected for: {missing}")
    parts = detect_part_starts()
    boundaries = sorted(set(starts.values()) | set(parts.values()) | {page_count() + 1})

    rows: list[tuple[str, int, str, int, int]] = []
    for part, number, title in CANONICAL_CHAPTERS:
        start = starts[number]
        end = next(b for b in boundaries if b > start) - 1
        rows.append((part, number, title, start, end))
    return rows, parts


def cmd_index(_args: argparse.Namespace) -> int:
    rows, parts = build_index()
    lines = [
        "# CA page index",
        "",
        "Generated by `python3 tools/ca_pdf.py index`. Do not edit by hand.",
        "",
        f"Source PDF: `{PDF_PATH.name}` - {page_count()} pages.",
        "",
        "Page numbers are 1-based PDF pages, as a PDF viewer shows them. The",
        "printed book page numbers are different and are never used in a citation.",
        "",
        "Chapter starts are detected from the PDF text. A chapter ends on the page",
        "before the next chapter start or the next part divider, whichever comes first.",
        "",
        "## Chapters",
        "",
        "| Part | Ch | Title | PDF pages |",
        "|---|---|---|---|",
    ]
    for part, number, title, start, end in rows:
        lines.append(f"| {part} | {number} | {title} | {start}-{end} |")

    lines += ["", "## Part dividers", "", "| Part | PDF page |", "|---|---|"]
    for part in ROMAN:
        if part in parts:
            lines.append(f"| {part} | {parts[part]} |")

    front = min(start for _, _, _, start, _ in rows)
    last_chapter_end = max(end for _, _, _, _, end in rows)
    lines += [
        "",
        "## Non-chapter material",
        "",
        "| Material | PDF pages |",
        "|---|---|",
        f"| Front matter | 1-{front - 1} |",
        f"| Appendix A: Architecture Archaeology | {parts['VII'] + 1}-{_index_start() - 1} |",
        f"| Index | {_index_start()}-{page_count()} |",
        "",
        f"No citation may point outside 1-{last_chapter_end}: the appendix and the",
        "book index are not normative material for these skills.",
        "",
    ]
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {INDEX_PATH.relative_to(ROOT)} ({len(rows)} chapters)")
    return 0


def _index_start() -> int:
    for number in range(page_count(), 1, -1):
        if norm_page(number)[:6].upper().startswith("INDEX"):
            return number
    return page_count()


def load_index() -> list[tuple[str, int, str, int, int]]:
    if not INDEX_PATH.exists():
        sys.exit("references/page-index.md is missing; run: python3 tools/ca_pdf.py index")
    rows: list[tuple[str, int, str, int, int]] = []
    row_re = re.compile(r"^\|\s*([IVX]+)\s*\|\s*(\d{1,2})\s*\|\s*(.+?)\s*\|\s*(\d{1,3})-(\d{1,3})\s*\|$")
    for line in INDEX_PATH.read_text(encoding="utf-8").splitlines():
        match = row_re.match(line.strip())
        if match:
            rows.append(
                (match.group(1), int(match.group(2)), match.group(3), int(match.group(4)), int(match.group(5)))
            )
    if len(rows) != len(CANONICAL_CHAPTERS):
        sys.exit(f"page-index.md lists {len(rows)} chapters, expected {len(CANONICAL_CHAPTERS)}")
    return rows


# --------------------------------------------------------------------------
# listings
# --------------------------------------------------------------------------

CODE_IMAGE_MARKER = "Click here to view code image"

CODE_MARKERS = re.compile(
    r"(^\s*(#include|#define|#ifdef|#ifndef|#endif|public\s|private\s|protected\s|static\s|void\s|int\s|char\s|double\s|float\s|struct\s|typedef\s|class\s|interface\s|enum\s|import\s|package\s|return\b|if\s*\(|for\s*\(|while\s*\(|switch\s|case\s|else\b|function\s|def\s|end\s*$|assert\(|\(def\s|\(swap!)"
    r"|[;{}]\s*$"
    r"|^\s*[}{]"
    r"|\bstd::|\bSystem\.out|\bprintf\(|\@Override"
    r"|^\s*[A-Z][A-Z0-9]{1,5},?\s+[A-Z]{3}\b"
    r"|^\s*(TAD|JMS|DCA|ISZ|JMP|CLA|KSF|KRB|SZA|TLS)\b)"
)

LANG_SIGNS = [
    ("Clojure", re.compile(r"\(def\s|\(swap!|\batom\b")),
    ("PDP-8 assembler", re.compile(r"\b(TAD|JMS|DCA|ISZ|KSF|KRB|SZA|TLS)\b")),
    ("Java", re.compile(r"\b(public|private|protected)\s+(class|interface|static|abstract|final)|\bimport\s+java|System\.out|\@Override|\bimplements\b|\bnew\s+\w+(<[^>]*>)?\(\)|List<|String\[\]")),
    ("C++", re.compile(r"\bstd::|\bcout\b|\bnamespace\b|\w+::\w+|\bpublic:|\bprivate:|\bvirtual\b")),
    ("C", re.compile(r"#include|#define|#ifdef|\bprintf\(|\bstruct\s+\w+|\btypedef\b|\bchar\s*\*|\bvoid\s+\w+\(|\bextern\b")),
]


def classify(block: list[str]) -> str:
    text = "\n".join(block)
    for name, pattern in LANG_SIGNS:
        if pattern.search(text):
            return name
    return "unclassified"


def detect_listings(page: int) -> list[tuple[int, str, str]]:
    """Return (line count, language, first line) for each code block on the page."""
    blocks: list[list[str]] = []
    current: list[str] = []
    gap = 0
    for raw_line in raw_page(page).splitlines():
        line = raw_line.strip()
        if line == CODE_IMAGE_MARKER:
            if current:
                blocks.append(current)
            current = []
            gap = 0
            continue
        if line and CODE_MARKERS.search(line) and len(line) > 1:
            current.append(line)
            gap = 0
        elif current:
            gap += 1
            if gap > 1:
                blocks.append(current)
                current = []
                gap = 0
            else:
                current.append(line)
    if current:
        blocks.append(current)
    out = []
    for block in blocks:
        body = [line for line in block if line]
        if len(body) < 3:
            continue
        language = classify(body)
        syntactic = sum(1 for line in body if re.search(r"[;{}()#]", line))
        # assembler carries none of those characters, so it is kept on its own
        # signature instead of the syntactic ratio
        if syntactic * 2 < len(body) and language != "PDP-8 assembler":
            continue
        out.append((len(body), language, body[0][:70]))
    return out


def cmd_listings(_args: argparse.Namespace) -> int:
    rows = load_index()

    def chapter_of(page: int) -> str:
        for _, number, _, start, end in rows:
            if start <= page <= end:
                return str(number)
        return "-"

    last_page = max(end for _, _, _, _, end in rows)
    found: list[tuple[int, str, str, int, str]] = []
    for page in range(1, last_page + 1):
        for count, language, head in detect_listings(page):
            found.append((page, chapter_of(page), language, count, head))

    languages: dict[str, list[int]] = {}
    for page, _, language, _, _ in found:
        languages.setdefault(language, []).append(page)

    lines = [
        "# CA code listings",
        "",
        "Generated by `python3 tools/ca_pdf.py listings`. Do not edit by hand.",
        "",
        "Every code block the extractor finds in the PDF body, with its PDF page,",
        "its chapter and the language it is written in. This file answers one",
        "question and one only: which languages does the book write code in, and",
        "on which pages. A skill asked for any other language halts with",
        "`CODE_STYLE_DIVERGENCE`.",
        "",
        "## Languages used by the book",
        "",
        "| Language | Blocks | PDF pages |",
        "|---|---|---|",
    ]
    for language in sorted(languages, key=lambda k: (-len(languages[k]), k)):
        pages = sorted(set(languages[language]))
        shown = ", ".join(str(p) for p in pages[:24])
        if len(pages) > 24:
            shown += ", ..."
        lines.append(f"| {language} | {len(languages[language])} | {shown} |")

    lines += ["", "## Blocks", "", "| PDF page | Ch | Language | Lines | First line |", "|---|---|---|---|---|"]
    for page, chapter, language, count, head in found:
        head = head.replace("|", "\\|")
        lines.append(f"| {page} | {chapter} | {language} | {count} | `{head}` |")
    lines.append("")

    LISTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    LISTINGS_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {LISTINGS_PATH.relative_to(ROOT)} ({len(found)} blocks)")
    return 0


# --------------------------------------------------------------------------
# pages / search
# --------------------------------------------------------------------------


def parse_range(spec: str) -> list[int]:
    match = re.fullmatch(r"(\d{1,3})(?:-(\d{1,3}))?", spec.strip())
    if not match:
        sys.exit(f"bad page range: {spec!r} (use 161 or 161-166)")
    start = int(match.group(1))
    end = int(match.group(2) or start)
    if start > end:
        sys.exit(f"bad page range: {spec!r}")
    return list(range(start, end + 1))


def cmd_pages(args: argparse.Namespace) -> int:
    for page in parse_range(args.range):
        print(f"===== PDF page {page} =====")
        print(raw_page(page) if args.raw else norm_page(page))
        print()
    return 0


def cmd_search(args: argparse.Namespace) -> int:
    flags = 0 if args.case_sensitive else re.IGNORECASE
    pattern = re.compile(args.pattern, flags)
    rows = load_index() if INDEX_PATH.exists() else []

    def chapter_of(page: int) -> str:
        for _, number, _, start, end in rows:
            if start <= page <= end:
                return f"ch.{number}"
        return "-"

    hits = 0
    for page in range(1, page_count() + 1):
        text = norm_page(page)
        for match in pattern.finditer(text):
            hits += 1
            left = max(0, match.start() - 60)
            snippet = text[left : match.end() + 60].strip()
            print(f"p.{page} [{chapter_of(page)}] ...{snippet}...")
            break
    print(f"-- {hits} page(s) matched {args.pattern!r}")
    return 0 if hits else 1


# --------------------------------------------------------------------------
# verify
# --------------------------------------------------------------------------


def markdown_files() -> list[Path]:
    out = []
    for path in sorted(ROOT.rglob("*.md")):
        if path.name in EXCLUDED_FILES:
            continue
        out.append(path)
    return out


def load_forbidden() -> list[str]:
    if not DETERMINISM_PATH.exists():
        sys.exit("rules/ca-determinism.md is missing; it holds the forbidden phrase list")
    text = DETERMINISM_PATH.read_text(encoding="utf-8")
    match = re.search(rf"```{FORBIDDEN_FENCE}\n(.*?)```", text, re.DOTALL)
    if not match:
        sys.exit(f"rules/ca-determinism.md has no ```{FORBIDDEN_FENCE} block")
    phrases = [line.strip().lower() for line in match.group(1).splitlines() if line.strip()]
    if not phrases:
        sys.exit(f"the ```{FORBIDDEN_FENCE} block in rules/ca-determinism.md is empty")
    return phrases


def strip_markdown(line: str) -> str:
    line = CITATION_RE.sub(" ", line)
    line = re.sub(r"`[^`]*`", " ", line)
    line = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", line)
    line = re.sub(r"[*_#>|\-]+", " ", line)
    line = re.sub(r"^\s*\d+\.\s*", " ", line)
    return line


def significant_terms(line: str) -> list[str]:
    cleaned = strip_markdown(line)
    terms = []
    for word in re.findall(r"[A-Za-z][A-Za-z0-9'-]{3,}", cleaned):
        lowered = word.lower().replace("'", "")
        if lowered in STOPWORDS or lowered in terms:
            continue
        terms.append(lowered)
    return terms


def term_present(term: str, page_words: set[str], page_squashed: str) -> bool:
    if term in page_words:
        return True
    if term + "s" in page_words:
        return True
    if term.endswith("s") and term[:-1] in page_words:
        return True
    if term.endswith("ies") and term[:-3] + "y" in page_words:
        return True
    return squash(term) in page_squashed


def section_of(path: Path, line_number: int, lines: list[str]) -> str:
    current = ""
    fences = in_fence_map(lines)
    for index in range(line_number):
        if fences[index] is not None:
            continue
        heading = re.match(r"^##\s+(.*)$", lines[index])
        if heading:
            current = heading.group(1).strip()
    return current


def in_fence_map(lines: list[str]) -> list[str | None]:
    """For each line, the info string of the fence it sits inside, else None."""
    out: list[str | None] = []
    fence: str | None = None
    for line in lines:
        match = re.match(r"^\s*```(\S*)", line)
        if match and fence is None:
            fence = match.group(1) or ""
            out.append(fence)
            continue
        if match and fence is not None:
            out.append(fence)
            fence = None
            continue
        out.append(fence)
    return out


def _is_table_body_row(lines: list[str], index: int) -> bool:
    """True for a markdown table row that is neither the header nor the separator."""
    separator = re.compile(r"^\s*\|[\s|:-]+\|\s*$")
    line = lines[index]
    if not line.strip().startswith("|") or separator.match(line):
        return False
    previous = lines[index - 1] if index > 0 else ""
    if separator.match(previous):
        return True
    return _is_table_body_row(lines, index - 1) if previous.strip().startswith("|") else False


def cmd_verify(_args: argparse.Namespace) -> int:
    rows = load_index()
    ranges = {number: (start, end) for _, number, _, start, end in rows}
    forbidden = load_forbidden()
    problems: dict[Path, list[str]] = {}
    citation_count = 0

    def fail(path: Path, line_number: int, message: str) -> None:
        problems.setdefault(path, []).append(f"  line {line_number}: {message}")

    for path in markdown_files():
        lines = path.read_text(encoding="utf-8").splitlines()
        fences = in_fence_map(lines)
        is_skill = path.name == "SKILL.md"
        is_card = path.parent.name == "references" and path.name.startswith("part-")

        for number, line in enumerate(lines, start=1):
            fence = fences[number - 1]

            # 3. forbidden hedging
            if fence != FORBIDDEN_FENCE:
                lowered = re.sub(r"\s+", " ", line.lower())
                for phrase in forbidden:
                    if phrase in lowered:
                        fail(path, number, f"forbidden phrasing {phrase!r}")

            if fence is not None:
                continue

            for raw in MALFORMED_CITATION_RE.findall(line):
                if not CITATION_RE.fullmatch(raw):
                    fail(path, number, f"malformed citation {raw!r} (want [CA ch.N p.X] or [CA ch.N pp.X-Y])")

            citations = CITATION_RE.findall(line)

            # normative lines must carry a citation
            item = re.match(r"^\s*(?:\d+\.|[-*])\s+\S", line)
            in_table = _is_table_body_row(lines, number - 1)
            normative = False
            if is_skill and section_of(path, number - 1, lines) in ("Rules", "Procedure"):
                normative = bool(item) or in_table
            if is_card:
                normative = bool(item)
            grounded = bool(citations) or "rules/ca-" in line or "HALT" in line or "->" in line
            if normative and not grounded:
                fail(path, number, "normative line without a citation")

            for chapter_s, marker, first_s, last_s in citations:
                citation_count += 1
                chapter = int(chapter_s)
                first = int(first_s)
                last = int(last_s) if last_s else first
                text = f"[CA ch.{chapter} {marker}.{first_s}{'-' + last_s if last_s else ''}]"

                if chapter not in ranges:
                    fail(path, number, f"{text}: chapter {chapter} is not in page-index.md")
                    continue
                if (marker == "pp") != bool(last_s):
                    fail(path, number, f"{text}: use p. for one page and pp. for a range")
                    continue
                if last < first:
                    fail(path, number, f"{text}: reversed page range")
                    continue
                start, end = ranges[chapter]
                if not (start <= first <= end and start <= last <= end):
                    fail(path, number, f"{text}: outside chapter {chapter} ({start}-{end})")
                    continue

                terms = significant_terms(line)
                if not terms:
                    fail(path, number, f"{text}: citing line has no verifiable term")
                    continue
                page_words: set[str] = set()
                page_squashed = ""
                for page in range(first, last + 1):
                    normalized = norm_page(page)
                    page_words |= words_of(normalized)
                    page_squashed += squash(normalized)
                matched = [t for t in terms if term_present(t, page_words, page_squashed)]
                coverage = len(matched) / len(terms)
                if coverage < TERM_COVERAGE_THRESHOLD:
                    missing = [t for t in terms if t not in matched]
                    fail(
                        path,
                        number,
                        f"{text}: only {len(matched)}/{len(terms)} terms on the cited page(s); missing {missing}",
                    )

        if is_skill:
            problems.setdefault(path, []).extend(check_skill_shape(path, lines, ranges))
            if not problems[path]:
                del problems[path]

    report = {path: messages for path, messages in problems.items() if messages}
    if not report:
        print(f"ca_pdf.py verify: OK - {citation_count} citations resolved across {len(markdown_files())} files")
        return 0
    for path in sorted(report):
        print(f"{path.relative_to(ROOT)}")
        for message in report[path]:
            print(message)
    total = sum(len(v) for v in report.values())
    print(f"ca_pdf.py verify: FAILED - {total} problem(s) in {len(report)} file(s)")
    return 1


def check_skill_shape(path: Path, lines: list[str], ranges: dict[int, tuple[int, int]]) -> list[str]:
    messages: list[str] = []
    text = "\n".join(lines)

    front = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not front:
        messages.append("  frontmatter block is missing")
    else:
        name = re.search(r"^name:\s*(\S+)\s*$", front.group(1), re.MULTILINE)
        if not name:
            messages.append("  frontmatter has no name: field")
        elif not name.group(1).startswith("ca-"):
            messages.append(f"  skill name {name.group(1)!r} does not start with 'ca-'")
        elif name.group(1) != path.parent.name:
            messages.append(f"  skill name {name.group(1)!r} does not match directory {path.parent.name!r}")
        if not re.search(r"^description:\s*\S", front.group(1), re.MULTILINE):
            messages.append("  frontmatter has no description: field")
    if not path.parent.name.startswith("ca-"):
        messages.append(f"  skill directory {path.parent.name!r} does not start with 'ca-'")

    fences = in_fence_map(lines)
    headings = [
        line[3:].strip()
        for number, line in enumerate(lines)
        if fences[number] is None and line.startswith("## ")
    ]
    if headings != REQUIRED_SKILL_SECTIONS:
        messages.append(f"  sections are {headings}, expected {REQUIRED_SKILL_SECTIONS}")

    if "rules/ca-answer-contract.md" not in text:
        messages.append(
            "  References does not cite rules/ca-answer-contract.md; "
            "the answer contract binds every skill in the pack"
        )

    source = re.search(r"^##\s+Source\s*$(.*?)^##\s", text, re.DOTALL | re.MULTILINE)
    if not source:
        messages.append("  Source section is missing")
        return messages
    declared = {int(c) for c, _, _, _ in CITATION_RE.findall(source.group(1))}
    if not declared:
        messages.append("  Source section declares no chapter")
        return messages
    used: dict[int, int] = {}
    for number, line in enumerate(lines, start=1):
        if fences[number - 1] is not None:
            continue
        for chapter_s, _, _, _ in CITATION_RE.findall(line):
            used.setdefault(int(chapter_s), number)
    for chapter, number in sorted(used.items()):
        if chapter not in declared:
            messages.append(
                f"  line {number}: cites ch.{chapter}, outside the declared scope {sorted(declared)}"
            )
    return messages


# --------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(prog="ca_pdf.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("index", help="rebuild references/page-index.md").set_defaults(func=cmd_index)
    subparsers.add_parser("listings", help="rebuild references/code-listings.md").set_defaults(func=cmd_listings)

    pages = subparsers.add_parser("pages", help="dump extracted text for a page range")
    pages.add_argument("range", help="a PDF page or range, e.g. 161 or 161-166")
    pages.add_argument("--raw", action="store_true", help="skip normalization")
    pages.set_defaults(func=cmd_pages)

    search = subparsers.add_parser("search", help="regex search across the PDF")
    search.add_argument("pattern")
    search.add_argument("--case-sensitive", action="store_true")
    search.set_defaults(func=cmd_search)

    subparsers.add_parser("verify", help="validate every [CA ...] citation").set_defaults(func=cmd_verify)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
