# Library detection protocol

Determine which charting library the template uses. Output is a single decision: one library name, with a confidence score and the evidence list.

## Inputs

- Template root folder.
- HTML pages, JS files (including minified bundles), CSS files.

## Algorithm (deterministic)

Run all four passes. Aggregate scores. Pick the highest. Tie-break by page count, then by config-line count.

### Pass A — `<script src>` and `<link href>` filenames

Grep all HTMLs and CSS for these substrings (case-insensitive). Each hit = +5 points to the matching library.

| substring | library |
|---|---|
| `apexcharts` | ApexCharts |
| `chart.min.js`, `chart.umd.js`, `chartjs`, `chart.bundle` | Chart.js |
| `echarts` | ECharts |
| `highcharts`, `highstock`, `highmaps` | Highcharts |
| `chartist` | Chartist |
| `plotly` | Plotly |
| `amcharts` | amCharts |
| `morris` | Morris.js |
| `jquery.flot`, `excanvas` | Flot |
| `c3.min.js`, `c3.css` | C3 |
| `nv.d3`, `nvd3` | NVD3 |
| `d3.v` (raw d3) + presence of custom `.svg` chart blocks | custom-svg-d3 |

### Pass B — JS constructor calls

Grep all JS files (including inline `<script>` blocks) for these patterns. Each hit = +10 points (stronger signal than mere file presence).

| pattern | library |
|---|---|
| `new ApexCharts(`, `ApexCharts.exec(` | ApexCharts |
| `new Chart(` (with `type:` next to it) | Chart.js |
| `echarts.init(` | ECharts |
| `Highcharts.chart(`, `Highcharts.stockChart(` | Highcharts |
| `new Chartist.` | Chartist |
| `Plotly.newPlot(`, `Plotly.react(` | Plotly |
| `am4core.create(`, `am5.Root.new(` | amCharts |
| `Morris.Bar(`, `Morris.Line(`, `Morris.Donut(` | Morris.js |
| `$.plot(` | Flot |
| `c3.generate(` | C3 |

### Pass C — CSS files included

Same as Pass A but for stylesheets that ship with charting libs (`apexcharts.css`, `c3.css`, `nv.d3.css`). +3 points each.

### Pass D — Custom SVG fallback

If Passes A–C all return zero AND the dashboard pages contain handcrafted `<svg>` blocks with bar rectangles or polyline paths AND there is no charting lib JS imported, mark `custom-svg`.

## Output JSON

```json
{
  "winner": "ApexCharts",
  "confidence": "high|medium|low",
  "scores": { "ApexCharts": 87, "Chart.js": 0, ... },
  "evidence": [
    { "file": "dashboard.html", "match": "<script src=\"plugins/apexcharts/apexcharts.min.js\">", "pass": "A" },
    { "file": "js/dashboard-charts.js", "match": "new ApexCharts(", "pass": "B", "occurrences": 12 }
  ],
  "pages_with_charts": ["dashboard.html", "analytics.html", "ecommerce.html"]
}
```

## Confidence

- **High**: winner score ≥ 30 AND second place < 50% of winner.
- **Medium**: winner score ≥ 15.
- **Low**: any winner found but below 15 — flag for user confirmation.
- **None**: no chart library detected → fallback to Recharts (announce explicitly).

## Mixed templates

If two libraries each score ≥ 15 (e.g., template demos both ApexCharts and Chart.js as showcase), pick the predominant by **page count** (in how many distinct pages each appears). Report the consolidation decision in Phase 3 plan and ask user to confirm.
