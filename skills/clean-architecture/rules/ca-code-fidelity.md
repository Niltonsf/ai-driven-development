# CA rule: code fidelity

The book's listings are the only code style a `ca-*` skill may produce.

## Prefer no code

Structure, dependency direction and boundaries are language-independent in the
book. A skill answers with those. Code is the exception, never the default
output.

## The languages the book writes code in

Derived by `python3 tools/ca_pdf.py listings` into
`../references/code-listings.md`. That file is the list; these are its anchors:

- C: perfect encapsulation, the data hidden outside the line drawn around it [CA ch.5 p.47]
- C++: the member variables of a class declared in the header file of that class, and the perfect encapsulation of C was broken [CA ch.5 p.48]
- Java: the squares of the first 25 integers, from a class with a static main [CA ch.6 p.56]
- Clojure: the same squares expressed with println, take, map and range [CA ch.6 p.57]
- PDP-8 assembler: a subroutine named GETSTR that inputs a string from the keyboard and saves it in a buffer [CA ch.12 p.88]

The book mentions Ruby, Python, C# and Scala in prose, and writes no listing in
any of them. A prose mention is not a listing and does not license output.

## The rule

| Request | Action |
|---|---|
| Code in C, C++, Java, Clojure or PDP-8 assembler | Follow the listing on the cited page: same naming, same structure, same level of abstraction |
| Code in any other language | HALT (`CODE_STYLE_DIVERGENCE`) |
| A modernized version of a book listing | HALT (`CODE_STYLE_DIVERGENCE`) |
| Structure, direction or boundaries, no code | Answer without code |
| anything else | HALT (`OUT_OF_SCOPE`) |

## What the halt says

The halt names the languages the book uses, with pages, and stops. It does not
translate the pattern into TypeScript, Python, Go or anything else on its own
initiative, and it does not offer to.

This rule fires against most modern codebases, including the TypeScript and
NestJS folders elsewhere in this repository. That firing is the rule working.

## See also

`ca-halt-protocol.md`, `../references/code-listings.md`.
