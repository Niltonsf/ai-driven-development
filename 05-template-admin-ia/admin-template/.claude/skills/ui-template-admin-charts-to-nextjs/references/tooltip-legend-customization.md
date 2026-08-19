# Tooltip & legend customization

How to render the template-faithful tooltip and legend in each library. Always prefer React components when the lib supports them; fall back to `globals.css` only when the lib injects DOM outside React.

## Decision tree

```
Lib supports React custom tooltip component?
├─ Yes → implement chart-tooltip.component.tsx with React; pass via props
└─ No  → style via globals.css with the lib's tooltip class
```

## React tooltip — Recharts

Recharts accepts a `content` prop on `<Tooltip>` that takes a React component:

```tsx
// chart-tooltip.component.tsx
'use client';
import { chartTheme } from './_chart-theme';

type TooltipPayloadEntry = { name: string; value: number; color: string };
type TooltipProps = { active?: boolean; label?: string; payload?: TooltipPayloadEntry[] };

export function ChartTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-chartTooltip border border-charts-tooltipBorder bg-charts-tooltipBg p-3 shadow-chartTooltip"
      style={{ fontSize: chartTheme.typography.tooltipSize, color: chartTheme.tooltip.fg }}
    >
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
```

Usage in chart:

```tsx
<Tooltip content={<ChartTooltip />} />
```

## React tooltip — ApexCharts

ApexCharts allows `tooltip.custom` returning an HTML string. To render React, use the official escape hatch: render to a string via `renderToStaticMarkup` (acceptable, since ApexCharts replaces DOM content directly).

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { ChartTooltip } from './chart-tooltip.component';

const apexCustomTooltip = ({ series, seriesIndex, dataPointIndex, w }) =>
  renderToStaticMarkup(
    <ChartTooltip
      label={w.globals.labels[dataPointIndex]}
      payload={series.map((s, i) => ({
        name: w.globals.seriesNames[i],
        value: s[dataPointIndex],
        color: w.globals.colors[i],
      }))}
    />
  );
```

## React tooltip — ECharts

ECharts `tooltip.formatter` accepts a function returning HTML string. Same `renderToStaticMarkup` pattern.

## React tooltip — Chart.js

Use `tooltip.external` (Chart.js v3+) to render a custom DOM element. Implement once in `_chart-theme.ts` as `chartjsExternalTooltip(context)` that mounts a React tooltip into a portal. Acceptable but heavier — only do this if the template's tooltip differs significantly from Chart.js defaults.

## CSS-only fallback

When the lib stubbornly injects its own DOM (rare), put minimal overrides in `globals.css`:

```css
/* src/app/globals.css */
.apexcharts-tooltip {
  background: theme('colors.charts.tooltipBg') !important;
  color: theme('colors.charts.tooltipFg') !important;
  border: 1px solid theme('colors.charts.tooltipBorder') !important;
  border-radius: 6px !important;
  box-shadow: theme('boxShadow.chartTooltip') !important;
  font-family: inherit !important;
}
```

Use sparingly. `!important` is required because libs inject inline styles.

## Legend

Same pattern. Prefer React custom legend (`<Legend content={<ChartLegend />} />` in Recharts; equivalents in other libs). When the template legend has unusual layout (e.g., legend with values next to labels), implement as React for full control.

```tsx
// chart-legend.component.tsx
'use client';
import { chartTheme } from './_chart-theme';

type LegendEntry = { value: string; color: string };
export function ChartLegend({ payload }: { payload?: LegendEntry[] }) {
  if (!payload?.length) return null;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-4 pt-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-2 text-charts-legendFg" style={{ fontSize: chartTheme.typography.legendSize }}>
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}
```

## When to skip

If the template uses defaults of the chosen library and the defaults match the desired look, do NOT generate `chart-tooltip` / `chart-legend`. Only emit them when the template has clearly customized tooltip/legend visuals.
