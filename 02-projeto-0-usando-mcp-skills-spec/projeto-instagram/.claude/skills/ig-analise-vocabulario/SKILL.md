---
name: ig-analise-vocabulario
description: Use when the user wants to analyze the speech style, tone, and word choice of an Instagram creator's Reels transcripts — triggers on "vocabulário", "como ele fala", "bordões", "gírias", "jeito de falar", "linguagem", "palavrões", "referências culturais", pointing at a folder of transcripts to find recurring speech patterns, or comparing tone/register across a creator's videos.
---

# ig-analise-vocabulario

## Overview

Analisa o jeito de falar do criador: gírias, bordões, formas de tratamento, complexidade das frases, palavrões, referências culturais e expressões recorrentes.

**REQUIRED BACKGROUND:** Leia a skill `ig-contexto` primeiro — ela é a régua (gramática de viralização do Reels) usada para julgar o vocabulário aqui.

## Input

Aceita dois formatos:
- **Texto direto no prompt**: uma transcrição ou várias coladas juntas.
- **Caminho de pasta**: leia todos os arquivos de transcrição dentro dela.

Quando for pasta, junte as transcrições e analise o **conjunto**, buscando o repertório de fala que se repete — o que aparece uma vez é acidente, o que se repete em vários vídeos é assinatura de voz do criador. Ignore arquivos que não sejam transcrição de um vídeo (logs, índices, metadados) — use o conteúdo, não o nome do arquivo, para decidir. Se a pasta tiver poucos vídeos (menos de ~8), trate a "Assinatura verbal" como hipótese preliminar e diga isso explicitamente na saída.

## O que procurar

- **Gírias e expressões de época/região**: termos de internet ou regionais que ele usa naturalmente, com frequência.
- **Bordões**: frases ou palavras que voltam quase idênticas em vídeos diferentes — a "marca registrada" verbal do criador.
- **Formas de tratamento**: como ele chama a audiência ("gente", "mano", "cê", "meu povo", "pessoal") e se isso muda por tipo de conteúdo.
- **Complexidade das frases**: frases curtas e diretas ou períodos mais longos? Uso de gramática "de fala" (elisões, concordância informal) vs. fala mais "cuidada".
- **Palavrões e nível de informalidade**: presença, frequência e contexto de uso (ênfase, humor, desabafo) — sem julgar, só documentar o padrão.
- **Referências culturais**: memes, música, novela, futebol, política, religião — o que ele referencia e para que público isso sinaliza pertencimento.
- **Expressões recorrentes de conectivo**: como ele costura frases ("aí", "tipo assim", "só que", "daí", "e aí"), que também formam parte da assinatura de voz.

## Formato de saída

- **Glossário do criador**: lista de gírias/bordões/expressões recorrentes, cada uma com 1–2 citações literais de onde aparece.
- **Padrão de tratamento**: como ele se dirige à audiência, com exemplos.
- **Perfil de registro**: descrição do nível de formalidade/complexidade de frase, com exemplos representativos (uma frase curta típica, uma mais longa se houver).
- **Referências culturais mapeadas**: quais aparecem e o que sinalizam sobre o público-alvo.
- **Assinatura verbal**: síntese de 3–6 traços de fala que, juntos, tornariam um texto reconhecível como "escrito na voz dele" — a parte mais acionável do resultado.

Sempre ancore com citações literais das transcrições — nunca dê conselho genérico sem exemplo real do material analisado.
