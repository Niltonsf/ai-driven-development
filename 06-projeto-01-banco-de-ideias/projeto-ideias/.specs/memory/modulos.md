# Módulos

Este arquivo é o **cabeçalho dos módulos de negócio** do Banco de Ideias: uma visão geral,
não técnica, do que cada módulo faz e por que existe. O detalhamento de conceitos e regras
de negócio de cada módulo fica no markdown próprio dentro de `modules/`.

O produto tem **apenas dois módulos de negócio**: **Autenticação** e **Ideias**. Não há
previsão de um terceiro — novas funcionalidades entram como uma nova área dentro de um
desses dois módulos. A integração com Inteligência Artificial é tratada como
**infraestrutura**, não como módulo de negócio.

---

## Autenticação

Cuida de quem é o usuário: cadastro de conta e verificação de credenciais no login. É o
módulo que garante que cada pessoa acesse apenas os próprios dados. Não decide como a
sessão é mantida depois do login — isso é responsabilidade técnica da aplicação.

- Onde está fisicamente: `modules/auth`
- Detalhes de negócio: [modules/auth.md](modules/auth.md)

---

## Ideias

É o núcleo do produto. Concentra todo o ciclo de valor: capturar uma ideia, organizá-la
por um tipo (que carrega um prompt especializado), transformá-la em conteúdo pronto com
IA, refinar o resultado quantas vezes for preciso e acompanhar tudo por um painel de
entrada. Reúne quatro áreas de negócio relacionadas: Tipos de Ideia, Ideias,
Processamentos e o Dashboard.

- Onde está fisicamente: `modules/ideas`
- Detalhes de negócio: [modules/ideas.md](modules/ideas.md)

---

## Infraestrutura de IA (não é módulo de negócio)

A geração e o refinamento de texto, além da transcrição de voz, são fornecidos por uma
camada de infraestrutura genérica que não conhece os conceitos do produto (Ideia, Tipo,
Processamento). O módulo de Ideias apenas consome essa capacidade através de um contrato
abstrato, o que permite trocar o provedor de IA sem afetar as regras de negócio.
