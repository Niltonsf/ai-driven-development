---
name: site-extractor-download
description: Baixa um site/página web para a pasta `sites/` do projeto usando o MCP `site-extractor` (ferramenta `mcp__site-extractor__extract_site`). Dispara quando o usuário pede para "baixar site", "extrair site", "salvar página", "fazer download de URL" ou similar. Se o usuário fornecer a URL no comando, baixa imediatamente; se não fornecer, pergunta a URL antes de prosseguir.
---

# site-download

Skill simples para automatizar o download de um site via MCP `site-extractor`.

## Comportamento

1. **URL**:
   - Se a URL veio nos argumentos (ex.: `/site-download https://exemplo.com`), use-a.
   - Se não veio, pergunte em uma única frase curta: "Qual a URL do site que você quer baixar?" e aguarde.

2. **Modo (recursivo ou página única) — OBRIGATÓRIO perguntar se não foi explícito**:
   - Se o usuário já indicou explicitamente no prompt o modo (ex.: "baixe recursivo", "só essa página", "página única", "site inteiro"), respeite.
   - Caso contrário, pergunte: "Modo recursivo (baixa o site seguindo links) ou página única (apenas esta URL)?" e aguarde a resposta.

3. **Quantidade de páginas — só perguntar se modo recursivo e não explícito**:
   - Se o modo for recursivo e o usuário não tiver dito quantas páginas quer (ex.: "recursivo, 50 páginas"), pergunte: "Quer manter o padrão de 25 páginas ou ajustar para um número maior?" e aguarde a resposta.
   - Se o usuário já indicou um número, use-o sem perguntar.

4. **Chamada do MCP**:
   - Página única: `mcp__site-extractor__extract_site` com `{ "url": "<URL>" }`. Não passe `recursive` nem `maxPages`.
   - Recursivo: `{ "url": "<URL>", "recursive": true, "maxPages": <N> }` onde `<N>` é 25 (padrão) ou o número informado.
   - Nunca passe `outputDir` — deixe o padrão do MCP (a pasta `sites/` do pacote).

5. **Após a chamada**:
   - Reporte em 1–2 linhas: a pasta de saída e o caminho da página inicial local retornados pelo MCP.
   - Não faça nada além disso. Sem leitura de arquivos baixados, sem análise, sem próximos passos.

## Regras

- A skill NÃO instala dependências, NÃO inicia o MCP, NÃO mexe em `mcp-servers/site-extractor/`. Assume que o MCP já está conectado.
- Se a ferramenta `mcp__site-extractor__extract_site` não estiver disponível, informe o usuário que o MCP `site-extractor` não está conectado e pare.
- Se a URL informada não tiver esquema (`http://` / `https://`), adicione `https://` antes de chamar.
- Uma chamada por invocação da skill. Sem loops, sem múltiplas URLs.
