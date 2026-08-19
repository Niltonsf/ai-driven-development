# Token extraction guide

How to pull visual tokens from the template's CSS and JS for the Tailwind `charts.*` namespace.

## Sources, in order

1. **JS chart config files** — usually `assets/js/dashboard.js`, `js/charts/*.js`, `pages/dashboard.js`. These have `colors: [...]`, `xaxis: { labels: { style: { fontFamily, fontSize, color } } }`, `tooltip: { theme, custom }` etc.
2. **CSS files** — `assets/css/style.css`, `dashboard.css`, theme CSS. Look for `--chart-*`, `.apexcharts-*`, `.chartjs-*`, `.echarts-*` selectors; gridline strokes; tooltip backgrounds.
3. **Computed DOM (mental model)** — for SVG charts, axis colors are often inherited from body color or set by class on `<text>` elements.

## What to extract

### Series palette (mandatory)

The ordered list of colors used to color multiple series. Look for:

- `colors: ['#5b8def', '#22c55e', ...]` in JS configs (ApexCharts, Chart.js)
- `color: ['#...', '#...']` in ECharts options
- `--chart-1`, `--chart-2`, ... CSS custom properties
- Theme-level palette in template's CSS (often near `:root`)

Capture **at least 6 colors**, more if the template has them. Order matters — first color = series 1.

### Semantic palette (optional)

Some templates color charts by meaning (success/danger/warning/info) instead of by index. Capture only if used.

### Axis & grid

- `axis line color` — color of the actual axis stroke
- `axis label color` — color of the axis title text
- `tick label color` — color of the tick numbers/text
- `gridline color` — usually a very light gray (#eef0f4, #f1f5f9)
- `gridline dash` — `2,2` / `3,3` / solid

### Typography

For each text role (axis label, tick label, tooltip, legend):

- `font-family` — usually inherits from body; capture explicitly if overridden
- `font-size` — capture px value
- `font-weight` — 400/500/600

### Tooltip

- `background` — often white in light themes, dark in dark themes
- `color` — text color inside tooltip
- `border` — width + color (or none)
- `border-radius` — px
- `padding` — px
- `box-shadow` — full shadow value (often `0 4px 12px rgba(0,0,0,0.08)`)

### Legend

- `position` — top/right/bottom/left (default for the template)
- `marker shape` — circle/square/line/diamond
- `marker size` — px
- `gap between items` — px
- `font color`

### Animations

- `duration` — ms
- `easing` — `ease`/`ease-out`/`cubic-bezier(...)`

### Per-type particulars

- **Bar**: `borderRadius` (top corner), `barWidth`/`columnWidth` percentage, `gap` between groups
- **Line**: `strokeWidth`, `curve` (smooth/straight/stepped), `marker.show`, `marker.size`
- **Area**: `fill.opacity` start, `fill.opacity` end, gradient stops
- **Pie/Donut**: `startAngle`, `endAngle`, `gap` between slices, donut `innerRadius` ratio

## How to feed into Tailwind

Output a flat object like this and pass to `tailwind-token-mapping.md`:

```ts
const extracted = {
  series: ['#5b8def', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'],
  semantic: { success: '#22c55e', danger: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
  grid: '#eef0f4',
  axisLine: '#e5e7eb',
  axisLabel: '#374151',
  tickLabel: '#6b7280',
  tooltip: { bg: '#ffffff', fg: '#1f2937', border: '#e5e7eb', radius: 6, padding: 12, shadow: '0 4px 12px rgba(0,0,0,0.08)' },
  legend: { position: 'bottom', marker: 'circle', markerSize: 8, fg: '#374151' },
  typography: { fontFamily: 'Inter, sans-serif', axisLabelSize: 12, tickLabelSize: 11, tooltipSize: 12, legendSize: 12 },
  animation: { duration: 1000, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  bar: { topRadius: 4, columnWidth: '60%' },
  line: { strokeWidth: 2, curve: 'smooth', showMarkers: false, markerSize: 4 },
  area: { fillOpacityStart: 0.6, fillOpacityEnd: 0.0, gradient: true },
  donut: { innerRatio: 0.7 },
};
```

This object is the input to Phase 2 (Tailwind config patch) and Phase 4 (`_chart-theme.ts`).

## Faithfulness rule

If the template uses an unusual value (e.g., `#5b8def` and not the closest Tailwind blue), **add the exact value as a token**. Do NOT round to the nearest Tailwind palette color.
