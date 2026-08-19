"use client";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { cn } from "@/shared/utils/cn";
import { apexBaseOptions, chartTheme } from "./_chart-theme";

export type AreaChartProps = {
  categories: string[];
  series: Array<{ name: string; data: number[]; color?: string }>;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  curve?: "smooth" | "straight";
  gradient?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function AreaChartImpl({
  categories,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  curve = "smooth",
  gradient = chartTheme.area.gradient,
  className,
  ariaLabel = "Area chart",
}: AreaChartProps) {
  const base = apexBaseOptions();
  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "area" },
    colors: series.map(
      (s, i) => s.color ?? chartTheme.series[i % chartTheme.series.length],
    ),
    stroke: { curve, width: chartTheme.line.strokeWidth },
    fill: gradient
      ? {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: chartTheme.area.fillOpacityStart,
            opacityTo: chartTheme.area.fillOpacityEnd,
            stops: [0, 100],
          },
        }
      : { type: "solid", opacity: chartTheme.area.fillOpacityStart },
    grid: { ...base.grid, show: showGrid },
    legend: { ...base.legend, show: showLegend },
    xaxis: { ...base.xaxis, categories },
  };
  return (
    <div className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <Chart
        options={options}
        series={series.map(({ name, data }) => ({ name, data }))}
        type="area"
        height={height}
      />
    </div>
  );
}
