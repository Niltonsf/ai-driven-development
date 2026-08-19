# Template discovery protocol (Fase 1)

## Objetivo

Varrer o template HTML em profundidade para descobrir todas as páginas relevantes e mapeá-las para rotas Next.js.

## Passos

### 1. Rodar o script de inventário

```bash
node .claude/skills/ui-template-admin-pages-to-nextjs/scripts/extract-pages-inventory.mjs <template-path> > <template-path>/.pages-inventory.json
```

O script percorre todos os `.html` na raiz e em subpastas comuns (`pages/`, `views/`, `templates/`, `html/`), e produz JSON com:

```json
{
  "templateRoot": "...",
  "pages": [
    {
      "file": "dashboard.html",
      "title": "...",
      "hasShell": true,           // tem aside+main? (sidebar + content)
      "blocks": [                  // blocos detectados na main
        {"type": "stat-card", "row": 0, "col": 0},
        {"type": "chart", "subtype": "line|bar|pie|...", "row": 1, "col": 0, "wide": true},
        {"type": "table", "row": 2},
        {"type": "list", "subtype": "activity"},
        {"type": "progress-group"}
      ]
    }
  ],
  "authPages": [...],     // login, register, lock, forgot, reset, verify
  "errorPages": [...],    // 404, 500, 403, maintenance
  "menuLinksInTemplate": [
    {"label": "Users", "href": "users-list.html", "depth": 1}
  ]
}
```

### 2. Inspeção complementar manual

Para cada página candidata identificada:
- Ler diretamente o HTML para entender ordem visual dos blocos, ratios de coluna, breakpoints aplicados.
- Notar copy importante (títulos, marketing text na auth, mensagens de empty state) que vale preservar.

### 3. Lidar com múltiplas variantes

Templates frequentemente trazem 3-5 dashboards (Analytics, eCommerce, CRM, Project) e múltiplos logins (Basic, Cover, Modern, Boxed). Quando há mais de uma variante:

- Listar todas as variantes encontradas.
- **Perguntar ao usuário** qual seguir como base.
- Não gerar todas — gerar só a escolhida + (opcionalmente) outras se o usuário pedir.

### 4. Identificar o domínio principal

Se o template tem `users-list.html`, usar Users como domínio CRUD principal. Se tem `products-list.html` mas não users, usar Products. Decidir baseado em qual é mais central no menu do template (primeiro grupo CRUD após dashboard).

### 5. Gerar tabela de mapeamento

Esta tabela é o **artefato chave** da Fase 1:

| página alvo | rota Next.js | HTML(s) origem | está no menu da app? | composites usados | charts usados | mocks necessários | fidelidade | origem |
|-------------|-------------|----------------|--------------------|--------------------|----------------|-------------------|-----------|--------|

A coluna **origem** classifica:
- `mínimo` — conjunto mínimo
- `template` — descoberta no template
- `menu` — referenciada pelo menu da app
- `mínimo+template` — mínimo COM equivalente no template (alta fidelidade)

A tabela vira o plano apresentado na Fase 3.

## Falhas comuns

- Template sem HTML de dashboard claro: usar `index.html` se tiver shell+gráficos; senão, gerar dashboard com defaults coerentes.
- Template SPA-like (um único HTML, conteúdo trocado por JS): inspecionar `data-page`, `id="*-page"`, divs com `display:none`. Se inviável, perguntar ao usuário.
- Template multilíngue (HTMLs duplicados em pastas `en/`, `pt/`): trabalhar em uma só (preferir `en/` ou pasta sem prefixo).
