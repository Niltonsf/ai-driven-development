# Chart.js recipes (`react-chartjs-2`)

Install: `npm i chart.js react-chartjs-2`

SSR-safe with `"use client"` only — no `dynamic` needed (canvas mounts client-side after hydration).

Tree-shake required: register only what you use:

```ts
// at top of each chart file (or a single _chartjs-register.ts module imported once)
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Filler, Tooltip, Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale, Filler, Tooltip, Legend);
```

`chartjsBaseOptions()` lives in `_chart-theme.ts` and returns the shared `options` object (scales, plugins, animations).

## Bar

```tsx
'use client';
import { Bar } from 'react-chartjs-2';
import { chartjsBaseOptions, chartTheme } from './_chart-theme';

export function BarChart({ labels, datasets, variant = 'simple', height = 300 }: BarChartProps) {
  const data = {
    labels,
    datasets: datasets.map((d, i) => ({
      label: d.label,
      data: d.data,
      backgroundColor: d.color ?? chartTheme.series[i % chartTheme.series.length],
      borderRadius: chartTheme.bar.topRadius,
      borderSkipped: false,
      stack: variant === 'stacked' ? 'stack-1' : undefined,
    })),
  };
  const options = {
    ...chartjsBaseOptions(),
    indexAxis: variant === 'horizontal' ? ('y' as const) : ('x' as const),
    scales: {
      x: { ...chartjsBaseOptions().scales?.x, stacked: variant === 'stacked' },
      y: { ...chartjsBaseOptions().scales?.y, stacked: variant === 'stacked' },
    },
  };
  return <div style={{ height }}><Bar data={data} options={options} /></div>;
}
```

## Line

```tsx
const data = {
  labels,
  datasets: datasets.map((d, i) => ({
    label: d.label, data: d.data,
    borderColor: d.color ?? chartTheme.series[i % chartTheme.series.length],
    backgroundColor: 'transparent',
    borderWidth: chartTheme.line.strokeWidth,
    tension: chartTheme.line.curve === 'smooth' ? 0.4 : 0,
    pointRadius: chartTheme.line.showMarkers ? chartTheme.line.markerSize : 0,
    pointHoverRadius: chartTheme.line.markerSize + 2,
  })),
};
return <Line data={data} options={chartjsBaseOptions()} />;
```

## Area

Same as Line + `fill: true` and gradient via `backgroundColor` callback that builds a `CanvasGradient` on mount. Reusable helper `makeGradient(ctx, color)` in `_chart-theme.ts`.

## Pie / Donut

```tsx
const data = {
  labels,
  datasets: [{ data: values, backgroundColor: chartTheme.series, borderWidth: 0 }],
};
const options = { ...chartjsBaseOptions(), cutout: variant === 'donut' ? `${chartTheme.donut.innerRatio * 100}%` : '0%' };
return <Doughnut data={data} options={options} />;
```

## Sparkline

```tsx
const options = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 } },
  animation: { duration: 0 },
};
return <div style={{ height: height ?? 50 }}><Line data={{ labels: data.map((_, i) => i), datasets: [{ data, borderColor: color ?? chartTheme.series[0], borderWidth: 2 }] }} options={options} /></div>;
```

## Radar / Polar / Scatter

Use `<Radar>`, `<PolarArea>`, `<Scatter>` from `react-chartjs-2` with the same conventions.
