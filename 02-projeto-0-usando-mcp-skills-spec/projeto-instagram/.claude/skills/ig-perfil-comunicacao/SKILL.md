---
name: ig-perfil-comunicacao
description: Use when the request is to create/generate a creator's "perfil de comunicação", consolidate the ganchos/vocabulário/storytelling/retenção analyses into one artifact, build a voice profile or style guide for an Instagram influencer, join separate analyses into a single profile, or produce something that lets an AI rewrite copy in that creator's voice — triggers on "perfil de comunicação", "perfil de voz", "guia de estilo", "consolidar análises", "juntar as análises", "escrever como ele/ela", "copy no estilo de".
---

# ig-perfil-comunicacao

## Overview

Esta é a skill de **síntese**. Ela pega as quatro análises de dimensão (`ig-analise-ganchos`, `ig-analise-vocabulario`, `ig-analise-storytelling`, `ig-analise-retencao`) e funde tudo em um único arquivo Markdown: o **perfil de comunicação** do criador.

O perfil não é um relatório para ler uma vez e arquivar. É uma **ferramenta reutilizável**: alguém vai colar esse arquivo junto de uma copy qualquer, em uma conversa nova, e pedir para reescrever o texto na voz do criador. Por isso, o resultado precisa ser:

- **Prescritivo** — regras acionáveis ("faça X", "evite Y"), não observações neutras ("o criador tende a usar X").
- **Autossuficiente** — tem que funcionar sozinho, colado em uma conversa sem acesso às transcrições originais nem às skills `ig-analise-*`. Nunca escreva algo como "conforme a análise de ganchos indicou" — o leitor daquele momento não tem a análise, só tem o perfil.

**REQUIRED BACKGROUND:** Leia a skill `ig-contexto` antes de sintetizar — ela é a régua (gramática de viralização do Reels) usada para julgar o que é assinatura de voz vs. o que é só comportamento genérico de qualquer criador de Reels.

## Input

Aceita dois formatos, à escolha de quem pede:

1. **Análises já prontas** — as saídas de `ig-analise-ganchos`, `ig-analise-vocabulario`, `ig-analise-storytelling` e `ig-analise-retencao` coladas no prompt. Vá direto para a síntese.
2. **Transcrições brutas** — quando não houver análises prontas, produza-as você mesmo antes de sintetizar, aplicando os critérios de cada uma das quatro skills (`ig-analise-*`) sobre as transcrições, com a lente de `ig-contexto` carregada. Isso é o que permite a esta skill funcionar sozinha, de ponta a ponta, sem depender de uma execução prévia separada.

Em ambos os casos, o princípio que define o perfil é o mesmo: **um traço que aparece em um único vídeo é acidente; um traço que se repete em vários vídeos é assinatura.** Só vira regra no perfil o que se repete. Se o material de origem for escasso (poucos vídeos, ou análises pouco conclusivas), diga isso explicitamente no "Resumo da voz" em vez de apresentar hipóteses preliminares como padrões confirmados.

## Como sintetizar

1. **Carregue a lente de plataforma** lendo `ig-contexto` — ela distingue o que é "erro" pela norma culta do que é escolha funcional no Reels. Nunca sugira "corrigir" um traço de voz para um registro mais formal.
2. **Reúna as quatro dimensões** (gancho, vocabulário/tom, storytelling, retenção) como material bruto de síntese.
3. **Resolva sobreposições.** É comum o mesmo traço aparecer em mais de uma análise (ex.: um bordão que é achado tanto em vocabulário quanto em gancho). Cite cada traço **uma única vez**, com sua citação literal, na seção onde ele é mais forte/mais acionável — não repita a mesma citação em duas seções do perfil. Quando duas dimensões estiverem genuinamente conectadas (ex.: o fechamento retoma literalmente a pergunta do gancho), mantenha a citação só na seção mais forte e apenas mencione a ligação em prosa na outra, sem duplicar o exemplo.
4. **Priorize a assinatura sobre o genérico.** Toda análise vai trazer coisas que qualquer criador de Reels faz (gancho nos 3s, tom casual) e coisas que só *esse* criador faz (um bordão específico, uma estrutura narrativa recorrente, um jeito peculiar de fechar). O perfil deve dar peso e destaque ao que diferencia essa voz de qualquer outra — isso é o que faz uma copy reescrita "soar como ele" em vez de "soar como Reels genérico".
5. **Ancore tudo em citações literais** das análises/transcrições. Uma regra sem exemplo real é uma opinião; uma regra com citação é uma calibração.
6. **Defina claramente o que evitar** para cada dimensão: registro (nível de formalidade que soaria errado), palavras (termos que o criador nunca usaria), ritmo (estruturas de frase ou cadência estranhas à voz dele). Essa lista de "evitar" é tão prescritiva quanto as regras positivas.

## Formato de saída

Gere um único arquivo Markdown seguindo este template fixo (todas as seções são obrigatórias, nessa ordem):

```markdown
# Perfil de Comunicação — <Nome do Criador>

## Resumo da voz
[Parágrafo curto: quem é essa voz em 3-5 frases. Se a base de vídeos for pequena/pouco conclusiva, declare isso aqui.]

## Princípios da voz
[3-8 regras curtas, cada uma no formato:]
- **[Regra acionável]** — Por quê: [razão, ancorada em citação ou padrão observado].

## Gancho / abertura
[Como abrir uma copy nessa voz: tipo(s) de gancho preferido, estrutura de frase de abertura, fórmulas que se repetem.]
- Exemplo literal: "..."

## Vocabulário e tom
[Registro, formas de tratamento, complexidade de frase, bordões.]
**Bordões e expressões:** lista com citação de cada um.
**Evitar:** lista explícita de palavras/registro/tom que quebrariam a voz.

## Estrutura narrativa
[Como essa voz costuma estruturar uma história/argumento: arco, uso de exemplo concreto vs. abstrato, personagens.]
- Exemplo literal: "..."

## Retenção e ritmo
[Mecanismos que essa voz usa para não deixar o leitor/ouvinte largar: pattern interrupts, cliffhangers, re-ganchos, forma de fechar.]
- Exemplo literal: "..."

## Banco de exemplos literais
[Citações organizadas por dimensão — o material de calibração cru, para consulta rápida ao reescrever uma copy.]

## Como aplicar a uma copy
[Passo a passo prático para reescrever um texto qualquer nesta voz.]
1. ...
2. ...
3. ...

**Checklist de conformidade** (antes de entregar a copy reescrita):
- [ ] ...
- [ ] ...
```

Todas as seções de análise (gancho, vocabulário, estrutura narrativa, retenção) precisam trazer pelo menos uma citação literal como âncora de calibração — nunca apenas descrição abstrata do traço.

## Arquivo de saída

Salve como arquivo Markdown. Use o nome indicado no prompt, se houver; caso contrário, use `perfil-comunicacao-<criador>.md` no diretório atual. Ao final, informe onde o arquivo foi salvo.
