# Flow inicial — do negócio ao código

O caminho completo: DDD decide **onde ficam as fronteiras e qual padrão usar**.
Clean Architecture decide **como o código se organiza dentro delas**.

## Regra que vale o flow inteiro

- **Pergunta sem resposta é HALT, não chute.** O HALT nomeia quem responde.
  Parar ali é resultado válido.
- **Quem decide no fim é você.** A skill relata o que o livro decide e o que
  ficou aberto.

---

## Parte 1 — DDD estratégico: onde ficam as fronteiras

### Passo 1 — Classificar o subdomínio (`ddd-subdomains`)

Pergunte ao negócio, nesta ordem:

- **Isso dá vantagem competitiva sobre os concorrentes?** Só core dá.
- **Daria para vender isso separado, como um produto?** Se sim, é core.
- **Já existe solução pronta e boa no mercado?** Então é generic: compre.
- **A lógica é cadastro/CRUD ou algoritmo com regra que não pode quebrar?**
- **Com que frequência isso muda?** Core muda muito, supporting quase não.

> Sem essa resposta, nada depois faz sentido. É o passo que mais para.

### Passo 2 — Acertar a linguagem (`ddd-ubiquitous-language`)

- **Esses nomes são os que o negócio usa?** Se você traduziu, já errou.
- **Duas palavras para a mesma coisa?** Sinônimo é sinal de fronteira errada.
- **A mesma palavra com dois sentidos?** Aí são dois contextos, não um.

### Passo 3 — Desenhar os contextos (`ddd-bounded-contexts`)

- **Onde esse modelo deixa de valer?** Ali termina o contexto.
- **Quantos times mexem nisso?** Dois times no mesmo contexto é proibido.
- **Um time pode ter vários contextos?** Pode. O contrário, não.

### Passo 4 — Ligar os contextos (`ddd-integration-patterns`)

- **Quem fornece e quem consome?** Upstream e downstream.
- **Os times colaboram de verdade ou só se falam por contrato?**
- **Quem dita o formato?** Se o de cima dita e o de baixo sofre, precisa de
  anticorruption layer.

> **Falta conhecimento do domínio, não decisão?** Pare e rode
> `ddd-eventstorming` antes de seguir.

---

## Parte 2 — DDD tático: como implementar dentro da fronteira

### Passo 5 — Escolher o padrão (`ddd-design-heuristics`, o roteador)

Quatro perguntas, primeira que der "sim" ganha:

- **Rastreia dinheiro, precisa de log auditável, ou o negócio exige análise
  profunda do comportamento?** → event-sourced domain model.
- **A lógica tem regras e invariantes que se afetam?** → domain model.
- **Os dados são aninhados mas as regras são simples?** → active record.
- **Nenhuma das anteriores?** → transaction script.

> Cuidado: "quero guardar histórico" quase nunca é event sourcing. Log de
> auditoria é tabela append-only.

### Passo 6 — Desenhar o agregado (`ddd-domain-model`)

Só se o passo 5 apontou domain model. Pergunte:

- **Que regra precisa ser verdadeira o tempo todo?** Esse é o invariante.
- **Que dados o negócio exige consistentes no mesmo instante?** Só eles entram
  no agregado.
- **Dado eventualmente consistente aqui gera estado inválido?** Se não, fica
  fora do agregado.
- **Duas pessoas mexem nisso ao mesmo tempo?** Se não, pode separar sem medo.
- **Regra final:** agregado o menor possível. Referência entre agregados é por
  id, nunca por objeto.

### Passo 7 — Confirmar arquitetura e teste (`ddd-architectural-patterns`)

- **Event sourcing** → CQRS, senão a consulta fica inviável.
- **Domain model** → ports & adapters.
- **Active record** → camadas com application service.
- **Transaction script** → camadas mínimas.

---

## Parte 3 — Clean Architecture: o código dentro da fronteira

### Passo 8 — Traçar as linhas (`ca-boundaries`)

- **O que muda por motivo diferente?** Entre os dois passa uma linha.
- **Quanto custa cruzar essa linha?** Chamada de função é barata, rede é cara.

### Passo 9 — Separar regra de caso de uso (`ca-business-rules`)

- **Essa regra vale mesmo sem computador?** Então é Entity.
- **Isso só existe porque o sistema existe?** Então é use case.
- **O que entra e o que sai do use case?** Request e response models próprios,
  nunca a Entity crua.

### Passo 10 — Apontar as dependências (`ca-dependency-rule`)

- **O domínio importa framework, ORM ou HTTP?** Se sim, está invertido.
- **Precisa chamar para fora?** Declare a interface dentro e implemente fora.
- **Teste único:** apague a infra e o domínio continua compilando.

### Passo 11 — Empurrar o detalhe para fora (`ca-details`, `ca-humble-object`)

- **Banco, web e framework são detalhe.** Decida por último, troque sem dor.
- **O que é difícil de testar?** Isole numa casca fina sem lógica.

---

## A junção

- **DDD te entrega:** o tipo do subdomínio, a fronteira do contexto, o padrão de
  lógica e o agregado.
- **Clean Architecture te entrega:** as camadas, o sentido das dependências e o
  que é detalhe.
- **Um módulo por bounded context.** Dentro dele, as camadas da Clean.

## Checklist antes de codar

- [ ] Sei o tipo do subdomínio e quem me disse isso.
- [ ] Os nomes são os do negócio.
- [ ] Sei onde o contexto termina e de quem ele é.
- [ ] Sei o padrão de lógica e por qual pergunta ele venceu.
- [ ] Sei o invariante do agregado, ou sei que não há um.
- [ ] O domínio não importa nada de infraestrutura.

## Os dois atalhos

- **Módulo novo do zero:** passos 1, 3, 5, depois 8 a 10.
- **Feature num módulo que já existe:** passo 5, a skill que ele apontar, e o
  passo 10 antes de abrir o PR.
