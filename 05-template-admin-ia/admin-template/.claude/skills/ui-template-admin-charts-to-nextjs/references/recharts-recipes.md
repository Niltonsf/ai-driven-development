# Recharts recipes

Default fallback library. SSR-safe with `"use client"` only — no `dynamic` needed.

Install: `npm i recharts`

All recipes assume `chartTheme` and `rechartsTheme` from `./_chart-theme`. Use `<ResponsiveContainer width="100%" height={height}>` to fill the container.

## Bar

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={height}>
  <BarChart data={data}>
    {showGrid && <CartesianGrid {...rechartsTheme.gridProps} vertical={false} />}
    <XAxis dataKey={xKey} {...rechartsTheme.axisProps} />
    <YAxis {...rechartsTheme.axisProps} />
    <Tooltip contentStyle={rechartsTheme.tooltipContentStyle} />
    {showLegend && <Legend {...rechartsTheme.legendProps} />}
    {series.map((s, i) => (
      <Bar key={s.key} dataKey={s.key} name={s.label}
           fill={s.color ?? chartTheme.series[i % chartTheme.series.length]}
           radius={[chartTheme.bar.topRadius, chartTheme.bar.topRadius, 0, 0]}
           stackId={variant === 'stacked' ? 'stack' : undefined} />
    ))}
  </BarChart>
</ResponsiveContainer>
```

For `variant: "horizontal"`, set `layout="vertical"` and swap X/Y axis types (`type="number"` for X, `type="category"` for Y).

## Line

```tsx
<LineChart data={data}>
  <CartesianGrid {...rechartsTheme.gridProps} vertical={false} />
  <XAxis dataKey={xKey} {...rechartsTheme.axisProps} />
  <YAxis {...rechartsTheme.axisProps} />
  <Tooltip contentStyle={rechartsTheme.tooltipContentStyle} />
  <Legend {...rechartsTheme.legendProps} />
  {series.map((s, i) => (
    <Line key={s.key} type={chartTheme.line.curve === 'smooth' ? 'monotone' : 'linear'}
          dataKey={s.key} name={s.label}
          stroke={s.color ?? chartTheme.series[i % chartTheme.series.length]}
          strokeWidth={chartTheme.line.strokeWidth}
          dot={chartTheme.line.showMarkers ? { r: chartTheme.line.markerSize } : false}
          activeDot={{ r: chartTheme.line.markerSize + 1 }} />
  ))}
</LineChart>
```

## Area (with gradient)

```tsx
<AreaChart data={data}>
  <defs>
    {series.map((s, i) => {
      const color = s.color ?? chartTheme.series[i % chartTheme.series.length];
      return (
        <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={chartTheme.area.fillOpacityStart} />
          <stop offset="100%" stopColor={color} stopOpacity={chartTheme.area.fillOpacityEnd} />
        </linearGradient>
      );
    })}
  </defs>
  <CartesianGrid {...rechartsTheme.gridProps} vertical={false} />
  <XAxis dataKey={xKey} {...rechartsTheme.axisProps} />
  <YAxis {...rechartsTheme.axisProps} />
  <Tooltip contentStyle={rechartsTheme.tooltipContentStyle} />
  <Legend {...rechartsTheme.legendProps} />
  {series.map((s, i) => {
    const color = s.color ?? chartTheme.series[i % chartTheme.series.length];
    return (
      <Area key={s.key} type="monotone" dataKey={s.key} name={s.label}
            stroke={color} strokeWidth={chartTheme.line.strokeWidth}
            fill={`url(#grad-${s.key})`} />
    );
  })}
</AreaChart>
```

## Pie

```tsx
<PieChart>
  <Pie data={data} dataKey="value" nameKey="name" outerRadius="80%" startAngle={90} endAngle={-270}>
    {data.map((_, i) => (
      <Cell key={i} fill={chartTheme.series[i % chartTheme.series.length]} />
    ))}
  </Pie>
  <Tooltip contentStyle={rechartsTheme.tooltipContentStyle} />
  <Legend {...rechartsTheme.legendProps} />
</PieChart>
```

## Donut

Same as Pie + `innerRadius={`${chartTheme.donut.innerRatio * 100}%`}`. Center label via SVG `<text>` overlay if template has it.

## Sparkline

```tsx
<ResponsiveContainer width="100%" height={height ?? 50}>
  <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
    <Line type="monotone" dataKey="value" stroke={color ?? chartTheme.series[0]}
          strokeWidth={2} dot={false} isAnimationActive={false} />
  </LineChart>
</ResponsiveContainer>
```

For `variant: "area"`, swap to `<AreaChart>` + gradient. For `variant: "bar"`, swap to `<BarChart>` with no axes.

## Radar / Scatter / Composed (mixed)

Use `<RadarChart>`, `<ScatterChart>`, `<ComposedChart>` from Recharts — same theme conventions.

## Heatmap

Recharts has no native heatmap. Implement as a custom SVG grid (200 LOC) — only when the template requires it. Cells use `chartTheme.semantic.*` or interpolated palette.
