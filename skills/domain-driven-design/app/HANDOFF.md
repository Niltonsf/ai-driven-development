# Flow do Projeto — o que falta

Formulário de DDD publicado como artifact.
URL: `https://claude.ai/artifact/6Qcm3hKd5s5Jo3UdtTyT8H`
Arquivo: `flow-projeto.html` (nesta pasta).

Para continuar: leia o artifact com `Artifact` action `read` antes de publicar,
e publique de volta na mesma URL com `capabilities: {"db": {}}`.

## O que a página já faz

Três níveis: negócio (1×), áreas do negócio (N, cada uma com suas respostas),
resumo derivado. Salva em `projects/<id>` e `projects/<id>/subdomains/<sid>`,
com localStorage como reserva. Exemplos de 4 domínios atrás de um botão `?`.
Glossário de 21 termos. Fundo claro fixo, visual Apple.

Capítulos cobertos: cap. 1 (tipos de área), cap. 2 parcial (linguagem),
cap. 10 (árvore de decisão), cap. 6 parcial (agregado).

## O que falta — em ordem de impacto

### 1. Bounded contexts — cap. 3, pp. 59-73. NÃO EXISTE na página.

O buraco principal. Subdomínio se descobre, bounded context se desenha; a
página só tem o primeiro, então pula da área direto para o código.

Perguntas obrigatórias que faltam:

- Os domain experts têm modelos mentais conflitantes da mesma entidade?
  [DDD cap.3 pp.59-62]
- Quantos times vão implementar? Um bounded context é implementado, evoluído e
  mantido por um time só; dois times nunca dividem o mesmo contexto.
  [DDD cap.3 p.68] — o contrário é permitido: um time pode ter vários contextos.
- Quais requisitos não-funcionais pedem ciclo de vida separado? [cap.3]
- O que precisa escalar sozinho? [cap.3]

Consequência estrutural: o agregado pertence ao bounded context, não à área.
Hoje ele está pendurado na área.

### 2. Integração entre contextos — cap. 4, pp. 75-86. NÃO EXISTE.

8 entradas obrigatórias, quase todas sobre organização e não sobre código:
qualidade da comunicação entre os times, se as metas dependem uma da outra, se
os times estão distribuídos geograficamente, se política ou geografia impedem
parceria, custo de duplicação contra custo de coordenação, quem dita o
contrato, se o time de baixo aceita o modelo do time de cima, e se algum dos
contextos implementa uma área central.

Skill: `ddd-integration-patterns`.

### 3. Coberturas parciais

Linguagem do negócio, cap. 2 — a página cobre 2 de 5 entradas. Faltam:

- Existe um domain expert disponível para conversar? [cap.2]
- Qual é o propósito que o modelo tem que servir? Todo modelo tem um
  propósito, e um modelo eficaz só contém o detalhe necessário para ele.
  [DDD cap.2 p.54]
- O conhecimento tácito que só existe na cabeça do domain expert. [cap.2]

Agregado, cap. 6 — a página cobre 4 de 5 entradas. Falta:

- A linguagem do bounded context para cada nome do modelo. [cap.6]

### 4. Capítulos inteiros de fora

- cap. 9, pp. 163-181 — comunicação entre componentes (`ddd-communication-patterns`)
- cap. 11 e 13 — como o desenho muda quando o negócio cresce (`ddd-evolving-design-decisions`)
- cap. 12, pp. 211-225 — eventstorming, a oficina que descobre tudo isso (`ddd-eventstorming`)
- cap. 14, pp. 251-258 — fronteira de microsserviço (`ddd-microservice-boundaries`)
- cap. 5, pp. 89-99 e cap. 7, pp. 125-142 e cap. 8, pp. 143-162 — o detalhe de
  cada padrão que a árvore do cap. 10 escolhe

## Regras que valem para quem continuar

- Não inventar regra de DDD. Conferir em `../skills/<nome>/SKILL.md` e resolver
  a citação com `python3 ../tools/ddd_pdf.py search "<trecho>"`.
  Atenção: `search` usa a numeração do livro; `pages <n>` usa a página crua do
  PDF, que é outra numeração.
- Rodar a skill cujo `## Source` cobre a pergunta. `ddd-design-heuristics` é
  roteador e não decide fronteira de agregado — isso é `ddd-domain-model`.
- Zona cinzenta e contradição aparecem na tela como pergunta em aberto, nunca
  como veredito.
- Campo em branco não é erro: é a lista de perguntas para o negócio.
- Todo texto em português simples, e toda sigla com o significado entre
  parênteses ao lado.
- Manter: salvamento automático com indicador, reserva em localStorage, botão
  de copiar em Markdown, exemplos com o botão `?`, glossário, fundo claro.

## Clean Architecture

Ainda não entrou. O plano é entrar depois que a parte estratégica do DDD
estiver completa. Pack em `../../clean-architecture/`.
