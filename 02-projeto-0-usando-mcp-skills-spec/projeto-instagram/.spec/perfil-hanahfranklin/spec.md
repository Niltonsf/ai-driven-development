# Geração do Perfil de Comunicação do Hanahfranklin

## Tarefas

### Fase 1: obtenção dos dados

- [x] Obter a lista de vídeos do instagram da conta @hanahfranklin usando o mcp `mcps/instagram-lista-videos-csv`
  - **Evidência:** executado em 2026-07-23 12:45:21 -03. Resultado: 717 vídeos coletados (717 novos, 0 atualizados) em 122 páginas percorridas, 1 erro ignorado (`web_profile_info: HTTP 400 Bad Request`). Arquivo gerado: `videos/hanahfranklin/dados/lista.csv`.
- [x] Obter os 10 melhores vídeos do instagram da conta @hanahfranklin usando o mcp `mcps/instagram-top-videos-download`
  - **Evidência:** executado em 2026-07-23 12:50:07 -03. Resultado: 10/10 vídeos baixados, 0 erros. Arquivos: `1_DX5FXQPhWZF.mp4` (658711 likes), `2_DGGKgG8RY4n.mp4` (540822), `3_DGivnY3RN5p.mp4` (272298), `4_DBjcfH8P_db.mp4` (240892), `5_DG5qaWZRPZq.mp4` (207718), `6_DHBVhl_RJCn.mp4` (198751), `7_C_OtomXSmMq.mp4` (167077), `8_DElIlC7Sg0l.mp4` (152578), `9_DHl9m8XygOi.mp4` (147999), `10_DPAM7t8jWR5.mp4` (133708), salvos em `videos/hanahfranklin/dados/`.
- [x] Transcrever os videos usando o mcp `mcps/video-transcricao`
  - **Evidência:** executado em 2026-07-23 12:52:41 -03 (via `node index.js` do MCP, idioma `pt`). Resultado: 10 transcritos, 0 já existiam, 0 com erro (de 10 vídeos). Arquivos `.transcricao.txt` gerados ao lado de cada `.mp4` em `videos/hanahfranklin/dados/`.

### Fase 2: análise das transcrições

- [x] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-ganchos` e criar um arquivo para armazenar o resultado da análise em `ig-analise-ganchos.md`
  - **Evidência:** executado em 2026-07-23 12:53–12:57 -03. Skill `ig-analise-ganchos` aplicada às 10 transcrições em `videos/hanahfranklin/dados/`. Arquivo gerado: `videos/hanahfranklin/dados/ig-analise-ganchos.md` (identificou 2 pilares de conteúdo — relacionamento e análise de criadores virais — cada um com fórmula de gancho própria).
- [x] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-retencao` e criar um arquivo para armazenar o resultado da análise em `ig-analise-retencao.md`
  - **Evidência:** executado em 2026-07-23 12:57–12:58 -03. Arquivo gerado: `videos/hanahfranklin/dados/ig-analise-retencao.md` (mapa de retenção por vídeo, técnicas recorrentes, estrutura de fechamento e pontos de vazamento de atenção).
- [x] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-storytelling` e criar um arquivo para armazenar o resultado da análise em `ig-analise-storytelling.md`
  - **Evidência:** executado em 2026-07-23 12:58–12:59 -03. Arquivo gerado: `videos/hanahfranklin/dados/ig-analise-storytelling.md` (arco narrativo por vídeo, padrões recorrentes, banco de especificidade e batidas emocionais).
- [x] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-vocabulario` e criar um arquivo para armazenar o resultado da análise em `ig-analise-vocabulario.md`
  - **Evidência:** executado em 2026-07-23 12:59 -03. Arquivo gerado: `videos/hanahfranklin/dados/ig-analise-vocabulario.md` (glossário, padrão de tratamento, perfil de registro, referências culturais e assinatura verbal).
- [x] Gere o arquivo final de perfil de comunicação usando a skill `.claude/skills/ig-perfil-comunicacao` com base nas analises anteriores no perfil `perfil-hanahfranklin.md`
  - **Evidência:** executado em 2026-07-23 12:59–13:01 -03. Skill `ig-perfil-comunicacao` aplicada sobre as 4 análises de dimensão já geradas (ganchos, retenção, storytelling, vocabulário), com a lente `ig-contexto`. Arquivo gerado: `perfil-hanahfranklin.md` (raiz do projeto) — perfil prescritivo com 8 princípios de voz, glossário, estrutura narrativa, mecânica de retenção, banco de citações literais e checklist de conformidade para reescrita de copy.

---

## Resumo de execução (spec concluída)

Spec executada de ponta a ponta em 2026-07-23, das 12:45 às 13:01 (-03). Todas as 8 tarefas marcadas como concluídas, com evidência registrada em cada item acima. Artefatos gerados:
- `videos/hanahfranklin/dados/lista.csv` (717 vídeos)
- `videos/hanahfranklin/dados/*.mp4` (10 vídeos mais curtidos)
- `videos/hanahfranklin/dados/*.transcricao.txt` (10 transcrições)
- `videos/hanahfranklin/dados/ig-analise-ganchos.md`
- `videos/hanahfranklin/dados/ig-analise-retencao.md`
- `videos/hanahfranklin/dados/ig-analise-storytelling.md`
- `videos/hanahfranklin/dados/ig-analise-vocabulario.md`
- `perfil-hanahfranklin.md` (raiz do projeto)
