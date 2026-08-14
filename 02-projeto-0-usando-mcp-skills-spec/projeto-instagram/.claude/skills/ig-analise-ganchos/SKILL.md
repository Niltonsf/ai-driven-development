---
name: ig-analise-ganchos
description: Use when the user wants to analyze the opening/hook of Instagram Reels transcripts — triggers on "ganchos", "aberturas", "primeiros segundos", "o que trava o scroll", "hook analysis", "como ele abre os vídeos", pointing at a folder of transcripts to find opening patterns, or a request to classify/compare hook types across a creator's videos.
---

# ig-analise-ganchos

## Overview

Analisa **só os primeiros segundos** de cada vídeo (a primeira 1–3 frases da transcrição, o que seria dito antes de qualquer corte de contexto). Classifica o tipo de gancho, explica por que ele trava o scroll, e mapeia os padrões de abertura que o criador repete entre vídeos.

**REQUIRED BACKGROUND:** Leia a skill `ig-contexto` primeiro — ela é a régua (gramática de viralização do Reels) usada para julgar os ganchos aqui.

## Input

Aceita dois formatos, à escolha de quem pede:
- **Texto direto no prompt**: uma transcrição ou várias coladas juntas.
- **Caminho de pasta**: leia todos os arquivos de transcrição dentro dela.

Quando for pasta, junte todas as transcrições identificadas por arquivo/vídeo e analise o **conjunto** — o objetivo é achar os padrões de abertura que se repetem no estilo do criador, não descrever um vídeo isolado. Ignore arquivos que não sejam transcrição de um vídeo (logs, índices, metadados) — use o conteúdo, não o nome do arquivo, para decidir: se não for fala transcrita, não é transcrição. Um gancho que aparece uma vez é acidente; um que se repete em 3+ vídeos é assinatura. Se a pasta tiver poucos vídeos (menos de ~8), trate os agrupamentos da seção "Padrões do criador" como hipóteses preliminares e diga isso explicitamente na saída, em vez de apresentá-los com a confiança de um padrão confirmado.

## Tipos de gancho (classificação)

Use estas categorias (ou nomeie uma nova se nenhuma encaixar):

| Tipo | Descrição | Por que trava o scroll |
|---|---|---|
| Pergunta provocadora | Abre com pergunta que a audiência quer ver respondida | Cria lacuna de curiosidade imediata |
| Afirmação chocante/controversa | Frase que contraria senso comum ou expectativa | Gera choque cognitivo, quebra o piloto automático do scroll |
| Confissão pessoal | "Eu vou contar uma coisa que..." | Promete intimidade/exclusividade |
| In medias res | Começa no meio da ação, sem contexto | Força a pessoa a assistir para entender o que está acontecendo |
| Promessa de valor/lista | "3 coisas que ninguém te conta sobre..." | Deixa claro o ganho de continuar assistindo |
| Negação/contraste | "Isso não é sobre X, é sobre Y" | Subverte expectativa inicial da audiência |
| Chamada direta ao espectador | "Se você já passou por isso..." | Cria identificação/pertencimento imediato |
| Cena visual/física sem fala | Ação abre antes da primeira frase | Curiosidade puramente visual (menos comum em transcrição) |
| Áudio de tendência/meme sonoro | Transcrição fonética de um trend cantado/falado, pouco legível como frase | Reconhecimento de padrão auditivo — a melodia/trend reconhecível trava o scroll antes do sentido ser processado; é senha de comunidade, não ideia verbal |

## Como analisar

1. Extraia a abertura de cada vídeo (primeira(s) frase(s) antes do desenvolvimento).
2. Classifique cada uma usando a tabela acima.
3. Para cada gancho, explique **especificamente** por que ele funciona (que lacuna de curiosidade abre, que emoção provoca) — não repita a definição genérica do tipo.
4. Agrupe por padrões recorrentes: que tipo(s) o criador mais usa, que estrutura de frase se repete, que palavras de abertura voltam ("Gente...", "Eu vou te contar...").
5. Aponte variações e outliers — ganchos que fogem do padrão do criador, e se funcionam ou não.

## Formato de saída

- **Ganchos por vídeo**: tipo classificado + citação literal + por que funciona (2–4 linhas cada).
- **Padrões do criador**: lista dos 2–4 tipos de gancho mais recorrentes, com contagem/frequência e citações de exemplo.
- **Fórmulas de abertura**: frases/estruturas que se repetem quase literalmente entre vídeos, se houver.
- **Pontos fracos**: ganchos que demoram a abrir uma pergunta, ou abrem a resposta cedo demais (mata a curiosidade).

Sempre ancore com citações literais das transcrições — nunca dê conselho genérico sem exemplo real do material analisado.
