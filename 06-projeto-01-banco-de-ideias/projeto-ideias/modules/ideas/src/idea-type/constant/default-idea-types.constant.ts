/**
 * Tipos de Ideia pré-definidos carregados pelo caso de uso `load-default-idea-types`.
 *
 * Este arquivo é o ARTEFATO DE REFERÊNCIA da spec 006-carregar-tipos-padrao.
 * Na implementação, copie-o (conteúdo e nome) para:
 *   modules/ideas/src/idea-type/constant/default-idea-types.constant.ts
 *
 * Restrições da entidade `IdeaType` (ver idea-type.entity.ts) — respeitadas aqui:
 *   - name:        obrigatório, 3..120 caracteres
 *   - description: obrigatório, 10..500 caracteres
 *   - prompt:      obrigatório, 20..8000 caracteres
 *
 * Os prompts usam os quatro marcadores de dupla chave que serão substituídos
 * pelos dados da Ideia no processamento (spec futura):
 *   {{name}}        -> nome da Ideia
 *   {{description}} -> descrição da Ideia
 *   {{objective}}   -> objetivo da Ideia
 *   {{resources}}   -> recursos/materiais de apoio da Ideia
 *
 * `id` e `userId` NÃO entram aqui: o caso de uso atribui um uuid novo (gerado
 * pela base `Entity`) e o `userId` do usuário autenticado a cada item.
 */
export const DEFAULT_IDEA_TYPES: ReadonlyArray<{
  name: string;
  description: string;
  prompt: string;
}> = [
  {
    name: "Roteiro de vídeo para rede social",
    description:
      "Gera um roteiro curto e dinâmico (Reels, TikTok, Shorts) com gancho nos primeiros segundos, desenvolvimento objetivo e chamada para ação. Ideal para vídeos verticais de 30 a 90 segundos.",
    prompt: `Você é um roteirista especialista em vídeos curtos para redes sociais
(Instagram Reels, TikTok e YouTube Shorts).

Crie um roteiro de vídeo vertical com base nas informações abaixo:

- Tema da ideia: {{name}}
- Descrição: {{description}}
- Objetivo do vídeo: {{objective}}
- Recursos e materiais de apoio: {{resources}}

Estruture o roteiro exatamente assim:

1. GANCHO (0s–3s)
   Uma frase de impacto que prenda a atenção imediatamente.

2. DESENVOLVIMENTO (3s–60s)
   3 a 5 blocos curtos, cada um com a fala e uma sugestão de imagem ou
   corte. Linguagem simples, direta e conversacional.

3. CHAMADA PARA AÇÃO (últimos 5s)
   Um convite claro alinhado ao objetivo informado.

Regras:
- Duração total entre 30 e 90 segundos.
- Tom adequado ao público da ideia.
- Use apenas os recursos informados; não invente dados.`,
  },
  {
    name: "Roteiro de vídeo viral",
    description:
      "Cria um roteiro pensado para máximo compartilhamento: gancho polêmico ou surpreendente, tensão narrativa, payoff e gatilho de compartilhamento. Focado em retenção e alcance orgânico.",
    prompt: `Você é um especialista em conteúdo viral e psicologia de
compartilhamento em redes sociais.

A partir das informações abaixo, escreva um roteiro projetado para
maximizar retenção, comentários e compartilhamentos:

- Tema da ideia: {{name}}
- Descrição: {{description}}
- Objetivo: {{objective}}
- Recursos e materiais de apoio: {{resources}}

Entregue o roteiro nesta estrutura:

1. GANCHO VIRAL (0s–3s)
   Abertura surpreendente, contraintuitiva ou que gere curiosidade
   imediata. Evite introduções genéricas.

2. ESCALADA DE TENSÃO
   Conduza o espectador por uma sequência que aumente a curiosidade,
   segurando a informação principal até o momento certo.

3. PAYOFF
   A revelação ou virada que recompensa quem assistiu até aqui.

4. GATILHO DE COMPARTILHAMENTO
   Uma frase final que motive o espectador a marcar alguém ou
   compartilhar, conectada ao objetivo informado.

Regras:
- Cada bloco deve indicar fala + sugestão visual.
- Mantenha frases curtas e ritmo acelerado.
- Baseie-se somente nos recursos fornecidos.`,
  },
  {
    name: "Vídeo VSL (Video Sales Letter)",
    description:
      "Produz o roteiro de uma carta de vendas em vídeo: identificação do problema, agitação da dor, apresentação da solução, prova, oferta e chamada para ação persuasiva. Voltado para conversão.",
    prompt: `Você é um copywriter sênior especializado em VSL (Video Sales
Letter) de alta conversão.

Escreva o roteiro completo de uma VSL com base em:

- Produto/oferta (tema da ideia): {{name}}
- Descrição: {{description}}
- Objetivo de conversão: {{objective}}
- Recursos, provas e materiais de apoio: {{resources}}

Siga esta estrutura clássica de VSL:

1. ABERTURA / PROMESSA
   Capte a atenção com a grande promessa ou uma pergunta provocativa.

2. PROBLEMA
   Descreva com precisão a dor do público-alvo.

3. AGITAÇÃO
   Aprofunde as consequências de não resolver esse problema.

4. SOLUÇÃO
   Apresente a oferta como o caminho lógico e desejável.

5. PROVA
   Use os recursos informados (depoimentos, dados, autoridade) para
   sustentar a credibilidade. Não invente provas.

6. OFERTA
   Detalhe o que está incluso e a proposta de valor.

7. CHAMADA PARA AÇÃO
   Instrução clara e urgente, alinhada ao objetivo informado.

Regras:
- Tom persuasivo, porém honesto — sem promessas não suportadas
  pelos recursos.
- Marque a duração estimada de cada bloco.`,
  },
  {
    name: "Resumo de conteúdo",
    description:
      "Transforma um material extenso (artigo, transcrição, aula, e-book) em um resumo estruturado com pontos-chave, principais aprendizados e conclusão objetiva. Útil para revisão e reaproveitamento.",
    prompt: `Você é um especialista em síntese e curadoria de conteúdo.

Resuma o material descrito abaixo de forma clara, fiel e organizada:

- Título/tema: {{name}}
- Descrição do conteúdo: {{description}}
- Objetivo do resumo: {{objective}}
- Conteúdo-fonte e materiais de apoio: {{resources}}

Entregue o resumo nesta estrutura:

1. RESUMO EXECUTIVO
   2 a 3 frases que capturam a essência do conteúdo.

2. PONTOS-CHAVE
   Lista de 5 a 8 tópicos com os argumentos ou fatos mais relevantes.

3. PRINCIPAIS APRENDIZADOS
   O que o leitor deve memorizar ou aplicar na prática.

4. CONCLUSÃO
   Fechamento objetivo conectado ao objetivo informado.

Regras:
- Seja fiel ao conteúdo-fonte: não adicione informações que não
  estejam nos recursos fornecidos.
- Linguagem clara e neutra.
- Preserve termos técnicos importantes do material original.`,
  },
];
