/**
 * Single source of truth for chart visual configuration. Every chart component
 * imports from here. Values are extracted from the demo.tailadmin.com template
 * (ApexCharts v3.54.0, light theme — single-theme app). The hex literals here
 * intentionally mirror the `--color-charts-*` CSS variables in globals.css —
 * ApexCharts options need raw color strings, not Tailwind classes.
 */

import type { ApexOptions } from "apexcharts";

export const chartTheme = {
  // Series palette — order matters: matches the order in which the template
  // assigns colors to series across pages (brand-500 first, brand-300 second,
  // semantic colors next, supporting brand variants last).
  series: [
    "#465fff", // brand-500
    "#9cb9ff", // brand-300
    "#12b76a", // success
    "#f79009", // warning
    "#f04438", // error
    "#7592ff", // brand-400
    "#c2d6ff", // brand-200
    "#039855", // success-600
  ],
  semantic: {
    success: "#12b76a",
    danger: "#f04438",
    warning: "#f79009",
    info: "#465fff",
  },
  grid: "#e4e7ec",
  axisLine: "#e4e7ec",
  axisLabel: "#344054",
  tickLabel: "#6e8192",
  tooltip: {
    bg: "#ffffff",
    fg: "#1d2939",
    border: "#e4e7ec",
    radius: 8,
    padding: 12,
    shadow: "0 4px 12px rgba(16, 24, 40, 0.08)",
  },
  legend: {
    position: "bottom" as const,
    marker: "circle" as const,
    markerSize: 8,
    fg: "#344054",
    gap: 16,
  },
  typography: {
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif",
    axisLabelSize: 12,
    tickLabelSize: 11,
    tooltipSize: 12,
    legendSize: 12,
  },
  animation: { duration: 800, easing: "easeout" as const },
  bar: { topRadius: 4, columnWidth: "39%" as const, gap: 8 },
  line: { strokeWidth: 2, curve: "smooth" as const, showMarkers: false, markerSize: 4 },
  area: { fillOpacityStart: 0.55, fillOpacityEnd: 0.0, gradient: true },
  donut: { innerRatio: 0.7 },
} as const;

export type ChartTheme = typeof chartTheme;

/**
 * ApexCharts-native option base. Every Apex-backed chart spreads this and
 * overrides only the type-specific bits (chart.type, plotOptions, fill, etc).
 */
export function apexBaseOptions(): ApexOptions {
  return {
    colors: [...chartTheme.series],
    chart: {
      fontFamily: chartTheme.typography.fontFamily,
      animations: {
        enabled: true,
        speed: chartTheme.animation.duration,
      },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    grid: {
      borderColor: chartTheme.grid,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      labels: {
        style: {
          colors: chartTheme.tickLabel,
          fontSize: `${chartTheme.typography.tickLabelSize}px`,
          fontFamily: chartTheme.typography.fontFamily,
        },
      },
      axisBorder: { show: false, color: chartTheme.axisLine },
      axisTicks: { show: false, color: chartTheme.axisLine },
    },
    yaxis: {
      labels: {
        style: {
          colors: chartTheme.tickLabel,
          fontSize: `${chartTheme.typography.tickLabelSize}px`,
          fontFamily: chartTheme.typography.fontFamily,
        },
      },
    },
    legend: {
      position: chartTheme.legend.position,
      horizontalAlign: "center",
      markers: {
        size: chartTheme.legend.markerSize / 2,
        shape: chartTheme.legend.marker,
      },
      labels: { colors: chartTheme.legend.fg },
      fontSize: `${chartTheme.typography.legendSize}px`,
      fontFamily: chartTheme.typography.fontFamily,
      itemMargin: { horizontal: chartTheme.legend.gap, vertical: 4 },
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: `${chartTheme.typography.tooltipSize}px`,
        fontFamily: chartTheme.typography.fontFamily,
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: chartTheme.line.curve, width: chartTheme.line.strokeWidth },
  };
}
