"use client";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { cn } from "@/shared/utils/cn";
import { apexBaseOptions, chartTheme } from "./_chart-theme";

export type DonutChartProps = {
  labels: string[];
  values: number[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showTotal?: boolean;
  totalLabel?: string;
  innerRatio?: number;
  className?: string;
  ariaLabel?: string;
};

export default function DonutChartImpl({
  labels,
  values,
  colors,
  height = 320,
  showLegend = true,
  showTotal = false,
  totalLabel = "Total",
  innerRatio = chartTheme.donut.innerRatio,
  className,
  ariaLabel = "Donut chart",
}: DonutChartProps) {
  const base = apexBaseOptions();
  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "donut" },
    colors: colors ?? [...chartTheme.series],
    labels,
    legend: { ...base.legend, show: showLegend },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: `${Math.round(innerRatio * 100)}%`,
          labels: showTotal
            ? {
                show: true,
                total: {
                  show: true,
                  label: totalLabel,
                  fontFamily: chartTheme.typography.fontFamily,
                  color: chartTheme.axisLabel,
                },
              }
            : { show: false },
        },
      },
    },
  };
  return (
    <div className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <Chart options={options} series={values} type="donut" height={height} />
    </div>
  );
}
