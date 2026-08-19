"use client";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { cn } from "@/shared/utils/cn";
import { chartTheme } from "./_chart-theme";

export type SparklineVariant = "line" | "area" | "bar";

export type SparklineProps = {
  data: number[];
  variant?: SparklineVariant;
  color?: string;
  height?: number;
  className?: string;
  ariaLabel?: string;
};

export default function SparklineImpl({
  data,
  variant = "line",
  color,
  height = 50,
  className,
  ariaLabel = "Sparkline",
}: SparklineProps) {
  const base: ApexOptions = {
    chart: {
      type: variant,
      sparkline: { enabled: true },
      animations: { enabled: false },
      toolbar: { show: false },
    },
    colors: [color ?? chartTheme.series[0]],
    stroke:
      variant === "bar"
        ? { width: 0 }
        : { curve: "smooth", width: 2 },
    fill:
      variant === "area"
        ? {
            type: "gradient",
            gradient: {
              shadeIntensity: 1,
              opacityFrom: chartTheme.area.fillOpacityStart,
              opacityTo: chartTheme.area.fillOpacityEnd,
              stops: [0, 100],
            },
          }
        : { type: "solid", opacity: 1 },
    plotOptions:
      variant === "bar"
        ? { bar: { borderRadius: 2, columnWidth: "60%" } }
        : undefined,
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    grid: { show: false },
    xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { show: false } },
  };
  return (
    <div className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <Chart
        options={base}
        series={[{ name: "value", data }]}
        type={variant}
        height={height}
      />
    </div>
  );
}
