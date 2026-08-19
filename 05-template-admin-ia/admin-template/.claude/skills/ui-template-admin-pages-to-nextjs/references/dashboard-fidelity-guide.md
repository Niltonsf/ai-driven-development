# Dashboard fidelity guide

O dashboard é a **página de maior esforço** desta skill. É o cartão de visita da vitrine. Replicar bloco-a-bloco o dashboard equivalente do template.

## Princípio

> Se o template tem 4 stat cards no topo, um gráfico grande à esquerda, dois pequenos à direita e uma tabela embaixo — a página React tem **exatamente** essa estrutura, usando composites e charts da app.

Fidelidade é estrutural, visual e quantitativa (mesmo número de blocos, mesma ordem, mesmas proporções de coluna), não literal de HTML.

## Protocolo bloco-a-bloco

### 1. Inventário visual do HTML do template

Ler o HTML do dashboard escolhido. Para cada região (de cima para baixo, esquerda para direita), preencher:

| # | Tipo identificado | Subtype | Posição (row/col) | Span (colunas que ocupa em md+) | Conteúdo / dados de demo extraídos do HTML |
|---|-------------------|---------|-------------------|----------------------------------|---------------------------------------------|

### 2. Tipologia de blocos (catálogo)

Mapear cada bloco a um destes tipos:

| Tipo no template | Composite/Chart na app | Notas |
|------------------|------------------------|-------|
| Stat card (KPI: label, valor, variação %) | `StatCard` (do `Card` family) — se não houver, usar `Card` + composição interna manual no `_components/` da página | Se houver sparkline interno, usar `Sparkline`. |
| Linha de gráfico (sales, revenue, traffic) | `<ChartContainer>` + `<LineChart>` ou `<AreaChart>` | Extrair série de dados do HTML (procurar `data-points`, scripts inline, ou inferir do range visual). |
| Barras (vendas por mês, comparação) | `<ChartContainer>` + `<BarChart>` | |
| Pizza/donut (distribuição) | `<ChartContainer>` + `<PieChart>` ou `<DonutChart>` | |
| Tabela embedada | `<DataTable>` (versão compacta, sem toolbar) | Reduzir a 5-10 linhas. |
| Lista de atividade recente | Composite `ActivityList` se existir; senão, `<Card>` + lista de itens com `<Avatar>` + texto | |
| Lista de tarefas / todos | Mesmo padrão de activity | |
| Progress group (várias barras de progresso) | `<Card>` + repetição de `<Progress>` (primitivo) | |
| Calendar widget | Placeholder com `<Card>` + texto se não houver composite. | |
| Mapa (rara) | Placeholder com `<Card>` + nota "mapa não implementado". | |
| Counter / large number | `StatCard` simplificado | |
| Image hero / banner | `<Card>` + `<img>` ou `<div>` com background — **única exceção** ao "não recriar visuais" para banner-hero do dashboard, com comentário explicando. |

### 3. Grid e responsividade

Replicar o grid de columns do template em Tailwind:
- Topo: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` (4 stat cards)
- Linha mista: `grid grid-cols-1 lg:grid-cols-3 gap-6` (1 grande + 2 pequenos = `lg:col-span-2` + `lg:col-span-1`)
- Tabela full-width: `<div className="grid grid-cols-1">`

Inferir os `col-span` lendo as classes do template (Bootstrap: `col-md-8` = `lg:col-span-2` em grid-12; etc).

### 4. Extração de dados de demo do HTML

Para cada bloco com dados, extrair:
- **Stat cards**: label, valor, variação %, comparativo. Transferir literalmente (em pt-BR ou idioma do template).
- **Charts**: séries. Quando o template tem dados em script inline (`var data = [{x: 'Jan', y: 320}, ...]`), copiar literalmente. Quando os dados não estão acessíveis (canvas opaco), gerar série coerente com o shape visual (crescente, sazonal, etc.).
- **Tabelas**: 5-10 linhas com nomes/valores plausíveis em pt-BR.

Tudo vai para `src/modules/examples/dashboard/mock-data.ts`.

### 5. Estrutura do arquivo

```
src/app/(admin)/dashboard/
└── page.tsx                          # entry-point ≤10 linhas, importa do módulo

src/modules/examples/dashboard/
├── dashboard-content.client.tsx      # client principal (filtros, troca de período)
├── mock-data.ts                      # tipos + dados literais
├── constants.ts                      # períodos disponíveis, defaults
└── components/
    ├── revenue-overview-card.tsx     # 1 arquivo por bloco grande
    ├── traffic-sources-chart.tsx
    ├── recent-orders-table.tsx
    └── stat-cards-row.tsx
```

Cada `components/*.tsx` é uma composição enxuta importando do `@/shared/components/ui` e `@/shared/components/charts`. Sem CSS recriando visual.

### 6. Comentário-cabeçalho obrigatório

```tsx
/**
 * Dashboard
 *
 * Replica: <template-path>/dashboard.html (variante "Analytics")
 * Fidelidade: ALTA
 * Adaptações:
 *   - Mapa de geolocalização do template substituído por placeholder
 *     (composite de mapa não disponível na app).
 *   - Widget de calendário compactado para uma lista de próximos eventos.
 */
```

### 7. Checklist de paridade visual

Antes de finalizar:

- [ ] Mesmo número de blocos do template
- [ ] Mesma ordem (top→bottom, left→right)
- [ ] Mesmas proporções de coluna em desktop
- [ ] Stack vertical correto em mobile
- [ ] Cada chart tem título igual ou equivalente ao do template
- [ ] Cada stat card tem label + valor + variação %
- [ ] Tabela tem as mesmas colunas (ou subset enxuto e fiel) do template
- [ ] Cores das séries respeitam a paleta `charts.palette` (já definida na skill de charts)
- [ ] Ações (botões "Ver tudo", dropdowns "Esta semana / Este mês") replicadas como `<Button variant="ghost">` ou similar — sem implementação real, com comentário "apresentacional"

### 8. Quando o template tem múltiplos dashboards

Variantes comuns: Analytics, eCommerce, CRM, Project, SaaS, Hospital, School. Perguntar ao usuário antes de escolher; gerar apenas o escolhido (ou os escolhidos, em rotas separadas como `/dashboard/analytics`, `/dashboard/ecommerce`).
