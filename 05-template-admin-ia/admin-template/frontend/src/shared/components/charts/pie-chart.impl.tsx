"use client";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { cn } from "@/shared/utils/cn";
import { apexBaseOptions, chartTheme } from "./_chart-theme";

export type PieChartProps = {
  labels: string[];
  values: number[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showDataLabels?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function PieChartImpl({
  labels,
  values,
  colors,
  height = 320,
  showLegend = true,
  showDataLabels = true,
  className,
  ariaLabel = "Pie chart",
}: PieChartProps) {
  const base = apexBaseOptions();
  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "pie" },
    colors: colors ?? [...chartTheme.series],
    labels,
    legend: { ...base.legend, show: showLegend },
    dataLabels: {
      enabled: showDataLabels,
      style: {
        fontSize: `${chartTheme.typography.tooltipSize}px`,
        fontFamily: chartTheme.typography.fontFamily,
      },
    },
    stroke: { width: 0 },
  };
  return (
    <div className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <Chart options={options} series={values} type="pie" height={height} />
    </div>
  );
}
