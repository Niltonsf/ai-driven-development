#!/usr/bin/env python3
"""Inject the answer contract when a prompt touches the book-locked packs.

Reads the UserPromptSubmit payload on stdin and, when the prompt mentions DDD,
Clean Architecture or either pack directory, prints the five rules back as
additional context. Anything else prints nothing and exits 0.
"""
import json
import re
import sys

TRIGGER = re.compile(
    r"""
    \bddd\b
  | domain[\s_-]*driven
  | clean[\s_-]*arch
  | skills/(domain-driven-design|clean-architecture)
  | \bagregado?s?\b
  | \baggregates?\b
  | bounded[\s_-]*context
  | subdom[ií]nio|subdomain
  | value[\s_-]*object|objeto[\s_-]*de[\s_-]*valor
  | ubiquitous|linguagem[\s_-]*ub[ií]qua
  | dependency[\s_-]*rule|humble[\s_-]*object
  | \bca-[a-z-]+|\bddd-[a-z-]+
    """,
    re.IGNORECASE | re.VERBOSE,
)

CONTRACT = """Contrato dos packs travados em livro (skills/domain-driven-design,
skills/clean-architecture). Vale para esta resposta:

1. Só a saída do livro conta. Afirmação sem página que `verify` resolve não é
   achado: ela sai do template e vai para uma seção "Fora do livro", rotulada
   como leitura sua.
2. Nada é assumido. Todo input marcado REQUIRES_* é perguntado ao humano, nunca
   inferido do código nem de um default plausível. Input sem resposta é HALT, e
   HALT é resultado válido.
3. Citação não se escolhe a dedo. Se páginas dentro do `## Source` declarado
   trazem regras que apontam contra a conclusão, imprima essas regras também.
4. Rode a skill cujo `## Source` cobre a pergunta. O roteador
   `ddd-design-heuristics` não decide fronteira de agregado — isso é
   `ddd-domain-model`. Responder pelo roteador sozinho é o mesmo que responder
   sem o livro.
5. O julgamento final é do humano. Relate o que o livro decide e o que ficou em
   aberto; nunca imprima sua preferência como veredicto do livro.

Antes de afirmar uma citação, resolva-a nesta sessão com
`python3 tools/ddd_pdf.py pages <n>` ou `search`, conforme o pack.
Regras completas: rules/ddd-answer-contract.md e rules/ca-answer-contract.md."""


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0

    prompt = payload.get("prompt") or ""
    if not isinstance(prompt, str) or not TRIGGER.search(prompt):
        return 0

    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": CONTRACT,
            },
            "suppressOutput": True,
        },
        sys.stdout,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
