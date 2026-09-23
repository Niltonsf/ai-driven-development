## 2026-09-22 — rebuilding omitted list markers

The PDF draws exercise list markers as separate fragments at x=0. For chapter 3
question 3 it emits only three of the four, so `pages` prints the first option
as part of the prompt and letters every later option one position early: the
answer key letters that question D, and `pages` shows the matching option as C.

Decision: `tools/ddd_pdf.py options` rebuilds the lettering. An unmarked line at
the prompt's indentation, after the prompt and before the first lettered option,
is that question's first option. The command prints a warning on every question
it reletters, so the repair is never silent, and `/ddd-exercise` step 3 reads
questions through it instead of `pages`.

Scope: one question out of the 53 the answer key letters. `pages` is unchanged,
so every citation the verifier resolves is still resolved against untouched
extracted text.
