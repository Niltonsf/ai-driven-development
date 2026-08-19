"use client";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { cn } from "@/shared/utils/cn";
import { apexBaseOptions, chartTheme } from "./_chart-theme";

export type BarVariant = "simple" | "stacked" | "grouped" | "horizontal";

export type BarChartProps = {
  categories: string[];
  series: Array<{ name: string; data: number[]; color?: string }>;
  variant?: BarVariant;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function BarChartImpl({
  categories,
  series,
  variant = "simple",
  height = 300,
  showLegend = true,
  showGrid = true,
  className,
  ariaLabel = "Bar chart",
}: BarChartProps) {
  const base = apexBaseOptions();
  const options: ApexOptions = {
    ...base,
    chart: {
      ...base.chart,
      type: "bar",
      stacked: variant === "stacked",
    },
    colors: series.map(
      (s, i) => s.color ?? chartTheme.series[i % chartTheme.series.length],
    ),
    plotOptions: {
      bar: {
        horizontal: variant === "horizontal",
        borderRadius: chartTheme.bar.topRadius,
        borderRadiusApplication: "end",
        columnWidth: chartTheme.bar.columnWidth,
      },
    },
    grid: { ...base.grid, show: showGrid },
    legend: { ...base.legend, show: showLegend },
    xaxis: { ...base.xaxis, categories },
  };
  return (
    <div className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <Chart
        options={options}
        series={series.map(({ name, data }) => ({ name, data }))}
        type="bar"
        height={height}
      />
    </div>
  );
}
