# mcp-site-extractor

Servidor [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) **standalone** que expõe a extração de páginas web (HTML, CSS, JS, imagens, fontes) como ferramentas chamáveis por agentes (Claude Code, Codex CLI, Cursor, Continue, Windsurf e qualquer outro cliente MCP via stdio).

A engine usa **Playwright** para captura real de rede + reescrita de assets, permitindo abrir o site offline.

Esta pasta é totalmente autocontida — pode ser movida ou copiada para qualquer lugar sem dependências externas.

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm

## Instalação

```bash
cd mcp-site-extractor
npm install
```

O `postinstall` baixa o Chromium do Playwright. Para forçar manualmente:

```bash
npx playwright install chromium
```

## Tools expostas

### `extract_site`
Baixa uma página (e opcionalmente links internos do mesmo domínio).

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `url` | string | sim | URL completa da página. |
| `recursive` | boolean | não | Segue links internos do mesmo domínio. Padrão: `false`. |
| `maxPages` | integer | não | Limite de páginas no modo recursivo. Padrão: `25`. |
| `outputDir` | string | não | Pasta destino. Padrão: `<pacote>/sites` ou env `SITES_DIR`. |

Retorna um resumo em texto + `structuredContent` com `siteRoot`, `entryPageAbsolutePath`, `pageCount`, `finalUrl`, etc.

Durante a execução, cada passo é enviado como `notifications/message` (logging do MCP). Clientes que mostram logs do servidor (ex.: Claude Code) exibem o progresso em tempo real.

### `list_sites`
Lista os sites já extraídos. Aceita `outputDir` opcional.

### `delete_site`
Remove uma pasta de site. Parâmetros: `folderName` (relativo, conforme `list_sites`) e `outputDir` opcional.

## Configuração nos clientes MCP

### Claude Code

Pasta atual já contém um [.mcp.json](.mcp.json) — basta abrir o Claude Code dentro da pasta `mcp-site-extractor/` e ele detecta automaticamente.

Para registrar globalmente:

```bash
claude mcp add site-extractor -- node /caminho/absoluto/mcp-site-extractor/src/mcp-server.mjs
```

Ou no `.mcp.json` do seu projeto consumidor:

```json
{
  "mcpServers": {
    "site-extractor": {
      "command": "node",
      "args": ["/caminho/absoluto/mcp-site-extractor/src/mcp-server.mjs"],
      "env": {
        "SITES_DIR": "/onde/quero/salvar/sites"
      }
    }
  }
}
```

### Codex CLI (`~/.codex/config.toml`)

```toml
[mcp_servers.site-extractor]
command = "node"
args = ["/caminho/absoluto/mcp-site-extractor/src/mcp-server.mjs"]

[mcp_servers.site-extractor.env]
SITES_DIR = "/onde/quero/salvar/sites"
```

### Cursor / Continue / Windsurf

Mesmo formato JSON do Claude Code (`command` + `args`). Consulte a documentação de cada cliente para o local exato do arquivo de configuração.

### Execução direta (debug)

```bash
npm start
```

O servidor fala MCP via **stdio**. Sem cliente conectado ele apenas espera por mensagens JSON-RPC.

## Pasta de saída

Resolução, em ordem:

1. parâmetro `outputDir` da chamada;
2. variável de ambiente `SITES_DIR`;
3. `<pacote>/sites`.

Estrutura por site:

```
sites/
  host/
    subpath/
      index.html
      css/
      js/
      assets/{images,fonts,media,files}/
      .site-meta.json     # URL original/final, recursive, pageCount, data
      .route-map.json     # mapeamento de rotas remotas → arquivos locais
```

## Comportamento

- Modo padrão: baixa **somente** a página informada e seus assets referenciados.
- Modo `recursive: true`: segue links internos do mesmo domínio (limite `maxPages`).
- Se a pasta destino já existir, é apagada antes de baixar de novo.
- Captura recursos via Playwright (rede + DOM), com fallback HTTP para o que não foi visto na rede.
- Faz scroll para acionar lazy loading.
- Tenta extrair conteúdo real de `iframe/srcdoc`.
- Reescreve caminhos para abrir 100% offline.

## Limitações esperadas

Mesmo com Playwright, alguns sites podem ter diferenças locais por:

- proteções anti-bot / validação de ambiente;
- APIs externas com CORS;
- scripts de terceiros que dependem da origem;
- fluxos autenticados ou conteúdo dependente de sessão.

## Estrutura interna

- [src/mcp-server.mjs](src/mcp-server.mjs) — entrypoint MCP (stdio), declara as tools.
- [src/downloader.js](src/downloader.js) — motor de extração (Playwright + reescrita de HTML/CSS/JS/assets), autocontido.
- [.mcp.json](.mcp.json) — config pronta para Claude Code rodar a partir desta pasta.

## Observação

Use em ambiente local e para fins educacionais, respeitando termos de uso e direitos autorais dos sites analisados.
