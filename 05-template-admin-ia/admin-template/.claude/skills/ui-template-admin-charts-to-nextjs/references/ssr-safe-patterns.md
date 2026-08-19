# SSR-safe patterns

Next.js App Router renders Server Components by default. Chart libraries vary in how cleanly they survive SSR. This file dictates per-library wiring.

## Quick reference

| Library | SSR behavior | Required pattern |
|---|---|---|
| Recharts | OK with `"use client"` | `"use client"` only |
| Chart.js (`react-chartjs-2`) | OK with `"use client"` (canvas mounts client-side) | `"use client"` only |
| ApexCharts (`react-apexcharts`) | **Breaks SSR** — accesses `window` at import time | `"use client"` + `dynamic(import, { ssr: false })` |
| ECharts (`echarts-for-react`) | **Breaks SSR** — accesses `document` at import time | `"use client"` + `dynamic(import, { ssr: false })` |
| Highcharts (`highcharts-react-official`) | OK with `"use client"` | `"use client"` only |
| Plotly (`react-plotly.js`) | **Breaks SSR** — heavy `window` access | `"use client"` + `dynamic(import, { ssr: false })` |
| Chartist | **Breaks SSR** — needs DOM at construction | `"use client"` + `dynamic(import, { ssr: false })` |

## Pattern A — `"use client"` only (Recharts, Chart.js, Highcharts)

```tsx
'use client';
import { LineChart as RLineChart, Line, ... } from 'recharts';

export function LineChart(props) {
  // ...
}
```

Done. The whole module is a Client Component; works under SSR (renders nothing on the server, hydrates on the client).

## Pattern B — `"use client"` + dynamic with `ssr: false` (ApexCharts, ECharts, Plotly, Chartist)

Two-file pattern. The actual chart implementation lives in an internal file; the public component dynamically imports it.

```tsx
// bar-chart.impl.tsx — internal
'use client';
import Chart from 'react-apexcharts';
import { apexBaseOptions, chartTheme } from './_chart-theme';

export default function BarChartImpl(props: BarChartProps) {
  // full ApexCharts implementation
  return <Chart options={...} series={...} type="bar" height={props.height ?? 300} />;
}
```

```tsx
// bar-chart.component.tsx — public
'use client';
import dynamic from 'next/dynamic';
import { ChartLoading } from './chart-loading.component';
import type { BarChartProps } from './bar-chart.impl';

const BarChartImpl = dynamic(() => import('./bar-chart.impl'), {
  ssr: false,
  loading: () => <ChartLoading height={300} />,
});

export type { BarChartProps };
export function BarChart(props: BarChartProps) {
  return <BarChartImpl {...props} />;
}
```

The `loading` slot uses `ChartLoading` so the user sees a skeleton while the chunk loads.

## Why both `"use client"` AND `dynamic({ ssr: false })`?

- `"use client"` excludes the module from the Server Component graph.
- `dynamic({ ssr: false })` additionally tells Next.js to skip pre-rendering on the server (the React tree itself).
- Without `dynamic`, ApexCharts/ECharts/Plotly would crash at SSR time because their import path touches `window`/`document` immediately.

## Loading skeleton coordination

`ChartLoading` accepts `height` so the skeleton matches the eventual chart height — no layout shift on hydration.

```tsx
const BarChartImpl = dynamic(() => import('./bar-chart.impl'), {
  ssr: false,
  loading: () => <ChartLoading height={300} variant="bar" />,
});
```

## Type sharing

Since `bar-chart.impl.tsx` and `bar-chart.component.tsx` share types, declare `BarChartProps` in `.impl.tsx` and re-export from the public file.

## Index re-export

`index.ts` re-exports only the public file (`bar-chart.component.tsx`), never `.impl.tsx`.
