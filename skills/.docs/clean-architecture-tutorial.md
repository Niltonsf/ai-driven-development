# Clean Architecture — end-to-end

As 8 skills do pack, na ordem em que uma decisão puxa a outra.
Cada linha diz quando rodar aquela skill.

## A ordem

1. **`ca-boundaries`** — rode quando quero validar **onde traçar as linhas** do
   sistema, e quanto custa cada cruzamento.
2. **`ca-business-rules`** — rode quando quero validar **o que é Entity e o que
   é use case**, e o formato dos request/response models.
3. **`ca-dependency-rule`** — rode quando quero validar **para onde as
   dependências apontam**, e se um cruzamento precisa de inversão (DIP).
4. **`ca-solid`** — rode quando quero validar **uma classe ou um módulo**
   isolado contra SRP, OCP, LSP, ISP e DIP.
5. **`ca-component-design`** — rode quando quero validar **como agrupar em
   pacotes deployáveis**, e se existe ciclo entre eles.
6. **`ca-humble-object`** — rode quando quero validar **o que é testável**,
   separando o difícil de testar (View, banco) do resto.
7. **`ca-details`** — rode quando quero validar **o que é detalhe**: banco, web,
   framework, e onde Main entra.
8. **`ca-package-structure`** — rode quando quero **ver as quatro formas de
   organizar as pastas**. Ela apresenta e não escolhe por você.

## Os comandos

- **`/ca-audit`** — rode quando quero passar o checklist inteiro num codebase ou
  num desenho.
- **`/ca-review`** — o mesmo, só que limitado a um diff ou a um PR.
- **`/ca-explain`** — rode quando quero um termo só: uma página, uma definição.

## Quando ela para

- **Código em outra linguagem** — o livro escreve C, C++, Java, Clojure e
  assembler PDP-8. TypeScript e Python param com `CODE_STYLE_DIVERGENCE`.
- **Escolha de estrutura de pastas** — o cap.34 mostra quatro e não decide;
  a skill faz o mesmo.
- **Fora do livro** — qualquer regra sem página que resolva vira HALT, não
  palpite.

## O caminho curto

- **Começando um módulo** — 1 → 2 → 3, e para. O resto vem quando doer.
- **Revisando código que já existe** — `/ca-review` primeiro; ele te manda para
  a skill certa.
- **Só quero entender um termo** — `/ca-explain` e nada mais.
