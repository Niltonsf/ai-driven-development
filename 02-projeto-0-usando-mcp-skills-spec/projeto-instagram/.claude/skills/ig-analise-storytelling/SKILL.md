---
name: ig-analise-storytelling
description: Use when the user wants to analyze the narrative construction of Instagram Reels transcripts — triggers on "storytelling", "arco da história", "como ele conta histórias", "estrutura narrativa", "personagens e exemplos", "loops abertos", "batidas emocionais", pointing at a folder of transcripts to find narrative patterns, or comparing story structure across a creator's videos.
---

# ig-analise-storytelling

## Overview

Analisa a construção narrativa das transcrições: arco da história, uso de personagens e exemplos concretos, loops abertos e seus payoffs, estrutura de argumento (listas, jornada, antes/depois), batidas emocionais, e o uso do específico vs. abstrato.

**REQUIRED BACKGROUND:** Leia a skill `ig-contexto` primeiro — ela é a régua (gramática de viralização do Reels) usada para julgar a narrativa aqui.

## Input

Aceita dois formatos:
- **Texto direto no prompt**: uma transcrição ou várias coladas juntas.
- **Caminho de pasta**: leia todos os arquivos de transcrição dentro dela.

Quando for pasta, junte as transcrições e analise o **conjunto**, buscando os padrões narrativos que o criador repete — não é resumir a história de um vídeo isolado, é entender a "fórmula" de como ele constrói narrativa em geral. Ignore arquivos que não sejam transcrição de um vídeo (logs, índices, metadados) — use o conteúdo, não o nome do arquivo, para decidir. Se a pasta tiver poucos vídeos (menos de ~8), trate a seção "Padrões recorrentes" como hipótese preliminar e diga isso explicitamente na saída.

## O que procurar

- **Arco da história**: identifique começo/situação inicial, complicação/tensão, e resolução/virada. Nem todo vídeo tem os três — note quando falta resolução (proposital, como gancho para outro vídeo) ou quando a complicação é fraca.
- **Personagens e exemplos concretos**: quem aparece na história (o próprio criador, terceiros nomeados ou não, "um amigo meu", "minha esposa")? O criador usa casos específicos e nomeados, ou fica no genérico ("as pessoas", "muita gente")?
- **Loops abertos e payoffs**: promessas feitas cedo ("vou te contar o que aconteceu depois") e onde/se são pagas depois. Loops não pagos dentro do próprio vídeo podem ser intencionais (ganchar para o próximo conteúdo) — não trate isso automaticamente como falha.
- **Estrutura de argumento**: o vídeo segue lista numerada ("3 motivos..."), jornada cronológica ("primeiro... depois... no fim..."), comparação (antes/depois, eu vs. você), ou argumento livre sem estrutura aparente?
- **Batidas emocionais**: pontos de tensão, alívio, humor, vulnerabilidade, indignação — onde aparecem na linha do tempo do vídeo e que palavras/frases carregam essa emoção.
- **Específico vs. abstrato**: o criador ancora em detalhes sensoriais e concretos (números, nomes, diálogo reconstituído) ou fala em generalidades? Detalhe específico costuma reter mais — note a proporção entre os dois.

## Formato de saída

- **Estrutura narrativa por vídeo**: arco identificado (situação → tensão → virada/resolução) com citações literais marcando cada fase.
- **Padrões recorrentes**: estruturas de argumento que se repetem (ex: "quase todo vídeo é lista de 3"), tipo de personagem mais comum, presença/ausência de resolução.
- **Banco de especificidade**: exemplos de detalhes concretos usados (nomes, números, falas reconstituídas) vs. trechos abstratos, com citação.
- **Batidas emocionais mapeadas**: onde o criador injeta emoção e com que recurso (palavra, repetição, pausa implícita na pontuação da transcrição).

Sempre ancore com citações literais das transcrições — nunca dê conselho genérico sem exemplo real do material analisado.
