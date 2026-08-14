---
name: ig-analise-retencao
description: Use when the user wants to analyze what keeps viewers watching an Instagram Reel from start to finish — triggers on "retenção", "o que segura a pessoa", "pattern interrupts", "cliffhangers", "por que ele não solta a audiência", "loop de fechamento", "CTA", pointing at a folder of transcripts to find retention patterns, or comparing pacing/engagement triggers across a creator's videos.
---

# ig-analise-retencao

## Overview

Analisa o que segura a atenção do começo ao fim do vídeo: pattern interrupts, lacunas de curiosidade sustentadas, cliffhangers, re-ganchos no meio, mudanças de ritmo, gatilhos de engajamento (comentário/compartilhamento) e o loop ou CTA de fechamento.

**REQUIRED BACKGROUND:** Leia a skill `ig-contexto` primeiro — ela é a régua (gramática de viralização do Reels) usada para julgar a retenção aqui.

## Input

Aceita dois formatos:
- **Texto direto no prompt**: uma transcrição ou várias coladas juntas.
- **Caminho de pasta**: leia todos os arquivos de transcrição dentro dela.

Quando for pasta, junte as transcrições e analise o **conjunto**, buscando os mecanismos de retenção que o criador repete entre vídeos — não é descrever a retenção de um vídeo isolado, é mapear o repertório de técnicas do estilo dele. Ignore arquivos que não sejam transcrição de um vídeo (logs, índices, metadados) — use o conteúdo, não o nome do arquivo, para decidir. Se a pasta tiver poucos vídeos (menos de ~8), trate a seção "Técnicas recorrentes" como hipótese preliminar e diga isso explicitamente na saída.

## O que procurar

Para cada vídeo (ou padrão recorrente no conjunto), identifique:

- **Pattern interrupts**: mudanças bruscas de assunto, ritmo, tom de voz ou câmera que "acordam" quem está assistindo no meio do vídeo.
- **Lacunas de curiosidade sustentadas**: perguntas abertas no início que só se resolvem perto do fim, ou novas perguntas que substituem a anterior antes que ela feche.
- **Cliffhangers internos**: frases tipo "mas antes disso...", "só que aí aconteceu uma coisa", que adiam informação prometida.
- **Re-ganchos no meio**: pontos onde o criador reinjeta tensão/curiosidade (não só no início) para evitar queda de atenção no miolo do vídeo.
- **Mudança de ritmo**: alternância entre frases curtas/rápidas e pausas, aceleração antes de um clímax, desaceleração para dar peso emocional.
- **Gatilhos de engajamento**: convites diretos ou indiretos a comentar/compartilhar — perguntas à audiência, afirmações levemente polêmicas, pedidos explícitos ("comenta aí", "manda pra alguém que precisa ouvir isso").
- **Loop/CTA de fechamento**: retorno à imagem/frase de abertura (loop, incentiva replay) e/ou chamada final de ação.

## Formato de saída

- **Mapa de retenção por vídeo**: linha do tempo textual (abertura → meio → fechamento) apontando onde cada mecanismo aparece, com citação literal.
- **Técnicas recorrentes**: quais mecanismos o criador mais usa (ex: "sempre reabre curiosidade no meio com 'só que aí...'"), com frequência e exemplos.
- **Estrutura de fechamento**: como ele costuma fechar — loop, CTA direto, pergunta, ou simplesmente corta (sem gatilho) — e se isso é consistente entre vídeos.
- **Pontos de vazamento de atenção**: trechos sem pattern interrupt, sem tensão nova, onde a retenção provavelmente cai (fala longa, sem re-gancho, sem mudança de ritmo).

Sempre ancore com citações literais das transcrições — nunca dê conselho genérico sem exemplo real do material analisado.
