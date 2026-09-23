#!/usr/bin/env python3
"""ddd_pdf.py - extraction and citation verification for Learning Domain-Driven Design.

Source of truth:
    ddd-vlad-khononov.pdf
    Vlad Khononov, Learning Domain-Driven Design: Aligning Software Architecture
    and Business Strategy, O'Reilly Media, 2022. 340 PDF pages.

Subcommands:
    index      rebuild references/ddd-page-index.md from the PDF outline
    listings   rebuild references/ddd-code-listings.md from the PDF
    artifacts  rebuild references/ddd-decision-artifacts.md from the PDF
    pages      dump extracted text for a page or page range
    search     regex search across the PDF, printing PDF page numbers
    verify     validate every [DDD ...] citation under domain-driven-design/

All page numbers are 1-based PDF pages, as a PDF viewer shows them. The printed
book page numbers are PDF page - 26 and are never used in a citation.

This script resolves no path outside domain-driven-design/.
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
    sys.exit("ddd_pdf.py requires pypdf (python3 -m pip install pypdf==4.0.0)")

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "ddd-vlad-khononov.pdf"
INDEX_PATH = ROOT / "references" / "ddd-page-index.md"
LISTINGS_PATH = ROOT / "references" / "ddd-code-listings.md"
ARTIFACTS_PATH = ROOT / "references" / "ddd-decision-artifacts.md"
DETERMINISM_PATH = ROOT / "rules" / "ddd-determinism.md"
SOURCE_PATH = ROOT / "rules" / "ddd-source-of-truth.md"


def inside_root(path: Path) -> Path:
    """Refuse any path outside domain-driven-design/."""
    resolved = path.resolve()
    if ROOT != resolved and ROOT not in resolved.parents:
        sys.exit(f"refusing to resolve a path outside {ROOT.name}/: {resolved}")
    return resolved


# The implementation spec quotes the banned phrases as data, and the three
# generated references carry no normative line. Everything else is scanned.
EXCLUDED_FILES = {"2026-09-21-ddd-skills-implementation-prompt.md"}
GENERATED_FILES = {
    "ddd-page-index.md",
    "ddd-code-listings.md",
    "ddd-decision-artifacts.md",
}

# --------------------------------------------------------------------------
# front and back matter, from the PDF outline
# --------------------------------------------------------------------------

FRONT_BACK = {
    "pref.": ("Preface", 17, 24),
    "intro": ("Introduction", 25, 26),
    "part.I": ("Part I opener: Strategic Design", 27, 28),
    "part.II": ("Part II opener: Tactical Design", 87, 88),
    "part.III": ("Part III opener: Applying DDD in Practice", 183, 184),
    "part.IV": ("Part IV opener: Relationships to Other Methodologies", 241, 242),
    "closing": ("Closing Words", 293, 297),
    "app.A": ("Appendix A: Applying DDD: A Case Study", 299, 313),
    "app.B": ("Appendix B: Answers to Exercise Questions", 315, 321),
}

NORMATIVE_FIRST, NORMATIVE_LAST = 17, 321

OUTLINE_CHAPTERS = [
    ("I", 1, "Analyzing Business Domains"),
    ("I", 2, "Discovering Domain Knowledge"),
    ("I", 3, "Managing Domain Complexity"),
    ("I", 4, "Integrating Bounded Contexts"),
    ("II", 5, "Implementing Simple Business Logic"),
    ("II", 6, "Tackling Complex Business Logic"),
    ("II", 7, "Modeling the Dimension of Time"),
    ("II", 8, "Architectural Patterns"),
    ("II", 9, "Communication Patterns"),
    ("III", 10, "Design Heuristics"),
    ("III", 11, "Evolving Design Decisions"),
    ("III", 12, "EventStorming"),
    ("III", 13, "Domain-Driven Design in the Real World"),
    ("IV", 14, "Microservices"),
    ("IV", 15, "Event-Driven Architecture"),
    ("IV", 16, "Data Mesh"),
]

# --------------------------------------------------------------------------
# citation grammar
# --------------------------------------------------------------------------

LOCATOR = r"ch\.\d{1,2}|pref\.|intro|closing|app\.A|app\.B|part\.(?:IV|III|II|I)"
CITATION_RE = re.compile(
    rf"\[DDD ({LOCATOR}) (pp?)\.(\d{{1,3}})(?:-(\d{{1,3}}))?\]"
)
ANY_DDD_BRACKET_RE = re.compile(r"\[DDD[^\]]*\]")
STATUS_RE = re.compile(r"`(RULE|HEURISTIC|PREFERENCE)`")
ARTIFACT_REF_RE = re.compile(r"\b(Figure|Table)\s+([0-9]{1,2}|[A-E])-([0-9]{1,2})\b")

STATUS_TOKENS = ("RULE", "HEURISTIC", "PREFERENCE")

HEURISTIC_MARKERS = (
    "should",
    "heuristic",
    "heuristics",
    "rule of thumb",
    "rules of thumb",
    "preferable",
    "advisable",
    "avoided",
)
PREFERENCE_MARKERS = ("prefer", "prefers", "preferred", "preference", "advice")

# A modal word used in a pack line must appear on the cited page. This is the
# check that catches hardening the book's "should" into "must".
MODAL_VARIANTS = {
    "must": ("must",),
    "never": ("never",),
    "cannot": ("cannot", "can not", "cant"),
    "always": ("always",),
    "should": ("should",),
    "preferable": ("preferable", "preferably"),
    "prefer": ("prefer", "prefers", "preferred", "preference"),
    "heuristic": ("heuristic", "heuristics"),
    "rule of thumb": ("rule of thumb", "rules of thumb"),
    "advisable": ("advisable",),
    "advice": ("advice",),
    "avoided": ("avoided", "avoid"),
}

REQUIRED_SKILL_SECTIONS = [
    "Source",
    "Rules",
    "Inputs",
    "Procedure",
    "Halt conditions",
    "Output template",
    "References",
]

REASON_CODES = (
    "OUT_OF_SCOPE",
    "UNDEFINED_IN_BOOK",
    "AMBIGUOUS_IN_BOOK",
    "BOOK_DECLINES_TO_GENERALIZE",
    "REQUIRES_BUSINESS_INPUT",
    "REQUIRES_ORG_INPUT",
    "STRUCTURE_DIVERGENCE",
    "CONFLICT_WITH_PROJECT",
    "CITATION_UNVERIFIED",
)

FORBIDDEN_FENCE = "ddd-forbidden"
SHARED_FENCE = "ddd-shared-ranges"
QUOTE_FENCE = "ddd-quote"
OUTPUT_FENCE = "ddd-output"

TERM_COVERAGE_THRESHOLD = 0.6
CAPTION_ONLY_WORDS = 120

STOPWORDS = {
    "about", "above", "after", "again", "against", "also", "always", "among",
    "another", "anything", "around", "because", "been", "before", "being",
    "below", "between", "both", "cannot", "does", "doing", "done", "down",
    "during", "each", "either", "else", "even", "ever", "every", "from",
    "have", "having", "here", "how", "however", "into", "itself", "just",
    "like", "made", "make", "makes", "many", "more", "most", "much", "must",
    "neither", "never", "next", "none", "only", "onto", "other", "others",
    "over", "same", "shall", "should", "since", "some", "such", "than",
    "that", "their", "them", "then", "there", "these", "they", "this",
    "those", "through", "thus", "under", "until", "upon", "very", "what",
    "when", "where", "whether", "which", "while", "will", "with", "within",
    "without", "would", "your", "yours", "once", "onto", "them",
    # template and protocol vocabulary, not book content
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
    "ask", "asks", "asked", "request", "requested", "requests", "route",
    "routes", "input", "inputs", "supply", "supplies", "supplied",
    # the `Who can supply it` column of every Inputs table
    "team", "teams", "lead", "leads", "expert", "experts", "measurement",
}


# --------------------------------------------------------------------------
# PDF access
# --------------------------------------------------------------------------

_reader: PdfReader | None = None
_page_cache: dict[int, str] = {}


def reader() -> PdfReader:
    global _reader
    if _reader is None:
        inside_root(PDF_PATH)
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
    """Rejoin the spaced-capital artifact: `T HE B OOK` -> `THE BOOK`."""
    for _ in range(4):
        text = re.sub(r"(?<![A-Za-z])([A-Z]) ([A-Z]{2,})", r"\1\2", text)
    return text


def norm_page(number: int) -> str:
    """Extracted page text with the extractor's two artifacts repaired.

    1. The soft-hyphen artifact: `implemen‐ ting` -> `implementing`.
    2. The spaced-capital artifact: `T HE` -> `THE`.
    """
    text = raw_page(number)
    text = re.sub(r"[‐­]\s*", "", text)
    text = re.sub(r"-\n(?=[a-z])", "-", text)
    text = re.sub(r"\s+", " ", text)
    return fix_small_caps(text).strip()


def squash(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())


def words_of(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def word_count(number: int) -> int:
    return len(re.findall(r"[A-Za-z0-9]+", norm_page(number)))


# --------------------------------------------------------------------------
# index
# --------------------------------------------------------------------------


def outline_chapter_starts() -> dict[int, int]:
    """Chapter number -> 1-based first PDF page, from the PDF's own outline."""
    starts: dict[int, int] = {}
    pattern = re.compile(r"^Chapter\s+(\d{1,2})\.")

    def walk(items) -> None:
        for item in items:
            if isinstance(item, list):
                walk(item)
                continue
            title = str(getattr(item, "title", "") or "")
            match = pattern.match(title.strip())
            if not match:
                continue
            number = int(match.group(1))
            if number in starts:
                continue
            starts[number] = reader().get_destination_page_number(item) + 1

    walk(reader().outline)
    return starts


def trim_blank_tail(start: int, end: int) -> int:
    """Drop trailing pages whose extracted text is empty (blank verso pages)."""
    while end > start and not norm_page(end):
        end -= 1
    return end


def build_index() -> list[tuple[str, int, str, int, int, int]]:
    """(part, chapter, title, start, raw_end, content_end) per chapter."""
    starts = outline_chapter_starts()
    missing = [n for _, n, _ in OUTLINE_CHAPTERS if n not in starts]
    if missing:
        sys.exit(f"the PDF outline gave no start page for chapter(s): {missing}")

    boundaries = sorted(
        set(starts.values())
        | {first for _, first, _ in FRONT_BACK.values()}
        | {page_count() + 1}
    )
    rows = []
    for part, number, title, in OUTLINE_CHAPTERS:
        start = starts[number]
        raw_end = next(b for b in boundaries if b > start) - 1
        rows.append((part, number, title, start, raw_end, trim_blank_tail(start, raw_end)))
    return rows


def cmd_index(_args: argparse.Namespace) -> int:
    rows = build_index()
    lines = [
        "# DDD page index",
        "",
        "Generated by `python3 tools/ddd_pdf.py index`. Do not edit by hand.",
        "",
        f"Source PDF: `{PDF_PATH.name}` - {page_count()} pages.",
        "",
        "Page numbers are 1-based PDF pages, as a PDF viewer shows them. The printed",
        "book page numbers are `PDF page - 26` and are never used in a citation.",
        "",
        "Chapter start pages come from the PDF's own outline",
        "(`PdfReader.outline` plus `get_destination_page_number`), not from text",
        "detection. `Raw end` is the page before the next start. `Content end` drops",
        "trailing blank verso pages, and is the range a citation is checked against.",
        "",
        "## Chapters",
        "",
        "| Part | Ch | Title | Content pages | Raw end |",
        "|---|---|---|---|---|",
    ]
    for part, number, title, start, raw_end, end in rows:
        span = f"{start}-{end}" if end > start else f"{start}"
        lines.append(f"| {part} | {number} | {title} | {span} | {raw_end} |")

    lines += [
        "",
        "## Front and back matter",
        "",
        "| Locator | Material | Content pages |",
        "|---|---|---|",
    ]
    for key, (title, first, last) in FRONT_BACK.items():
        end = trim_blank_tail(first, last)
        span = f"{first}-{end}" if end > first else f"{first}"
        lines.append(f"| `{key}` | {title} | {span} |")

    lines += [
        "",
        "## Non-normative material",
        "",
        "| Material | PDF pages |",
        "|---|---|",
        "| Cover, copyright, table of contents, foreword | 1-16 |",
        "| Bibliography | 323-324 |",
        f"| Index | 325-{page_count()} |",
        "",
        f"The normative range for this pack is {NORMATIVE_FIRST}-{NORMATIVE_LAST}.",
        "The bibliography is citable only as evidence that a topic is deferred to",
        "another book. The index is never citable.",
        "",
    ]
    inside_root(INDEX_PATH)
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {INDEX_PATH.relative_to(ROOT)} ({len(rows)} chapters)")
    return 0


_INDEX_ROW_RE = re.compile(
    r"^\|\s*([IV]+)\s*\|\s*(\d{1,2})\s*\|\s*(.+?)\s*\|\s*(\d{1,3})(?:-(\d{1,3}))?\s*\|\s*(\d{1,3})\s*\|$"
)


def load_chapter_ranges() -> dict[int, tuple[int, int]]:
    inside_root(INDEX_PATH)
    if not INDEX_PATH.exists():
        sys.exit("references/ddd-page-index.md is missing; run: python3 tools/ddd_pdf.py index")
    out: dict[int, tuple[int, int]] = {}
    for line in INDEX_PATH.read_text(encoding="utf-8").splitlines():
        match = _INDEX_ROW_RE.match(line.strip())
        if match:
            first = int(match.group(4))
            last = int(match.group(5) or first)
            out[int(match.group(2))] = (first, last)
    if len(out) != len(OUTLINE_CHAPTERS):
        sys.exit(
            f"ddd-page-index.md lists {len(out)} chapters, expected {len(OUTLINE_CHAPTERS)}"
        )
    return out


def locator_range(locator: str, chapters: dict[int, tuple[int, int]]) -> tuple[int, int] | None:
    if locator.startswith("ch."):
        return chapters.get(int(locator[3:]))
    entry = FRONT_BACK.get(locator)
    if entry is None:
        return None
    return entry[1], entry[2]


# --------------------------------------------------------------------------
# listings
# --------------------------------------------------------------------------

CODE_MARKERS = re.compile(
    r"(^\s*(using\s+\w|namespace\s|public\s|private\s|protected\s|internal\s|static\s|void\s|var\s|new\s|int\s|long\s|string\s|decimal\s|bool\s|class\s|interface\s|enum\s|struct\s|record\s|return\b|throw\b|if\s*\(|foreach\s*\(|for\s*\(|while\s*\(|switch\s*\(|else\b|await\s|async\s|SELECT\b|FROM\b|WHERE\b|GROUP\s+BY\b|INSERT\b|UPDATE\b|CREATE\s+TABLE\b)"
    r"|[;{}]\s*$"
    r"|^\s*[}{\[\]]"
    r"|^\s*\"[A-Za-z_-]+\"\s*:"
    r"|\bGuid\b|\bIEnumerable<|\bList<|\bDictionary<|=>\s*$)"
)

LANG_SIGNS = [
    ("SQL", re.compile(r"\bSELECT\b.*\bFROM\b|\bGROUP\s+BY\b|\bCREATE\s+TABLE\b", re.IGNORECASE)),
    ("JSON", re.compile(r"^\s*[\[{]\s*$|^\s*\"[A-Za-z_-]+\"\s*:", re.MULTILINE)),
    (
        "C#",
        re.compile(
            r"\bpublic\s+(class|interface|static|sealed|abstract|void|record)|\bnamespace\b|\bGuid\b|\bvar\s+\w+\s*=|\bIEnumerable<|\bList<|=>"
        ),
    ),
]


def classify(block: list[str]) -> str:
    text = "\n".join(block)
    for name, pattern in LANG_SIGNS:
        if pattern.search(text):
            return name
    return "unclassified"


def detect_listings(page: int) -> list[tuple[int, str, str]]:
    blocks: list[list[str]] = []
    current: list[str] = []
    gap = 0
    for raw_line in raw_page(page).splitlines():
        line = raw_line.strip()
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
        syntactic = sum(1 for line in body if re.search(r"[;{}()<>\[\]]", line))
        if syntactic * 2 < len(body):
            continue
        out.append((len(body), classify(body), body[0][:70]))
    return out


def chapter_label(page: int, chapters: dict[int, tuple[int, int]]) -> str:
    for number, (first, last) in chapters.items():
        if first <= page <= last:
            return f"ch.{number}"
    for key, (_, first, last) in FRONT_BACK.items():
        if first <= page <= last:
            return key
    return "-"


def cmd_listings(_args: argparse.Namespace) -> int:
    chapters = load_chapter_ranges()
    found: list[tuple[int, str, str, int, str]] = []
    for page in range(NORMATIVE_FIRST, NORMATIVE_LAST + 1):
        for count, language, head in detect_listings(page):
            found.append((page, chapter_label(page, chapters), language, count, head))

    languages: dict[str, list[int]] = {}
    for page, _, language, _, _ in found:
        languages.setdefault(language, []).append(page)

    lines = [
        "# DDD code listings",
        "",
        "Generated by `python3 tools/ddd_pdf.py listings`. Do not edit by hand.",
        "",
        "Every code block the extractor finds between PDF pages",
        f"{NORMATIVE_FIRST} and {NORMATIVE_LAST}, with its page, its locator and the language it is",
        "written in.",
        "",
        "This file answers one question: which languages does the book print code in.",
        "It does **not** restrict the language a skill may answer in. PDF p.21 states",
        "the code samples are implemented in C# and that the concepts are not limited",
        "to C#; p.103 footnote 2 repeats it for functional programming. There is no",
        "`CODE_STYLE_DIVERGENCE` halt in this pack. What must not drift is structure:",
        "see `../rules/ddd-structural-fidelity.md`.",
        "",
        "## Languages the book prints",
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

    lines += [
        "",
        "## Blocks",
        "",
        "| PDF page | Locator | Language | Lines | First line |",
        "|---|---|---|---|---|",
    ]
    for page, locator, language, count, head in found:
        head = head.replace("|", "\\|").replace("`", "'")
        lines.append(f"| {page} | {locator} | {language} | {count} | `{head}` |")
    lines.append("")

    inside_root(LISTINGS_PATH)
    LISTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    LISTINGS_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {LISTINGS_PATH.relative_to(ROOT)} ({len(found)} blocks)")
    return 0


# --------------------------------------------------------------------------
# artifacts
# --------------------------------------------------------------------------

CAPTION_RE = re.compile(
    r"\b(Figure|Table)\s+([0-9]{1,2}|[A-E])-([0-9]{1,2})\s*\.\s*([^\n]{0,160})"
)
FOOTER_RE = re.compile(
    r"\s*\d{1,3}\s*\|\s*(?:Chapter\s+\d{1,2}:|Appendix\s+[AB]:|Closing Words|Part\s+[IV]+:).*$"
)


def clean_caption(kind: str, group: str, number: str, tail: str) -> str:
    """The caption text alone: no repeated label, no running footer, one sentence."""
    text = tail.strip()
    text = re.sub(rf"^{kind}\s+{group}-{number}\s*\.\s*", "", text)
    text = FOOTER_RE.sub("", text)
    text = re.sub(r"\s*\d{1,3}\s*\|\s*[A-Z][^|]*$", "", text)
    text = re.split(r"(?<=[a-z\)])\s(?=[A-Z][a-z]+\s+[a-z])", text)[0]
    text = text.strip().rstrip(".").replace("|", "/")
    return re.sub(r"\s+", " ", text)


def detect_artifacts() -> list[tuple[str, int, str, str, int, bool]]:
    """(id, page, locator, caption, page words, caption-only) for every artifact."""
    chapters = load_chapter_ranges()
    seen: dict[str, tuple[str, int, str, str, int, bool]] = {}
    for page in range(NORMATIVE_FIRST, NORMATIVE_LAST + 1):
        text = norm_page(page)
        counted = word_count(page)
        body = re.sub(CAPTION_RE, " ", text)
        body_words = len(re.findall(r"[A-Za-z0-9]+", body))
        for kind, group, number, tail in CAPTION_RE.findall(text):
            identifier = f"{kind} {group}-{number}"
            if identifier in seen:
                continue
            caption = clean_caption(kind, group, number, tail)
            seen[identifier] = (
                identifier,
                page,
                chapter_label(page, chapters),
                caption,
                counted,
                body_words < CAPTION_ONLY_WORDS,
            )

    def sort_key(row):
        identifier = row[0]
        kind, rest = identifier.split(" ", 1)
        group, number = rest.split("-")
        group_key = (0, int(group)) if group.isdigit() else (1, ord(group))
        return (kind, group_key, int(number))

    return sorted(seen.values(), key=sort_key)


def cmd_artifacts(_args: argparse.Namespace) -> int:
    rows = detect_artifacts()
    caption_only = [r for r in rows if r[5]]
    lines = [
        "# DDD decision artifacts",
        "",
        "Generated by `python3 tools/ddd_pdf.py artifacts`. Do not edit by hand.",
        "",
        "Every numbered figure and table the extractor finds between PDF pages",
        f"{NORMATIVE_FIRST} and {NORMATIVE_LAST}, with the page its caption sits on.",
        "",
        "## The caption-only column",
        "",
        "A figure is a picture. The extractor returns its caption and nothing else,",
        "so a pack line that cites a figure page **for the figure's own content**",
        "can never reach the 60% term-coverage threshold of",
        "`python3 tools/ddd_pdf.py verify`.",
        "",
        "`Caption-only` is `yes` when the page's extracted text, with its captions",
        f"removed, holds fewer than {CAPTION_ONLY_WORDS} words: the page is the picture plus its",
        "caption. A line that names a caption-only artifact is exempt from the",
        "term-coverage check. Every other check still applies to it.",
        "",
        "The exemption is a licence to cite a picture, not a licence to invent its",
        "content. Where prose explains the figure, cite the prose.",
        "",
        "## Caption-only artifacts",
        "",
        "| Artifact | PDF page | Locator | Caption |",
        "|---|---|---|---|",
    ]
    for identifier, page, locator, caption, _, _ in caption_only:
        lines.append(f"| {identifier} | {page} | {locator} | {caption} |")

    lines += [
        "",
        "## All artifacts",
        "",
        "| Artifact | PDF page | Locator | Page words | Caption-only | Caption |",
        "|---|---|---|---|---|---|",
    ]
    for identifier, page, locator, caption, counted, only in rows:
        lines.append(
            f"| {identifier} | {page} | {locator} | {counted} | {'yes' if only else 'no'} | {caption} |"
        )
    lines.append("")

    inside_root(ARTIFACTS_PATH)
    ARTIFACTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACTS_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(
        f"wrote {ARTIFACTS_PATH.relative_to(ROOT)} "
        f"({len(rows)} artifacts, {len(caption_only)} caption-only)"
    )
    return 0


def load_caption_only() -> set[str]:
    inside_root(ARTIFACTS_PATH)
    if not ARTIFACTS_PATH.exists():
        sys.exit(
            "references/ddd-decision-artifacts.md is missing; "
            "run: python3 tools/ddd_pdf.py artifacts"
        )
    out: set[str] = set()
    row_re = re.compile(
        r"^\|\s*((?:Figure|Table)\s+[0-9A-E]{1,2}-[0-9]{1,2})\s*\|\s*\d{1,3}\s*\|[^|]*\|\s*\d+\s*\|\s*(yes|no)\s*\|"
    )
    for line in ARTIFACTS_PATH.read_text(encoding="utf-8").splitlines():
        match = row_re.match(line.strip())
        if match and match.group(2) == "yes":
            out.add(re.sub(r"\s+", " ", match.group(1)))
    return out


# --------------------------------------------------------------------------
# pages / search
# --------------------------------------------------------------------------


def parse_range(spec: str) -> list[int]:
    match = re.fullmatch(r"(\d{1,3})(?:-(\d{1,3}))?", spec.strip())
    if not match:
        sys.exit(f"bad page range: {spec!r} (use 188 or 185-193)")
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


MARKER_RE = re.compile(r"^([0-9]{1,2}|[a-z])\.$")
PROMPT_X = 18.0
OPTION_X = 31.0
X_TOLERANCE = 3.0


def page_fragments(number: int) -> list[tuple[float, str]]:
    """Return (x position, text) for every fragment, in reading order.

    The book draws list markers as their own fragments at x=0, so the marker
    and the line it labels arrive as two separate fragments.
    """
    out: list[tuple[float, str]] = []

    def visit(text: str, _cm, tm, _font, _size) -> None:
        stripped = text.strip()
        if stripped:
            out.append((round(tm[4], 1), stripped))

    reader().pages[number - 1].extract_text(visitor_text=visit)
    return out


def exercise_options(number: int) -> list[dict]:
    """Rebuild the exercise questions of a page, marker by marker.

    A question's options are relettered when the PDF omits a marker: an
    unmarked line sitting at the prompt indentation, after the prompt and
    before the first lettered option, is that question's first option, and
    every later letter on the page is off by one.
    """
    questions: list[dict] = []
    current: dict | None = None
    pending: str | None = None
    seen_letter = False

    for x, fragment in page_fragments(number):
        marker = MARKER_RE.match(fragment)
        if marker and marker.group(1).isdigit():
            current = {"number": int(marker.group(1)), "prompt": [], "options": [],
                       "orphan": None, "relettered": False}
            questions.append(current)
            pending, seen_letter = "prompt", False
            continue
        if current is None:
            continue
        if marker:
            pending, seen_letter = "option", True
            current["options"].append([])
            continue
        if pending == "prompt":
            if abs(x - PROMPT_X) <= X_TOLERANCE:
                # a line at prompt indentation is an option that lost its marker
                # only once the prompt itself is a finished sentence; otherwise it
                # is the prompt continuing onto the next line
                # only a question mark closes a prompt: a colon introduces the
                # option list itself, or a code listing the prompt continues after
                finished = bool(current["prompt"]) and current["prompt"][-1].rstrip().endswith("?")
                if finished and not seen_letter and current["orphan"] is None:
                    current["orphan"] = fragment
                else:
                    current["prompt"].append(fragment)
            continue
        if pending == "option" and current["options"]:
            if abs(x - OPTION_X) <= X_TOLERANCE:
                current["options"][-1].append(fragment)
            else:
                pending = None

    for question in questions:
        options = [" ".join(parts) for parts in question["options"] if parts]
        if question["orphan"] is not None and options:
            options.insert(0, question["orphan"])
            question["relettered"] = True
        question["options"] = options
    return questions


def cmd_options(args: argparse.Namespace) -> int:
    """Print exercise questions with their markers rebuilt."""
    flagged = 0
    for page in parse_range(args.range):
        printed = False
        for question in exercise_options(page):
            if not question["options"]:
                continue
            if not printed:
                print(f"===== PDF page {page} =====")
                printed = True
            print(f"{question['number']}. {' '.join(question['prompt'])}")
            for index, option in enumerate(question["options"]):
                print(f"   {chr(ord('a') + index)}. {option}")
            if question["relettered"]:
                flagged += 1
                print("   ^ the PDF omits this question's first marker; the letters "
                      "above are rebuilt, and `pages` prints them shifted by one")
            print()
    if flagged:
        print(f"{flagged} question(s) relettered")
    return 0


def cmd_search(args: argparse.Namespace) -> int:
    flags = 0 if args.case_sensitive else re.IGNORECASE
    pattern = re.compile(args.pattern, flags)
    chapters = load_chapter_ranges() if INDEX_PATH.exists() else {}

    hits = 0
    for page in range(1, page_count() + 1):
        text = norm_page(page)
        match = pattern.search(text)
        if not match:
            continue
        hits += 1
        left = max(0, match.start() - 60)
        snippet = text[left : match.end() + 60].strip()
        print(f"p.{page} [{chapter_label(page, chapters)}] ...{snippet}...")
    print(f"-- {hits} page(s) matched {args.pattern!r}")
    return 0 if hits else 1


# --------------------------------------------------------------------------
# verify helpers
# --------------------------------------------------------------------------


def markdown_files() -> list[Path]:
    out = []
    for path in sorted(ROOT.rglob("*.md")):
        if path.name in EXCLUDED_FILES:
            continue
        out.append(inside_root(path))
    return out


def load_fenced_list(path: Path, fence: str) -> list[str]:
    inside_root(path)
    if not path.exists():
        sys.exit(f"{path.relative_to(ROOT)} is missing; it holds the ```{fence} block")
    text = path.read_text(encoding="utf-8")
    match = re.search(rf"```{fence}\n(.*?)```", text, re.DOTALL)
    if not match:
        sys.exit(f"{path.relative_to(ROOT)} has no ```{fence} block")
    items = [line.strip() for line in match.group(1).splitlines() if line.strip()]
    if not items:
        sys.exit(f"the ```{fence} block in {path.relative_to(ROOT)} is empty")
    return items


def load_shared_pages() -> set[int]:
    pages: set[int] = set()
    for item in load_fenced_list(SOURCE_PATH, SHARED_FENCE):
        match = re.fullmatch(r"(\d{1,3})(?:-(\d{1,3}))?", item)
        if not match:
            sys.exit(f"bad entry in ```{SHARED_FENCE}: {item!r}")
        first = int(match.group(1))
        last = int(match.group(2) or first)
        pages |= set(range(first, last + 1))
    return pages


FENCE_RE = re.compile(r"^\s*(`{3,})(\S*)")


def in_fence_map(lines: list[str]) -> list[str | None]:
    """For each line, the info string of the fence it sits inside, else None.

    A fence of N backticks is closed only by a bare fence of N or more. A
    shorter or labelled fence inside a longer one is content, which is how a
    file shows a `ddd-quote` fence without opening one.
    """
    out: list[str | None] = []
    info: str | None = None
    ticks = 0
    for line in lines:
        match = FENCE_RE.match(line)
        if match:
            width, label = len(match.group(1)), match.group(2)
            if info is None:
                info, ticks = label, width
                out.append(info)
                continue
            if width >= ticks and not label:
                out.append(info)
                info, ticks = None, 0
                continue
            out.append(info)
            continue
        out.append(info)
    return out


def section_map(lines: list[str], fences: list[str | None]) -> list[str]:
    out: list[str] = []
    current = ""
    for index, line in enumerate(lines):
        if fences[index] is None:
            heading = re.match(r"^##\s+(.*)$", line)
            if heading:
                current = heading.group(1).strip()
        out.append(current)
    return out


def strip_markdown(line: str) -> str:
    line = CITATION_RE.sub(" ", line)
    line = re.sub(r"<[^>]*>", " ", line)
    line = re.sub(r"`[^`]*`", " ", line)
    line = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", line)
    line = re.sub(r"[*_#>|]+", " ", line)
    line = re.sub(r"^\s*\d+\.\s*", " ", line)
    line = re.sub(r"^\s*[-*]\s*", " ", line)
    return line


def significant_terms(line: str) -> list[str]:
    cleaned = strip_markdown(line)
    terms: list[str] = []
    for word in re.findall(r"[A-Za-z][A-Za-z0-9'-]{3,}", cleaned):
        lowered = word.lower().replace("'", "")
        if lowered in STOPWORDS or lowered in terms:
            continue
        terms.append(lowered)
    return terms


def term_present(term: str, page_words: set[str], page_squashed: str) -> bool:
    if term in page_words or term + "s" in page_words:
        return True
    if term.endswith("s") and term[:-1] in page_words:
        return True
    if term.endswith("ies") and term[:-3] + "y" in page_words:
        return True
    for part in term.split("-"):
        if len(part) > 3 and part not in page_words:
            break
    else:
        if "-" in term:
            return True
    return squash(term) in page_squashed


def _table_row_kind(lines: list[str], index: int) -> str:
    """'header', 'separator', 'body' or '' for a markdown table line."""
    separator = re.compile(r"^\s*\|[\s|:-]+\|\s*$")
    line = lines[index]
    if not line.strip().startswith("|"):
        return ""
    if separator.match(line):
        return "separator"
    previous = lines[index - 1] if index > 0 else ""
    if separator.match(previous):
        return "body"
    if not previous.strip().startswith("|"):
        return "header"
    return "body" if _table_row_kind(lines, index - 1) in ("body", "separator") else "header"


def contains_phrase(text: str, phrase: str) -> bool:
    """Whole-word match, tolerant of the whitespace between a phrase's words."""
    pattern = r"\b" + r"\s+".join(re.escape(word) for word in phrase.split()) + r"\b"
    return bool(re.search(pattern, text))


def page_text_blob(first: int, last: int) -> tuple[set[str], str, str]:
    words: set[str] = set()
    squashed = ""
    plain = ""
    for page in range(first, last + 1):
        normalized = norm_page(page)
        words |= words_of(normalized)
        squashed += squash(normalized)
        plain += " " + normalized.lower()
    return words, squashed, plain


# --------------------------------------------------------------------------
# verify
# --------------------------------------------------------------------------


def cmd_verify(_args: argparse.Namespace) -> int:
    chapters = load_chapter_ranges()
    forbidden = load_fenced_list(DETERMINISM_PATH, FORBIDDEN_FENCE)
    shared_pages = load_shared_pages()
    caption_only = load_caption_only()

    problems: dict[Path, list[str]] = {}
    citation_count = 0
    quote_count = 0
    files = markdown_files()

    def fail(path: Path, number: int, message: str) -> None:
        problems.setdefault(path, []).append(f"  line {number}: {message}")

    for path in files:
        raw_text = path.read_text(encoding="utf-8")
        lines = raw_text.splitlines()
        fences = in_fence_map(lines)
        sections = section_map(lines, fences)
        is_skill = path.name == "SKILL.md"
        is_generated = path.name in GENERATED_FILES

        # 9. this pack never writes a Clean Architecture page number
        for number, line in enumerate(lines, start=1):
            if "[CA " in line:
                fail(path, number, "contains the substring '[CA ' - this pack never cites that book")

        # 2. every file name carries the ddd- prefix
        if path.name != "README.md" and not path.name.startswith("ddd-") and not is_skill:
            fail(path, 1, f"file name {path.name!r} does not start with 'ddd-'")

        declared = skill_declared_pages(lines, fences, sections, chapters) if is_skill else None

        for index, line in enumerate(lines):
            number = index + 1
            fence = fences[index]

            # 5. forbidden hedging, outside a ddd-quote or ddd-forbidden fence
            if fence not in (QUOTE_FENCE, FORBIDDEN_FENCE):
                lowered = re.sub(r"\s+", " ", line.lower())
                for phrase in forbidden:
                    if phrase in lowered:
                        fail(path, number, f"forbidden phrasing {phrase!r}")

            # 6. a ddd-quote fence opener carries exactly one citation
            if fence == QUOTE_FENCE and re.match(rf"^\s*`{{3,}}{QUOTE_FENCE}\b", line):
                quote_count += 1
                info = line.split("```", 1)[1]
                found = CITATION_RE.findall(info)
                if len(found) != 1:
                    fail(path, number, f"a ```{QUOTE_FENCE} fence carries {len(found)} citation(s), want exactly 1")
                else:
                    problem = check_quote(lines, index, fences, found[0], chapters)
                    if problem:
                        fail(path, number, problem)
                continue

            if fence is not None and fence != OUTPUT_FENCE:
                continue

            for bracket in ANY_DDD_BRACKET_RE.findall(line):
                if not CITATION_RE.fullmatch(bracket):
                    fail(
                        path,
                        number,
                        f"malformed citation {bracket!r} (want [DDD ch.N p.X], [DDD ch.N pp.X-Y], "
                        "[DDD pref. p.X], [DDD intro p.X], [DDD part.I p.X], [DDD closing p.X], "
                        "[DDD app.A p.X] or [DDD app.B p.X])",
                    )

            citations = CITATION_RE.findall(line)
            line_plain = ""
            for _loc, _mk, _fs, _ls in citations:
                span_first = int(_fs)
                span_last = int(_ls) if _ls else span_first
                if 1 <= span_first <= span_last <= page_count():
                    line_plain += " " + page_text_blob(span_first, span_last)[2]
            row_kind = _table_row_kind(lines, index) if fence is None else ""
            is_item = bool(re.match(r"^\s*(?:\d+\.|[-*])\s+\S", line))
            is_output_line = fence == OUTPUT_FENCE and bool(re.match(r"^\s*[-*]\s+\S", line))

            # one citation per line, outside the Source section
            if len(citations) > 1 and sections[index] != "Source":
                fail(path, number, f"{len(citations)} citations on one line; one claim, one line, one citation")

            # 8. status token on every normative line
            normative = (
                not is_generated
                and bool(citations)
                and sections[index] not in ("Source", "References")
                and (is_item or row_kind == "body" or is_output_line)
            )
            tokens = STATUS_RE.findall(line)
            if normative:
                if len(tokens) != 1:
                    fail(
                        path,
                        number,
                        f"normative line carries {len(tokens)} status token(s), want exactly one of "
                        f"{'/'.join(STATUS_TOKENS)} - see rules/ddd-heuristic-status.md",
                    )
                else:
                    problem = check_status(line, tokens[0], line_plain)
                    if problem:
                        fail(path, number, problem)

            # normative shape: an item in Rules/Procedure needs a citation
            if is_skill and sections[index] in ("Rules", "Procedure") and not citations:
                if is_item or row_kind == "body":
                    grounded = (
                        "HALT" in line
                        or "rules/ddd-" in line
                        or "../../rules/" in line
                        or "anything else" in line.lower()
                        or "ddd-quote" in line
                    )
                    if not grounded:
                        fail(path, number, "normative line without a citation")

            for locator, marker, first_s, last_s in citations:
                citation_count += 1
                first = int(first_s)
                last = int(last_s) if last_s else first
                text = f"[DDD {locator} {marker}.{first_s}{'-' + last_s if last_s else ''}]"

                span = locator_range(locator, chapters)
                if span is None:
                    fail(path, number, f"{text}: unknown locator {locator!r}")
                    continue
                if (marker == "pp") != bool(last_s):
                    fail(path, number, f"{text}: use p. for one page and pp. for a range")
                    continue
                if last < first:
                    fail(path, number, f"{text}: reversed page range")
                    continue
                if not (span[0] <= first and last <= span[1]):
                    fail(path, number, f"{text}: outside {locator} ({span[0]}-{span[1]})")
                    continue
                if not (NORMATIVE_FIRST <= first and last <= NORMATIVE_LAST):
                    fail(path, number, f"{text}: outside the normative range {NORMATIVE_FIRST}-{NORMATIVE_LAST}")
                    continue

                # 4. a skill cites no page outside its declared ranges
                if declared is not None and sections[index] != "Source":
                    outside = [p for p in range(first, last + 1) if p not in declared and p not in shared_pages]
                    if outside:
                        fail(path, number, f"{text}: page(s) {outside} outside this skill's declared scope")
                        continue

                page_words, page_squashed, page_plain = page_text_blob(first, last)

                # modality preservation: a modal word in the line is on the page
                problem = check_modality(line, page_plain, page_squashed, text)
                if problem:
                    fail(path, number, problem)

                # 2 and 3. term coverage, with the caption-only exemption
                exempt_artifact = next(
                    (
                        f"{kind} {group}-{num}"
                        for kind, group, num in ARTIFACT_REF_RE.findall(line)
                        if f"{kind} {group}-{num}" in caption_only
                    ),
                    None,
                )
                if exempt_artifact:
                    continue
                # the Source section declares ranges rather than making a claim
                if sections[index] == "Source":
                    continue
                terms = significant_terms(line)
                if not terms:
                    continue
                matched = [t for t in terms if term_present(t, page_words, page_squashed)]
                coverage = len(matched) / len(terms)
                if coverage < TERM_COVERAGE_THRESHOLD:
                    missing = [t for t in terms if t not in matched]
                    fail(
                        path,
                        number,
                        f"{text}: only {len(matched)}/{len(terms)} terms on the cited page(s); missing {missing}",
                    )

        # 7. skill shape
        if is_skill:
            messages = check_skill_shape(path, lines, fences, sections)
            if messages:
                problems.setdefault(path, []).extend(messages)

    report = {path: messages for path, messages in problems.items() if messages}
    if not report:
        print(
            f"ddd_pdf.py verify: OK - {citation_count} citations and {quote_count} "
            f"ddd-quote fences resolved across {len(files)} files"
        )
        return 0
    for path in sorted(report):
        print(f"{path.relative_to(ROOT)}")
        for message in report[path]:
            print(message)
    total = sum(len(v) for v in report.values())
    print(f"ddd_pdf.py verify: FAILED - {total} problem(s) in {len(report)} file(s)")
    return 1


def check_quote(
    lines: list[str],
    opener: int,
    fences: list[str | None],
    citation: tuple[str, str, str, str],
    chapters: dict[int, tuple[int, int]],
) -> str | None:
    locator, marker, first_s, last_s = citation
    span = locator_range(locator, chapters)
    if span is None:
        return f"ddd-quote cites an unknown locator {locator!r}"
    first = int(first_s)
    last = int(last_s) if last_s else first
    if not (span[0] <= first and last <= span[1]):
        return f"ddd-quote cites p.{first_s} outside {locator} ({span[0]}-{span[1]})"

    body: list[str] = []
    index = opener + 1
    while index < len(lines) and fences[index] == QUOTE_FENCE:
        body.append(lines[index])
        index += 1
    if body and re.match(r"^\s*```", body[-1]):
        body.pop()
    quoted = squash(" ".join(body))
    if not quoted:
        return "ddd-quote fence is empty"
    _, page_squashed, _ = page_text_blob(first, last)
    if quoted not in page_squashed:
        return f"ddd-quote is not verbatim on p.{first_s}: {' '.join(body).strip()[:80]!r}"
    return None


def check_status(line: str, token: str, page_plain: str) -> str | None:
    """Token consistency: the line may not contradict the cited page's grade."""
    body = re.sub(r"`(?:RULE|HEURISTIC|PREFERENCE)`", " ", line).lower()
    body = re.sub(r"`[^`]*`", " ", body)
    body = re.sub(r"<[^>]*>", " ", body)
    heuristic = [m for m in HEURISTIC_MARKERS if contains_phrase(body, m)]
    preference = [m for m in PREFERENCE_MARKERS if contains_phrase(body, m)]
    page_heuristic = any(contains_phrase(page_plain, m) for m in HEURISTIC_MARKERS)
    page_preference = any(contains_phrase(page_plain, m) for m in PREFERENCE_MARKERS)
    if token == "RULE":
        if heuristic:
            return f"`RULE` line uses the heuristic wording {heuristic!r}; the book grades it lower"
        if preference:
            return f"`RULE` line uses the preference wording {preference!r}; the book grades it lower"
        return None
    if token == "HEURISTIC":
        if not heuristic and not page_heuristic:
            return (
                "`HEURISTIC` line: neither the line nor the cited page carries heuristic "
                "wording ('should', 'heuristic', 'rule of thumb', 'advisable', 'preferable')"
            )
        return None
    if not preference and not page_preference:
        return (
            "`PREFERENCE` line: neither the line nor the cited page carries preference "
            "wording ('prefer', 'preference', 'advice')"
        )
    return None


def check_modality(line: str, page_plain: str, page_squashed: str, text: str) -> str | None:
    body = re.sub(r"`[^`]*`", " ", line).lower()
    body = re.sub(r"<[^>]*>", " ", body)
    for canonical, variants in MODAL_VARIANTS.items():
        if not any(contains_phrase(body, v) for v in variants):
            continue
        on_page = any(
            contains_phrase(page_plain, v) or squash(v) in page_squashed for v in variants
        )
        if not on_page:
            return (
                f"{text}: the line says {canonical!r} and the cited page does not. "
                "Match the page's modal verb - see rules/ddd-heuristic-status.md"
            )
    return None


def skill_declared_pages(
    lines: list[str],
    fences: list[str | None],
    sections: list[str],
    chapters: dict[int, tuple[int, int]],
) -> set[int]:
    pages: set[int] = set()
    for index, line in enumerate(lines):
        if sections[index] != "Source" or fences[index] is not None:
            continue
        for locator, _, first_s, last_s in CITATION_RE.findall(line):
            span = locator_range(locator, chapters)
            if span is None:
                continue
            first = int(first_s)
            last = int(last_s) if last_s else first
            pages |= set(range(first, last + 1))
    return pages


def check_skill_shape(
    path: Path, lines: list[str], fences: list[str | None], sections: list[str]
) -> list[str]:
    messages: list[str] = []
    text = "\n".join(lines)

    front = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not front:
        messages.append("  frontmatter block is missing")
    else:
        name = re.search(r"^name:\s*(\S+)\s*$", front.group(1), re.MULTILINE)
        if not name:
            messages.append("  frontmatter has no name: field")
        elif not name.group(1).startswith("ddd-"):
            messages.append(f"  skill name {name.group(1)!r} does not start with 'ddd-'")
        elif name.group(1) != path.parent.name:
            messages.append(
                f"  skill name {name.group(1)!r} does not match directory {path.parent.name!r}"
            )
        if not re.search(r"^description:\s*\S", front.group(1), re.MULTILINE):
            messages.append("  frontmatter has no description: field")
    if not path.parent.name.startswith("ddd-"):
        messages.append(f"  skill directory {path.parent.name!r} does not start with 'ddd-'")

    headings = [
        line[3:].strip()
        for index, line in enumerate(lines)
        if fences[index] is None and line.startswith("## ")
    ]
    if headings != REQUIRED_SKILL_SECTIONS:
        messages.append(f"  sections are {headings}, expected {REQUIRED_SKILL_SECTIONS}")

    if "rules/ddd-answer-contract.md" not in text:
        messages.append(
            "  References does not cite rules/ddd-answer-contract.md; "
            "the answer contract binds every skill in the pack"
        )

    if not skill_declared_pages(lines, fences, sections, load_chapter_ranges()):
        messages.append("  the Source section declares no page range")

    # every table in Procedure and Halt conditions is exhaustive
    for index, line in enumerate(lines):
        if fences[index] is not None or sections[index] not in ("Procedure", "Halt conditions"):
            continue
        if _table_row_kind(lines, index) != "body":
            continue
        following = lines[index + 1] if index + 1 < len(lines) else ""
        if following.strip().startswith("|"):
            continue
        if not re.match(r"^\s*\|\s*anything else\s*\|", line, re.IGNORECASE):
            messages.append(
                f"  line {index + 1}: table ends without an `anything else` row; "
                "an incomplete table is where drift enters"
            )

    # the output template sits in a ddd-output fence
    if OUTPUT_FENCE not in [f for f in fences if f]:
        messages.append(f"  the Output template section has no ```{OUTPUT_FENCE} fence")

    # halt conditions name only the nine reason codes
    for index, line in enumerate(lines):
        if sections[index] != "Halt conditions" or fences[index] is not None:
            continue
        for code in re.findall(r"`([A-Z][A-Z_]{4,})`", line):
            if code not in REASON_CODES and code not in STATUS_TOKENS:
                messages.append(f"  line {index + 1}: {code!r} is not one of the nine reason codes")
    return messages


# --------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="ddd_pdf.py",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("index", help="rebuild references/ddd-page-index.md").set_defaults(
        func=cmd_index
    )
    subparsers.add_parser("listings", help="rebuild references/ddd-code-listings.md").set_defaults(
        func=cmd_listings
    )
    subparsers.add_parser(
        "artifacts", help="rebuild references/ddd-decision-artifacts.md"
    ).set_defaults(func=cmd_artifacts)

    pages = subparsers.add_parser("pages", help="dump extracted text for a page range")
    pages.add_argument("range", help="a PDF page or range, e.g. 188 or 185-193")
    pages.add_argument("--raw", action="store_true", help="skip normalization")
    pages.set_defaults(func=cmd_pages)

    options = subparsers.add_parser(
        "options", help="print a page's exercise questions with list markers rebuilt"
    )
    options.add_argument("range", help="single page or start-end")
    options.set_defaults(func=cmd_options)

    search = subparsers.add_parser("search", help="regex search across the PDF")
    search.add_argument("pattern")
    search.add_argument("--case-sensitive", action="store_true")
    search.set_defaults(func=cmd_search)

    subparsers.add_parser("verify", help="validate every [DDD ...] citation").set_defaults(
        func=cmd_verify
    )

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
