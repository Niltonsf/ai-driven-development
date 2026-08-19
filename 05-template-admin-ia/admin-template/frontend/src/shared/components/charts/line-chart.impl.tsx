"use client";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { cn } from "@/shared/utils/cn";
import { apexBaseOptions, chartTheme } from "./_chart-theme";

export type LineVariant = "simple" | "multi-series";

export type LineChartProps = {
  categories: string[];
  series: Array<{ name: string; data: number[]; color?: string }>;
  variant?: LineVariant;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showMarkers?: boolean;
  curve?: "smooth" | "straight" | "stepline";
  className?: string;
  ariaLabel?: string;
};

export default function LineChartImpl({
  categories,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  showMarkers = chartTheme.line.showMarkers,
  curve = chartTheme.line.curve,
  className,
  ariaLabel = "Line chart",
}: LineChartProps) {
  const base = apexBaseOptions();
  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "line" },
    colors: series.map(
      (s, i) => s.color ?? chartTheme.series[i % chartTheme.series.length],
    ),
    stroke: { curve, width: chartTheme.line.strokeWidth },
    markers: { size: showMarkers ? chartTheme.line.markerSize : 0 },
    grid: { ...base.grid, show: showGrid },
    legend: { ...base.legend, show: showLegend },
    xaxis: { ...base.xaxis, categories },
  };
  return (
    <div className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <Chart
        options={options}
        series={series.map(({ name, data }) => ({ name, data }))}
        type="line"
        height={height}
      />
    </div>
  );
}
