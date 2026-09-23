# Clean Architecture, travado no livro

Um conjunto de skills, regras e comandos do Claude Code cuja única fonte de
verdade é um PDF desta pasta:

```
clean-architecture-a-craftsmans-guide-to-software-structure-and-design.pdf
```

Robert C. Martin, *Clean Architecture: A Craftsman's Guide to Software
Structure and Design*, Pearson, 2018. 364 páginas de PDF, nunca modificado.

Toda regra daqui existe numa página que você pode abrir. Se não está no PDF,
não está aqui: o artefato para em vez de improvisar.

## O que diferencia isto de um pacote de skills comum

1. **Determinismo.** Passos numerados, tabelas de decisão exaustivas,
   templates de saída fixos. Frases de hedge reprovam a verificação.
2. **Prefixo `ca-`.** Toda skill, regra e comando começa com `ca-`, então quem
   lê sabe que o artefato está travado no livro.
3. **Citação de página em tudo.** Toda linha normativa termina com uma citação
   num formato único, com a página do PDF em base 1, e um script prova isso:

   ```
   [CA ch.22 p.161]        uma página
   [CA ch.14 pp.98-115]    um intervalo
   ```

4. **Parar em vez de derivar.** Fora do livro, a resposta é um bloco de HALT
   fixo com um código de motivo. Veja `rules/ca-halt-protocol.md`.

## Idioma

As respostas, explicações e veredictos que as skills entregam são em
português. O que é escrito em arquivo continua em inglês: identificadores,
comentários, as próprias skills e estas regras. A regra completa, com a linha
exata entre as duas coisas, está em `rules/ca-language.md`.

O andaime dos templates não é traduzido. Títulos, rótulos de campo, cabeçalhos
de tabela, códigos de motivo e o formato da citação são reproduzidos
literalmente; o que preenche os espaços é que vai em português. Traduzir os
rótulos faria o mesmo achado parecer dois achados diferentes, que é exatamente
a deriva que `rules/ca-determinism.md` existe para impedir.

Os termos que o livro define ficam em inglês dentro da frase em português:
Entity, use case, Humble Object, Main, Dependency Rule, REP, CCP, CRP, ADP,
SDP, SAP.

## Contrato com o leitor

Cinco regras que amarram toda skill deste pacote. Existem porque um pacote
travado no livro ainda consegue entregar uma conclusão confiante que o livro
nunca sustentou.

1. **Só a saída do livro conta.** Uma afirmação sem página que resolve não é um
   achado. Ela pode até ser dita, mas vai rotulada como opinião e fica fora do
   template de saída, nunca misturada nele.
2. **Nada é assumido.** Todo input que uma skill marca como pendente é
   perguntado, nunca inferido do código nem do que parece razoável. Input sem
   resposta é HALT, e HALT é resultado válido, não obstáculo a contornar.
3. **Citação não se escolhe a dedo.** Quando páginas dentro do escopo declarado
   trazem regras que apontam contra a conclusão, essas regras também são
   impressas. Citação verdadeira não torna a conclusão certa.
4. **A skill certa roda.** Toda skill declara seu `## Source` e seu intervalo de
   capítulos. Responder com uma skill cujo escopo não cobre a pergunta é o mesmo
   que responder sem o livro: `ca-solid` não decide fronteira de componente, e
   `ca-boundaries` não decide estrutura de pacote.
5. **O julgamento é do leitor.** O pacote relata o que o livro decide e o que
   ficou em aberto. Escolher entre o livro, a convenção do projeto e a
   abordagem de um professor é decisão do leitor, e o pacote nunca apresenta a
   preferência dele como veredicto do livro.

A regra 3 é a mais fácil de quebrar sem perceber. Uma citação real, colada numa
conclusão que as páginas vizinhas contradizem, passa por rigor sem ser rigor.

## Estrutura

```
tools/ca_pdf.py          extração e verificação
references/              índice de páginas, listagens de código, um card por parte do livro
rules/                   as seis regras que amarram toda skill
skills/                  as oito skills ca-*
commands/                /ca-audit, /ca-review, /ca-explain
divergences.md           append-only, começa vazio
```

## A ferramenta

```bash
python3 tools/ca_pdf.py index                    # regera references/page-index.md
python3 tools/ca_pdf.py listings                 # regera references/code-listings.md
python3 tools/ca_pdf.py pages 161-166            # texto extraído de um intervalo
python3 tools/ca_pdf.py search "Dependency Rule" # busca por regex, imprime páginas do PDF
python3 tools/ca_pdf.py verify                   # o portão
```

`verify` é a definição de pronto. Para todo `.md` desta pasta ele checa que:

- a página citada cai dentro do intervalo daquele capítulo em `page-index.md`;
- ao menos 60% das palavras de conteúdo da linha que cita aparecem no texto
  extraído daquela página, depois de normalizar espaços e o artefato de
  versalete que o extrator produz (`T HE C LEAN` vira `THE CLEAN`);
- nenhum arquivo contém uma frase de hedge da lista em
  `rules/ca-determinism.md`;
- toda skill tem as seis seções exigidas, na ordem, com um `name:` em `ca-`
  igual ao nome do diretório;
- nenhuma skill cita capítulo fora do escopo declarado no seu `## Source`;
- toda linha de regra, passo, linha de tabela e bullet de card está ancorada,
  no livro ou num arquivo de protocolo de `rules/`.

Saída 0 é limpo. Saída 1 imprime um relatório por arquivo e por linha.

O spec de implementação, `2026-09-21-ca-skills-implementation-prompt.md`, é o
único arquivo que a varredura de frases ignora: ele cita as frases proibidas
como dado.

Depende de `pypdf`. O `CryptographyDeprecationWarning` fica silenciado.

## As oito skills

| Skill | Capítulos | Escopo |
|---|---|---|
| `ca-dependency-rule` | 22, 11, 19 | Dependências apontam para dentro; cruzamento via DIP; policy e nível |
| `ca-solid` | 7-11 | SRP, OCP, LSP, ISP, DIP no nível em que o livro os trata |
| `ca-component-design` | 12-14 | REP, CCP, CRP; ADP e ciclos; SDP, SAP; as métricas I, A e D |
| `ca-boundaries` | 17, 18, 24, 25 | Quais linhas, quanto custa cada cruzamento, completa ou parcial |
| `ca-business-rules` | 20, 16, 21 | Entities, use cases, request e response models, independência |
| `ca-humble-object` | 23, 28 | Presenter e View, gateways, mappers, testes como parte do sistema |
| `ca-details` | 26, 30-32 | Banco, web, frameworks, e Main como o detalhe final |
| `ca-package-structure` | 34 | Apresenta quatro abordagens e não escolhe nenhuma |

As partes I e II (cap.1-6) recebem cards de referência, não skills: são
enquadramento, não procedimento. Os capítulos 15, 27, 29 e 33 são referência
pelo mesmo motivo.

## As seis regras

| Arquivo | O que amarra |
|---|---|
| `rules/ca-source-of-truth.md` | O PDF é a única fonte, e o que fica de fora |
| `rules/ca-citation.md` | Formato da citação, onde ela vai, o que o verificador checa |
| `rules/ca-halt-protocol.md` | Quando parar, os códigos de motivo, o bloco literal |
| `rules/ca-code-fidelity.md` | As linguagens que o livro escreve, e o halt para as outras |
| `rules/ca-determinism.md` | Os cinco testes e a lista de frases proibidas |
| `rules/ca-language.md` | Português para o leitor, inglês para o arquivo |

## O que para

`OUT_OF_SCOPE`, `CODE_STYLE_DIVERGENCE`, `AMBIGUOUS_IN_BOOK`,
`CONFLICT_WITH_PROJECT`, `CITATION_UNVERIFIED`. O bloco é fixo; veja
`rules/ca-halt-protocol.md`.

Dois halts disparam com frequência, e estão corretos ao disparar:

- **Código em outra linguagem.** O livro escreve C, C++, Java, um trecho em
  Clojure e uma listagem em assembler PDP-8. Um pedido de TypeScript, Python
  ou Go para com `CODE_STYLE_DIVERGENCE`. As outras pastas deste repositório
  são TypeScript e NestJS, então isso dispara contra elas por construção.
- **A escolha do cap.34.** O livro apresenta quatro organizações de código e
  não escolhe nenhuma. `ca-package-structure` apresenta as quatro e para na
  escolha.

O que for decidido fora do livro vai para `divergences.md`, append-only.

## Duas coisas que a tabela do spec errou

`ca_pdf.py index` re-deriva os intervalos de capítulo a partir do PDF e achou
cinco páginas finais uma ou duas páginas antes do que a tabela feita à mão do
spec dizia, porque divisores e introduções de parte ficam entre capítulos. O
`references/page-index.md` gerado é o que vale:

| Capítulo | Spec dizia | Gerado |
|---|---|---|
| 2 | 33-37 | 33-36 |
| 6 | 56-63 | 56-61 |
| 11 | 83-87 | 83-86 |
| 14 | 98-116 | 98-115 |
| 29 | 195-208 | 195-207 |

O spec também listava Ruby entre as linguagens de código do livro.
Re-derivado com `ca_pdf.py listings`, o livro menciona Ruby em prosa e não
escreve nenhuma listagem em Ruby. Ruby não é, portanto, linguagem de saída
permitida; veja `rules/ca-code-fidelity.md`.

## Direitos autorais

Frases curtas são citadas onde a redação exata é a regra. Todo o resto é
reescrito, com a página. Nenhum capítulo é extraído em massa para
`references/`.
