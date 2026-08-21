# Produto — Banco de Ideias

## Em uma frase

O **Banco de Ideias** é uma aplicação web onde o usuário captura ideias, organiza-as por tipo (cada tipo carrega um prompt especializado) e usa Inteligência Artificial para transformar essas ideias em conteúdo pronto — podendo reprocessar e refinar o resultado quantas vezes precisar, mantendo o histórico de cada geração.

Narrativa central do produto: **"capture ideias, processe com IA, reaproveite quantas vezes precisar"**.

## Para quem

Usuário individual e autenticado que produz conteúdo a partir de ideias (ex.: roteiros de vídeo para redes sociais, roteiros virais, VSL, resumos de conteúdo). Cada usuário só enxerga e manipula os próprios dados — toda entidade de negócio pertence a um `userId` e toda consulta filtra por ele.

## Conceitos do domínio

- **Tipo de Ideia** (`idea-type`): categoria reutilizável que carrega um **prompt especializado**. O prompt é um texto livre com marcadores `{{name}}`, `{{description}}`, `{{objective}}` e `{{resources}}`, substituídos pelos dados da Ideia no momento do processamento. O usuário pode escrever os próprios ou importar uma biblioteca de **Tipos pré-definidos** (carga em massa, idempotente, disponível só enquanto o usuário não tem nenhum Tipo cadastrado).
- **Ideia** (`idea`): cabeçalho com `name`, `description`, `objective` e o vínculo
  (`ideaTypeId`) com um Tipo de Ideia. Não guarda resultado.
- **Recurso** (`Resource`): material de contexto anexado a uma Ideia (relação
  mestre–detalhe, persistido junto da Ideia). No MVP só o tipo `text`; o modelo (`type` +
  `content`) já prevê tipos futuros (`image`, `document`, `audio`, `video-url`). Máx. 20
  por Ideia.
- **Processamento** (`processing`): agregado próprio que tira um **snapshot** da Ideia +
  Recursos + prompt do Tipo no momento da criação e gera o primeiro Resultado via IA.
  Cada Processamento tem uma trilha de **Iterações** (refinamentos sucessivos, máx. 50),
  cada iteração com `refinement` e `result`. A mesma Ideia pode originar vários
  Processamentos independentes. Editar a Ideia depois **não** afeta Processamentos antigos.
- **Dashboard**: visão de entrada da área privada (somente leitura) — contagens de Ideias,
  Tipos e Processamentos, acesso rápido às ações comuns, gráfico de atividade dos últimos
  7 dias e lista das últimas Ideias atualizadas.

## Decisões de produto relevantes

- **Snapshot, não referência viva**: Processamento congela os dados da Ideia/Tipo na criação. Garante que resultados antigos não mudem quando a Ideia é editada.
- **Carga de Tipos padrão é gate por "zero registros"**: quem já personalizou a biblioteca
  nunca mais recebe o seed automático, mesmo apagando registros depois.
- **IA é detalhe de infraestrutura**, não conceito de negócio. O domínio depende de uma porta abstrata (`AiProvider`), nunca da OpenAI diretamente. Existem dois canais de IA: geração/refinamento de texto e transcrição de voz (ditado), independentes entre si.
- O conteúdo gerado pela IA é renderizado como **Markdown** na timeline do Processamento.

## Estado atual

MVP funcional ponta a ponta entregue por 12 specs (todas arquivadas em `.specs/archive/`): base do projeto, registro/login, identidade visual, CRUD de Tipo de
Ideia + carga de padrões, CRUD de Ideia + Recursos, módulo de IA (texto e voz), Processamento com iterações e Dashboard. Não há specs ativas em `.specs/changes/`.

## Fora de escopo (evolução futura, registrada nas specs)

Streaming de respostas da IA, full-text search (`tsvector`) na busca de Ideias, exclusão de iteração isolada, cache de gerações, ajuste de fuso horário no gráfico do dashboard, novos tipos de Recurso além de texto, drag-and-drop de Recursos.
