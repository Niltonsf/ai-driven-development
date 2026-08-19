# Inspection checklist — chart-by-chart audit

Filled during Phase 1 for every chart instance found in the template. The output of `extract-charts-inventory.mjs` populates rows automatically; supplement by hand for charts the script couldn't parse (minified bundles).

## Per-instance row

| Field | What to capture | Example |
|---|---|---|
| `id` | Stable id (page#index) | `dashboard.html#chart-revenue` |
| `type` | bar/line/area/pie/donut/sparkline/radar/gauge/heatmap/scatter/mixed | `bar` |
| `library` | Detected lib for this instance | ApexCharts |
| `pages` | Pages where this exact chart appears | `dashboard.html`, `analytics.html` |
| `seriesCount` | Number of data series | 3 |
| `paletteUsed` | Hex sequence used for series | `["#5b8def","#22c55e","#f59e0b"]` |
| `axes` | x-axis type, y-axis type, label format | `x: category, y: number, currency` |
| `legend` | position, marker shape, marker size | `bottom, circle, 8px` |
| `tooltip` | shape (singleton vs shared), bg, fg, border, custom format | `shared, bg=#fff, fg=#333, currency formatter` |
| `gridlines` | x-grid yes/no, y-grid yes/no, color, dashed | `x:no, y:yes, #eef0f4, dashed` |
| `animation` | duration, easing | `1000ms, easeOut` |
| `barRadius` | top corner radius (bar only) | `4px` |
| `lineConfig` | stroke width, smooth/straight/stepped, marker | `2px, smooth, no markers` |
| `areaFill` | opacity, gradient yes/no, stops | `gradient: 0.6→0.0, top→bottom` |
| `donutInnerRatio` | inner radius / outer radius | `0.7` |
| `notes` | anything unusual | `custom plugin to draw center label` |

## Coverage table (Phase 1 output)

```
Minimum set status:
  bar          ✓ present (3 instances)  → fidelity port
  line         ✓ present (5 instances)  → fidelity port
  area         ✗ absent                 → defaults from extracted palette
  pie          ✓ present (1 instance)   → fidelity port
  donut        ✓ present (2 instances)  → fidelity port
  sparkline    ✓ present (8 instances)  → fidelity port

Additional set:
  radar        ✗ absent → SKIP
  gauge        ✓ present (1 instance)   → fidelity port
  heatmap      ✗ absent → SKIP
  scatter      ✗ absent → SKIP
  mixed        ✓ present (1 instance, bar+line) → fidelity port
```

## Where charts hide in templates

Common locations to check beyond obvious dashboard pages:

- Stat cards with mini sparkline trend (top-right of card)
- Widget cards with embedded donut for percentage
- Sidebar widgets with progress radial
- Right rail of analytics pages with multiple small charts
- Login pages with decorative chart background (skip — not a real chart)
- Demo/showcase pages: `apex-charts.html`, `chartjs.html`, `echarts.html`, `charts-*.html`

## When the JS is minified

If config is in `bundle.min.js` and unreadable:

1. Look at the rendered HTML/SVG/canvas for visual cues (palette, axis labels visible in DOM).
2. Look at the chart's container CSS class for theme hints.
3. Use browser devtools mentally: check if the chart has `apexcharts-tooltip`/`chartjs-tooltip`/`echarts-tooltip` injected DOM (gives away the lib).
4. If still ambiguous, generate with conservative defaults from the extracted palette and document the limitation in Phase 5 report.
