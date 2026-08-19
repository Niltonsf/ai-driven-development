# ECharts recipes (`echarts-for-react`)

Install: `npm i echarts echarts-for-react`

NOT SSR-safe → use Pattern B from `ssr-safe-patterns.md` (`.impl.tsx` + dynamic import with `ssr: false`).

`echartsBaseOption()` lives in `_chart-theme.ts` and returns the base option object (textStyle, color palette, grid, tooltip, legend, animation).

## Bar

```tsx
'use client';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { echartsBaseOption, chartTheme } from './_chart-theme';

export default function BarChartImpl({ categories, series, variant = 'simple', height = 300 }: BarChartProps) {
  const option: EChartsOption = {
    ...echartsBaseOption(),
    xAxis: { type: 'category', data: categories, axisLine: { lineStyle: { color: chartTheme.axisLine } }, axisLabel: { color: chartTheme.tickLabel } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.grid } }, axisLabel: { color: chartTheme.tickLabel } },
    series: series.map((s, i) => ({
      name: s.name, type: 'bar', data: s.data,
      itemStyle: { color: chartTheme.series[i % chartTheme.series.length], borderRadius: [chartTheme.bar.topRadius, chartTheme.bar.topRadius, 0, 0] },
      stack: variant === 'stacked' ? 'total' : undefined,
      barMaxWidth: '60%',
    })),
  };
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}
```

## Line

```tsx
series: series.map((s, i) => ({
  name: s.name, type: 'line', data: s.data,
  smooth: chartTheme.line.curve === 'smooth',
  lineStyle: { width: chartTheme.line.strokeWidth, color: chartTheme.series[i % chartTheme.series.length] },
  itemStyle: { color: chartTheme.series[i % chartTheme.series.length] },
  showSymbol: chartTheme.line.showMarkers,
  symbolSize: chartTheme.line.markerSize,
})),
```

## Area (gradient)

```tsx
import { graphic } from 'echarts';

series: series.map((s, i) => {
  const color = chartTheme.series[i % chartTheme.series.length];
  return {
    name: s.name, type: 'line', data: s.data, smooth: true,
    lineStyle: { width: chartTheme.line.strokeWidth, color },
    areaStyle: {
      color: new graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: color + Math.round(chartTheme.area.fillOpacityStart * 255).toString(16).padStart(2, '0') },
        { offset: 1, color: color + Math.round(chartTheme.area.fillOpacityEnd * 255).toString(16).padStart(2, '0') },
      ]),
    },
    showSymbol: false,
  };
}),
```

## Pie

```tsx
const option: EChartsOption = {
  ...echartsBaseOption(),
  series: [{
    type: 'pie', radius: '70%',
    data: data.map((d, i) => ({ ...d, itemStyle: { color: chartTheme.series[i % chartTheme.series.length] } })),
    label: { color: chartTheme.tickLabel, fontFamily: chartTheme.typography.fontFamily },
  }],
};
```

## Donut

Same as Pie + `radius: [`${chartTheme.donut.innerRatio * 100}%`, '70%']`. Center label via `graphic.text` overlay or `series.label.position: 'center'`.

## Sparkline

```tsx
const option: EChartsOption = {
  grid: { left: 0, right: 0, top: 4, bottom: 4 },
  xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
  yAxis: { show: false },
  tooltip: { show: false },
  series: [{ type: 'line', data, smooth: true, showSymbol: false, lineStyle: { width: 2, color: color ?? chartTheme.series[0] } }],
  animation: false,
};
return <ReactECharts option={option} style={{ height: height ?? 50 }} notMerge lazyUpdate />;
```

## Heatmap / Radar / Gauge / Scatter

ECharts has first-class support for all. Use `series.type: 'heatmap' | 'radar' | 'gauge' | 'scatter'` with theme-driven colors.
