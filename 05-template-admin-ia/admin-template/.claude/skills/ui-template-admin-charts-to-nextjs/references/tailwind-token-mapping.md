# Tailwind token mapping — `charts.*` namespace

Pattern for patching `tailwind.config.{ts,js}` after Phase 2 token extraction. Uses ONLY the `charts` namespace — never `ui`, `adminMenu`, `adminShell`.

## Patch shape

```ts
// tailwind.config.ts
export default {
  // ...existing config preserved...
  theme: {
    extend: {
      // ...existing extends preserved...
      colors: {
        // ...existing colors preserved (ui.*, adminMenu.*, adminShell.*)...
        charts: {
          series: {
            1: '#5b8def',
            2: '#22c55e',
            3: '#f59e0b',
            4: '#ef4444',
            5: '#a855f7',
            6: '#06b6d4',
            // add as many as the template provides, in order
          },
          success: '#22c55e',
          danger: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6',
          grid: '#eef0f4',
          axisLine: '#e5e7eb',
          axisLabel: '#374151',
          tickLabel: '#6b7280',
          tooltipBg: '#ffffff',
          tooltipFg: '#1f2937',
          tooltipBorder: '#e5e7eb',
          legendFg: '#374151',
        },
      },
      boxShadow: {
        chartTooltip: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        chartTooltip: '6px',
      },
      transitionTimingFunction: {
        chartEnter: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        chartEnter: '1000ms',
      },
      keyframes: {
        chartFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        chartFadeIn: 'chartFadeIn 600ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
};
```

## Rules

1. **Preserve everything** under `theme.extend.*` that already exists. This patch is additive only.
2. **Only `charts.*`** for new color tokens. Do not touch `ui.*`, `adminMenu.*`, `adminShell.*`.
3. **Series tokens are numeric keys** (`1`, `2`, ...) so consumers can iterate via `Object.values(charts.series)`.
4. **Animation keyframes/timings** carry `chart` prefix to avoid collision with other namespaces.
5. **No global resets** — the `globals.css` patch only happens later, and only when the chart lib injects DOM outside React's control (e.g., ApexCharts tooltip in `<body>`).

## Reading from JS

Tailwind tokens are not directly readable in JS at runtime (they only become CSS classes after build). For the chart library config, the `_chart-theme.ts` file holds the same values as **constants**, mirroring the Tailwind config:

```ts
// src/shared/components/charts/_chart-theme.ts
export const chartTheme = {
  series: ['#5b8def', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'],
  semantic: { success: '#22c55e', danger: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
  grid: '#eef0f4',
  axisLine: '#e5e7eb',
  axisLabel: '#374151',
  tickLabel: '#6b7280',
  tooltip: { bg: '#ffffff', fg: '#1f2937', border: '#e5e7eb', radius: 6, padding: 12, shadow: '0 4px 12px rgba(0,0,0,0.08)' },
  legend: { fg: '#374151', position: 'bottom' as const, marker: 'circle' as const, markerSize: 8 },
  typography: { fontFamily: 'Inter, sans-serif', axisLabelSize: 12, tickLabelSize: 11, tooltipSize: 12, legendSize: 12 },
  animation: { duration: 1000, easing: 'easeOutCubic' },
  bar: { topRadius: 4, columnWidth: '60%' },
  line: { strokeWidth: 2, curve: 'smooth' as const, showMarkers: false, markerSize: 4 },
  area: { fillOpacityStart: 0.6, fillOpacityEnd: 0.0, gradient: true },
  donut: { innerRatio: 0.7 },
} as const;
```

Both the Tailwind config and `_chart-theme.ts` must hold the **same hex values**. If you change one, change the other.
