# ApexCharts recipes (`react-apexcharts`)

Install: `npm i apexcharts react-apexcharts`

NOT SSR-safe → use Pattern B from `ssr-safe-patterns.md` (`bar-chart.impl.tsx` + `bar-chart.component.tsx` with `dynamic({ ssr: false })`).

All snippets show only the `.impl.tsx` body. `apexBaseOptions()` lives in `_chart-theme.ts`.

## Bar (vertical)

```tsx
'use client';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { apexBaseOptions, chartTheme } from './_chart-theme';

export type BarChartProps = {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
  variant?: 'simple' | 'stacked' | 'horizontal';
  height?: number;
};

export default function BarChartImpl({ categories, series, variant = 'simple', height = 300 }: BarChartProps) {
  const options: ApexOptions = {
    ...apexBaseOptions(),
    chart: { ...apexBaseOptions().chart, type: variant === 'horizontal' ? 'bar' : 'bar', stacked: variant === 'stacked' },
    plotOptions: {
      bar: {
        horizontal: variant === 'horizontal',
        borderRadius: chartTheme.bar.topRadius,
        borderRadiusApplication: 'end',
        columnWidth: chartTheme.bar.columnWidth,
      },
    },
    xaxis: { ...apexBaseOptions().xaxis, categories },
    dataLabels: { enabled: false },
  };
  return <Chart options={options} series={series} type="bar" height={height} />;
}
```

## Line

```tsx
const options: ApexOptions = {
  ...apexBaseOptions(),
  chart: { ...apexBaseOptions().chart, type: 'line' },
  stroke: { curve: chartTheme.line.curve === 'smooth' ? 'smooth' : 'straight', width: chartTheme.line.strokeWidth },
  markers: { size: chartTheme.line.showMarkers ? chartTheme.line.markerSize : 0 },
  xaxis: { ...apexBaseOptions().xaxis, categories },
  dataLabels: { enabled: false },
};
return <Chart options={options} series={series} type="line" height={height} />;
```

## Area (gradient)

```tsx
const options: ApexOptions = {
  ...apexBaseOptions(),
  chart: { ...apexBaseOptions().chart, type: 'area' },
  stroke: { curve: 'smooth', width: chartTheme.line.strokeWidth },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: chartTheme.area.fillOpacityStart,
      opacityTo: chartTheme.area.fillOpacityEnd,
      stops: [0, 100],
    },
  },
  xaxis: { ...apexBaseOptions().xaxis, categories },
  dataLabels: { enabled: false },
};
return <Chart options={options} series={series} type="area" height={height} />;
```

## Pie

```tsx
const options: ApexOptions = {
  ...apexBaseOptions(),
  chart: { ...apexBaseOptions().chart, type: 'pie' },
  labels,
  dataLabels: { enabled: true, style: { fontSize: '12px', fontFamily: chartTheme.typography.fontFamily } },
};
return <Chart options={options} series={values} type="pie" height={height} />;
```

## Donut

Same as Pie but `type: 'donut'` + `plotOptions: { pie: { donut: { size: `${chartTheme.donut.innerRatio * 100}%` } } }`. Center label via `plotOptions.pie.donut.labels.total` when template shows total.

## Sparkline

```tsx
const options: ApexOptions = {
  chart: { type: 'line', sparkline: { enabled: true }, animations: { enabled: false } },
  stroke: { curve: 'smooth', width: 2 },
  colors: [color ?? chartTheme.series[0]],
  tooltip: { enabled: false },
};
return <Chart options={options} series={[{ data }]} type="line" height={height ?? 50} />;
```

## Radial bar / Gauge

```tsx
const options: ApexOptions = {
  chart: { type: 'radialBar' },
  plotOptions: { radialBar: { hollow: { size: '70%' }, dataLabels: { value: { fontSize: '20px' } } } },
  colors: [chartTheme.series[0]],
  labels: [label],
};
return <Chart options={options} series={[value]} type="radialBar" height={height} />;
```

## Heatmap

`chart.type: 'heatmap'` + `plotOptions.heatmap.colorScale.ranges`. Use template's color stops if present, else `chartTheme.semantic.*` mapped to thresholds.
