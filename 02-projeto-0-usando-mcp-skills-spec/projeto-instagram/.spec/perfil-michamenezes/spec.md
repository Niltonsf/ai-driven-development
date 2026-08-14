# Geração do Perfil de Comunicação do Michamenezes

## Tarefas

### Fase 1: obtenção dos dados

- [ ] Obter a lista de vídeos do instagram da conta @michamenezes usando o mcp `mcps/instagram-lista-videos-csv`
- [ ] Obter os 10 melhores vídeos do instagram da conta @michamenezes usando o mcp `mcps/instagram-top-videos-download`
- [ ] Transcrever os videos usando o mcp `mcps/video-transcricao`

### Fase 2: análise das transcrições

- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-ganchos` e criar um arquivo para armazenar o resultado da análise em `ig-analise-ganchos.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-retencao` e criar um arquivo para armazenar o resultado da análise em `ig-analise-retencao.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-storytelling` e criar um arquivo para armazenar o resultado da análise em `ig-analise-storytelling.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-vocabulario` e criar um arquivo para armazenar o resultado da análise em `ig-analise-vocabulario.md`
- [ ] Gere o arquivo final de perfil de comunicação usando a skill `.claude/skills/ig-perfil-comunicacao` com base nas analises anteriores no perfil `perfil-michamenezes.md`
