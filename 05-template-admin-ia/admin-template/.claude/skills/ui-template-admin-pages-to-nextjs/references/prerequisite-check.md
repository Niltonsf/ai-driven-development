# Prerequisite check (Fase 0)

Esta skill ABORTA se algo abaixo faltar. Executar em ordem; ao primeiro `FAIL`, parar e reportar TODOS os faltantes (não só o primeiro — checar todos antes de abortar).

## Protocolo

### 1. Shell administrativo
- **Verificar**: existe `src/app/(admin)/layout.tsx` OU `src/app/(private)/layout.tsx` OU `src/app/(dashboard)/layout.tsx` que monte o shell.
- **Verificar**: pasta de componentes do shell existe — buscar nesta ordem: `src/shared/components/admin-shell/`, `src/shared/template/admin/`, `src/shared/template/`.
- **FAIL**: orientar `ui-template-admin-shell-to-nextjs`.

### 2. Sidebar / navegação
- **Verificar**: existe componente de sidebar (qualquer arquivo cujo nome bate com `sidebar`, `side-nav`, `aside-menu` na pasta de shell).
- **Verificar**: existe arquivo de configuração de navegação consumível. Buscar (em ordem):
  - `src/shared/config/navigation.ts`
  - `src/shared/template/admin/navigation.ts`
  - `src/shared/template/admin/menu.ts`
  - `src/shared/template/admin/sidebar.config.ts`
  - `src/shared/template/admin/sidebar-items.ts`
  - qualquer `*nav*.ts` ou `*menu*.ts` dentro de `src/shared/`
- **FAIL**: orientar `ui-template-admin-sidebar-to-nextjs`.

### 3. Primitivos
- **Verificar**: `src/shared/components/ui/index.ts` existe e re-exporta no mínimo:
  - `Button` (ou alias equivalente)
  - `Input`
  - `Label`
  - `Badge` ou `Chip` ou `Tag`
  - `Avatar`
  - `Alert`
- **FAIL**: orientar `ui-template-admin-primitives-to-nextjs`.

### 4. Composites
- **Verificar** (mesma pasta `src/shared/components/ui/`, conforme convenção da skill de composites):
  - `PageHeader` (com breadcrumb)
  - `Card` (com subpartes — `CardHeader`/`CardBody`/`CardFooter` ou similar)
  - `Modal` (ou `Dialog`)
  - `DataTable` (com toolbar)
  - `Pagination`
  - `EmptyState`
  - `LoadingSkeleton` (ou `Skeleton`)
  - `FormSection`
  - `FormFooter`
- **FAIL**: orientar `ui-template-admin-composites-to-nextjs`.

### 5. Charts
- **Verificar**: `src/shared/components/charts/index.ts` existe e re-exporta no mínimo:
  - `BarChart`
  - `LineChart`
  - `AreaChart`
  - `PieChart` OU `DonutChart`
  - `Sparkline`
  - `ChartContainer`, `ChartLoading`, `ChartEmptyState`
- **FAIL**: orientar `ui-template-admin-charts-to-nextjs`.

## Output da Fase 0

Produzir um pequeno relatório em texto:

```
[Pré-requisitos]
- Shell:        OK em src/app/(admin)/layout.tsx + src/shared/template/admin/
- Sidebar:      OK; navegação em src/shared/template/admin/navigation.ts
- Primitivos:   OK (Button, Input, Label, Badge, Avatar, Alert, Switch, Checkbox, Select)
- Composites:   OK (PageHeader, Card, Modal, DataTable, Pagination, EmptyState, Skeleton, FormSection, FormFooter, Tabs, Drawer, Toast)
- Charts:       OK (BarChart, LineChart, AreaChart, DonutChart, Sparkline, ChartContainer, ChartLoading, ChartEmptyState)
```

Em caso de FAIL, listar todos os faltantes com a skill recomendada para cada um, e parar.

## Mapeamento dinâmico

Capturar e guardar para uso nas fases seguintes:
- `SHARED_UI_PATH` — caminho real onde primitivos+composites moram (geralmente `src/shared/components/ui`).
- `SHARED_CHARTS_PATH` — `src/shared/components/charts`.
- `ADMIN_GROUP_SEGMENT` — qual segment de grupo é o admin (`(admin)`, `(private)`, `(dashboard)`).
- `NAV_CONFIG_PATH` — caminho do arquivo de configuração de navegação.
- `AVAILABLE_PRIMITIVES`, `AVAILABLE_COMPOSITES`, `AVAILABLE_CHARTS` — listas exatas dos nomes exportados (lidas dos `index.ts`).

Esses valores são usados em todas as fases seguintes — não assumir nomes; ler sempre.
