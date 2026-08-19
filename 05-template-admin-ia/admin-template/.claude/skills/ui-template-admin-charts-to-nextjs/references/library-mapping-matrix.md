# Library mapping matrix — template lib → React wrapper

Used in Phase 0 right after `library-detection-protocol.md` returns a winner. Maps the detected library to the package(s) to install, with fidelity grade, license note, SSR-safety, and fallback when a clean React wrapper does not exist.

| Template library | React package(s) to install | Fidelity | License | SSR-safe | Decision |
|---|---|---|---|---|---|
| **ApexCharts** | `apexcharts` + `react-apexcharts` | High — config object 1:1 | MIT | No → use `dynamic(import, { ssr: false })` | Auto-install |
| **Chart.js** | `chart.js` + `react-chartjs-2` | High — config 1:1 | MIT | Yes (canvas-based, mount client-side) | Auto-install |
| **ECharts** | `echarts` + `echarts-for-react` | High — option object 1:1 | Apache-2.0 | No → `dynamic` | Auto-install |
| **Highcharts** | `highcharts` + `highcharts-react-official` | High — config 1:1 | **Commercial for non-personal use** | Yes | **Confirm with user.** Offer Recharts substitution if user lacks license. |
| **Chartist** | `chartist` + minimal own React wrapper (~30 LOC) | Medium — small API, easy to wrap | MIT | No → `dynamic` | Auto-install |
| **Plotly** | `plotly.js-dist-min` + `react-plotly.js` | Medium — heavy bundle (~3MB) | MIT | No → `dynamic` | **Warn about bundle size.** Confirm with user. |
| **amCharts (v4/v5)** | — | n/a | — | — | **Substitute → Recharts.** Reason: legacy/heavy, no good React wrapper. Inform user. |
| **Morris.js** | — | n/a | — | — | **Substitute → Recharts.** Reason: unmaintained since 2014. Inform user. |
| **Flot (jQuery Flot)** | — | n/a | — | — | **Substitute → Recharts.** Reason: jQuery-based. Inform user. |
| **C3.js** | — | n/a | — | — | **Substitute → Recharts.** Reason: stale, d3 v3 only. Inform user. |
| **NVD3** | — | n/a | — | — | **Substitute → Recharts.** Reason: unmaintained. Inform user. |
| **Custom SVG** (no lib) | Own SVG components for trivial charts (sparkline, mini bar, gauge); Recharts for the rest | Mixed | — | Yes (SVG renders SSR) | Decide per-chart |
| **None detected** | `recharts` | n/a (default) | MIT | Yes | Auto-install Recharts as fallback |

## Confirmation requirements (Phase 3)

The skill must ask the user before installing in these cases:

- **Highcharts** — commercial license required for non-personal/commercial use. Offer to swap to Recharts if no license.
- **Plotly** — heavy bundle. Confirm acceptance.
- **amCharts / Morris / Flot / C3 / NVD3** — substitution is forced. Get explicit acknowledgement.
- **Mixed templates** (two libs ≥15 score) — confirm consolidation choice.

In all other cases, proceed automatically once Phase 3 plan is shown.

## Rationale for substitutions

Recharts is the safe substitute because:

- React-first (declarative components, no imperative `init`/`destroy`).
- Actively maintained.
- Covers all minimum chart types and most additionals (bar, line, area, pie, donut/radial, radar, scatter, composed/mixed). Heatmap is the only minimum-set gap (handle with a custom SVG grid wrapper if needed).
- SSR-safe out of the box.
- ~100KB gzipped — acceptable for an admin app.

## What this matrix does NOT decide

- Whether to install at all (Phase 3 confirms).
- Per-chart customization details (those live in `<library>-recipes.md`).
- Whether to wrap in `dynamic()` (those live in `ssr-safe-patterns.md`).
